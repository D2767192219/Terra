#!/usr/bin/env python3
"""
球球Terra系统诊断脚本
快速检查和诊断常见的配置和连接问题
"""

import os
import sys
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

def print_header(title):
    """打印标题"""
    print("\n" + "=" * 50)
    print(f"🔍 {title}")
    print("=" * 50)

def print_status(status, message):
    """打印状态信息"""
    icon = "✅" if status else "❌"
    print(f"{icon} {message}")

def check_environment():
    """检查环境配置"""
    print_header("环境配置检查")
    
    # 检查Python版本
    python_version = sys.version
    print(f"🐍 Python版本: {python_version}")
    
    # 检查工作目录
    current_dir = Path.cwd()
    print(f"📂 当前目录: {current_dir}")
    
    # 检查项目结构
    backend_dir = current_dir / "backend"
    frontend_dir = current_dir / "frontend"
    
    print_status(backend_dir.exists(), f"后端目录存在: {backend_dir}")
    print_status(frontend_dir.exists(), f"前端目录存在: {frontend_dir}")
    
    # 检查关键文件
    key_files = [
        "backend/main.py",
        "backend/chat_api.py", 
        "backend/qianfan_client.py",
        "frontend/chat.js",
        "backend/requirements.txt"
    ]
    
    for file_path in key_files:
        file_exists = (current_dir / file_path).exists()
        print_status(file_exists, f"关键文件: {file_path}")

def check_dependencies():
    """检查Python依赖"""
    print_header("依赖检查")
    
    required_packages = [
        "fastapi",
        "uvicorn", 
        "requests",
        "python-dotenv",
        "pydantic"
    ]
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print_status(True, f"依赖包: {package}")
        except ImportError:
            print_status(False, f"依赖包: {package} (未安装)")
            print(f"   安装命令: pip install {package}")

def check_config():
    """检查配置文件"""
    print_header("配置文件检查")
    
    # 加载环境变量
    env_file = Path("backend/.env")
    env_example = Path("backend/env_example.txt")
    
    print_status(env_file.exists(), f"配置文件: {env_file}")
    print_status(env_example.exists(), f"配置示例: {env_example}")
    
    if env_file.exists():
        load_dotenv(env_file)
        
        # 检查必需的环境变量
        required_vars = {
            "QIANFAN_APP_ID": "千帆应用ID",
            "QIANFAN_TOKEN": "千帆授权令牌"
        }
        
        for var_name, description in required_vars.items():
            var_value = os.getenv(var_name)
            has_value = bool(var_value and var_value.strip())
            print_status(has_value, f"{description} ({var_name})")
            
            if has_value:
                # 显示部分值用于验证
                if len(var_value) > 20:
                    masked_value = var_value[:10] + "..." + var_value[-5:]
                else:
                    masked_value = var_value[:5] + "..."
                print(f"     值: {masked_value} (长度: {len(var_value)})")
    else:
        print("⚠️ 未找到配置文件，请运行: python backend/setup_ai.py")

def check_backend_service():
    """检查后端服务"""
    print_header("后端服务检查")
    
    backend_url = "http://localhost:8000"
    
    # 检查健康检查接口
    try:
        response = requests.get(f"{backend_url}/health", timeout=5)
        print_status(response.status_code == 200, f"健康检查接口: {backend_url}/health")
        
        if response.status_code == 200:
            data = response.json()
            print(f"     服务状态: {data.get('status', 'unknown')}")
    except requests.exceptions.ConnectionError:
        print_status(False, "后端服务连接失败 - 服务可能未启动")
        print("     启动命令: cd backend && python main.py")
    except Exception as e:
        print_status(False, f"健康检查失败: {e}")
    
    # 检查API测试接口
    try:
        response = requests.get(f"{backend_url}/api/chat/test", timeout=5)
        print_status(response.status_code == 200, f"API测试接口: {backend_url}/api/chat/test")
        
        if response.status_code == 200:
            data = response.json()
            config_status = data.get('config_status', {})
            print(f"     配置状态: {config_status}")
    except requests.exceptions.ConnectionError:
        print_status(False, "API服务连接失败")
    except Exception as e:
        print_status(False, f"API测试失败: {e}")

def test_chat_api():
    """测试聊天API"""
    print_header("聊天API测试")
    
    backend_url = "http://localhost:8000"
    
    try:
        # 测试前端聊天接口
        test_message = "你好，这是一个测试消息"
        payload = {
            "message": test_message,
            "conversation_id": None
        }
        
        print(f"📤 发送测试消息: {test_message}")
        response = requests.post(
            f"{backend_url}/api/chat",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"📥 响应状态: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_status(True, "聊天API测试成功")
            print(f"     对话ID: {data.get('conversation_id', 'unknown')}")
            response_text = data.get('response', '')
            if len(response_text) > 100:
                response_text = response_text[:100] + "..."
            print(f"     AI回复: {response_text}")
        else:
            print_status(False, f"聊天API测试失败 (HTTP {response.status_code})")
            try:
                error_detail = response.json()
                print(f"     错误详情: {error_detail}")
            except:
                print(f"     错误内容: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print_status(False, "无法连接到后端服务")
    except Exception as e:
        print_status(False, f"聊天API测试异常: {e}")

def check_qianfan_direct():
    """直接测试千帆API"""
    print_header("千帆API直接测试")
    
    app_id = os.getenv('QIANFAN_APP_ID')
    token = os.getenv('QIANFAN_TOKEN')
    
    if not app_id or not token:
        print_status(False, "千帆API配置不完整，跳过直接测试")
        return
    
    try:
        # 添加backend目录到路径
        backend_dir = Path(__file__).parent / 'backend'
        sys.path.insert(0, str(backend_dir))
        
        from qianfan_client import create_qianfan_client
        
        print("🔗 创建千帆客户端...")
        client = create_qianfan_client(token)
        
        print("📞 测试创建对话...")
        conversation_result = client.create_conversation(app_id)
        conversation_id = conversation_result.get('conversation_id')
        
        if conversation_id:
            print_status(True, f"千帆对话创建成功: {conversation_id[:20]}...")
            
            print("💬 测试发送消息...")
            message_result = client.send_message(app_id, conversation_id, "你好", stream=False)
            
            if 'answer' in message_result:
                answer = message_result['answer']
                if len(answer) > 100:
                    answer = answer[:100] + "..."
                print_status(True, f"千帆消息发送成功: {answer}")
            else:
                print_status(False, f"千帆回复格式异常: {list(message_result.keys())}")
        else:
            print_status(False, f"千帆对话创建失败: {conversation_result}")
            
    except ImportError:
        print_status(False, "无法导入千帆客户端模块")
    except Exception as e:
        print_status(False, f"千帆API直接测试失败: {e}")

def provide_solutions():
    """提供解决方案"""
    print_header("常见问题解决方案")
    
    solutions = [
        ("400 Bad Request错误", [
            "检查是否正确配置了QIANFAN_APP_ID和QIANFAN_TOKEN",
            "运行: python backend/setup_ai.py 重新配置",
            "确认千帆应用状态为启用",
            "检查API密钥权限"
        ]),
        ("连接失败", [
            "确认后端服务已启动: cd backend && python main.py",
            "检查端口8000是否被占用",
            "尝试访问: http://localhost:8000/docs"
        ]),
        ("依赖缺失", [
            "安装Python依赖: pip install -r backend/requirements.txt",
            "确认Python版本 >= 3.7"
        ]),
        ("配置问题", [
            "运行配置助手: python backend/setup_ai.py",
            "检查.env文件格式",
            "确认环境变量加载正确"
        ])
    ]
    
    for problem, steps in solutions:
        print(f"\n🔧 {problem}:")
        for i, step in enumerate(steps, 1):
            print(f"   {i}. {step}")

def main():
    """主函数"""
    print("🌍 球球Terra - 系统诊断工具")
    print("自动检查系统配置和连接状态")
    
    # 切换到项目根目录
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # 运行各项检查
    check_environment()
    check_dependencies()
    check_config()
    check_backend_service()
    test_chat_api()
    check_qianfan_direct()
    provide_solutions()
    
    print_header("诊断完成")
    print("📋 请根据上述检查结果解决发现的问题")
    print("💡 如果问题仍然存在，请查看详细的错误日志")
    print("📖 参考文档: CHAT_GUIDE.md")

if __name__ == "__main__":
    main() 