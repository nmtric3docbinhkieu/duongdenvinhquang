@echo off
cd /d "%~dp0"
echo Đang khởi động server...
start "Server" cmd /k "node server.js"
timeout /t 3 /nobreak >nul
echo Đang mở trình duyệt...
start http://localhost:3000
