# 🌍 球球terra AI智能体部署指南

## 概述

球球terra是一个集成3D地球可视化和AI智能对话的地球科学科普应用。本指南将帮助您完成从本地测试模式到真实AI智能体的完整部署。

## 架构说明

- **前端**: 纯HTML/CSS/JavaScript + Three.js，支持3D地球交互
- **后端**: FastAPI + SQLite，集成百度千帆大模型
- **AI服务**: 百度智能云千帆平台
- **数据库**: SQLite，存储对话记录

## 🚀 快速开始

### 1. 启动前端服务
```bash
cd frontend
./start-frontend.sh
```
访问地址：
- 本地: http://localhost:8080
- 局域网: http://你的IP:8080

### 2. 配置AI智能体

#### 方法一：使用配置助手（推荐）
```bash
cd backend
python setup_ai.py
```

#### 方法二：手动配置
1. 在`backend/`目录创建`.env`文件：
```bash
# 百度千帆API配置
QIANFAN_APP_ID=your_app_id_here
QIANFAN_AUTHORIZATION=Bearer your_authorization_here

# 数据库配置
DATABASE_URL=sqlite:///./terra.db
```

2. 从百度智能云千帆平台获取密钥：
   - 登录：https://qianfan.baidubce.com/
   - 进入应用工作台
   - 复制app_id和Authorization密钥

### 3. 启动后端服务
```bash
cd backend
./start-backend.sh
```

## 📊 管理和监控

### 管理面板
访问: http://localhost:8000/admin.html

功能：
- ✅ 实时AI服务状态监控
- 📊 对话统计信息
- 💬 历史对话记录查看
- 🔧 AI连接测试

### API文档
访问: http://localhost:8000/docs

### 健康检查
```bash
curl http://localhost:8000/api/health
```

## 🔧 故障排除

### AI服务未配置
**症状**: 聊天功能提示"AI服务未正确配置"

**解决方案**:
1. 运行 `python setup_ai.py` 重新配置
2. 检查`.env`文件是否存在且配置正确
3. 验证百度千帆API密钥是否有效

### 数据库问题
**症状**: 对话记录无法保存

**解决方案**:
1. 检查`backend/terra.db`文件权限
2. 重启后端服务
3. 如需重置，删除`terra.db`文件

### 网络连接问题
**症状**: Three.js加载失败或地球纹理异常

**解决方案**:
1. 检查网络连接
2. 使用本地Three.js版本（已自动配置）
3. 检查防火墙设置

## 🌐 局域网部署

### 前端配置
前端已自动支持局域网访问，启动时会显示局域网IP。

### 后端配置
后端默认绑定所有网络接口(0.0.0.0)，支持局域网访问。

### 防火墙配置
确保以下端口开放：
- 前端: 8080
- 后端: 8000

## 📱 移动端支持

球球terra完全支持移动设备：
- 响应式设计
- 触摸交互
- PWA支持
- 离线缓存

## 🔒 安全注意事项

1. **API密钥安全**: 
   - 不要将`.env`文件提交到版本控制
   - 定期轮换API密钥
   
2. **网络安全**:
   - 生产环境建议使用HTTPS
   - 配置适当的CORS策略

3. **数据隐私**:
   - 对话记录存储在本地SQLite
   - 可定期清理敏感对话记录

## 📈 性能优化

1. **前端优化**:
   - Three.js本地缓存
   - Service Worker离线支持
   - 资源压缩

2. **后端优化**:
   - 数据库连接池
   - API请求缓存
   - 日志管理

## 🆕 功能特性

### 前端功能
- 🌍 交互式3D地球模型
- 🗺️ 全球地标展示
- 📍 实时坐标显示
- 🎮 多种交互控制
- 📱 PWA离线支持

### AI智能体功能
- 🤖 地球科学专业问答
- 💬 连续对话记忆
- 📚 丰富知识库
- 🔄 实时学习更新

### 数据管理功能
- 📊 对话统计分析
- 💾 历史记录查询
- 🔍 智能搜索过滤
- 📈 使用趋势分析

## 🛠️ 开发者信息

### 技术栈
- **前端**: HTML5, CSS3, JavaScript ES6+, Three.js
- **后端**: Python 3.8+, FastAPI, SQLAlchemy
- **AI**: 百度智能云千帆大模型
- **数据库**: SQLite

### API端点
- `POST /api/chat` - 智能对话
- `GET /api/health` - 健康检查
- `GET /api/test-ai` - AI连接测试
- `GET /api/conversations` - 对话记录
- `GET /api/conversations/stats` - 统计信息

### 环境要求
- Python 3.8+
- Node.js (可选，用于开发)
- 现代Web浏览器
- 网络连接（用于AI服务）

## 📞 技术支持

如遇问题，请检查：
1. 管理面板状态: http://localhost:8000/admin.html
2. API文档: http://localhost:8000/docs
3. 后端日志输出
4. 浏览器开发者工具

---

**祝您使用愉快！🌍✨** 