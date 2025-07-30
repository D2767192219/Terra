#!/usr/bin/env python3
"""
配置检查脚本
用于验证环境变量配置是否正确
"""

import os
import sys
from dotenv import load_dotenv

def check_config():
    """检查环境变量配置"""
    print("🔍 检查环境变量配置...")
    
    # 加载.env文件
    load_dotenv()
    
    # 检查必要的环境变量
    required_vars = {
        'QIANFAN_APP_ID': '百度千帆应用ID',
        'QIANFAN_TOKEN': '百度千帆授权令牌'
    }
    
    missing_vars = []
    configured_vars = []
    
    for var_name, description in required_vars.items():
        value = os.getenv(var_name)
        if value and value.strip():
            # 隐藏敏感信息，只显示前几个字符
            if var_name == 'QIANFAN_TOKEN':
                display_value = value[:10] + "..." if len(value) > 10 else "***"
            else:
                display_value = value
            print(f"✅ {description}: {display_value}")
            configured_vars.append(var_name)
        else:
            print(f"❌ {description}: 未配置")
            missing_vars.append(var_name)
    
    print("\n" + "="*50)
    
    if missing_vars:
        print("❌ 配置不完整！")
        print("\n请按以下步骤配置：")
        print("1. 复制环境变量模板：")
        print("   cp env_template.txt .env")
        print("\n2. 编辑 .env 文件，填入你的配置：")
        print("   QIANFAN_APP_ID=your-app-id-here")
        print("   QIANFAN_TOKEN=your-bearer-token-here")
        print("\n3. 获取配置信息：")
        print("   - 访问 https://console.bce.baidu.com/qianfan/overview")
        print("   - 创建应用并获取应用ID")
        print("   - 获取API密钥作为授权令牌")
        return False
    else:
        print("✅ 配置完整！可以启动应用了。")
        print("\n启动命令：")
        print("  ./start.sh          # 完整应用")
        print("  ./start-backend.sh  # 仅后端")
        return True

if __name__ == "__main__":
    try:
        success = check_config()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ 检查配置时出错: {e}")
        sys.exit(1) 