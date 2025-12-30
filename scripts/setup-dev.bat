@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

:: ==========================================
:: CONFIGURACAO (LOW CODE)
:: ==========================================
set "TARGET_FOLDER=web-docs"
set "INSTALL_CMD=npm install"
set "START_CMD=npm run dev"
set "EDITOR_CMD=code"

echo ===========================================
echo  Setup do Portal: %TARGET_FOLDER%
echo ===========================================
echo.

:: 1. Validacao de Ambiente (Seguranca/Prerequisitos)
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado. Por favor instale o Node.js.
    pause
    EXIT /B 1
)

:: 2. Navegacao Segura
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%\.."
set "PROJECT_ROOT=%CD%"
set "TARGET_PATH=%PROJECT_ROOT%\%TARGET_FOLDER%"

if not exist "%TARGET_PATH%" (
  echo [ERRO] Pasta alvo nao encontrada: %TARGET_PATH%
  pause
  EXIT /B 1
)

cd /d "%TARGET_PATH%"
echo Diretorio atual: %CD%

:: 3. Execucao de Comandos
echo.
echo Executando instalacao...
call %INSTALL_CMD%

IF %ERRORLEVEL% NEQ 0 (
  echo [ERRO] Falha na instalacao.
  pause
  EXIT /B 1
)

:: 4. Abertura do Editor (Opcional)
where %EDITOR_CMD% >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Abrindo editor...
    call %EDITOR_CMD% .
) else (
    echo Editor '%EDITOR_CMD%' nao encontrado no PATH. Pulando abertura.
)

echo.
echo ===========================================
echo  Setup Concluido com Sucesso
echo  Para iniciar, execute: %START_CMD%
echo ===========================================
echo.
pause
ENDLOCAL
