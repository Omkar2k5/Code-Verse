#!/usr/bin/env python3
"""
Stable startup script for the weapon detection backend.
This version uses threading instead of eventlet for better Windows compatibility.
"""

import os
import sys

# Set environment variables for stability
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Reduce TensorFlow warnings

# Import the main application
from app import app, socketio, logger, start_camera

def main():
    """Main startup function"""
    logger.info("=" * 60)
    logger.info("Starting Code-Verse Weapon Detection System")
    logger.info("=" * 60)
    
    # Initialize the main camera
    logger.info("Initializing camera system...")
    if start_camera(0):
        logger.info("✓ Main camera (index 0) initialized successfully")
    else:
        logger.warning("⚠ Main camera (index 0) failed to initialize")
        logger.info("  System will still start but camera feed may not work")
    
    # Start the server
    logger.info("Starting web server...")
    logger.info("Frontend should connect to: http://127.0.0.1:5000")
    logger.info("Dashboard available at: http://localhost:3000/dashboard")
    logger.info("=" * 60)
    
    try:
        socketio.run(
            app,
            host='127.0.0.1',
            port=5000,
            debug=False,
            use_reloader=False,
            log_output=False  # Reduce connection spam in logs
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()