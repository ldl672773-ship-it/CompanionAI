@echo off
echo 使用稳定配置运行ChatterUI Android版本...

set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot
set ANDROID_HOME=C:\Users\lll21\AppData\Local\Android\Sdk
set PATH=%PATH%;%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools

echo 停止现有进程...
taskkill /f /im node.exe >nul 2>&1
timeout /t 3 >nul

echo 备份原配置...
copy app.config.js app.config.original.js >nul 2>&1
copy app.config.simple.js app.config.js

echo 清理缓存...
npx expo r -c

echo 启动ChatterUI (稳定模式)...
npx expo run:android --port 8084

echo 恢复原配置...
copy app.config.original.js app.config.js >nul 2>&1

pause