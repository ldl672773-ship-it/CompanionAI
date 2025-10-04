@echo off
echo ====================================
echo CompanionAI GitHub Release 创建脚本
echo ====================================
echo.

REM 检查GitHub CLI是否安装
where gh >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] GitHub CLI (gh) 未安装
    echo.
    echo 请选择以下方式之一：
    echo.
    echo 方式1：手动安装GitHub CLI
    echo   1. 访问：https://cli.github.com/
    echo   2. 下载并安装
    echo   3. 重启终端后再运行本脚本
    echo.
    echo 方式2：通过网页创建Release（最简单）
    echo   1. 访问：https://github.com/ldl672773-ship-it/CompanionAI/releases/new
    echo   2. 填写信息（已为您准备好，见 RELEASE_NOTES_v1.0.0.md）
    echo   3. 上传APK：CompanionAI-v1.0.0.apk
    echo   4. 点击 "Publish release"
    echo.
    pause
    exit /b 1
)

echo [1/4] 检查GitHub登录状态...
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo [登录] 请登录GitHub...
    gh auth login
    if %errorlevel% neq 0 (
        echo [错误] GitHub登录失败
        pause
        exit /b 1
    )
)

echo [2/4] 检查APK文件...
if not exist "CompanionAI-v1.0.0.apk" (
    echo [错误] 找不到 CompanionAI-v1.0.0.apk
    echo 请确保APK文件在当前目录
    pause
    exit /b 1
)

echo [3/4] 创建Git Tag v1.0.0...
git tag v1.0.0 2>nul
git push origin v1.0.0 2>nul

echo [4/4] 创建GitHub Release并上传APK...
gh release create v1.0.0 ^
  --title "CompanionAI v1.0.0 - 首次发布 🎉" ^
  --notes-file "RELEASE_NOTES_v1.0.0.md" ^
  --latest ^
  "CompanionAI-v1.0.0.apk#CompanionAI v1.0.0 (Android APK)"

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo ✅ Release创建成功！
    echo ====================================
    echo.
    echo 访问：https://github.com/ldl672773-ship-it/CompanionAI/releases
    echo.
) else (
    echo.
    echo ====================================
    echo ❌ Release创建失败
    echo ====================================
    echo.
    echo 请检查网络连接或使用网页方式创建
    echo.
)

pause
