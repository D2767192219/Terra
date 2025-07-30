# 🌍 球球terra - 地球科学科普智能体

一个集成了3D地球展示和AI智能对话的地球科学科普应用，支持PWA离线使用。

## ✨ 功能特性

- 🌍 **3D交互式地球**: 基于Three.js的高质量3D地球模型
- 🤖 **智能聊天助手**: 集成百度千帆AI，专业回答地球科学问题
- 📍 **地标探索**: 互动地标标记，了解全球著名地点
- 📱 **PWA支持**: 支持离线使用，可安装到手机桌面
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🎨 **现代UI设计**: 美观的毛玻璃效果和动画

## 🏗️ 项目结构

```
球球terra/
├── frontend/               # 前端文件
│   ├── index.html         # 主页面
│   ├── style.css          # 样式文件
│   ├── script.js          # 3D地球逻辑
│   ├── chat.js            # 聊天功能
│   ├── manifest.json      # PWA配置
│   ├── sw.js             # Service Worker
│   └── start-frontend.sh  # 前端启动脚本
├── backend/               # 后端文件
│   ├── main.py           # FastAPI后端
│   ├── requirements.txt  # Python依赖
│   ├── venv/            # Python虚拟环境（自动创建）
│   └── start-backend.sh # 后端启动脚本
├── start.sh              # 全栈启动脚本
├── start.bat             # Windows启动脚本
└── README.md            # 项目文档
```

## 🚀 快速开始

### 环境配置

**首次使用需要配置AI服务：**

**方法一：快速配置（推荐）**
```bash
cd backend
python setup_env.py
```

**方法二：手动配置**
1. 复制环境变量模板：
```bash
cd backend
cp env_template.txt .env
```

2. 编辑 `.env` 文件，填入你的百度千帆API配置：
```bash
# 应用ID - 从个人空间-应用-应用ID获取
QIANFAN_APP_ID=your-app-id-here

# 授权令牌 - 从应用工作台获取的密钥
QIANFAN_TOKEN=your-bearer-token-here
```

3. 获取配置信息：
   - 访问 [百度千帆控制台](https://console.bce.baidu.com/qianfan/overview)
   - 创建应用并获取应用ID
   - 获取API密钥作为授权令牌

**验证配置：**
```bash
cd backend
python check_config.py
```

### 方式一：完整应用（推荐）

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

这将同时启动前端和后端，提供完整的功能体验。

### 方式二：分别启动

**启动后端API服务器：**
```bash
cd backend
./start-backend.sh        # Linux/Mac
# 或
start-backend.bat         # Windows
```

**启动前端开发服务器：**
```bash
cd frontend
./start-frontend.sh       # Linux/Mac
# 或
start-frontend.bat        # Windows
```

### 方式三：手动启动

**后端：**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py
```

**前端：**
```bash
cd frontend
python3 -m http.server 8080
```

## 🎮 使用说明

### 地球操作
- 🖱️ **左键拖拽**: 旋转地球
- 🎯 **滚轮**: 缩放视角  
- 🖱️ **右键拖拽**: 平移视角
- 📍 **点击标记**: 查看地标详情

### 聊天功能
- 点击右下角 🤖 按钮开启聊天
- 输入地球科学相关问题
- 支持连续对话和上下文理解

## 🏗️ 技术栈

### 前端
- **Three.js**: 3D图形渲染
- **原生JavaScript**: 核心交互逻辑
- **CSS3**: 现代样式和动画
- **PWA**: 离线缓存和应用安装

### 后端
- **FastAPI**: 高性能Python Web框架
- **百度千帆**: AI智能对话服务
- **Uvicorn**: ASGI服务器
- **Python venv**: 虚拟环境隔离

## 🔧 开发模式

### 前端开发
```bash
cd frontend
./start-frontend.sh
# 访问 http://localhost:8080
```

### 后端开发
```bash
cd backend
./start-backend.sh
# API: http://localhost:8000/api
# 文档: http://localhost:8000/docs
```

### 完整应用
```bash
./start.sh
# 访问 http://localhost:8000
```

## 📱 PWA安装

### 桌面端
1. 在Chrome/Edge浏览器中访问应用
2. 点击地址栏右侧的安装按钮
3. 确认安装到桌面


### 移动端
1. 在Chrome/Safari中访问应用
2. 点击"添加到主屏幕"
3. 应用将作为原生应用运行

## ⚙️ 配置说明

### 安全提醒
⚠️ **重要：** 请确保 `.env` 文件不会被上传到GitHub等公开仓库，该文件包含敏感的API密钥信息。

### API配置
如需修改AI服务配置，请编辑 `backend/.env` 文件中的以下变量：
```bash
QIANFAN_APP_ID=your-app-id
QIANFAN_TOKEN=your-authorization-token
```

### 端口配置
- 前端开发服务器: `8080`
- 后端API服务器: `8000`
- 完整应用: `8000`（包含前端）

## 🌟 特色亮点

- **🎓 教育性**: 寓教于乐的地球科学学习体验
- **🔄 交互性**: 3D地球操作 + AI对话双重体验
- **📱 现代化**: PWA技术，类原生应用体验
- **🌐 响应式**: 完美适配各种设备尺寸
- **💻 开发友好**: 前后端分离，虚拟环境隔离
- **🔒 环境隔离**: 使用Python虚拟环境避免依赖冲突

## 🐛 故障排除

### 常见问题

1. **Python命令不存在**
   ```bash
   # Mac可能需要使用python3
   python3 --version
   ```

2. **权限错误**
   ```bash
   chmod +x start.sh
   chmod +x frontend/start-frontend.sh
   chmod +x backend/start-backend.sh
   ```

3. **端口被占用**
   - 更改启动脚本中的端口号
   - 或者停止占用端口的程序

4. **虚拟环境问题**
   ```bash
   # 删除并重新创建虚拟环境
   rm -rf backend/venv
   ./start.sh
   ```

5. **AI配置问题**
   ```bash
   # 检查配置
   cd backend
   python check_config.py
   
   # 重新配置
   python setup_env.py
   ```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests 来帮助改进这个项目！

---

💡 **提示**: 这是一个教育项目，展示了如何将3D可视化与AI对话相结合，创造有趣的学习体验。