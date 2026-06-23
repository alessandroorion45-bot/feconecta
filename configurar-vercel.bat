@echo off
echo.
echo ========================================
echo   CONFIGURADOR AUTOMATICO DA VERCEL
echo ========================================
echo.
echo Iniciando configuracao...
echo.

REM Executar script PowerShell
PowerShell.exe -ExecutionPolicy Bypass -File "%~dp0configurar-vercel.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erro ao executar script!
    pause
    exit /b 1
)

echo.
echo Script executado com sucesso!
pause
