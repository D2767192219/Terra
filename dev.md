# 🛠️ 球球terra - 开发者文档

## 📁 项目架构

### 前后端分离架构
```
球球terra/
├── frontend/          # 静态前端资源
│   ├── index.html    # 主入口页面
│   ├── style.css     # 样式文件
│   ├── script.js     # 3D地球渲染逻辑
│   ├── chat.js       # 聊天功能逻辑
│   ├── manifest.json # PWA应用配置
│   └── sw.js         # Service Worker缓存策略
├── backend/          # Python API服务
│   ├── main.py       # FastAPI应用主文件
│   ├── requirements.txt # Python依赖清单
│   └── venv/         # 虚拟环境（运行时创建）
└── 启动脚本
```

## 🔧 开发环境设置

### 1. 克隆项目
```bash
git clone <repository-url>
cd 球球terra
```

### 2. 后端环境
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

pip install -r requirements.txt
```

### 3. 前端环境
前端使用原生JavaScript，无需额外安装依赖。

## 🚀 开发工作流

### 前端开发
```bash
cd frontend
python3 -m http.server 8080
# 访问 http://localhost:8080
```

**开发注意事项：**
- 修改HTML/CSS/JS文件后刷新浏览器即可看到效果
- 聊天功能需要后端API支持，纯前端模式无法使用
- PWA功能需要HTTPS或localhost环境

### 后端开发
```bash
cd backend
source venv/bin/activate
python main.py
# API文档: http://localhost:8000/docs
```

**开发注意事项：**
- FastAPI支持热重载，修改代码后自动重启
- API接口遵循RESTful设计
- 错误处理和日志记录已配置

### 完整应用开发
```bash
./start.sh
# 访问 http://localhost:8000
```

## 📡 API接口文档

### 聊天接口
```http
POST /api/chat
Content-Type: application/json

{
  "message": "什么是地球的核心？",
  "conversation_id": "可选的对话ID"
}
```

**响应：**
```json
{
  "response": "地球的核心分为内核和外核...",
  "conversation_id": "会话ID",
  "error": null
}
```

### 健康检查接口
```http
GET /api/health
```

**响应：**
```json
{
  "status": "healthy",
  "service": "球球terra API"
}
```

## 🎨 前端架构

### 核心模块

1. **script.js** - 3D地球渲染
   - Three.js场景管理
   - 地球纹理加载
   - 交互控制逻辑
   - 地标标记系统

2. **chat.js** - 聊天功能
   - 消息发送/接收
   - UI状态管理
   - 错误处理
   - 历史记录管理

3. **style.css** - 视觉设计
   - 响应式布局
   - 毛玻璃效果
   - 动画过渡
   - 移动端适配

### 关键组件

#### 地球渲染器
```javascript
// 初始化3D场景
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(...);
  renderer = new THREE.WebGLRenderer(...);
  // ...
}
```

#### 聊天管理器
```javascript
// 发送消息到API
async function sendMessage() {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id })
  });
  // ...
}
```

## 🔒 后端架构

### FastAPI应用结构
```python
app = FastAPI(title="球球terra - 地球科学科普智能体")

# 中间件配置
app.add_middleware(CORSMiddleware, ...)

# API路由
@app.post("/api/chat")
async def chat_with_terra(chat_message: ChatMessage):
    # 调用百度千帆API
    # 处理响应
    # 返回结果

# 静态文件服务
app.mount("/static", StaticFiles(directory=frontend_path))
```

### 依赖管理
```txt
fastapi==0.104.1    # Web框架
uvicorn==0.24.0     # ASGI服务器
requests==2.31.0    # HTTP客户端
pydantic==2.5.0     # 数据验证
```

## 📱 PWA实现

### Manifest配置
```json
{
  "name": "球球terra - 地球科学科普智能体",
  "short_name": "球球terra",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0c0c0c",
  "theme_color": "#4a9eff"
}
```

### Service Worker缓存策略
```javascript
// 缓存优先策略
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

## 🎯 性能优化

### 前端优化
- 地球纹理压缩和fallback机制
- 按需加载Three.js组件
- CSS动画使用transform避免重排
- 图像资源延迟加载

### 后端优化
- 虚拟环境隔离依赖
- 异步请求处理
- 错误重试机制
- 日志级别控制

## 🧪 测试策略

### 前端测试
```bash
# 浏览器兼容性测试
# Chrome 51+, Firefox 47+, Safari 10+, Edge 79+

# 设备测试
# 桌面、平板、手机
# 横屏、竖屏模式

# PWA测试
# 离线功能、安装流程
```

### 后端测试
```bash
# API接口测试
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "测试消息"}'

# 负载测试
# 并发请求测试
# 错误恢复测试
```

## 🔧 部署指南

### 开发环境部署
1. 使用提供的启动脚本
2. 本地开发和测试

### 生产环境部署
1. **前端**: 部署到静态资源服务器（Nginx、CDN）
2. **后端**: 部署到云服务器（Docker、K8s）
3. **域名**: 配置HTTPS支持PWA功能

### Docker部署（可选）
```dockerfile
# 后端Dockerfile示例
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

## 🐛 调试技巧

### 前端调试
```javascript
// 开启Three.js调试
console.log('Three.js版本:', THREE.REVISION);

// 聊天功能调试
console.log('发送消息:', message);
console.log('API响应:', response);
```

### 后端调试
```python
# 启用详细日志
logging.basicConfig(level=logging.DEBUG)

# API调试
logger.info(f"收到聊天请求: {chat_message}")
logger.debug(f"百度千帆响应: {response_data}")
```

## 📝 代码规范

### JavaScript规范
- 使用ES6+语法
- 驼峰命名法
- 注释关键逻辑
- 错误处理覆盖

### Python规范
- PEP 8编码规范
- 类型提示支持
- 异常处理完整
- 文档字符串

## 🔄 版本控制

### Git工作流
```bash
# 功能开发
git checkout -b feature/new-feature
git commit -m "feat: 添加新功能"
git push origin feature/new-feature

# 代码审查和合并
# 使用Pull Request流程
```

### 版本标记
- 使用语义化版本（SemVer）
- 主版本.次版本.修订版本
- 例如：v1.0.0, v1.1.0, v1.1.1

---

💡 **开发提示**: 保持前后端分离的架构，便于独立开发和部署。 