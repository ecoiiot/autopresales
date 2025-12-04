"""
报价评分计算器路由
"""
from fastapi import APIRouter, HTTPException
from .logic import CalculationRequest, CalculationResult, calculate_scores
from core.tool_registry import tool_registry

router = APIRouter(prefix="/api/tools/bidding/scoring", tags=["报价评分计算器"])


@router.post("/calculate", response_model=CalculationResult)
async def calculate(request: CalculationRequest):
    """
    计算评分
    
    接收配置和投标单位列表，返回计算结果
    """
    try:
        result = calculate_scores(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"计算失败: {str(e)}")


# 注册工具
def register_tool():
    """注册工具到全局注册表"""
    tool_registry.register_tool(
        tool_id="bidding_scoring",
        name="报价评分计算器",
        description="工程招标报价评分计算工具，支持自定义评分规则和批量计算",
        router=router,
        category="bidding",
        path="/tools/bidding/scoring"
    )


# 自动注册
register_tool()

