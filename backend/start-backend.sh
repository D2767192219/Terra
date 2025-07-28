#!/bin/bash

echo "🌍 球球terra - 后端API服务器"
echo "============================="

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python3"
    exit 1
fi

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

# 获取本机IP地址
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo "✅ 依赖安装完成"
echo ""

# 检查是否配置了AI
if [ ! -f ".env" ]; then
    echo "⚠️ 未检测到AI配置文件"
    echo "🔧 请先配置百度千帆API："
    echo "   python setup_ai.py"
    echo ""
    echo "📚 或者查看配置说明："
    echo "   cat config_instructions.md"
    echo ""
    read -p "是否现在配置AI？(y/N): " configure_ai
    if [ "$configure_ai" = "y" ] || [ "$configure_ai" = "Y" ]; then
        python setup_ai.py
        if [ $? -ne 0 ]; then
            echo "❌ AI配置失败，退出启动"
            deactivate
            exit 1
        fi
    fi
fi

echo "🚀 启动FastAPI后端服务器..."
echo "📍 本地API: http://localhost:8000/api"
echo "📱 局域网API: http://$LOCAL_IP:8000/api"
echo "📖 API文档: http://localhost:8000/docs"
echo "🛠️ 管理面板: http://localhost:8000/admin.html"
echo ""
echo "按Ctrl+C停止服务器"
echo ""

# 启动服务器
python main.py

# 退出时停用虚拟环境
deactivate 