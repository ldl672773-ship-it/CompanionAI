@echo off
echo 配置Android环境并运行ChatterUI...

set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot
set ANDROID_HOME=C:\Users\lll21\AppData\Local\Android\Sdk
set PATH=%PATH%;%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools

echo 检���环境状态...
java -version
echo.
adb devices
echo.

echo 停止可能冲突的进程...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo 启动ChatterUI Android版本...
npx expo run:android --port 8085

pause