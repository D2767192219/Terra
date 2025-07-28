from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, ValidationError
from typing import Optional, Dict, Any
import os
import logging
import traceback
from qianfan_client import QianfanClient, create_qianfan_client

# 创建路由器
router = APIRouter(prefix="/api/chat", tags=["智能体对话"])

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

QIANFAN_TOKEN = 'Bearer bce-v3/ALTAK-1oMR2qNcjrYEgFF5lwRuf/57a449fdca9e46e5b3cfc1c7867ddfed59c08558'
DEFAULT_APP_ID = 'ac6acc7c-9e7c-4909-8bc0-5ca667a5e0b6'

# 简单的对话存储（生产环境应使用数据库）
conversation_storage = {}

# Pydantic模型
class ConversationRequest(BaseModel):
    app_id: Optional[str] = None
    token: Optional[str] = None

class ConversationResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class MessageRequest(BaseModel):
    app_id: Optional[str] = None
    conversation_id: str
    message: str
    stream: bool = False
    token: Optional[str] = None

class MessageResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class QuickChatRequest(BaseModel):
    app_id: Optional[str] = None
    message: str
    stream: bool = False
    token: Optional[str] = None

class QuickChatResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# 前端兼容接口 - 对应前端的chat.js调用
class FrontendChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class FrontendChatResponse(BaseModel):
    conversation_id: str
    response: str
    success: bool = True

class TestResponse(BaseModel):
    success: bool
    message: str
    endpoints: list
    config_status: Optional[Dict[str, Any]] = None

# 在现有的Pydantic模型后添加新的模型
class AgentChatRequest(BaseModel):
    app_id: Optional[str] = None
    message: str
    conversation_id: Optional[str] = None  # 如果提供则使用现有对话，否则创建新的
    stream: bool = False
    token: Optional[str] = None

class AgentChatResponse(BaseModel):
    success: bool
    conversation_id: str
    response: str
    request_id: Optional[str] = None
    message_id: Optional[str] = None
    error: Optional[str] = None

# 依赖函数：获取千帆客户端
def get_qianfan_client(token: Optional[str] = None) -> QianfanClient:
    """获取千帆客户端实例"""
    auth_token = token or QIANFAN_TOKEN
    if not auth_token:
        raise HTTPException(
            status_code=400, 
            detail="缺少授权令牌。请配置QIANFAN_TOKEN环境变量或运行setup_ai.py进行配置。"
        )
    return create_qianfan_client(auth_token)

# 前端兼容接口 - 直接处理chat.js的调用
@router.post("", response_model=FrontendChatResponse)
async def frontend_chat(request: FrontendChatRequest):
    """前端聊天接口 - 兼容现有chat.js的调用方式"""
    try:
        logger.info(f"收到前端聊天请求: message='{request.message}', conversation_id={request.conversation_id}")
        
        # 验证输入
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="消息内容不能为空"
            )
        
        # 验证配置
        if not QIANFAN_TOKEN:
            logger.error("千帆授权令牌未配置")
            raise HTTPException(
                status_code=400, 
                detail="服务器未配置AI授权令牌。请联系管理员配置QIANFAN_TOKEN环境变量。"
            )
        
        if not DEFAULT_APP_ID:
            logger.error("千帆应用ID未配置")
            raise HTTPException(
                status_code=400,
                detail="服务器未配置AI应用ID。请联系管理员配置QIANFAN_APP_ID环境变量。"
            )
        
        # 创建客户端
        try:
            client = get_qianfan_client()
        except Exception as e:
            logger.error(f"创建千帆客户端失败: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"AI服务连接失败: {str(e)}"
            )
        
        app_id = DEFAULT_APP_ID
        
        # 如果没有conversation_id，创建新对话
        if not request.conversation_id:
            logger.info("创建新对话")
            try:
                conversation_result = client.create_conversation(app_id)
                conversation_id = conversation_result.get('conversation_id')
                
                if not conversation_id:
                    logger.error(f"创建对话失败，返回结果: {conversation_result}")
                    raise HTTPException(
                        status_code=500, 
                        detail="创建对话失败，请检查AI服务配置"
                    )
                
                # 存储对话信息
                conversation_storage[conversation_id] = {
                    "app_id": app_id,
                    "created_at": "now"
                }
                logger.info(f"新对话创建成功: {conversation_id}")
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"创建对话异常: {e}")
                logger.error(f"异常详情: {traceback.format_exc()}")
                raise HTTPException(
                    status_code=500,
                    detail=f"创建对话时发生错误: {str(e)}"
                )
        else:
            conversation_id = request.conversation_id
            logger.info(f"使用现有对话: {conversation_id}")
        
        # 发送消息
        try:
            logger.info(f"发送消息到对话: {conversation_id}")
            message_result = client.send_message(app_id, conversation_id, request.message, stream=False)
            logger.info(f"消息发送成功，响应长度: {len(str(message_result))}")
            
        except Exception as e:
            logger.error(f"发送消息失败: {e}")
            logger.error(f"异常详情: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"发送消息失败: {str(e)}"
            )
        
        # 解析回复
        try:
            response_text = extract_response_text(message_result)
            logger.info(f"成功提取回复文本，长度: {len(response_text)}")
            
        except Exception as e:
            logger.error(f"提取回复文本失败: {e}")
            response_text = "抱歉，处理AI回复时出现错误。"
        
        return FrontendChatResponse(
            conversation_id=conversation_id,
            response=response_text
        )
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except ValidationError as e:
        logger.error(f"请求验证失败: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"请求参数格式错误: {str(e)}"
        )
    except Exception as e:
        logger.error(f"前端聊天接口未知异常: {e}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"聊天服务暂时不可用: {str(e)}"
        )

def extract_response_text(api_response: Dict[str, Any]) -> str:
    """从千帆API响应中提取文本回复"""
    try:
        logger.debug(f"提取响应文本，输入: {api_response}")
        
        # 根据千帆API文档，answer字段包含回复文本
        if 'answer' in api_response and api_response['answer']:
            response_text = api_response['answer']
            logger.debug(f"从answer字段提取到文本: {response_text[:100]}...")
            return response_text
        
        # 如果没有answer字段，尝试从content字段提取
        if 'content' in api_response and isinstance(api_response['content'], list):
            for content_item in api_response['content']:
                if content_item.get('content_type') == 'text' and 'outputs' in content_item:
                    outputs = content_item['outputs']
                    if 'text' in outputs:
                        response_text = outputs['text']
                        logger.debug(f"从content字段提取到文本: {response_text[:100]}...")
                        return response_text
        
        # 如果都没有，返回默认回复
        logger.warning(f"无法从API响应中提取文本，响应结构: {list(api_response.keys())}")
        return "抱歉，我暂时无法理解您的问题。"
        
    except Exception as e:
        logger.error(f"提取响应文本失败: {e}")
        return "抱歉，处理回复时出现错误。"

@router.post("/conversation", response_model=ConversationResponse)
async def create_conversation(request: ConversationRequest):
    """创建新的对话"""
    try:
        # 获取参数
        app_id = request.app_id or DEFAULT_APP_ID
        token = request.token or QIANFAN_TOKEN
        
        if not token:
            raise HTTPException(status_code=400, detail="缺少授权令牌")
        
        if not app_id:
            raise HTTPException(status_code=400, detail="缺少应用ID")
        
        # 创建客户端并发起请求
        client = get_qianfan_client(token)
        result = client.create_conversation(app_id)
        
        return ConversationResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建对话失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/message", response_model=MessageResponse)
async def send_message(request: MessageRequest):
    """发送消息"""
    try:
        # 获取参数
        app_id = request.app_id or DEFAULT_APP_ID
        token = request.token or QIANFAN_TOKEN
        
        # 验证必需参数
        if not token:
            raise HTTPException(status_code=400, detail="缺少授权令牌")
        
        if not request.conversation_id:
            raise HTTPException(status_code=400, detail="缺少对话ID")
        
        if not request.message:
            raise HTTPException(status_code=400, detail="缺少消息内容")
        
        # 创建客户端并发送消息
        client = get_qianfan_client(token)
        result = client.send_message(app_id, request.conversation_id, request.message, request.stream)
        
        return MessageResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发送消息失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{conversation_id}", response_model=MessageResponse)
async def get_conversation_history(
    conversation_id: str,
    app_id: Optional[str] = None,
    token: Optional[str] = None
):
    """获取对话历史"""
    try:
        # 获取参数
        app_id = app_id or DEFAULT_APP_ID
        token = token or QIANFAN_TOKEN
        
        if not token:
            raise HTTPException(status_code=400, detail="缺少授权令牌")
        
        # 创建客户端并获取历史
        client = get_qianfan_client(token)
        result = client.get_conversation_history(app_id, conversation_id)
        
        return MessageResponse(
            success=True,
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取对话历史失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quick-chat", response_model=QuickChatResponse)
async def quick_chat(request: QuickChatRequest):
    """快速对话（自动创建对话并发送消息）"""
    try:
        # 获取参数
        app_id = request.app_id or DEFAULT_APP_ID
        token = request.token or QIANFAN_TOKEN
        
        # 验证必需参数
        if not token:
            raise HTTPException(status_code=400, detail="缺少授权令牌")
        
        if not request.message:
            raise HTTPException(status_code=400, detail="缺少消息内容")
        
        # 创建客户端
        client = get_qianfan_client(token)
        
        # 首先创建对话
        conversation_result = client.create_conversation(app_id)
        conversation_id = conversation_result.get('conversation_id')
        
        if not conversation_id:
            raise HTTPException(status_code=500, detail="创建对话失败")
        
        # 发送消息
        message_result = client.send_message(app_id, conversation_id, request.message, request.stream)
        
        return QuickChatResponse(
            success=True,
            data={
                'conversation': conversation_result,
                'message_response': message_result
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"快速对话失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test", response_model=TestResponse)
async def test_connection():
    """测试API连接"""
    config_status = {
        "qianfan_token_configured": bool(QIANFAN_TOKEN),
        "qianfan_app_id_configured": bool(DEFAULT_APP_ID),
        "qianfan_token_length": len(QIANFAN_TOKEN) if QIANFAN_TOKEN else 0,
        "app_id": DEFAULT_APP_ID if DEFAULT_APP_ID else "未配置"
    }
    
    logger.info(f"API测试请求，配置状态: {config_status}")
    
    return TestResponse(
        success=True,
        message="智能体对话API正常运行",
        endpoints=[
            "POST /api/chat - 前端聊天接口",
            "POST /api/chat/conversation - 创建对话",
            "POST /api/chat/message - 发送消息", 
            "GET /api/chat/history/{conversation_id} - 获取对话历史",
            "POST /api/chat/quick-chat - 快速对话",
            "POST /api/chat/agent-chat - 智能体对话接口（推荐）"
        ],
        config_status=config_status
    ) 

# 在最后添加新的智能体对话接口
@router.post("/agent-chat", response_model=AgentChatResponse)
async def agent_chat(request: AgentChatRequest):
    """
    智能体对话接口 - 完整实现用户描述的两步流程
    1. 如果没有conversation_id，先创建新对话
    2. 使用conversation_id发送消息获取回复
    """
    try:
        logger.info(f"智能体对话请求: message='{request.message}', conversation_id={request.conversation_id}")
        
        # 验证输入
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="消息内容不能为空"
            )
        
        # 获取参数
        app_id = request.app_id or DEFAULT_APP_ID
        token = request.token or QIANFAN_TOKEN
        
        # 验证配置
        if not token:
            logger.error("千帆授权令牌未配置")
            raise HTTPException(
                status_code=400, 
                detail="缺少授权令牌。请配置QIANFAN_TOKEN环境变量。"
            )
        
        if not app_id:
            logger.error("千帆应用ID未配置")
            raise HTTPException(
                status_code=400,
                detail="缺少应用ID。请配置QIANFAN_APP_ID环境变量。"
            )
        
        # 创建客户端
        try:
            client = get_qianfan_client(token)
        except Exception as e:
            logger.error(f"创建千帆客户端失败: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"AI服务连接失败: {str(e)}"
            )
        
        conversation_id = request.conversation_id
        
        # 步骤1：如果没有conversation_id，创建新对话
        if not conversation_id:
            logger.info("步骤1: 创建新对话")
            try:
                conversation_result = client.create_conversation(app_id)
                conversation_id = conversation_result.get('conversation_id')
                
                if not conversation_id:
                    logger.error(f"创建对话失败，返回结果: {conversation_result}")
                    raise HTTPException(
                        status_code=500, 
                        detail="创建对话失败，请检查AI服务配置"
                    )
                
                logger.info(f"对话创建成功: {conversation_id}")
                
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"创建对话异常: {e}")
                logger.error(f"异常详情: {traceback.format_exc()}")
                raise HTTPException(
                    status_code=500,
                    detail=f"创建对话时发生错误: {str(e)}"
                )
        else:
            logger.info(f"使用现有对话: {conversation_id}")
        
        # 步骤2：使用conversation_id发送消息
        try:
            logger.info(f"步骤2: 发送消息到对话 {conversation_id}")
            message_result = client.send_message(app_id, conversation_id, request.message, request.stream)
            
            logger.info(f"消息发送成功，响应: {type(message_result)}")
            
        except Exception as e:
            logger.error(f"发送消息失败: {e}")
            logger.error(f"异常详情: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"发送消息失败: {str(e)}"
            )
        
        # 解析回复文本
        try:
            response_text = extract_response_text(message_result)
            logger.info(f"成功提取回复文本，长度: {len(response_text)}")
            
        except Exception as e:
            logger.error(f"提取回复文本失败: {e}")
            response_text = "抱歉，处理AI回复时出现错误。"
        
        # 返回结果
        return AgentChatResponse(
            success=True,
            conversation_id=conversation_id,
            response=response_text,
            request_id=message_result.get('request_id'),
            message_id=message_result.get('message_id')
        )
        
    except HTTPException:
        # 重新抛出HTTP异常
        raise
    except ValidationError as e:
        logger.error(f"请求验证失败: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"请求参数格式错误: {str(e)}"
        )
    except Exception as e:
        logger.error(f"智能体对话接口未知异常: {e}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500, 
            detail=f"智能体对话服务暂时不可用: {str(e)}"
        ) 

# 提取响应文本的辅助函数
def extract_response_text(message_result):
    """从消息结果中提取AI响应文本"""
    if not message_result:
        return ""
        
    # 尝试直接从answer字段获取
    if "answer" in message_result:
        return message_result["answer"]
        
    # 尝试从result.text字段获取（千帆老接口格式）
    if "result" in message_result and isinstance(message_result["result"], dict):
        if "text" in message_result["result"]:
            return message_result["result"]["text"]
            
    return "未能提取到响应内容" 