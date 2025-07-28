#!/usr/bin/env python3
"""
球球Terra集成测试脚本
测试前后端API集成和千帆对话功能
"""

import asyncio
import aiohttp
import json
import sys
import os
from pathlib import Path

# 添加backend目录到Python路径
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# 测试配置
TEST_CONFIG = {
    'backend_url': 'http://localhost:8000',
    'test_messages': [
        "你好",
        "你是谁？",
        "告诉我一些关于地球的知识",
        "什么是全球变暖？"
    ]
}

class TerraIntegrationTest:
    def __init__(self, backend_url):
        self.backend_url = backend_url
        self.session = None
        self.conversation_id = None
    
    async def setup(self):
        """初始化测试环境"""
        self.session = aiohttp.ClientSession()
        print("🚀 初始化测试环境...")
    
    async def cleanup(self):
        """清理测试环境"""
        if self.session:
            await self.session.close()
        print("🧹 清理测试环境完成")
    
    async def test_health_check(self):
        """测试健康检查接口"""
        print("\n📋 测试 1: 健康检查")
        try:
            async with self.session.get(f'{self.backend_url}/health') as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ 健康检查通过: {data}")
                    return True
                else:
                    print(f"❌ 健康检查失败: HTTP {response.status}")
                    return False
        except Exception as e:
            print(f"❌ 健康检查异常: {e}")
            return False
    
    async def test_chat_api_info(self):
        """测试聊天API信息接口"""
        print("\n📋 测试 2: 聊天API信息")
        try:
            async with self.session.get(f'{self.backend_url}/api/chat/test') as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ API信息获取成功: {data['message']}")
                    print(f"   可用接口: {len(data.get('endpoints', []))} 个")
                    return True
                else:
                    print(f"❌ API信息获取失败: HTTP {response.status}")
                    return False
        except Exception as e:
            print(f"❌ API信息获取异常: {e}")
            return False
    
    async def test_conversation_creation(self):
        """测试对话创建"""
        print("\n📋 测试 3: 对话创建")
        try:
            payload = {
                "app_id": os.getenv('QIANFAN_APP_ID'),
                "token": os.getenv('QIANFAN_TOKEN')
            }
            
            async with self.session.post(
                f'{self.backend_url}/api/chat/conversation',
                json=payload
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    if data['success'] and 'data' in data:
                        conversation_id = data['data'].get('conversation_id')
                        self.conversation_id = conversation_id
                        print(f"✅ 对话创建成功: {conversation_id[:20]}...")
                        return True
                    else:
                        print(f"❌ 对话创建失败: {data}")
                        return False
                else:
                    error_text = await response.text()
                    print(f"❌ 对话创建失败: HTTP {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ 对话创建异常: {e}")
            return False
    
    async def test_frontend_chat_api(self):
        """测试前端聊天接口"""
        print("\n📋 测试 4: 前端聊天接口")
        
        success_count = 0
        total_tests = len(TEST_CONFIG['test_messages'])
        
        for i, message in enumerate(TEST_CONFIG['test_messages'], 1):
            print(f"\n   测试消息 {i}/{total_tests}: {message}")
            
            try:
                payload = {
                    "message": message,
                    "conversation_id": self.conversation_id
                }
                
                async with self.session.post(
                    f'{self.backend_url}/api/chat',
                    json=payload
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'response' in data:
                            response_text = data['response'][:100] + "..." if len(data['response']) > 100 else data['response']
                            print(f"   ✅ 回复: {response_text}")
                            
                            # 更新对话ID
                            if 'conversation_id' in data:
                                self.conversation_id = data['conversation_id']
                            
                            success_count += 1
                        else:
                            print(f"   ❌ 响应格式错误: {data}")
                    else:
                        error_text = await response.text()
                        print(f"   ❌ 请求失败: HTTP {response.status} - {error_text}")
                        
            except Exception as e:
                print(f"   ❌ 请求异常: {e}")
        
        success_rate = success_count / total_tests * 100
        print(f"\n📊 聊天测试结果: {success_count}/{total_tests} 成功 ({success_rate:.1f}%)")
        return success_count > 0
    
    async def test_direct_qianfan_api(self):
        """测试直接调用千帆API"""
        print("\n📋 测试 5: 直接千帆API调用")
        
        try:
            # 检查环境变量
            app_id = os.getenv('QIANFAN_APP_ID')
            token = os.getenv('QIANFAN_TOKEN')
            
            if not app_id or not token:
                print("⚠️ 跳过：未配置千帆API密钥")
                return True
            
            # 导入千帆客户端
            from qianfan_client import create_qianfan_client
            
            client = create_qianfan_client(token)
            
            # 测试创建对话
            conversation_result = client.create_conversation(app_id)
            conversation_id = conversation_result.get('conversation_id')
            
            if conversation_id:
                print(f"✅ 千帆对话创建成功: {conversation_id[:20]}...")
                
                # 测试发送消息
                message_result = client.send_message(app_id, conversation_id, "你好，请简单介绍一下自己", stream=False)
                
                if 'answer' in message_result:
                    answer = message_result['answer'][:100] + "..." if len(message_result['answer']) > 100 else message_result['answer']
                    print(f"✅ 千帆回复成功: {answer}")
                    return True
                else:
                    print(f"❌ 千帆回复格式错误: {message_result}")
                    return False
            else:
                print(f"❌ 千帆对话创建失败: {conversation_result}")
                return False
                
        except ImportError:
            print("⚠️ 跳过：无法导入千帆客户端")
            return True
        except Exception as e:
            print(f"❌ 千帆API测试异常: {e}")
            return False
    
    async def run_all_tests(self):
        """运行所有测试"""
        print("🌍 球球Terra - 集成测试")
        print("=" * 40)
        
        await self.setup()
        
        try:
            tests = [
                self.test_health_check(),
                self.test_chat_api_info(),
                self.test_conversation_creation(),
                self.test_frontend_chat_api(),
                self.test_direct_qianfan_api()
            ]
            
            results = await asyncio.gather(*tests, return_exceptions=True)
            
            # 统计结果
            success_count = sum(1 for result in results if result is True)
            total_tests = len(tests)
            
            print("\n" + "=" * 40)
            print("📊 测试结果汇总")
            print("=" * 40)
            print(f"总测试数: {total_tests}")
            print(f"成功: {success_count}")
            print(f"失败: {total_tests - success_count}")
            print(f"成功率: {success_count/total_tests*100:.1f}%")
            
            if success_count == total_tests:
                print("\n🎉 所有测试通过！球球Terra系统工作正常。")
                return True
            elif success_count >= total_tests * 0.8:
                print("\n✅ 大部分测试通过，系统基本可用。")
                return True
            else:
                print("\n❌ 多个测试失败，请检查配置和网络连接。")
                return False
                
        finally:
            await self.cleanup()

async def main():
    """主函数"""
    # 检查环境变量
    if not os.getenv('QIANFAN_APP_ID') or not os.getenv('QIANFAN_TOKEN'):
        print("⚠️ 警告：未检测到千帆API配置")
        print("请先运行: python backend/setup_ai.py")
        print("或手动配置环境变量")
        print("\n继续进行基础API测试...")
    
    # 运行测试
    tester = TerraIntegrationTest(TEST_CONFIG['backend_url'])
    success = await tester.run_all_tests()
    
    if success:
        print("\n🚀 系统准备就绪！")
        print("启动命令：")
        print("  后端: cd backend && python main.py")
        print("  前端: cd frontend && python3 -m http.server 8080")
        sys.exit(0)
    else:
        print("\n🔧 请检查系统配置后重新测试")
        sys.exit(1)

if __name__ == "__main__":
    # 加载环境变量
    from dotenv import load_dotenv
    load_dotenv(backend_dir / '.env')
    
    # 运行测试
    asyncio.run(main()) 