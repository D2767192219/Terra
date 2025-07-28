#!/bin/bash

echo "🌍 球球terra - 地球科学科普智能体"
echo "=================================="

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python3"
    exit 1
fi

# 进入backend目录
cd backend

# 检查是否存在requirements.txt
if [ ! -f "requirements.txt" ]; then
    echo "❌ requirements.txt文件不存在"
    exit 1
fi

# 检查虚拟环境是否存在
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ 虚拟环境创建失败"
        exit 1
    fi
    echo "✅ 虚拟环境创建成功"
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 升级pip
echo "⬆️ 更新pip..."
pip install --upgrade pip

# 安装依赖
echo "📦 安装Python依赖..."
pip install -r requirements.txt

# 检查安装是否成功
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    deactivate
    exit 1
fi

echo "✅ 依赖安装完成"
echo ""
echo "🚀 启动FastAPI服务器..."
echo "📍 访问地址: http://localhost:8000"
echo "📱 在手机上访问同一地址体验PWA功能"
echo "📁 前端文件在: frontend/"
echo "📁 后端文件在: backend/"
echo ""
echo "按Ctrl+C停止服务器"
echo ""

# 启动服务器
python main.py

# 退出时停用虚拟环境
deactivate 