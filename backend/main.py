from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

# 导入工具注册机制
from core.tool_registry import tool_registry
from core.middleware import AccessTrackingMiddleware

# 导入工具模块（会自动注册）
from tools.bidding_scoring import router as bidding_scoring_router
from tools.bidding_scoring.logic import CalculationRequest, CalculationResult, calculate_scores

# 导入管理后台路由
from admin.router import router as admin_router
from admin.database import init_db

app = FastAPI(title="王得伏工具平台", version="2.0.0")

# 配置CORS，允许前端跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应设置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加访问追踪中间件
app.add_middleware(AccessTrackingMiddleware)

# 初始化数据库（创建表）
try:
    init_db()
except Exception as e:
    print(f"数据库初始化失败（可能数据库未就绪）: {e}")

# 注册管理后台路由
app.include_router(admin_router)

# 注册所有工具路由
for router in tool_registry.get_routers():
    app.include_router(router)

# 保持向后兼容：保留旧的 API 端点
@app.post("/api/calculate", response_model=CalculationResult)
async def calculate_legacy_v1(request: CalculationRequest):
    """
    计算评分（旧端点，保持兼容）
    """
    try:
        result = calculate_scores(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"计算失败: {str(e)}")


@app.post("/calculate", response_model=CalculationResult)
async def calculate_legacy_v2(request: CalculationRequest):
    """
    计算评分（旧端点，保持兼容）
    """
    try:
        result = calculate_scores(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"计算失败: {str(e)}")


# 静态文件目录路径（相对于 backend/main.py 的位置）
# 在 Docker 容器中，路径为 /app/frontend/dist
static_dir = Path(__file__).parent.parent / "frontend" / "dist"

# 挂载静态文件（必须在所有 API 路由之后）
# 注意：静态文件挂载必须在 SPA 回退路由之前
if static_dir.exists():
    # 挂载静态资源目录（CSS、JS、图片等）
    # 只挂载 assets 目录，避免与 SPA 路由冲突
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    # SPA 路由回退：所有非 API 路径都返回 index.html
    # 这个路由必须放在最后，确保 API 路由优先匹配
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """
        SPA 路由回退处理
        当访问非 API 路径时，返回 index.html，让前端路由处理
        这样可以支持前端路由（如 React Router）的客户端路由
        """
        # 如果路径以 /api 开头，不应该到这里（应该被 API 路由匹配）
        # 但为了安全，还是检查一下
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # 如果是静态资源文件，尝试直接返回
        # 注意：assets 已经通过 mount 处理，这里作为备用
        if full_path.startswith("assets/"):
            file_path = static_dir / full_path
            if file_path.exists() and file_path.is_file():
                return FileResponse(str(file_path))
            raise HTTPException(status_code=404, detail="Static file not found")
        
        # 其他所有路径都返回 index.html（SPA 路由回退）
        # 这样前端路由可以正确处理页面刷新
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        else:
            raise HTTPException(status_code=404, detail="index.html not found. Please build frontend first.")
else:
    # 如果静态文件目录不存在，提供一个友好的错误提示
    @app.get("/{full_path:path}")
    async def serve_spa_error(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        raise HTTPException(
            status_code=500, 
            detail="Frontend static files not found. Please ensure frontend/dist directory exists."
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
