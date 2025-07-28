#!/usr/bin/env python3
"""
启动带智能体对话功能的FastAPI服务
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv

def main():
    """启动服务"""
    # 加载环境变量
    load_dotenv()
    
    # 检查必要的环境变量
    qianfan_token = os.getenv('QIANFAN_TOKEN')
    if not qianfan_token:
        print("⚠️  警告：未设置QIANFAN_TOKEN环境变量")
        print("请在.env文件中设置您的百度千帆API令牌")
        print("示例：QIANFAN_TOKEN=your_token_here")
        print()
    
    # 获取启动参数
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("RELOAD", "true").lower() in ['true', '1', 'yes']
    
    print("🚀 启动AI聊天助手FastAPI服务")
    print(f"📍 服务地址: http://{host}:{port}")
    print(f"📖 API文档: http://{host}:{port}/docs")
    print(f"🔧 交互式文档: http://{host}:{port}/redoc")
    print()
    print("💡 智能体对话API端点:")
    print("  • POST /api/chat/conversation - 创建对话")
    print("  • POST /api/chat/message - 发送消息")
    print("  • GET /api/chat/history/{conversation_id} - 获取对话历史")
    print("  • POST /api/chat/quick-chat - 快速对话")
    print("  • GET /api/chat/test - 测试连接")
    print()
    
    if qianfan_token:
        print("✅ 百度千帆API令牌已配置")
    else:
        print("❌ 百度千帆API令牌未配置")
    
    print(f"🔄 自动重载: {'开启' if reload else '关闭'}")
    print("-" * 50)
    
    try:
        # 启动服务
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 服务已停止")
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 