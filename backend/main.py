from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from scoring_logic import CalculationRequest, CalculationResult, calculate_scores

app = FastAPI(title="工程招标报价评分系统", version="1.0.0")

# 配置CORS，允许前端跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应设置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件目录路径（相对于 backend/main.py 的位置）
# 在 Docker 容器中，路径为 /app/frontend/dist
static_dir = Path(__file__).parent.parent / "frontend" / "dist"

# 先定义所有 API 路由（确保它们优先匹配）
@app.post("/api/calculate", response_model=CalculationResult)
async def calculate(request: CalculationRequest):
    """
    计算评分
    
    接收配置和投标单位列表，返回计算结果
    """
    try:
        result = calculate_scores(request)
        return result
    except Exception as e:
        # 返回错误信息
        raise HTTPException(status_code=400, detail=f"计算失败: {str(e)}")


# 保留旧的 /calculate 端点以保持兼容性
@app.post("/calculate", response_model=CalculationResult)
async def calculate_legacy(request: CalculationRequest):
    """
    计算评分（旧端点，保持兼容）
    """
    try:
        result = calculate_scores(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"计算失败: {str(e)}")


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
