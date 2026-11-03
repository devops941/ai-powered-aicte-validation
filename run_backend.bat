@echo off
echo ========================================================
echo Starting AI Powered AICTE Document Verification Backend...
echo ========================================================
cd /d "%~dp0verisense"
call venv\Scripts\activate.bat
echo Backend running on http://127.0.0.1:8000
python -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
pause
