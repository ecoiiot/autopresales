from typing import List
from pydantic import BaseModel


class OutlierRule(BaseModel):
    """去极值规则"""
    min_count: int  # 最小数量
    remove_high: int  # 去掉最高价数量
    remove_low: int  # 去掉最低价数量


class IntervalRule(BaseModel):
    """区间规则"""
    min_dev: float  # 最小偏离度（%）
    max_dev: float  # 最大偏离度（%）
    type: str  # "add" 或 "deduct"
    factor: float  # 系数


class ScoringConfig(BaseModel):
    """评分配置"""
    k_factor: float  # K值
    base_score: float  # 基准分
    outlier_rules: List[OutlierRule]  # 去极值规则列表
    high_price_factor: float  # 高价扣分系数
    low_price_rules: List[IntervalRule]  # 低价区间规则列表


class Bidder(BaseModel):
    """投标单位"""
    name: str  # 单位名称
    price: float  # 报价


class CalculationRequest(BaseModel):
    """计算请求"""
    config: ScoringConfig
    bidders: List[Bidder]


class BidderResult(BaseModel):
    """投标单位结果"""
    name: str  # 单位名称
    price: float  # 报价
    deviation: float  # 偏离度（%）
    score: float  # 最终得分
    rank: int  # 排名


class CalculationResult(BaseModel):
    """计算结果"""
    benchmark_price: float  # 基准价
    results: List[BidderResult]  # 结果列表


def calculate_scores(request: CalculationRequest) -> CalculationResult:
    """
    计算评分
    
    算法：
    1. 根据去极值规则处理报价，计算基准价（均值 * K值）
    2. 对每个报价计算得分：
       - 报价 = 基准价：得基准分
       - 报价 > 基准价：线性扣分
       - 报价 < 基准价：根据区间规则加分或扣分
    """
    config = request.config
    bidders = request.bidders
    
    if not bidders:
        return CalculationResult(benchmark_price=0.0, results=[])
    
    # 提取所有报价
    prices = [bidder.price for bidder in bidders]
    prices_sorted = sorted(prices)
    
    # 根据去极值规则处理报价
    valid_prices = prices_sorted.copy()
    bidder_count = len(bidders)
    
    # 找到匹配的去极值规则（按 min_count 降序排序，取第一个匹配的）
    matched_rule = None
    sorted_rules = sorted(config.outlier_rules, key=lambda x: x.min_count, reverse=True)
    for rule in sorted_rules:
        if bidder_count > rule.min_count:
            matched_rule = rule
            break
    
    if matched_rule:
        # 去掉最高价
        for _ in range(matched_rule.remove_high):
            if valid_prices:
                valid_prices.pop()
        # 去掉最低价
        for _ in range(matched_rule.remove_low):
            if valid_prices:
                valid_prices.pop(0)
    
    # 计算基准价（有效报价的均值 * K值）
    if valid_prices:
        avg_price = sum(valid_prices) / len(valid_prices)
        benchmark_price = avg_price * config.k_factor
    else:
        benchmark_price = sum(prices) / len(prices) * config.k_factor
    
    # 计算每个投标单位的得分
    results = []
    for bidder in bidders:
        price = bidder.price
        deviation = ((price - benchmark_price) / benchmark_price) * 100
        
        # 初始得分为基准分
        score = config.base_score
        
        if price > benchmark_price:
            # 报价高于基准价：线性扣分
            score = config.base_score - (deviation * config.high_price_factor)
        elif price < benchmark_price:
            # 报价低于基准价：根据区间规则处理
            abs_deviation = abs(deviation)
            for rule in config.low_price_rules:
                if rule.min_dev <= abs_deviation < rule.max_dev:
                    if rule.type == "add":
                        score = config.base_score + (abs_deviation * rule.factor)
                    elif rule.type == "deduct":
                        score = config.base_score - (abs_deviation * rule.factor)
                    break
        # 如果 price == benchmark_price，保持基准分不变
        
        # 确保得分不为负数
        score = max(0, score)
        
        results.append(BidderResult(
            name=bidder.name,
            price=price,
            deviation=round(deviation, 2),
            score=round(score, 2),
            rank=0  # 稍后排序
        ))
    
    # 按得分降序排序，设置排名
    results.sort(key=lambda x: x.score, reverse=True)
    for i, result in enumerate(results, 1):
        result.rank = i
    
    return CalculationResult(
        benchmark_price=round(benchmark_price, 2),
        results=results
    )

