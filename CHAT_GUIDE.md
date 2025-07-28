# 🌍 球球Terra - 聊天功能使用指南

## 概述

球球Terra现在具备完整的AI聊天功能，基于百度千帆API实现。本指南将帮助您快速设置和使用聊天功能。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 进入后端目录
cd backend

# 安装Python依赖
pip install -r requirements.txt
```

### 2. 配置AI服务

**方法一：使用配置脚本（推荐）**
```bash
cd backend
python setup_ai.py
```

**方法二：手动配置**
```bash
# 复制配置模板
cp backend/env_example.txt backend/.env

# 编辑配置文件，填入您的千帆API信息
# QIANFAN_APP_ID=your-app-id
# QIANFAN_TOKEN=your-token
```

### 3. 启动服务

**自动启动（推荐）**
```bash
# 启动后端
./backend/start-backend.sh

# 启动前端（新开终端）
./frontend/start-frontend.sh
```

**手动启动**
```bash
# 后端
cd backend
python main.py

# 前端（新开终端）
cd frontend
python3 -m http.server 8080
```

### 4. 访问系统

- 前端界面：http://localhost:8080
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

## 🛠️ 功能特性

### 已修复的问题

✅ **API路由冲突** - 统一了前后端接口
✅ **流式响应处理** - 正确解析千帆API的SSE格式
✅ **前端兼容性** - 修复了API调用路径不匹配
✅ **对话流程** - 完整的创建对话→发送消息流程
✅ **错误处理** - 增强了用户体验和错误提示

### 新增功能

🆕 **自动对话创建** - 首次发消息时自动创建对话
🆕 **智能错误处理** - 根据错误类型提供具体提示
🆕 **配置助手** - `setup_ai.py`帮助快速配置
🆕 **集成测试** - `test_integration.py`验证系统状态
🆕 **详细日志** - 便于调试和监控

## 📱 使用方法

### 前端聊天

1. 打开浏览器访问 http://localhost:8080
2. 点击右下角的聊天图标
3. 在聊天框中输入消息
4. 按回车或点击发送按钮

### API调用

**前端兼容接口**
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'
```

**标准API**
```bash
# 创建对话
curl -X POST http://localhost:8000/api/chat/conversation \
  -H "Content-Type: application/json" \
  -d '{}'

# 发送消息
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "your-conversation-id",
    "message": "你好"
  }'
```

## 🔧 配置说明

### 环境变量

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `QIANFAN_APP_ID` | 是 | 千帆应用ID |
| `QIANFAN_TOKEN` | 是 | 千帆授权令牌 |
| `QIANFAN_API_BASE_URL` | 否 | API基础URL（默认：千帆官方） |
| `HOST` | 否 | 服务器绑定地址（默认：0.0.0.0） |
| `PORT` | 否 | 服务器端口（默认：8000） |
| `LOG_LEVEL` | 否 | 日志级别（默认：INFO） |

### 获取千帆配置

1. 访问 [百度智能云千帆平台](https://console.bce.baidu.com/qianfan/overview)
2. 注册/登录账号
3. 创建应用（推荐选择"自主规划Agent"）
4. 获取应用ID和API密钥

## 🧪 测试功能

### 运行集成测试

```bash
# 安装测试依赖
pip install aiohttp

# 运行完整测试
python test_integration.py
```

### 手动测试

```bash
# 测试健康检查
curl http://localhost:8000/health

# 测试聊天API
curl http://localhost:8000/api/chat/test

# 测试对话功能
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'
```

## 🐛 故障排除

### 常见问题

**Q: 401 Unauthorized错误**
```
A: 检查QIANFAN_TOKEN是否正确
   - 确认令牌没有过期
   - 检查令牌格式（可能需要去掉"Bearer "前缀）
```

**Q: 400 Bad Request错误**
```
A: 检查QIANFAN_APP_ID是否正确
   - 确认应用ID来自正确的应用
   - 检查应用状态是否为启用
```

**Q: 连接超时**
```
A: 检查网络连接
   - 确保能访问千帆API地址
   - 检查防火墙设置
   - 尝试使用代理
```

**Q: 前端无法连接后端**
```
A: 检查后端服务状态
   - 确认后端服务已启动（http://localhost:8000）
   - 检查CORS配置
   - 查看浏览器控制台错误信息
```

### 调试模式

启用详细日志：
```bash
export LOG_LEVEL=DEBUG
python main.py
```

## 📊 监控和维护

### 日志查看

- 后端日志：控制台输出
- 前端日志：浏览器控制台（F12 → Console）

### 性能监控

- API响应时间：查看后端日志
- 对话统计：通过API `/api/chat/test` 查看服务状态

### 数据管理

- 对话数据：当前存储在内存中（重启后清除）
- 生产环境建议：使用Redis或数据库存储对话状态

## 🔒 安全建议

1. **保护API密钥**
   - 不要将`.env`文件提交到版本控制
   - 定期轮换API密钥
   - 使用环境变量管理敏感信息

2. **网络安全**
   - 生产环境使用HTTPS
   - 设置合适的CORS策略
   - 限制API访问频率

3. **数据隐私**
   - 避免发送敏感个人信息
   - 了解千帆平台数据处理政策
   - 考虑对敏感数据进行脱敏

## 📈 扩展功能

### 计划中的功能

- [ ] 对话历史持久化
- [ ] 用户身份认证
- [ ] 多模型支持
- [ ] 流式响应前端显示
- [ ] 对话导出功能

### 自定义开发

系统采用模块化设计，便于扩展：

- `qianfan_client.py` - 千帆API客户端
- `chat_api.py` - REST API接口
- `chat.js` - 前端聊天逻辑

## 🆘 技术支持

- **项目文档**：查看 `backend/config_instructions.md`
- **API文档**：访问 http://localhost:8000/docs
- **千帆文档**：https://cloud.baidu.com/doc/WENXINWORKSHOP/
- **问题反馈**：通过GitHub Issues

## 📝 更新日志

### v1.1.0 (当前版本)
- ✅ 修复API路由冲突
- ✅ 实现流式响应处理  
- ✅ 增强错误处理
- ✅ 添加配置助手
- ✅ 创建集成测试
- ✅ 完善文档

### v1.0.0 (基础版本)
- ✅ 基础3D地球展示
- ✅ 基础聊天功能框架
- ✅ 千帆API集成

---

🌍 **球球Terra团队** - 让AI与地球知识触手可及 