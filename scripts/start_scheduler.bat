@echo off
title Abdullah Journey OS - Scheduler Daemon
cd /d "%~dp0\.."
echo Starting 24/7 Autonomous Scheduler Daemon...
node scripts/scheduler_daemon.js
pause
