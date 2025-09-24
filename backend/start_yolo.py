#!/usr/bin/env python3
"""
Startup script for YOLOv8 weapon detection backend.
"""

import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_yolo_model():
    """Test YOLOv8 model before starting server"""
    try:
        from ultralytics import YOLO
        import numpy as np
        
        model_path = 'yolov8n.pt'
        if not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            return False
            
        # Load model
        model = YOLO(model_path)
        logger.info(f"✓ YOLOv8 model loaded: {len(model.names)} classes")
        logger.info(f"✓ Available classes: {list(model.names.values())}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to load YOLOv8 model: {e}")
        return False

def main():
    """Main startup function"""
    logger.info("=" * 60)
    logger.info("Starting Code-Verse YOLOv8 Weapon Detection System")
    logger.info("=" * 60)
    
    # Test model first
    if not test_yolo_model():
        logger.error("Model test failed. Exiting.")
        sys.exit(1)
    
    logger.info("Model test passed. Starting server...")
    
    # Import and start the Flask app
    try:
        from app import app, socketio, start_camera
        
        # Initialize main camera
        if start_camera(0):
            logger.info("✓ Main camera initialized")
        else:
            logger.warning("⚠ Camera initialization failed")
        
        # Start server
        logger.info("Server starting on http://127.0.0.1:5000")
        logger.info("Dashboard available at http://localhost:3000/dashboard")
        logger.info("=" * 60)
        
        socketio.run(
            app,
            host='127.0.0.1',
            port=5000,
            debug=False,
            use_reloader=False,
            log_output=False
        )
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()