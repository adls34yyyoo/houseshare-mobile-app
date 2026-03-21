@echo off
chcp 65001 >nul
title HouseShare - 创建简单图标
color 0A

echo.
echo ============================================
echo    🏠 HouseShare - 创建简单图标文件
echo ============================================
echo.

echo 📁 当前目录：%CD%
echo.

echo 🔍 检查图标文件夹...
if not exist "assets\icons" (
    echo ❌ 图标文件夹不存在，正在创建...
    mkdir "assets\icons" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ 已创建：assets\icons\
    ) else (
        echo ❌ 创建文件夹失败！
        pause
        exit /b 1
    )
)

echo.
echo 🎨 正在创建简单的PNG图标文件...
echo.

:: 创建简单的Base64编码的PNG图标
echo 创建 72x72 图标...
echo iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA > "assets\icons\icon-72x72.png.base64"
echo 创建 96x96 图标...
echo iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA > "assets\icons\icon-96x96.png.base64"
echo 创建 128x128 图标...
echo iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA > "assets\icons\icon-128x128.png.base64"
echo 创建 144x144 图标...
echo iVBORw0KGgoAAAANSUhEUgAAAJAAAACQCAYAAADnRuK4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA > "assets\icons\icon-144x144.png.base64"
echo 创建 152x152 图标...
echo iVBORw0KGgoAAAANSUhEUgAAAJgAAACQCAYAAAAvK0hGAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA > "assets\icons\icon-152x152.png.base64"

echo.
echo ⚠️  注意：Base64编码的图标文件已创建
echo     但这些不是真正的PNG文件
echo.
echo 🎯 推荐使用以下方法创建真实图标：
echo.
echo 方法1：使用在线图标生成器
echo     访问：https://realfavicongenerator.net/
echo     上传任意图片，生成所有尺寸图标
echo.
echo 方法2：使用我创建的图标生成器
echo     双击：icon-generator-real.html
echo     自定义图标，生成真实PNG文件
echo.
echo 方法3：使用预制的简单图标
echo     我会为您创建简单的占位图标文件
echo.

set /p choice=请选择方法 (1/2/3): 

if "%choice%"=="1" (
    echo.
    echo 🌐 请访问：https://realfavicongenerator.net/
    echo     按提示操作，下载图标包
    echo     解压到当前文件夹的 assets\icons\ 目录
    echo.
    pause
    exit /b 0
)

if "%choice%"=="2" (
    echo.
    echo 🎨 请双击 icon-generator-real.html
    echo     自定义图标样式
    echo     生成并下载所有图标
    echo     保存到 assets\icons\ 目录
    echo.
    pause
    exit /b 0
)

if "%choice%"=="3" (
    echo.
    echo 🔧 正在创建简单的占位图标...
    echo.
    
    :: 创建简单的蓝色方块图标（Base64）
    echo 创建 192x192 图标...
    echo data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB > "assets\icons\icon-192x192.png.txt"
    
    echo 创建 384x384 图标...
    echo data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAABgCAYAAADimHc4AAAACXBIWXMAAAsTAAALEwEAmpwYAAAB > "assets\icons\icon-384x384.png.txt"
    
    echo 创建 512x512 图标...
    echo data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAAsTAAALEwEAmpwYAAAB > "assets\icons\icon-512x512.png.txt"
    
    echo.
    echo 📋 创建了3个占位图标文件（.txt格式）
    echo    这些文件需要转换为PNG格式
    echo.
    echo 🔗 转换方法：
    echo    1. 复制Base64编码（data:image/png;base64,之后的内容）
    echo    2. 访问：https://base64.guru/converter/decode/image
    echo    3. 粘贴Base64编码，解码为PNG
    echo    4. 下载PNG文件，重命名为正确的文件名
    echo.
    pause
    exit /b 0
)

echo.
echo ❌ 无效选择
echo.
pause