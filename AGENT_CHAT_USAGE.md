# 智能体对话功能使用指南

## 概述

根据您的需求，我已经在后端实现了完整的智能体对话功能，完全按照您描述的两步流程：

1. **自动创建conversation_id** - 调用千帆API创建新对话
2. **发送消息获取回复** - 使用conversation_id与智能体对话

## 实现的功能

### 1. 后端API接口 (`/api/chat/agent-chat`)

位置：`backend/chat_api.py`

**主要特性：**
- ✅ 自动创建对话ID（如果没有提供）
- ✅ 支持继续现有对话
- ✅ 完整的错误处理
- ✅ 支持流式和非流式响应
- ✅ 兼容您提供的千帆API规范

**接口参数：**
```json
{
    "message": "用户消息",
    "conversation_id": "可选，对话ID",
    "app_id": "可选，智能体应用ID", 
    "stream": false,
    "token": "可选，授权令牌"
}
```

**响应格式：**
```json
{
    "success": true,
    "conversation_id": "对话ID",
    "response": "AI回复内容",
    "request_id": "请求ID",
    "message_id": "消息ID"
}
```

### 2. 前端测试页面

位置：`frontend/agent-chat-test.html`

**功能特性：**
- 🎨 现代化UI界面
- 💬 实时对话测试
- 🔍 显示对话ID
- ⚡ 支持新建对话
- 🔄 多轮对话支持
- ❌ 完善的错误提示

### 3. Python测试工具

位置：`backend/test_agent_chat.py`

**测试内容：**
- 🔧 API可用性检查
- 🚀 新对话创建测试
- 💬 继续对话测试
- 🛡️ 错误处理测试
- 🔄 多轮对话测试

### 4. 详细API文档

位置：`backend/AGENT_CHAT_API.md`

包含完整的：
- 接口规范
- 使用示例（JavaScript + Python）
- 错误处理
- 最佳实践

## 快速开始

### 1. 启动后端服务

```bash
cd backend
# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 启动服务
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. 配置环境变量

```bash
export QIANFAN_TOKEN="your_qianfan_token"
export QIANFAN_APP_ID="ac6acc7c-9e7c-4909-8bc0-5ca667a5e0b6"
```

### 3. 测试接口

```bash
# 运行Python测试脚本
cd backend
python test_agent_chat.py
```

### 4. 前端测试

打开浏览器访问：`http://localhost:3000/agent-chat-test.html`

## 前端调用示例

### JavaScript

```javascript
// 新建对话
async function startChat(message) {
    const response = await fetch('/api/chat/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
    return response.json();
}

// 继续对话
async function continueChat(message, conversationId) {
    const response = await fetch('/api/chat/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message, 
            conversation_id: conversationId 
        })
    });
    return response.json();
}

// 使用示例
startChat('你好').then(data => {
    console.log('AI回复:', data.response);
    const conversationId = data.conversation_id;
    
    // 继续对话
    continueChat('你能做什么？', conversationId);
});
```

### Python

```python
import requests
import json

def agent_chat(message, conversation_id=None):
    url = "http://localhost:8000/api/chat/agent-chat"
    payload = {"message": message}
    
    if conversation_id:
        payload["conversation_id"] = conversation_id
    
    response = requests.post(
        url, 
        headers={'Content-Type': 'application/json'},
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8')
    )
    
    return response.json()

# 使用示例
result = agent_chat("你好，请介绍一下你自己")
print(f"AI回复: {result['response']}")

# 继续对话
conversation_id = result['conversation_id']
result = agent_chat("你能帮我做什么？", conversation_id)
print(f"AI回复: {result['response']}")
```

## 文件结构

```
backend/
├── chat_api.py              # 主要API实现（已更新）
├── qianfan_client.py        # 千帆客户端（现有）
├── test_agent_chat.py       # 测试脚本（新增）
└── AGENT_CHAT_API.md        # API文档（新增）

frontend/
└── agent-chat-test.html     # 测试页面（新增）

根目录/
└── AGENT_CHAT_USAGE.md      # 使用指南（本文件）
```

## 主要特性

✅ **完全实现您的需求** - 严格按照您提供的两步流程实现  
✅ **兼容现有架构** - 无缝集成到您的项目中  
✅ **完善的错误处理** - 处理各种异常情况  
✅ **支持中文响应** - 根据您的记忆偏好[[memory:4199215]]  
✅ **详细的文档** - 包含完整的使用说明  
✅ **测试工具齐全** - Python脚本 + HTML页面  
✅ **生产就绪** - 包含日志、验证、超时处理  

## 注意事项

1. **环境配置**：确保配置了`QIANFAN_TOKEN`和`QIANFAN_APP_ID`环境变量
2. **网络连接**：确保服务器能访问千帆API（`https://qianfan.baidubce.com`）
3. **对话有效期**：conversation_id有效期为7天，超过后需重新创建
4. **并发处理**：API支持并发请求，但建议控制频率
5. **错误重试**：建议在客户端实现重试机制处理临时性错误

## 技术支持

如果您在使用过程中遇到问题：

1. 查看后端日志（启动时会显示详细信息）
2. 运行测试脚本 `python test_agent_chat.py` 检查配置
3. 检查环境变量配置是否正确
4. 确认网络连接和千帆API可访问性

现在您可以直接在前端调用新的 `/api/chat/agent-chat` 接口来实现智能体对话功能了！🎉 