from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
import os

# 加载当前目录的 .env 文件
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)

from chat_api import router as chat_router

app = FastAPI(title="球球terra", description="地球科学科普智能体")

# 获取前端目录路径
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")

# 包含智能体对话路由（放在静态文件前面）
app.include_router(chat_router)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SPA 回退路由 - 所有非 API 请求返回 index.html
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # 先检查是否是静态文件
    static_file_path = os.path.join(frontend_path, full_path)
    if os.path.exists(static_file_path) and os.path.isfile(static_file_path):
        return FileResponse(static_file_path)
    
    # 否则返回 index.html（SPA 路由）
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return JSONResponse({"error": "Not Found"}, status_code=404)

@app.get("/")
async def root():
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "球球terra 后端服务正在运行", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-chat-backend"}

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"启动服务器: http://{host}:{port}")
    print(f"前端页面: http://{host}:{port}/")
    print(f"API文档: http://{host}:{port}/docs")
    
    uvicorn.run(app, host=host, port=port)
