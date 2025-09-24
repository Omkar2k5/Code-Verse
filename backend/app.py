from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_sqlalchemy import SQLAlchemy
import cv2
import numpy as np
import base64
import tensorflow as tf
import json
from io import BytesIO
from PIL import Image
import logging
import os
from datetime import datetime, timedelta
from threading import Thread
import time

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
socketio = SocketIO(app, async_mode='threading', cors_allowed_origins="http://localhost:3000")

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database Model
class Detection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    weapon_type = db.Column(db.String(50))
    location = db.Column(db.String(50))
    screenshot_path = db.Column(db.String(200))
    confidence = db.Column(db.Float)

    def __repr__(self):
        return f"<Detection {self.id}: {self.weapon_type} at {self.location}>"

# Create database tables
with app.app_context():
    db.create_all()


# Load the TensorFlow/Keras weapon detection model

try:
    model_path = 'weapon_detection_model.h5'
    logger.info(f"Loading weapon detection model from: {model_path}")
    
    model = tf.keras.models.load_model(model_path)
    
    # Test the model with a dummy inference to ensure compatibility
    dummy_img = np.zeros((1, 224, 224, 3), dtype=np.float32)
    test_results = model.predict(dummy_img, verbose=0)
    
    logger.info(f"Successfully loaded and tested model from: {model_path}")
    logger.info(f"Model input shape: {model.input_shape}")
    logger.info(f"Model output shape: {model.output_shape}")
    logger.info(f"Number of classes: {model.output_shape[-1]}")
    
    # Define class names (assuming 3-class weapon detection)
    # You may need to adjust these based on your specific model training
    class_names = ['No Weapon', 'Knife', 'Gun']  # Adjust as needed
    logger.info(f"Model classes: {class_names}")
        
except Exception as e:
    logger.error(f"Critical error loading model: {e}")
    model = None
    class_names = []

# Initialize video capture
cap = None
try:
    cap = cv2.VideoCapture(0)  # Use webcam
    if not cap.isOpened():
        logger.error("Could not open video capture device")
        cap = None
    else:
        logger.info("Video capture device opened successfully")
except Exception as e:
    logger.error(f"Error initializing video capture: {e}")
    cap = None

# Global variables for detection tracking
last_detection_time = None
cooldown_period = timedelta(seconds=60)

def decode_base64_image(base64_string):
    """Decode base64 image string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Convert bytes to PIL Image
        pil_image = Image.open(BytesIO(image_bytes))
        
        # Convert PIL to OpenCV format
        cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        return cv_image
    except Exception as e:
        logger.error(f"Error decoding base64 image: {e}")
        return None

def preprocess_image_for_classification(frame):
    """Preprocess image for the classification model"""
    try:
        # Resize to model input size (224x224)
        resized = cv2.resize(frame, (224, 224))
        
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        
        # Normalize pixel values to [0, 1]
        normalized = rgb_image.astype(np.float32) / 255.0
        
        # Add batch dimension
        batch_image = np.expand_dims(normalized, axis=0)
        
        return batch_image
    
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        return None

def classify_image(frame, confidence_threshold=0.5):
    """Classify the entire image for weapon detection and return results"""
    if model is None:
        logger.warning("Model is not loaded, skipping classification")
        return []
    
    try:
        # Validate input frame
        if frame is None or frame.size == 0:
            logger.warning("Invalid frame provided for classification")
            return []
        
        # Preprocess the image
        processed_image = preprocess_image_for_classification(frame)
        if processed_image is None:
            return []
        
        # Run inference
        predictions = model.predict(processed_image, verbose=0)
        
        # Get the predicted class and confidence
        predicted_class_id = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_id])
        
        detections = []
        
        # Only return detection if confidence is above threshold
        if confidence >= confidence_threshold:
            class_name = class_names[predicted_class_id] if predicted_class_id < len(class_names) else f"class_{predicted_class_id}"
            
            # For classification, we consider the entire image as the "detection area"
            height, width = frame.shape[:2]
            
            detections.append({
                'bbox': [0, 0, width, height],  # Full image as bounding box
                'confidence': round(confidence, 3),
                'class_name': class_name,
                'class_id': int(predicted_class_id),
                'classification_type': 'full_image'  # Indicate this is image classification
            })
        
        # Also return all class probabilities for reference
        all_predictions = []
        for i, prob in enumerate(predictions[0]):
            class_name = class_names[i] if i < len(class_names) else f"class_{i}"
            all_predictions.append({
                'class_name': class_name,
                'class_id': i,
                'probability': round(float(prob), 3)
            })
        
        logger.debug(f"Classification result - Predicted: {class_names[predicted_class_id] if predicted_class_id < len(class_names) else 'Unknown'}, Confidence: {confidence:.3f}")
        
        return detections, all_predictions
    
    except Exception as e:
        logger.error(f"Error during classification: {type(e).__name__}: {e}")
        return [], []

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

@app.route('/detect', methods=['POST'])
def detect():
    """Process image and return classification results"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode the base64 image
        frame = decode_base64_image(data['image'])
        
        if frame is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Get confidence threshold from request (default 0.5)
        confidence_threshold = data.get('confidence_threshold', 0.5)
        
        # Perform classification
        detections, all_predictions = classify_image(frame, confidence_threshold)
        
        # Get frame dimensions for frontend reference
        height, width = frame.shape[:2]
        
        response = {
            'detections': detections,
            'all_predictions': all_predictions,  # Include all class probabilities
            'frame_dimensions': {
                'width': width,
                'height': height
            },
            'timestamp': data.get('timestamp'),
            'total_detections': len(detections),
            'model_type': 'classification'  # Indicate this is classification
        }
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"Error in detect endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/detect_stream', methods=['POST'])
def detect_stream():
    """Stream endpoint for continuous classification"""
    try:
        data = request.get_json()
        
        if not data or 'frames' not in data:
            return jsonify({'error': 'No frame data provided'}), 400
        
        results = []
        confidence_threshold = data.get('confidence_threshold', 0.5)
        
        for frame_data in data['frames']:
            frame = decode_base64_image(frame_data['image'])
            
            if frame is not None:
                detections, all_predictions = classify_image(frame, confidence_threshold)
                
                results.append({
                    'frame_id': frame_data.get('frame_id'),
                    'detections': detections,
                    'all_predictions': all_predictions,
                    'timestamp': frame_data.get('timestamp')
                })
        
        return jsonify({
            'results': results,
            'model_type': 'classification'
        })
    
    except Exception as e:
        logger.error(f"Error in detect_stream endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/model_info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    if model is None:
        return jsonify({'error': 'No model loaded'}), 500
    
    try:
        # Get model information
        info = {
            'model_loaded': True,
            'model_type': 'classification',
            'model_framework': 'tensorflow',
            'classes': class_names,
            'num_classes': len(class_names),
            'input_shape': list(model.input_shape),
            'output_shape': list(model.output_shape),
            'total_params': model.count_params() if hasattr(model, 'count_params') else 'Unknown'
        }
        
        return jsonify(info)
    
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        return jsonify({'error': str(e)}), 500

# Frontend-compatible endpoints
@app.route('/')
def home():
    return "Welcome to the Weapon Detection System"

@app.route('/stream')
def stream():
    """Live video stream with weapon detection"""
    global last_detection_time
    
    def generate():
        global last_detection_time
        if cap is None:
            # Return a placeholder image if no camera
            logger.warning("No camera available, serving placeholder")
            return
            
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    logger.warning("Failed to read frame from camera")
                    continue
                
                annotated_frame = frame.copy()
                current_time = datetime.now()
                
                # Perform weapon detection
                if model is not None:
                    detections, all_predictions = classify_image(frame, confidence_threshold=0.5)
                    
                    # Check for weapon detections (exclude 'No Weapon' class)
                    weapon_detections = [d for d in detections if d['class_name'] != 'No Weapon']
                    
                    if weapon_detections and (last_detection_time is None or 
                        (current_time - last_detection_time) > cooldown_period):
                        
                        # Save screenshot
                        os.makedirs('screenshots', exist_ok=True)
                        timestamp = current_time.strftime("%Y%m%d_%H%M%S")
                        screenshot_path = f"screenshots/{timestamp}.jpg"
                        cv2.imwrite(screenshot_path, annotated_frame)
                        
                        # Save to database and emit socket event
                        for detection in weapon_detections:
                            weapon_type = detection['class_name']
                            confidence = detection['confidence']
                            
                            db_detection = Detection(
                                weapon_type=weapon_type, 
                                location="Main Entrance", 
                                screenshot_path=screenshot_path,
                                confidence=confidence
                            )
                            
                            with app.app_context():
                                db.session.add(db_detection)
                                db.session.commit()
                                
                                # Emit WebSocket event
                                socketio.emit('detection', {
                                    'message': f'{weapon_type} detected at {db_detection.location} (confidence: {confidence:.2f})',
                                    'timestamp': db_detection.timestamp.isoformat(),
                                    'screenshot': f'/screenshots/{os.path.basename(screenshot_path)}',
                                    'weapon_type': weapon_type,
                                    'confidence': confidence
                                })
                        
                        last_detection_time = current_time
                    
                    # Draw detection results on frame
                    if detections:
                        height, width = frame.shape[:2]
                        for detection in detections:
                            if detection['class_name'] != 'No Weapon':
                                # Draw bounding box (full frame for classification)
                                cv2.rectangle(annotated_frame, (10, 10), (width-10, height-10), (0, 0, 255), 3)
                                
                                # Add text
                                text = f"{detection['class_name']}: {detection['confidence']:.2f}"
                                cv2.putText(annotated_frame, text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 
                                          1, (0, 0, 255), 2, cv2.LINE_AA)
                
                # Encode frame
                try:
                    _, buffer = cv2.imencode('.jpg', annotated_frame)
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                except Exception as e:
                    logger.error(f"Error encoding frame: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error in video stream: {e}")
            return b''
    
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/screenshots/<filename>')
def serve_screenshot(filename):
    return send_from_directory('screenshots', filename)

@app.route('/api/history')
def get_history():
    try:
        detections = Detection.query.order_by(Detection.timestamp.desc()).all()
        return jsonify({
            'detections': [
                {
                    'id': d.id, 
                    'date': d.timestamp.isoformat(), 
                    'weapon_type': d.weapon_type,
                    'location': d.location, 
                    'screenshot': f'/screenshots/{os.path.basename(d.screenshot_path)}',
                    'confidence': d.confidence
                }
                for d in detections
            ]
        })
    except Exception as e:
        logger.error(f"Error in get_history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis/weapon-distribution')
def weapon_distribution():
    try:
        distributions = db.session.query(Detection.weapon_type, db.func.count(Detection.id)).group_by(Detection.weapon_type).all()
        return jsonify({
            'labels': [d[0] for d in distributions], 
            'data': [d[1] for d in distributions]
        })
    except Exception as e:
        logger.error(f"Error in weapon_distribution: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/model-status')
def model_status():
    """Get current model status and information"""
    try:
        return jsonify({
            'model_type': 'tensorflow',
            'weapon_classes': class_names,
            'status': 'loaded' if model is not None else 'failed',
            'camera_status': 'connected' if cap is not None and cap.isOpened() else 'disconnected'
        })
    except Exception as e:
        logger.error(f"Error in model_status: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Weapon Detection API Server...")
    logger.info(f"Model loaded: {model is not None}")
    logger.info(f"Camera status: {'Connected' if cap is not None and cap.isOpened() else 'Disconnected'}")
    
    # Ensure screenshots directory exists
    os.makedirs('screenshots', exist_ok=True)
    
    # Run the Flask app with SocketIO
    socketio.run(
        app,
        host='0.0.0.0',  # Allow external connections
        port=5000,
        debug=True,
        allow_unsafe_werkzeug=True  # For development only
    )
