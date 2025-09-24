from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
import base64
import tensorflow as tf
import json
import threading
import time
from datetime import datetime
from io import BytesIO
from PIL import Image
import logging

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
# More permissive CORS for development
CORS(app, origins="*")  # Allow all origins for development
socketio = SocketIO(app, 
                   cors_allowed_origins="*",  # Allow all origins for Socket.IO
                   async_mode='threading',
                   ping_timeout=20,
                   ping_interval=25,
                   logger=False,
                   engineio_logger=False)

# Configure logging - enable debug level to see detection info
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Global variables for camera management and detection history
cameras = {}  # Will store camera objects
detection_history = []  # Store detection history
connected_clients = 0
camera_lock = threading.Lock()


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
        return [], []
    
    try:
        # Validate input frame
        if frame is None or frame.size == 0:
            logger.warning("Invalid frame provided for classification")
            return [], []
        
        # Preprocess the image
        processed_image = preprocess_image_for_classification(frame)
        if processed_image is None:
            return [], []
        
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

def initialize_camera(camera_index):
    """Initialize a camera by index"""
    try:
        with camera_lock:
            if camera_index in cameras:
                # Camera already initialized
                return True
            
            # Try to open the camera
            cap = cv2.VideoCapture(camera_index)
            if not cap.isOpened():
                logger.warning(f"Could not open camera {camera_index}")
                return False
            
            # Set camera properties for better performance
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.set(cv2.CAP_PROP_FPS, 30)
            
            cameras[camera_index] = cap
            logger.info(f"Camera {camera_index} initialized successfully")
            return True
    except Exception as e:
        logger.error(f"Error initializing camera {camera_index}: {e}")
        return False

def release_camera(camera_index):
    """Release a camera by index"""
    try:
        with camera_lock:
            if camera_index in cameras:
                cameras[camera_index].release()
                del cameras[camera_index]
                logger.info(f"Camera {camera_index} released")
                return True
            return False
    except Exception as e:
        logger.error(f"Error releasing camera {camera_index}: {e}")
        return False

def get_camera_frame(camera_index):
    """Get a frame from the specified camera"""
    try:
        with camera_lock:
            if camera_index not in cameras:
                # Try to initialize the camera if it doesn't exist
                if not initialize_camera(camera_index):
                    return None
            
            cap = cameras[camera_index]
            ret, frame = cap.read()
            
            if not ret:
                logger.warning(f"Failed to read from camera {camera_index}")
                # Try to reinitialize the camera
                release_camera(camera_index)
                if initialize_camera(camera_index):
                    cap = cameras[camera_index]
                    ret, frame = cap.read()
                    if not ret:
                        return None
                else:
                    return None
            
            return frame
    except Exception as e:
        logger.error(f"Error getting frame from camera {camera_index}: {e}")
        return None

def generate_frames(camera_index):
    """Generate frames for streaming with better error handling"""
    frame_count = 0
    detection_interval = 5  # Run detection every 5 frames for better responsiveness
    
    try:
        while True:
            frame = get_camera_frame(camera_index)
            if frame is None:
                # Send a placeholder image instead of breaking
                placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(placeholder, f'Camera {camera_index} not available', (50, 240), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                frame = placeholder
            else:
                # Only perform detection every N frames to reduce processing load
                if frame_count % detection_interval == 0 and model is not None:
                    try:
                        logger.debug(f"Running detection on frame {frame_count}")
                        detections, all_predictions = classify_image(frame, confidence_threshold=0.3)  # Lower threshold for better detection
                        
                        # Draw detection results and log all predictions
                        logger.debug(f"Detection results: {len(detections)} detections, {len(all_predictions)} predictions")
                        if all_predictions:
                            logger.info(f"All predictions: {all_predictions}")
                        
                        if detections:
                            for detection in detections:
                                # Show all detections including 'No Weapon' for debugging
                                label = f"{detection['class_name']}: {detection['confidence']:.2f}"
                                color = (0, 255, 0) if detection['class_name'].lower() == 'no weapon' else (0, 0, 255)
                                cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                                
                                # Emit detection for frontend display (including No Weapon for debugging)
                                detection_data = {
                                    'bbox': detection['bbox'],
                                    'confidence': detection['confidence'],
                                    'class_name': detection['class_name'],
                                    'class_id': detection['class_id'],
                                    'is_weapon': detection['class_name'].lower() != 'no weapon',
                                    'timestamp': datetime.now().isoformat(),
                                    'camera_index': camera_index
                                }
                                
                                # Always emit detection data for frontend overlay
                                socketio.emit('detection_result', detection_data)
                                
                                # Only emit alerts for actual weapons
                                if detection['class_name'].lower() != 'no weapon' and detection['confidence'] > 0.3:
                                    alert_data = {
                                        'message': f"Weapon detected: {detection['class_name']}",
                                        'timestamp': datetime.now().isoformat(),
                                        'weapon_type': detection['class_name'],
                                        'confidence': detection['confidence'],
                                        'camera_index': camera_index
                                    }
                                    socketio.emit('detection', alert_data)
                                    
                                    # Add to history
                                    detection_history.insert(0, {
                                        'id': len(detection_history) + 1,
                                        'date': datetime.now().isoformat(),
                                        'weapon_type': detection['class_name'],
                                        'location': f'Camera {camera_index}',
                                        'screenshot': '',
                                        'confidence': detection['confidence']
                                    })
                                    
                                    # Keep only last 50 detections
                                    if len(detection_history) > 50:
                                        detection_history.pop()
                    except Exception as e:
                        logger.error(f"Detection error: {e}")
                        # Continue without detection on error
                        pass
            
            # Encode frame as JPEG with compression
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
            ret, buffer = cv2.imencode('.jpg', frame, encode_param)
            if not ret:
                continue
            
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            
            frame_count += 1
            time.sleep(0.066)  # ~15 FPS for better performance
            
    except GeneratorExit:
        logger.info(f"Stream generator for camera {camera_index} stopped")
    except Exception as e:
        logger.error(f"Error in frame generation for camera {camera_index}: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

@app.route('/test-detection', methods=['GET'])
def test_detection():
    """Test detection with current camera frame"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
            
        # Get current frame from camera 0
        frame = get_camera_frame(0)
        if frame is None:
            return jsonify({'error': 'No frame available from camera'}), 500
        
        # Run detection
        detections, all_predictions = classify_image(frame, confidence_threshold=0.1)
        
        return jsonify({
            'detections': detections,
            'all_predictions': all_predictions,
            'frame_shape': frame.shape,
            'model_classes': class_names
        })
        
    except Exception as e:
        logger.error(f"Error in test detection: {e}")
        return jsonify({'error': str(e)}), 500

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

# API endpoints that the frontend expects
@app.route('/api/model-status', methods=['GET'])
def api_model_status():
    """Get model status for dashboard"""
    try:
        # Check if main camera (index 0) is available
        camera_status = 'connected' if 0 in cameras or initialize_camera(0) else 'disconnected'
        
        status = {
            'status': 'loaded' if model is not None else 'error',
            'model_loaded': model is not None,
            'camera_status': camera_status,
            'classes': class_names,
            'num_classes': len(class_names) if class_names else 0,
            'connected_clients': connected_clients
        }
        
        return jsonify(status)
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def api_history():
    """Get detection history"""
    try:
        return jsonify({
            'detections': detection_history,
            'total': len(detection_history)
        })
    except Exception as e:
        logger.error(f"Error getting history: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/camera/stop/<int:camera_index>', methods=['POST'])
def api_camera_stop(camera_index):
    """Stop a camera"""
    try:
        success = release_camera(camera_index)
        return jsonify({
            'success': success,
            'message': f'Camera {camera_index} stopped' if success else f'Camera {camera_index} not found'
        })
    except Exception as e:
        logger.error(f"Error stopping camera {camera_index}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/camera/initialize/<int:camera_index>', methods=['POST'])
def api_camera_initialize(camera_index):
    """Initialize a camera"""
    try:
        success = initialize_camera(camera_index)
        return jsonify({
            'success': success,
            'message': f'Camera {camera_index} initialized' if success else f'Failed to initialize camera {camera_index}'
        })
    except Exception as e:
        logger.error(f"Error initializing camera {camera_index}: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/camera/check/<int:camera_index>', methods=['GET'])
def api_camera_check(camera_index):
    """Check if a camera is available"""
    try:
        available = camera_index in cameras
        if not available:
            # Try to test the camera
            cap = cv2.VideoCapture(camera_index)
            available = cap.isOpened()
            if available:
                cap.release()
        
        return jsonify({
            'available': available,
            'camera_index': camera_index
        })
    except Exception as e:
        logger.error(f"Error checking camera {camera_index}: {e}")
        return jsonify({'available': False, 'error': str(e)})

# Video streaming endpoints
@app.route('/stream')
def video_stream():
    """Main camera stream"""
    return Response(generate_frames(0), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stream/<int:camera_index>')
def video_stream_by_index(camera_index):
    """Stream from specific camera"""
    return Response(generate_frames(camera_index), mimetype='multipart/x-mixed-replace; boundary=frame')

# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    global connected_clients
    connected_clients += 1
    logger.info(f'Client connected. Total clients: {connected_clients}')
    emit('status', {'connected': True, 'message': 'Connected to weapon detection system'})

@socketio.on('disconnect')
def handle_disconnect():
    global connected_clients
    connected_clients -= 1
    logger.info(f'Client disconnected. Total clients: {connected_clients}')

@socketio.on('request_status')
def handle_status_request():
    """Handle status requests from clients"""
    try:
        camera_status = 'connected' if 0 in cameras else 'disconnected'
        status = {
            'model_loaded': model is not None,
            'camera_status': camera_status,
            'detections_count': len(detection_history),
            'timestamp': datetime.now().isoformat()
        }
        emit('status_update', status)
    except Exception as e:
        logger.error(f"Error handling status request: {e}")
        emit('error', {'message': str(e)})

def cleanup_cameras():
    """Clean up all cameras on shutdown"""
    global cameras
    with camera_lock:
        for camera_index in list(cameras.keys()):
            try:
                cameras[camera_index].release()
                logger.info(f"Released camera {camera_index}")
            except Exception as e:
                logger.error(f"Error releasing camera {camera_index}: {e}")
        cameras.clear()

if __name__ == '__main__':
    logger.info("Starting Weapon Detection API Server...")
    logger.info(f"Model loaded: {model is not None}")
    logger.info(f"Model classes: {class_names}")
    
    # Initialize the main camera (camera 0) on startup
    if initialize_camera(0):
        logger.info("Main camera (0) initialized successfully")
    else:
        logger.warning("Main camera (0) could not be initialized - will try again on first request")
    
    try:
        logger.info("Server starting on http://127.0.0.1:5000")
        logger.info("Frontend dashboard: http://localhost:3000/dashboard")
        
        # Run the Flask-SocketIO app with threading mode for stability
        socketio.run(
            app,
            host='localhost',  # Use localhost for frontend compatibility
            port=5000,
            debug=False,  # Disable debug for production stability
            use_reloader=False,  # Disable auto-reloader
            log_output=True
        )
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
    except Exception as e:
        logger.error(f"Server error: {e}")
    finally:
        cleanup_cameras()
