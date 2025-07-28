#!/usr/bin/env python3
"""
智能体对话功能的工具函数模块
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class ConversationManager:
    """对话管理器 - 简单的内存存储"""
    
    def __init__(self):
        self.conversations = {}
        self.cleanup_interval = 3600  # 1小时清理一次
        self.last_cleanup = time.time()
    
    def store_conversation(self, conversation_id: str, app_id: str, metadata: Dict[str, Any] = None):
        """存储对话信息"""
        self.conversations[conversation_id] = {
            'app_id': app_id,
            'created_at': datetime.now(),
            'last_used': datetime.now(),
            'metadata': metadata or {}
        }
        self._cleanup_expired()
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """获取对话信息"""
        if conversation_id in self.conversations:
            # 更新最后使用时间
            self.conversations[conversation_id]['last_used'] = datetime.now()
            return self.conversations[conversation_id]
        return None
    
    def update_conversation(self, conversation_id: str, metadata: Dict[str, Any]):
        """更新对话元数据"""
        if conversation_id in self.conversations:
            self.conversations[conversation_id]['metadata'].update(metadata)
            self.conversations[conversation_id]['last_used'] = datetime.now()
    
    def delete_conversation(self, conversation_id: str):
        """删除对话"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
    
    def list_conversations(self, limit: int = 50) -> List[Dict[str, Any]]:
        """列出对话"""
        conversations = []
        for conv_id, data in self.conversations.items():
            conversations.append({
                'conversation_id': conv_id,
                'app_id': data['app_id'],
                'created_at': data['created_at'].isoformat(),
                'last_used': data['last_used'].isoformat(),
                'metadata': data['metadata']
            })
        
        # 按最后使用时间排序
        conversations.sort(key=lambda x: x['last_used'], reverse=True)
        return conversations[:limit]
    
    def _cleanup_expired(self):
        """清理过期的对话"""
        now = time.time()
        if now - self.last_cleanup < self.cleanup_interval:
            return
        
        self.last_cleanup = now
        cutoff_time = datetime.now() - timedelta(days=7)  # 7天过期
        
        expired_ids = []
        for conv_id, data in self.conversations.items():
            if data['last_used'] < cutoff_time:
                expired_ids.append(conv_id)
        
        for conv_id in expired_ids:
            del self.conversations[conv_id]
        
        if expired_ids:
            logging.info(f"清理了 {len(expired_ids)} 个过期对话")

class ResponseFormatter:
    """响应格式化器"""
    
    @staticmethod
    def success_response(data: Any, message: str = "操作成功") -> Dict[str, Any]:
        """成功响应"""
        return {
            "success": True,
            "message": message,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def error_response(error: str, code: str = "UNKNOWN_ERROR", details: Any = None) -> Dict[str, Any]:
        """错误响应"""
        response = {
            "success": False,
            "error": error,
            "error_code": code,
            "timestamp": datetime.now().isoformat()
        }
        
        if details:
            response["details"] = details
        
        return response
    
    @staticmethod
    def format_conversation_response(conversation_data: Dict[str, Any]) -> Dict[str, Any]:
        """格式化对话创建响应"""
        return {
            "conversation_id": conversation_data.get("conversation_id"),
            "request_id": conversation_data.get("request_id"),
            "expires_in": "7天",
            "created_at": datetime.now().isoformat()
        }
    
    @staticmethod
    def format_message_response(message_data: Dict[str, Any], user_message: str) -> Dict[str, Any]:
        """格式化消息响应"""
        # 这里需要根据实际API响应格式调整
        if isinstance(message_data, dict):
            ai_reply = message_data.get("reply", str(message_data))
        else:
            ai_reply = str(message_data)
        
        return {
            "user_message": user_message,
            "ai_reply": ai_reply,
            "timestamp": datetime.now().isoformat(),
            "raw_response": message_data
        }

class ConfigHelper:
    """配置助手"""
    
    @staticmethod
    def get_config() -> Dict[str, Any]:
        """获取当前配置"""
        return {
            "qianfan_token": "已配置" if os.getenv('QIANFAN_TOKEN') else "未配置",
            "qianfan_app_id": os.getenv('QIANFAN_APP_ID', 'ac6acc7c-9e7c-4909-8bc0-5ca667a5e0b6'),
            "api_base_url": os.getenv('QIANFAN_API_BASE_URL', 'https://qianfan.baidubce.com'),
            "host": os.getenv('HOST', '0.0.0.0'),
            "port": int(os.getenv('PORT', 8000)),
            "env_file_exists": os.path.exists('.env')
        }
    
    @staticmethod
    def validate_config() -> Dict[str, Any]:
        """验证配置"""
        issues = []
        warnings = []
        
        # 检查必需的环境变量
        if not os.getenv('QIANFAN_TOKEN'):
            issues.append("缺少 QIANFAN_TOKEN 环境变量")
        
        # 检查可选配置
        if not os.getenv('QIANFAN_APP_ID'):
            warnings.append("未设置 QIANFAN_APP_ID，将使用默认值")
        
        # 检查.env文件
        if not os.path.exists('.env'):
            warnings.append("未找到 .env 文件，建议创建以便配置环境变量")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings
        }

class LogHelper:
    """日志助手"""
    
    @staticmethod
    def setup_logging(level: str = "INFO", log_file: str = None):
        """设置日志"""
        log_level = getattr(logging, level.upper(), logging.INFO)
        
        handlers = [logging.StreamHandler()]
        if log_file:
            handlers.append(logging.FileHandler(log_file, encoding='utf-8'))
        
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=handlers
        )
    
    @staticmethod
    def log_api_call(endpoint: str, success: bool, duration: float, details: str = ""):
        """记录API调用"""
        logger = logging.getLogger("api_calls")
        status = "成功" if success else "失败"
        message = f"{endpoint} - {status} - 耗时: {duration:.2f}s"
        if details:
            message += f" - {details}"
        
        if success:
            logger.info(message)
        else:
            logger.error(message)

class TokenManager:
    """Token管理器"""
    
    @staticmethod
    def mask_token(token: str) -> str:
        """遮蔽token显示"""
        if not token:
            return "未设置"
        
        if len(token) <= 8:
            return "*" * len(token)
        
        return token[:4] + "*" * (len(token) - 8) + token[-4:]
    
    @staticmethod
    def validate_token_format(token: str) -> bool:
        """验证token格式"""
        if not token:
            return False
        
        # 基本长度检查
        if len(token) < 10:
            return False
        
        # 可以添加更多验证逻辑
        return True

class APIEndpointHelper:
    """API端点助手"""
    
    @staticmethod
    def get_available_endpoints() -> List[Dict[str, Any]]:
        """获取可用的API端点列表"""
        return [
            {
                "path": "/api/chat/conversation",
                "method": "POST",
                "description": "创建新的对话",
                "parameters": ["app_id", "token"]
            },
            {
                "path": "/api/chat/message",
                "method": "POST", 
                "description": "发送消息",
                "parameters": ["app_id", "conversation_id", "message", "stream", "token"]
            },
            {
                "path": "/api/chat/history/{conversation_id}",
                "method": "GET",
                "description": "获取对话历史",
                "parameters": ["app_id", "token"]
            },
            {
                "path": "/api/chat/quick-chat",
                "method": "POST",
                "description": "快速对话（自动创建对话并发送消息）",
                "parameters": ["app_id", "message", "stream", "token"]
            },
            {
                "path": "/api/chat/test",
                "method": "GET",
                "description": "测试API连接",
                "parameters": []
            }
        ]
    
    @staticmethod
    def get_endpoint_info(path: str) -> Optional[Dict[str, Any]]:
        """获取特定端点信息"""
        endpoints = APIEndpointHelper.get_available_endpoints()
        for endpoint in endpoints:
            if endpoint["path"] == path:
                return endpoint
        return None

# 全局实例
conversation_manager = ConversationManager()
response_formatter = ResponseFormatter()

# 工具函数
def format_duration(seconds: float) -> str:
    """格式化持续时间"""
    if seconds < 1:
        return f"{seconds*1000:.0f}ms"
    elif seconds < 60:
        return f"{seconds:.1f}s"
    else:
        minutes = int(seconds // 60)
        seconds = seconds % 60
        return f"{minutes}m{seconds:.1f}s"

def safe_json_loads(text: str, default: Any = None) -> Any:
    """安全的JSON解析"""
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return default

def create_example_env_file():
    """创建示例.env文件"""
    content = """# 百度千帆API配置
QIANFAN_TOKEN=your_authorization_token_here
QIANFAN_APP_ID=ac6acc7c-9e7c-4909-8bc0-5ca667a5e0b6
QIANFAN_API_BASE_URL=https://qianfan.baidubce.com

# FastAPI服务配置
HOST=0.0.0.0
PORT=8000
RELOAD=true

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=chat_api.log
"""
    
    try:
        with open('.env.example', 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception:
        return False 