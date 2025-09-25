Vision Vanguards – AI-Powered Real-Time Weapon Detection System
📌 Problem Statement

Violent incidents in public spaces often go undetected until too late, putting lives at risk. Existing surveillance systems lack real-time intelligence to automatically identify weapons and alert authorities.

Our project aims to build an AI-powered surveillance system that can:

Detect and classify weapons in real-time from CCTV/IP cameras.

Notify on-site security instantly.

Escalate emergencies to the nearest police station with crucial details.

💡 Proposed Solution

The AI-Powered Real-Time Weapon Detection System integrates computer vision, deep learning, and smart alerting mechanisms:

Weapon Detection & Classification – Identifies guns, knives, and rifles from video streams.

Instant Alerts – Sends live notifications to security personnel.

Geo-Aware Escalation – Automatically maps camera location to the nearest police station.

Secure Evidence Sharing – Sends annotated snapshots & metadata only; full video remains secure on-premises.

🚀 Key Features

✅ End-to-End Pipeline: Detection → Classification → Context Awareness → Escalation

✅ Multi-Channel Alerts: Webhooks, SMS, Email, API calls

✅ Privacy-Preserving: Only essential metadata shared

✅ Cloud + On-Prem Deployment: Scalable, fault-tolerant

🛠️ Tech Stack
Frontend

React.js + Tailwind CSS → Dashboard UI

WebSocket integration → Real-time alerts

Backend

Python (Flask/FastAPI) → AI Model Serving

Node.js / Rust → API & notification services

Firebase / MongoDB → Logging & alert storage

AI/ML

OpenCV → Video stream processing

TensorFlow / PyTorch → Weapon detection & classification (YOLO/ResNet)

Pretrained deep learning models fine-tuned on weapon datasets

Deployment

Docker & Kubernetes (optional) for scaling

Cloud-ready (AWS / GCP / Azure)

On-premise fallback for sensitive institutions

⚙️ Installation & Setup
1️⃣ Clone Repository
git clone https://github.com/<your-username>/weapon-detection-system.git
cd weapon-detection-system

2️⃣ Backend Setup (Python – AI Model)
# Create virtual environment
python -m venv venv
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

3️⃣ Frontend Setup (React)
cd frontend
npm install
npm run dev   # start local dev server

4️⃣ Environment Configuration

Create a .env file with:

# API Keys
SMS_GATEWAY_KEY=your_api_key
EMAIL_SERVER=smtp.example.com
FIREBASE_CONFIG=your_firebase_credentials
POLICE_API_URL=https://example.com/nearest-station

5️⃣ Run the System
# Run AI backend
python app.py  

# Run frontend dashboard
cd frontend && npm start

6️⃣ Access Dashboard

Open:

http://localhost:3000

🌍 Impact & Benefits

Faster Response → Detects threats in real time, reducing escalation time.

Enhanced Security → Assists law enforcement & institutions.

Community Trust → Safer public spaces with proactive monitoring.

Economic Benefits → Reduces losses from crime.

👥 Team – Vision Vanguards

Omkar Gondkar

Purrav Yagnik

Akhil Karampuri

Anushree Shekokar
