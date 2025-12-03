// 共享类型定义

export interface OutlierRule {
  min_count: number;  // 最小数量（>=）
  max_count?: number; // 最大数量（<），可选，如果不填表示无上限
  remove_high: number;
  remove_low: number;
}

export interface IntervalRule {
  min_dev: number;
  max_dev: number;
  type: 'add' | 'deduct';
  factor: number;
}

export interface ScoringConfig {
  k_factor: number;
  base_score: number;
  outlier_rules: OutlierRule[];
  high_price_rules: IntervalRule[];  // 高价区间规则
  low_price_rules: IntervalRule[];   // 低价区间规则
  min_score?: number;  // 扣分最小值（默认0）
  max_score?: number;  // 加分最大值（默认100）
  // 单调式规则（仅用于前端表单，提交时会转换为数组格式）
  high_price_type?: 'add' | 'deduct';
  high_price_factor?: number;
  low_price_type?: 'add' | 'deduct';
  low_price_factor?: number;
}

export interface Bidder {
  name: string;
  price: number;
}

export interface BidderResult {
  name: string;
  price: number;
  deviation: number;
  score: number;
  rank: number;
}

export interface CalculationResult {
  benchmark_price: number;
  results: BidderResult[];
}
