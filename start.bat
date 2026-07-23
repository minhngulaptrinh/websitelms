@echo off
cd /d "%~dp0"
echo Dang khoi dong may chu Hoc toan cung Minh bang PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
