# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Code-Verse is a comprehensive weapon detection system that combines computer vision, real-time monitoring, and web-based dashboards. The system uses YOLOv8 for object detection and provides real-time camera feed analysis through a multi-tier architecture.

## Architecture

### Core Components

**Backend (`/backend`)**
- Flask-based API server with Socket.IO for real-time communication  
- TensorFlow/Keras model integration for weapon classification
- Camera management system supporting multiple video sources
- RESTful endpoints for model status, detection history, and camera controls
- Streaming video endpoints with MJPEG support

**Frontend (`/frontend`)**  
- Next.js 14 React application with TypeScript
- Real-time dashboard with Socket.IO client integration
- Shadcn/ui components with Tailwind CSS styling
- Chart.js and Recharts for data visualization
- Multi-camera view with live video streaming

**Machine Learning (`/ml`)**
- YOLOv8-based weapon detection pipeline using Ultralytics
- DataFlow class for dataset management and preprocessing  
- Model training, evaluation, and export capabilities
- Video/image inference with custom visualization
- MLOps monitoring integration for experiment tracking

### Key Integration Points

- **Real-time Communication**: Socket.IO connections between frontend/backend for live detection alerts
- **Video Streaming**: MJPEG streams from backend consumed by frontend dashboard  
- **Model Pipeline**: ML module trains models that backend loads for inference
- **API Layer**: RESTful services for camera management, model status, and detection history

## Common Development Commands

### Backend Development
```powershell
# Navigate to backend directory
cd backend

# Install Python dependencies  
pip install -r requirements.txt

# Download/prepare the model (if needed)
python download_model.py

# Start the Flask development server
python app.py

# Alternative: Use the provided batch file
./run_backend.bat
```

### Frontend Development  
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or  
pnpm dev

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

### Machine Learning Development
```powershell  
# Navigate to ML directory
cd ml

# Install ML dependencies
pip install -r requirements.txt

# Download training images
python download_images.py

# Run training pipeline
python main.py

# Interactive model development (Jupyter)
# Open yolo.ipynb in Jupyter/VS Code
```

### Full System Startup
```powershell
# Terminal 1: Start backend
cd backend && python app.py

# Terminal 2: Start frontend  
cd frontend && npm run dev

# Access dashboard at http://localhost:3000
```

## Development Workflow

### Model Training & Deployment
1. Use `ml/DataFlow.py` to prepare datasets
2. Train models with `ml/Model.py` using YOLOv8
3. Export trained models to `backend/` directory
4. Update model paths in `backend/app.py` if needed
5. Restart backend to load new model

### Frontend-Backend Integration
- Backend runs on port 5000 with CORS enabled for frontend
- Socket.IO connections handle real-time detection events
- Camera feeds use MJPEG streaming via `/stream/<camera_id>` endpoints  
- API calls use standard fetch() with error handling

### Camera Management
- Primary camera (index 0) is automatically initialized
- Additional cameras (1-3) require external connection
- Use `/api/camera/check/<id>` to verify camera availability
- Start/stop cameras via `/api/camera/start/<id>` and `/api/camera/stop/<id>`

## Architecture Patterns

### Error Handling
- Frontend includes connection retry logic and graceful degradation
- Backend provides comprehensive error responses with logging
- Model loading failures don't crash the server - graceful fallbacks provided

### State Management  
- Frontend uses React hooks for local state management
- Real-time data sync via Socket.IO event handlers
- Camera status and detection history managed through REST APIs

### Security Considerations
- CORS properly configured for local development
- No sensitive data hardcoded in frontend code
- Model inference runs server-side to protect model assets

## Troubleshooting

### Connection Issues
- Ensure backend is running on port 5000 before starting frontend
- Check Windows Firewall settings if cross-network access needed
- Verify Socket.IO connection in browser developer tools

### Camera Problems  
- Use backend `/api/camera/check/<id>` endpoint to verify camera access
- Windows may require camera permissions for OpenCV access
- Multiple applications cannot access same camera simultaneously

### Model Issues
- Check `backend/weapon_detection_model.h5` exists and is valid
- Review backend logs for TensorFlow/Keras compatibility errors  
- Ensure Python environment has all required ML dependencies installed