#!/bin/bash

echo "🌍 球球terra - 前端开发服务器"
echo "=============================="

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3未安装，请先安装Python3"
    exit 1
fi

# 获取本机IP地址
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo "🚀 启动前端开发服务器..."
echo "📍 本地访问: http://localhost:8080"
echo "📱 局域网访问: http://$LOCAL_IP:8080"
echo "💡 这是纯前端模式，聊天功能需要后端支持"
echo ""
echo "按Ctrl+C停止服务器"
echo ""

# 启动Python简单HTTP服务器，绑定到所有网络接口
python3 -m http.server 8080 --bind 0.0.0.0 