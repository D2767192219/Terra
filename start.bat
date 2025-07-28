@echo off
chcp 65001 >nul

echo 🌍 球球terra - 地球科学科普智能体
echo ==================================

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python未安装，请先安装Python
    pause
    exit /b 1
)

REM 进入backend目录
cd backend

REM 检查是否存在requirements.txt
if not exist "requirements.txt" (
    echo ❌ requirements.txt文件不存在
    pause
    exit /b 1
)

REM 检查虚拟环境是否存在
if not exist "venv" (
    echo 📦 创建Python虚拟环境...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ 虚拟环境创建失败
        pause
        exit /b 1
    )
    echo ✅ 虚拟环境创建成功
)

REM 激活虚拟环境
echo 🔧 激活虚拟环境...
call venv\Scripts\activate.bat

REM 升级pip
echo ⬆️ 更新pip...
python -m pip install --upgrade pip

REM 安装依赖
echo 📦 安装Python依赖...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ 依赖安装失败
    call venv\Scripts\deactivate.bat
    pause
    exit /b 1
)

echo ✅ 依赖安装完成
echo.
echo 🚀 启动FastAPI服务器...
echo 📍 访问地址: http://localhost:8000
echo 📱 在手机上访问同一地址体验PWA功能
echo 📁 前端文件在: frontend/
echo 📁 后端文件在: backend/
echo.
echo 按Ctrl+C停止服务器
echo.

REM 启动服务器
python main.py

REM 退出时停用虚拟环境
call venv\Scripts\deactivate.bat

pause 