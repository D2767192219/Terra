#!/usr/bin/env python3
"""
配置验证脚本
检查百度千帆API配置是否正确
"""

import os
import sys
import requests
import json
from dotenv import load_dotenv
from typing import Dict, List, Tuple

class ConfigValidator:
    """配置验证器"""
    
    def __init__(self):
        # 加载环境变量
        load_dotenv()
        
        self.errors = []
        self.warnings = []
        self.success_messages = []
        
    def check_env_vars(self) -> bool:
        """检查环境变量"""
        print("🔍 检查环境变量...")
        
        required_vars = {
            'QIANFAN_TOKEN': '百度千帆API令牌',
            'QIANFAN_APP_ID': '应用ID'
        }
        
        optional_vars = {
            'QIANFAN_API_BASE_URL': 'API基础URL',
            'HOST': '服务主机',
            'PORT': '服务端口'
        }
        
        all_good = True
        
        # 检查必需变量
        for var, desc in required_vars.items():
            value = os.getenv(var)
            if not value:
                self.errors.append(f"❌ 缺少环境变量 {var} ({desc})")
                all_good = False
            else:
                # 检查token格式
                if var == 'QIANFAN_TOKEN':
                    if len(value) < 10:
                        self.warnings.append(f"⚠️  {var} 长度较短，请确认是否正确")
                    else:
                        self.success_messages.append(f"✅ {var} 已设置")
                else:
                    self.success_messages.append(f"✅ {var} = {value}")
        
        # 检查可选变量
        for var, desc in optional_vars.items():
            value = os.getenv(var)
            if value:
                self.success_messages.append(f"✅ {var} = {value}")
            else:
                default_values = {
                    'QIANFAN_API_BASE_URL': 'https://qianfan.baidubce.com',
                    'HOST': '0.0.0.0',
                    'PORT': '8000'
                }
                default = default_values.get(var, '未设置')
                self.warnings.append(f"⚠️  {var} 未设置，将使用默认值: {default}")
        
        return all_good
    
    def check_env_file(self) -> bool:
        """检查.env文件"""
        print("\n📁 检查.env文件...")
        
        env_files = ['.env', '../.env', 'backend/.env']
        found_env = False
        
        for env_file in env_files:
            if os.path.exists(env_file):
                found_env = True
                self.success_messages.append(f"✅ 找到配置文件: {env_file}")
                
                try:
                    with open(env_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'QIANFAN_TOKEN' in content:
                            self.success_messages.append("✅ .env文件包含QIANFAN_TOKEN")
                        else:
                            self.warnings.append("⚠️  .env文件中未找到QIANFAN_TOKEN")
                except Exception as e:
                    self.warnings.append(f"⚠️  读取{env_file}时出错: {e}")
                break
        
        if not found_env:
            self.warnings.append("⚠️  未找到.env文件，请创建并配置环境变量")
            self.warnings.append("   参考: cp .env.example .env")
        
        return found_env
    
    def test_api_connection(self) -> bool:
        """测试API连接"""
        print("\n🌐 测试百度千帆API连接...")
        
        token = os.getenv('QIANFAN_TOKEN')
        app_id = os.getenv('QIANFAN_APP_ID', 'ac6acc7c-9e7c-4909-8bc0-5ca667a5e0b6')
        base_url = os.getenv('QIANFAN_API_BASE_URL', 'https://qianfan.baidubce.com')
        
        if not token:
            self.errors.append("❌ 无法测试API：缺少QIANFAN_TOKEN")
            return False
        
        try:
            url = f"{base_url}/v2/app/conversation"
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            data = {
                'app_id': app_id
            }
            
            print(f"   正在连接: {url}")
            response = requests.post(
                url, 
                headers=headers, 
                json=data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                conversation_id = result.get('conversation_id')
                request_id = result.get('request_id')
                
                self.success_messages.append("✅ API连接成功！")
                self.success_messages.append(f"   Request ID: {request_id}")
                self.success_messages.append(f"   Conversation ID: {conversation_id}")
                return True
            
            elif response.status_code == 401:
                self.errors.append("❌ API认证失败：Token无效或已过期")
                return False
            
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('message', '请求参数错误')
                    self.errors.append(f"❌ API请求错误 (400): {error_msg}")
                except:
                    self.errors.append("❌ API请求错误 (400): 请求参数错误")
                return False
            
            else:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('message', f'HTTP {response.status_code}')
                    self.errors.append(f"❌ API调用失败: {error_msg}")
                except:
                    self.errors.append(f"❌ API调用失败: HTTP {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            self.errors.append("❌ API连接超时，请检查网络连接")
            return False
        except requests.exceptions.ConnectionError:
            self.errors.append("❌ 无法连接到API服务器，请检查网络")
            return False
        except Exception as e:
            self.errors.append(f"❌ API测试异常: {e}")
            return False
    
    def check_dependencies(self) -> bool:
        """检查Python依赖"""
        print("\n📦 检查Python依赖...")
        
        required_packages = [
            'fastapi',
            'uvicorn', 
            'requests',
            'python-dotenv',
            'pydantic'
        ]
        
        optional_packages = [
            'aiohttp'
        ]
        
        all_good = True
        
        for package in required_packages:
            try:
                __import__(package.replace('-', '_'))
                self.success_messages.append(f"✅ {package} 已安装")
            except ImportError:
                self.errors.append(f"❌ 缺少依赖包: {package}")
                all_good = False
        
        for package in optional_packages:
            try:
                __import__(package.replace('-', '_'))
                self.success_messages.append(f"✅ {package} 已安装")
            except ImportError:
                self.warnings.append(f"⚠️  建议安装: {package}")
        
        if not all_good:
            self.errors.append("💡 安装命令: pip install -r requirements.txt")
        
        return all_good
    
    def check_file_structure(self) -> bool:
        """检查文件结构"""
        print("\n📂 检查文件结构...")
        
        required_files = [
            'qianfan_client.py',
            'chat_api.py',
            'main.py',
            'requirements.txt'
        ]
        
        optional_files = [
            'chat_example.py',
            'fastapi_chat_example.py',
            '.env.example',
            'README_CHAT.md'
        ]
        
        base_dirs = ['.', 'backend', '../backend']
        found_dir = None
        
        # 找到正确的目录
        for base_dir in base_dirs:
            if all(os.path.exists(os.path.join(base_dir, f)) for f in required_files):
                found_dir = base_dir
                break
        
        if found_dir:
            self.success_messages.append(f"✅ 找到项目文件，目录: {os.path.abspath(found_dir)}")
            
            # 检查可选文件
            for file in optional_files:
                filepath = os.path.join(found_dir, file)
                if os.path.exists(filepath):
                    self.success_messages.append(f"✅ {file}")
                else:
                    self.warnings.append(f"⚠️  建议创建: {file}")
            
            return True
        else:
            self.errors.append("❌ 未找到完整的项目文件结构")
            self.errors.append("   请确保在正确的目录中运行此脚本")
            return False
    
    def print_results(self):
        """打印检查结果"""
        print("\n" + "="*60)
        print("📋 配置验证结果")
        print("="*60)
        
        if self.success_messages:
            print("\n✅ 成功项目:")
            for msg in self.success_messages:
                print(f"  {msg}")
        
        if self.warnings:
            print("\n⚠️  警告项目:")
            for msg in self.warnings:
                print(f"  {msg}")
        
        if self.errors:
            print("\n❌ 错误项目:")
            for msg in self.errors:
                print(f"  {msg}")
        
        print("\n" + "="*60)
        
        if not self.errors:
            print("🎉 配置验证通过！您可以开始使用智能体对话功能了。")
            print("\n💡 下一步:")
            print("  1. 启动服务: python start_chat_api.py")
            print("  2. 测试功能: python fastapi_chat_example.py test")
            print("  3. 查看文档: http://localhost:8000/docs")
        else:
            print("💥 发现配置问题，请解决上述错误后重试。")
            print("\n💡 解决建议:")
            print("  1. 创建.env文件: cp .env.example .env")
            print("  2. 配置API令牌: 编辑.env文件，设置QIANFAN_TOKEN")
            print("  3. 安装依赖: pip install -r requirements.txt")
        
        return len(self.errors) == 0

def main():
    """主函数"""
    print("🚀 百度千帆智能体对话功能配置验证")
    print("="*60)
    
    validator = ConfigValidator()
    
    # 执行各项检查
    checks = [
        ("文件结构", validator.check_file_structure),
        ("Python依赖", validator.check_dependencies),
        ("环境文件", validator.check_env_file),
        ("环境变量", validator.check_env_vars),
        ("API连接", validator.test_api_connection),
    ]
    
    all_passed = True
    for name, check_func in checks:
        try:
            result = check_func()
            all_passed = all_passed and result
        except Exception as e:
            validator.errors.append(f"❌ {name}检查时出错: {e}")
            all_passed = False
    
    # 打印结果
    success = validator.print_results()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 