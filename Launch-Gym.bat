@echo off
TITLE Iron Pulse Gym - Starting Backend
echo 🚀 Starting Gym Management Backend...

:: Start the backend in a new minimized window
start /min cmd /c "npm run dev"

echo ⏳ Waiting for server to initialize...
timeout /t 5 /nobreak > nul

echo 🌐 Opening the website...
start http://localhost:5000

echo ✅ Everything is running! You can close this window.
pause