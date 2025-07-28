import requests
import json
import logging
from typing import Optional, Dict, Any, Iterator
import re

class QianfanClient:
    """百度千帆API客户端"""
    
    def __init__(self, authorization_token: str, base_url: str = "https://qianfan.baidubce.com"):
        """
        初始化千帆客户端
        
        Args:
            authorization_token: 授权令牌（Bearer token）
            base_url: API基础URL
        """
        self.authorization_token = authorization_token
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': authorization_token  # 直接使用完整的 Authorization header
        }
        
        # 配置日志
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def create_conversation(self, app_id: str) -> Dict[str, Any]:
        """
        创建新的对话
        
        Args:
            app_id: 应用ID
            
        Returns:
            包含conversation_id和request_id的字典
            
        Raises:
            requests.RequestException: 请求失败时抛出异常
        """
        url = f"{self.base_url}/v2/app/conversation"
        
        payload = {
            "app_id": app_id
        }
        
        try:
            self.logger.info(f"创建对话，app_id: {app_id}")
            
            response = requests.post(
                url, 
                headers=self.headers, 
                data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            self.logger.info(f"对话创建成功，conversation_id: {result.get('conversation_id')}")
            return result
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"创建对话失败: {e}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    self.logger.error(f"错误详情: {error_detail}")
                except:
                    self.logger.error(f"响应内容: {e.response.text}")
            raise
    
    def send_message(self, app_id: str, conversation_id: str, message: str, 
                    stream: bool = False) -> Dict[str, Any]:
        """
        发送消息到对话
        
        Args:
            app_id: 应用ID
            conversation_id: 对话ID
            message: 消息内容
            stream: 是否流式返回
            
        Returns:
            API响应结果
        """
        url = f"{self.base_url}/v2/app/conversation/runs"
        
        payload = {
            "app_id": app_id,
            "conversation_id": conversation_id,
            "query": message,
            "stream": stream
        }
        
        try:
            self.logger.info(f"发送消息，conversation_id: {conversation_id}, stream: {stream}")
            
            response = requests.post(
                url,
                headers=self.headers,
                data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                timeout=60 if not stream else 120,
                stream=stream  # 启用流式接收
            )
            
            response.raise_for_status()
            
            if stream:
                return self._handle_stream_response(response)
            else:
                result = response.json()
                self.logger.info("消息发送成功")
                return result
                
        except requests.exceptions.RequestException as e:
            self.logger.error(f"发送消息失败: {e}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    self.logger.error(f"错误详情: {error_detail}")
                except:
                    self.logger.error(f"响应内容: {e.response.text}")
            raise
    
    def _handle_stream_response(self, response) -> Dict[str, Any]:
        """处理流式响应 - 解析Server-Sent Events格式"""
        full_answer = ""
        final_result = {}
        
        try:
            # 按行处理流式响应
            for line in response.iter_lines(decode_unicode=True):
                if not line or line.startswith(':'):
                    continue
                    
                # 解析SSE格式的数据
                if line.startswith('data: '):
                    data_content = line[6:].strip()  # 移除 'data: ' 前缀
                    
                    # 跳过空数据行和结束标记
                    if not data_content or data_content == '[DONE]':
                        continue
                    
                    try:
                        # 解析JSON数据
                        chunk_data = json.loads(data_content)
                        
                        # 累积答案文本
                        if 'answer' in chunk_data:
                            full_answer += chunk_data['answer']
                        
                        # 保存最后一个完整的响应作为最终结果
                        if chunk_data.get('is_completion', False):
                            final_result = chunk_data
                            final_result['answer'] = full_answer
                            break
                        else:
                            # 更新最终结果但不停止（继续累积答案）
                            final_result.update(chunk_data)
                            
                    except json.JSONDecodeError as e:
                        self.logger.warning(f"无法解析JSON数据: {data_content}, 错误: {e}")
                        continue
            
            # 如果有累积的答案，更新到最终结果
            if full_answer and 'answer' not in final_result:
                final_result['answer'] = full_answer
            
            # 如果没有获得任何有效响应，返回默认结构
            if not final_result:
                final_result = {
                    'answer': full_answer or "抱歉，没有收到有效的响应。",
                    'is_completion': True,
                    'request_id': 'stream-unknown',
                    'conversation_id': 'unknown',
                    'message_id': 'unknown'
                }
            
            self.logger.info(f"流式响应处理完成，最终答案长度: {len(final_result.get('answer', ''))}")
            return final_result
            
        except Exception as e:
            self.logger.error(f"处理流式响应失败: {e}")
            return {
                'answer': "抱歉，处理流式响应时出现错误。",
                'is_completion': True,
                'error': str(e)
            }
    
    def send_message_stream(self, app_id: str, conversation_id: str, message: str) -> Iterator[Dict[str, Any]]:
        """
        发送消息并返回流式响应迭代器
        
        Args:
            app_id: 应用ID
            conversation_id: 对话ID
            message: 消息内容
            
        Yields:
            每个流式响应块的字典
        """
        url = f"{self.base_url}/v2/app/conversation/runs"
        
        payload = {
            "app_id": app_id,
            "conversation_id": conversation_id,
            "query": message,
            "stream": True
        }
        
        try:
            self.logger.info(f"发送流式消息，conversation_id: {conversation_id}")
            
            response = requests.post(
                url,
                headers=self.headers,
                data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                timeout=120,
                stream=True
            )
            
            response.raise_for_status()
            
            # 逐行处理流式响应
            for line in response.iter_lines(decode_unicode=True):
                if not line or line.startswith(':'):
                    continue
                    
                if line.startswith('data: '):
                    data_content = line[6:].strip()
                    
                    if not data_content or data_content == '[DONE]':
                        break
                    
                    try:
                        chunk_data = json.loads(data_content)
                        yield chunk_data
                        
                        # 如果响应完成，退出循环
                        if chunk_data.get('is_completion', False):
                            break
                            
                    except json.JSONDecodeError as e:
                        self.logger.warning(f"无法解析流式JSON数据: {data_content}")
                        continue
                        
        except requests.exceptions.RequestException as e:
            self.logger.error(f"发送流式消息失败: {e}")
            yield {
                'answer': "抱歉，网络连接出现问题。",
                'is_completion': True,
                'error': str(e)
            }
    
    def get_conversation_history(self, app_id: str, conversation_id: str) -> Dict[str, Any]:
        """
        获取对话历史
        
        Args:
            app_id: 应用ID
            conversation_id: 对话ID
            
        Returns:
            对话历史数据
        """
        # 注意：这个接口可能需要根据实际API文档调整
        url = f"{self.base_url}/v2/app/conversation/{conversation_id}/messages"
        
        params = {"app_id": app_id}
        
        try:
            response = requests.get(
                url,
                headers=self.headers,
                params=params,
                timeout=30
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"获取对话历史失败: {e}")
            raise


# 便捷函数
def create_qianfan_client(authorization_token: str) -> QianfanClient:
    """创建千帆客户端实例"""
    return QianfanClient(authorization_token) 