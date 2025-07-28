# 🌍 球球Terra - AI配置说明

## 概述

球球Terra使用百度千帆AI平台提供智能对话功能。本文档将指导您完成AI配置。

## 快速配置

1. **运行配置脚本**（推荐）：
   ```bash
   python setup_ai.py
   ```

2. **手动配置**：
   复制 `.env.example` 到 `.env` 并填入您的配置。

## 详细配置步骤

### 1. 获取千帆API访问权限

1. 访问 [百度智能云千帆平台](https://console.bce.baidu.com/qianfan/overview)
2. 注册/登录百度智能云账号
3. 开通千帆大模型服务

### 2. 创建应用

1. 在千帆控制台中，进入"个人空间" → "应用"
2. 点击"创建应用"
3. 选择应用类型：
   - **自主规划Agent**：适合通用对话
   - **工作流Agent**：适合复杂任务流程
4. 配置应用参数：
   - 应用名称：球球Terra
   - 描述：地球知识助手
   - 大模型：推荐 ERNIE-4.0 或 ERNIE-3.5
5. 保存应用并记录**应用ID**

### 3. 获取授权令牌

1. 在应用详情页面，找到"应用工作台"
2. 获取**API密钥**（Authorization token）
3. 格式通常为：`Bearer bce-v3/ALTAK-xxx` 或直接的密钥字符串

### 4. 配置环境变量

创建 `.env` 文件并填入以下信息：

```bash
# 必需配置
QIANFAN_APP_ID=你的应用ID
QIANFAN_TOKEN=你的授权令牌

# 可选配置
QIANFAN_API_BASE_URL=https://qianfan.baidubce.com
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

## 配置验证

### 自动测试
运行配置脚本时会自动测试连接：
```bash
python setup_ai.py
```

### 手动测试
启动后端服务并访问测试接口：
```bash
python main.py
# 在另一个终端中：
curl http://localhost:8000/api/chat/test
```

### 前端测试
1. 启动前端服务
2. 打开聊天功能
3. 发送测试消息

## 常见问题

### Q: API调用失败，显示401错误
**A:** 检查授权令牌是否正确，确保：
- 令牌没有过期
- 令牌格式正确（可能需要去掉"Bearer "前缀）
- 应用状态为启用

### Q: 显示400错误
**A:** 检查应用ID是否正确：
- 确认应用ID来自正确的应用
- 检查应用类型是否支持对话功能

### Q: 网络连接超时
**A:** 检查网络和防火墙设置：
- 确保能访问千帆API地址
- 检查公司/学校网络限制
- 尝试使用代理

### Q: 流式响应不工作
**A:** 这是正常的，系统会：
- 自动降级到非流式模式
- 仍然能正常对话
- 可能响应稍慢

## 高级配置

### 自定义模型参数
在应用配置中可以调整：
- 温度值（创造性）
- 最大tokens
- 系统提示词

### 多应用配置
如果需要使用多个应用：
1. 在不同环境中使用不同的 `.env` 文件
2. 通过API参数动态切换应用ID

### 代理配置
如果需要通过代理访问：
```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

## 安全注意事项

1. **保护API密钥**：
   - 不要将 `.env` 文件提交到版本控制
   - 定期轮换API密钥
   - 限制密钥权限

2. **网络安全**：
   - 在生产环境中使用HTTPS
   - 限制API访问来源IP
   - 监控API使用量

3. **数据隐私**：
   - 了解千帆平台的数据处理政策
   - 避免发送敏感信息
   - 考虑数据脱敏

## 费用管理

- 千帆平台按API调用次数收费
- 定期检查控制台中的用量统计
- 设置预算警告和限制

## 技术支持

- 千帆平台官方文档：https://cloud.baidu.com/doc/WENXINWORKSHOP/
- 开发者社区：https://ai.baidu.com/forum/
- 技术支持：通过百度智能云工单系统

## 开发模式

### 本地开发
```bash
# 启动后端
cd backend
python main.py

# 启动前端
cd frontend
python3 -m http.server 8080
```

### 调试模式
设置环境变量：
```bash
LOG_LEVEL=DEBUG
```

这将输出详细的API调用日志，帮助排查问题。 