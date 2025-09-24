#!/usr/bin/env python3
"""
Simple test script to verify YOLOv8 model loading
"""

import os
import sys

print("Testing YOLOv8 model loading...")
print("-" * 40)

try:
    from ultralytics import YOLO
    import torch
    import numpy as np
    
    print(f"✓ YOLOv8 (ultralytics) imported successfully")
    print(f"✓ PyTorch version: {torch.__version__}")
    
    # Check if model file exists
    model_path = 'yolov8n.pt'
    if os.path.exists(model_path):
        print(f"✓ Model file found: {model_path}")
    else:
        print(f"✗ Model file not found: {model_path}")
        sys.exit(1)
    
    # Load the model
    print("Loading YOLOv8 model...")
    model = YOLO(model_path)
    print("✓ YOLOv8 model loaded successfully")
    
    # Get model info
    print(f"✓ Model classes: {len(model.names)}")
    print(f"✓ Available classes: {list(model.names.values())[:10]}...")  # Show first 10
    
    # Test inference with dummy image
    print("Testing model inference...")
    dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
    results = model.predict(dummy_img, verbose=False)
    print("✓ Model inference test successful")
    
    print("-" * 40)
    print("✓ All tests passed! YOLOv8 model is working correctly.")
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("Make sure to install: pip install ultralytics")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)