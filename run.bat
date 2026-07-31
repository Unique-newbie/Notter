@echo off
title Story Bible AI - Writing Assistant
color 0A
cls

echo =======================================================
echo               STORY BIBLE AI ASSISTANT
echo =======================================================
echo.

IF NOT EXIST "node_modules" (
    echo [!] Installing project dependencies...
    call npm install
    echo.
)

echo [✓] Starting Story Bible AI Server...
echo [✓] Open your browser at: http://localhost:3000
echo.
echo Press Ctrl+C at any time to stop the server.
echo =======================================================
echo.

call npm run dev
pause
