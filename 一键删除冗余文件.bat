@echo off
chcp 65001 >nul
title HouseShare手机APP - 删除冗余文件工具
color 0A

echo.
echo ============================================
echo    🗑️  HouseShare手机APP - 删除冗余文件工具
echo ============================================
echo.

echo ⚠️  重要提醒：此脚本只删除本地冗余文件
echo    不会影响GitHub上已部署的文件
echo.

echo 📁 当前目录：%CD%
echo.

set /p confirm=❓ 确认要删除本地冗余文件吗？(Y/N): 

if /i "%confirm%" neq "Y" (
    echo.
    echo ❌ 操作已取消
    pause
    exit /b 0
)

echo.
echo 🔍 正在检查文件...
echo.

:: 列出要删除的文件
echo 将要删除的文件：
echo -------------------------
if exist "测试登录.html" (
    echo ✅ 测试登录.html
) else (
    echo ❌ 测试登录.html (不存在)
)

if exist "New repository" (
    echo ✅ New repository
) else (
    echo ❌ New repository (不存在)
)

if exist "create-icons.html" (
    echo ✅ create-icons.html
) else (
    echo ❌ create-icons.html (不存在)
)

if exist "generate-icons.html" (
    echo ✅ generate-icons.html
) else (
    echo ❌ generate-icons.html (不存在)
)

if exist "DEPLOYMENT-GUIDE.md" (
    echo ✅ DEPLOYMENT-GUIDE.md
) else (
    echo ❌ DEPLOYMENT-GUIDE.md (不存在)
)

echo -------------------------
echo.

set /p confirm2=❓ 确认删除以上文件？(Y/N): 

if /i "%confirm2%" neq "Y" (
    echo.
    echo ❌ 操作已取消
    pause
    exit /b 0
)

echo.
echo 🗑️ 正在删除文件...
echo.

:: 删除文件
set count=0

if exist "测试登录.html" (
    del "测试登录.html" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ 已删除：测试登录.html
        set /a count+=1
    ) else (
        echo ❌ 删除失败：测试登录.html
    )
)

if exist "New repository" (
    del "New repository" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ 已删除：New repository
        set /a count+=1
    ) else (
        echo ❌ 删除失败：New repository
    )
)

if exist "create-icons.html" (
    del "create-icons.html" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ 已删除：create-icons.html
        set /a count+=1
    ) else (
        echo ❌ 删除失败：create-icons.html
    )
)

if exist "generate-icons.html" (
    del "generate-icons.html" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ 已删除：generate-icons.html
        set /a count+=1
    ) else (
        echo ❌ 删除失败：generate-icons.html
    )
)

if exist "DEPLOYMENT-GUIDE.md" (
    del "DEPLOYMENT-GUIDE.md" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ 已删除：DEPLOYMENT-GUIDE.md
        set /a count+=1
    ) else (
        echo ❌ 删除失败：DEPLOYMENT-GUIDE.md
    )
)

echo.
echo ============================================
echo 📊 删除完成统计：
echo    共删除 %count% 个文件
echo.
echo 📱 核心文件保留：
echo    ✅ index.html
echo    ✅ manifest.json  
echo    ✅ sw.js
echo    ✅ css/ 文件夹
echo    ✅ js/ 文件夹
echo    ✅ assets/ 文件夹
echo.
echo ⚠️  注意：
echo    1. 此操作只删除本地文件
echo    2. GitHub上的文件不受影响
echo    3. 如需删除GitHub文件，请使用网页界面
echo ============================================
echo.

echo 🔧 下一步操作建议：
echo    1. 打开GitHub：https://github.com/adls34yyyoo/houseshare-mobile-app
echo    2. 检查当前文件状态
echo    3. 如需删除GitHub文件，使用网页操作
echo.

echo 📞 需要帮助？
echo    请查看 "删除已部署文件指南.txt" 文件
echo.

pause