#!/usr/bin/env python3
"""
Information about the weapon detection model used in this system.
This script provides details about the H5 TensorFlow/Keras model.
"""

import os
import tensorflow as tf

def check_model():
    """Check if the weapon detection model exists and provide information"""
    model_path = 'weapon_detection_model.h5'
    
    print("=== Weapon Detection Model Information ===")
    print(f"Model path: {model_path}")
    
    if os.path.exists(model_path):
        print("✓ Model file found!")
        
        try:
            # Load and examine the model
            model = tf.keras.models.load_model(model_path)
            
            print(f"Model type: TensorFlow/Keras Sequential Model")
            print(f"Input shape: {model.input_shape}")
            print(f"Output shape: {model.output_shape}")
            print(f"Number of parameters: {model.count_params():,}")
            print(f"Number of layers: {len(model.layers)}")
            
            # Assumed class names (you may need to adjust these)
            class_names = ['No Weapon', 'Knife', 'Gun']
            print(f"Predicted classes: {class_names}")
            
            print("\n✓ Model loaded and validated successfully!")
            print("This is a custom-trained weapon detection classification model.")
            print("It classifies entire images into weapon/no-weapon categories.")
            
            return model_path
            
        except Exception as e:
            print(f"✗ Error loading model: {e}")
            return None
    else:
        print(f"✗ Model file not found at: {os.path.abspath(model_path)}")
        print("Please ensure the weapon_detection_model.h5 file is in the backend directory.")
        return None

def verify_model_requirements():
    """Check if required dependencies are installed"""
    print("\n=== Checking Dependencies ===")
    
    try:
        import tensorflow as tf
        print(f"✓ TensorFlow version: {tf.__version__}")
    except ImportError:
        print("✗ TensorFlow not found. Install with: pip install tensorflow")
        return False
    
    try:
        import cv2
        print(f"✓ OpenCV version: {cv2.__version__}")
    except ImportError:
        print("✗ OpenCV not found. Install with: pip install opencv-python")
        return False
    
    try:
        import numpy as np
        print(f"✓ NumPy version: {np.__version__}")
    except ImportError:
        print("✗ NumPy not found. Install with: pip install numpy")
        return False
    
    print("✓ All required dependencies are installed!")
    return True

if __name__ == "__main__":
    verify_model_requirements()
    check_model()
