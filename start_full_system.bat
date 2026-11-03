@echo off
echo =========================================================================
echo  AI Powered AICTE Document Verification — Full-Stack Launcher
echo =========================================================================
echo  Backend  (FastAPI + Python)  →  http://127.0.0.1:8000
echo  Frontend (React + Vite)      →  http://localhost:3000
echo =========================================================================
start "Backend  :8000" cmd /k "%~dp0run_backend.bat"
timeout /t 3 /nobreak >nul
start "Frontend :3000" cmd /k "%~dp0run_frontend.bat"
echo.
echo Both servers launched. Press any key to exit this window.
pause >nul
