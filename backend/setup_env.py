#!/usr/bin/env python3
"""
环境变量设置脚本
帮助用户快速配置百度千帆API
"""

import os
import sys
from pathlib import Path

def setup_env():
    """设置环境变量"""
    print("🔧 配置百度千帆API环境变量")
    print("="*40)
    
    # 检查.env文件是否存在
    env_file = Path(".env")
    if env_file.exists():
        print("⚠️  .env文件已存在")
        overwrite = input("是否覆盖现有配置？(y/N): ").lower()
        if overwrite != 'y':
            print("❌ 取消配置")
            return False
    
    print("\n📋 请按以下步骤获取配置信息：")
    print("1. 访问 https://console.bce.baidu.com/qianfan/overview")
    print("2. 登录并创建应用")
    print("3. 获取应用ID和API密钥")
    print("")
    
    # 获取用户输入
    app_id = input("请输入应用ID (QIANFAN_APP_ID): ").strip()
    if not app_id:
        print("❌ 应用ID不能为空")
        return False
    
    token = input("请输入授权令牌 (QIANFAN_TOKEN): ").strip()
    if not token:
        print("❌ 授权令牌不能为空")
        return False
    
    # 确保token格式正确
    if not token.startswith('Bearer '):
        token = f'Bearer {token}'
    
    # 写入.env文件
    env_content = f"""# 百度千帆API配置
# 应用ID - 从个人空间-应用-应用ID获取
QIANFAN_APP_ID={app_id}

# 授权令牌 - 从应用工作台获取的密钥
QIANFAN_TOKEN={token}

# API基础URL（通常不需要修改）
QIANFAN_API_BASE_URL=https://qianfan.baidubce.com

# 服务器配置
HOST=0.0.0.0
PORT=8000

# 日志级别
LOG_LEVEL=INFO
"""
    
    try:
        with open(".env", "w", encoding="utf-8") as f:
            f.write(env_content)
        
        print("\n✅ 环境变量配置完成！")
        print("📁 配置文件已保存到: .env")
        print("\n🔍 验证配置...")
        
        # 验证配置
        from check_config import check_config
        if check_config():
            print("\n🎉 配置验证成功！可以启动应用了。")
            return True
        else:
            print("\n❌ 配置验证失败，请检查输入的信息。")
            return False
            
    except Exception as e:
        print(f"❌ 保存配置文件失败: {e}")
        return False

if __name__ == "__main__":
    try:
        success = setup_env()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n❌ 用户取消配置")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 配置过程中出错: {e}")
        sys.exit(1) 