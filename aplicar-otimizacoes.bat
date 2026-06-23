@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   APLICAR OTIMIZACOES - AUTOMATICO
echo ========================================
echo.
echo Iniciando otimizacoes de performance...
echo.

REM Executar script PowerShell
PowerShell.exe -ExecutionPolicy Bypass -File "%~dp0aplicar-otimizacoes.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erro ao executar script!
    pause
    exit /b 1
)

echo.
echo Script executado com sucesso!
pause
