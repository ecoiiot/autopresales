from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/")
async def root():
    """根路径"""
    return {"message": "工程招标报价评分系统 API"}


@app.post("/calculate", response_model=CalculationResult)
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
        raise Exception(f"计算失败: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

