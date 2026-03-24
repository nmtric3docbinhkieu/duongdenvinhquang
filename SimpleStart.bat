@echo off
cd /d "%~dp0"
title Đường Đến Vinh Quang - Khởi động đơn giản
color 0A

echo ========================================
echo   ĐƯỜNG ĐẾN VINH QUANG - THPT ĐỐC BINH KIỀU
echo ========================================
echo.

echo [1] Kiểm tra dependencies...
if not exist "..\node_modules" (
    echo Đang cài đặt dependencies...
    cd ..
    npm install
    cd public
    echo ✅ Dependencies đã cài đặt xong!
) else (
    echo ✅ Dependencies đã sẵn sàng.
)

echo.
echo [2] Khởi động server...
echo Server sẽ chạy trên: http://localhost:3000
echo.
echo Nhấn Ctrl+C để dừng server
echo.

node server.js
