@echo off
echo Starting Weapon Detection Backend Server...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Start the Flask server
echo Starting Flask server on port 5000...
echo Backend will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
python app.py

pause