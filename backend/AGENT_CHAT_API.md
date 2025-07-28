# 智能体对话API文档

## 概述

智能体对话API提供了与百度千帆智能体进行对话的完整功能，实现了自动化的两步流程：
1. 自动创建conversation_id（如果没有提供）
2. 使用conversation_id发送消息获取AI回复

## 接口地址

```
POST /api/chat/agent-chat
```

## 请求参数

### 请求头
```
Content-Type: application/json
```

### 请求体
```json
{
    "app_id": "可选，智能体应用ID",
    "message": "必需，用户消息内容",
    "conversation_id": "可选，对话ID，如果不提供会自动创建",
    "stream": "可选，是否流式返回，默认false",
    "token": "可选，授权令牌，如果不提供会使用环境变量"
}
```

### 参数说明

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| app_id | string | 否 | 环境变量QIANFAN_APP_ID | 千帆智能体应用ID |
| message | string | 是 | - | 用户发送的消息内容 |
| conversation_id | string | 否 | null | 对话ID，如果不提供会自动创建新对话 |
| stream | boolean | 否 | false | 是否使用流式返回 |
| token | string | 否 | 环境变量QIANFAN_TOKEN | 千帆API授权令牌 |

## 响应格式

### 成功响应
```json
{
    "success": true,
    "conversation_id": "对话ID",
    "response": "AI回复内容",
    "request_id": "请求ID",
    "message_id": "消息ID"
}
```

### 错误响应
```json
{
    "success": false,
    "error": "错误描述",
    "detail": "详细错误信息"
}
```

## 使用示例

### JavaScript/前端调用

#### 新建对话
```javascript
async function startNewChat(message) {
    try {
        const response = await fetch('/api/chat/agent-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message
                // 不提供conversation_id，会自动创建新对话
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('对话ID:', data.conversation_id);
            console.log('AI回复:', data.response);
            
            // 保存conversation_id用于后续对话
            localStorage.setItem('conversation_id', data.conversation_id);
            
            return data;
        } else {
            throw new Error(data.error || '对话失败');
        }
    } catch (error) {
        console.error('新建对话失败:', error);
        throw error;
    }
}

// 使用示例
startNewChat('你好，请介绍一下你自己')
    .then(data => {
        console.log('新对话开始成功');
    })
    .catch(error => {
        console.error('对话失败:', error);
    });
```

#### 继续现有对话
```javascript
async function continueChat(message, conversationId) {
    try {
        const response = await fetch('/api/chat/agent-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                conversation_id: conversationId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('AI回复:', data.response);
            return data;
        } else {
            throw new Error(data.error || '对话失败');
        }
    } catch (error) {
        console.error('继续对话失败:', error);
        throw error;
    }
}

// 使用示例
const conversationId = localStorage.getItem('conversation_id');
continueChat('能详细说说你的功能吗？', conversationId)
    .then(data => {
        console.log('对话继续成功');
    })
    .catch(error => {
        console.error('对话失败:', error);
    });
```

### Python调用示例

```python
import requests
import json

class AgentChatClient:
    def __init__(self, base_url="http://localhost:8000", token=None, app_id=None):
        self.base_url = base_url
        self.token = token
        self.app_id = app_id
        self.conversation_id = None
    
    def chat(self, message, conversation_id=None):
        """发送消息到智能体"""
        url = f"{self.base_url}/api/chat/agent-chat"
        
        payload = {
            "message": message
        }
        
        # 添加可选参数
        if conversation_id:
            payload["conversation_id"] = conversation_id
        if self.token:
            payload["token"] = self.token
        if self.app_id:
            payload["app_id"] = self.app_id
        
        try:
            response = requests.post(
                url,
                headers={'Content-Type': 'application/json'},
                data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
                timeout=60
            )
            
            response.raise_for_status()
            data = response.json()
            
            if data.get('success'):
                # 更新对话ID
                self.conversation_id = data.get('conversation_id')
                return {
                    'success': True,
                    'response': data.get('response'),
                    'conversation_id': self.conversation_id
                }
            else:
                return {
                    'success': False,
                    'error': data.get('error', '未知错误')
                }
                
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'网络请求失败: {str(e)}'
            }
    
    def new_conversation(self):
        """开始新对话"""
        self.conversation_id = None
    
    def continue_chat(self, message):
        """继续当前对话"""
        return self.chat(message, self.conversation_id)

# 使用示例
client = AgentChatClient()

# 开始新对话
result = client.chat("你好，请介绍一下你自己")
if result['success']:
    print(f"AI回复: {result['response']}")
    print(f"对话ID: {result['conversation_id']}")
    
    # 继续对话
    result = client.continue_chat("你能帮我做什么？")
    if result['success']:
        print(f"AI回复: {result['response']}")
    else:
        print(f"对话失败: {result['error']}")
else:
    print(f"对话失败: {result['error']}")
```

## 错误处理

### 常见错误码

| HTTP状态码 | 错误类型 | 说明 | 解决方案 |
|------------|----------|------|----------|
| 400 | 参数错误 | 缺少必需参数或参数格式错误 | 检查请求参数 |
| 400 | 配置错误 | 缺少授权令牌或应用ID | 配置环境变量或在请求中提供 |
| 500 | 服务错误 | 创建对话或发送消息失败 | 检查网络连接和服务配置 |

### 错误处理示例

```javascript
async function chatWithErrorHandling(message) {
    try {
        const response = await fetch('/api/chat/agent-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error(data.error || '对话失败');
        }
        
    } catch (error) {
        console.error('对话错误:', error);
        
        if (error.message.includes('授权令牌')) {
            alert('服务器配置错误，请联系管理员');
        } else if (error.message.includes('网络')) {
            alert('网络连接失败，请检查网络');
        } else {
            alert(`对话失败: ${error.message}`);
        }
        
        throw error;
    }
}
```

## 环境配置

在使用API之前，需要配置以下环境变量：

```bash
# 千帆API授权令牌
export QIANFAN_TOKEN="your_qianfan_token"

# 千帆应用ID
export QIANFAN_APP_ID="your_app_id"
```

或者在请求中直接提供这些参数。

## 最佳实践

1. **保存对话ID**: 在前端保存conversation_id，用于维持对话连续性
2. **错误处理**: 实现完善的错误处理机制
3. **超时设置**: 设置合理的请求超时时间
4. **重试机制**: 对于临时性错误实现重试机制
5. **用户体验**: 显示加载状态和错误提示

## 测试页面

项目提供了测试页面 `frontend/agent-chat-test.html`，可以直接在浏览器中测试API功能。

打开 `http://localhost:3000/agent-chat-test.html` 即可使用。 