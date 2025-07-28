#!/usr/bin/env python3
"""
百度千帆API配置脚本
帮助用户快速配置AI聊天功能
"""

import os
import sys
from pathlib import Path

def print_banner():
    """打印欢迎横幅"""
    print("=" * 50)
    print("🌍 球球Terra - 百度千帆AI配置助手")
    print("=" * 50)
    print()

def print_instructions():
    """打印配置说明"""
    print("📋 配置说明：")
    print("1. 访问百度智能云千帆平台: https://console.bce.baidu.com/qianfan/overview")
    print("2. 登录并创建一个应用（自主规划agent或工作流agent）")
    print("3. 获取应用ID和授权令牌")
    print("4. 在下面输入这些信息")
    print()

def get_user_input():
    """获取用户输入的配置信息"""
    print("🔧 请输入您的千帆API配置：")
    print()
    
    app_id = input("📱 应用ID (QIANFAN_APP_ID): ").strip()
    if not app_id:
        print("❌ 应用ID不能为空")
        return None
    
    print("\n💡 提示：授权令牌是从应用工作台获取的密钥")
    print("格式类似：Bearer bce-v3/ALTAK-xxx 或直接是密钥字符串")
    token = input("🔑 授权令牌 (QIANFAN_TOKEN): ").strip()
    if not token:
        print("❌ 授权令牌不能为空")
        return None
    
    # 如果用户输入的token包含"Bearer "前缀，去掉它
    if token.startswith("Bearer "):
        token = token[7:]
    
    return {
        'app_id': app_id,
        'token': token
    }

def save_config(config):
    """保存配置到.env文件"""
    env_file = Path('.env')
    
    try:
        # 创建.env文件内容
        env_content = f"""# 百度千帆API配置
# 由setup_ai.py自动生成

# 应用ID
QIANFAN_APP_ID={config['app_id']}

# 授权令牌
QIANFAN_TOKEN={config['token']}

# API基础URL（通常不需要修改）
QIANFAN_API_BASE_URL=https://qianfan.baidubce.com

# 服务器配置
HOST=0.0.0.0
PORT=8000

# 日志级别
LOG_LEVEL=INFO
"""
        
        # 写入文件
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print(f"✅ 配置已保存到 {env_file.absolute()}")
        return True
        
    except Exception as e:
        print(f"❌ 保存配置失败: {e}")
        return False

def test_config(config):
    """测试配置是否有效"""
    print("\n🔬 测试API连接...")
    
    try:
        # 动态导入以避免在配置前导入失败
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from qianfan_client import create_qianfan_client
        
        # 创建客户端
        client = create_qianfan_client(config['token'])
        
        # 测试创建对话
        result = client.create_conversation(config['app_id'])
        
        if 'conversation_id' in result:
            print("✅ API连接测试成功！")
            print(f"   对话ID: {result['conversation_id'][:20]}...")
            return True
        else:
            print("❌ API测试失败：响应格式不正确")
            print(f"   响应: {result}")
            return False
            
    except ImportError as e:
        print("⚠️ 无法导入千帆客户端，跳过连接测试")
        print("   请确保已安装所有依赖: pip install -r requirements.txt")
        return True  # 配置文件已保存，这不是致命错误
        
    except Exception as e:
        print(f"❌ API测试失败: {e}")
        print("\n🔍 可能的原因：")
        print("   1. 应用ID或授权令牌不正确")
        print("   2. 网络连接问题")
        print("   3. API密钥权限不足")
        return False

def main():
    """主函数"""
    print_banner()
    
    # 检查是否已存在配置
    env_file = Path('.env')
    if env_file.exists():
        print("⚠️ 发现现有配置文件 .env")
        choice = input("是否要重新配置？(y/N): ").strip().lower()
        if choice not in ['y', 'yes']:
            print("配置取消")
            return
        print()
    
    print_instructions()
    
    # 获取用户输入
    config = get_user_input()
    if not config:
        print("❌ 配置失败")
        sys.exit(1)
    
    # 保存配置
    if not save_config(config):
        sys.exit(1)
    
    # 测试配置
    if test_config(config):
        print("\n🎉 AI配置完成！")
        print("现在可以启动聊天服务了：")
        print("   python main.py")
    else:
        print("\n⚠️ 配置已保存但测试失败")
        print("请检查您的API密钥和网络连接")
    
    print("\n🔗 有用的链接：")
    print("   千帆平台: https://console.bce.baidu.com/qianfan/overview")
    print("   API文档: https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html")

if __name__ == "__main__":
    main() 