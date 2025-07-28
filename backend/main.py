from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from chat_api import router as chat_router

# 加载环境变量
load_dotenv()

app = FastAPI(title="AI聊天助手", description="基于百度千帆API的聊天系统")

# 包含智能体对话路由
app.include_router(chat_router)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该设置具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI聊天助手后端服务正在运行", "status": "ok"}

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "healthy", "service": "ai-chat-backend"}

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"启动服务器: http://{host}:{port}")
    print(f"API文档: http://{host}:{port}/docs")
    print(f"聊天接口: http://{host}:{port}/api/chat/")
    
    uvicorn.run(app, host=host, port=port) 