@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

echo ===========================================
echo  Setup do Portal de Documentacao do Gateway
echo ===========================================
echo.

REM Descobre o caminho absoluto da pasta do script
set SCRIPT_DIR=%~dp0
REM Sobe um nivel para chegar na raiz do repositorio
cd /d "%SCRIPT_DIR%\.."

set PROJECT_DIR=%CD%\web-docs

echo Pasta do projeto: %PROJECT_DIR%
echo.

IF NOT EXIST "%PROJECT_DIR%" (
  echo ERRO: Pasta web-docs nao encontrada.
  pause
  EXIT /B 1
)

cd /d "%PROJECT_DIR%"

echo Instalando dependencias com npm install...
call npm install

IF %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERRO ao executar npm install. Verifique se o Node.js esta instalado.
  pause
  EXIT /B 1
)

echo.
echo Abrindo Visual Studio Code...
code .

echo.
echo Setup concluido.
echo Para iniciar o servidor de desenvolvimento, execute:
echo   npm run dev
echo.
pause
ENDLOCAL
