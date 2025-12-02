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

// 工程文件数据结构
export interface ProjectFile {
  version: string;
  timestamp: number;
  config: ScoringConfig;
  bidders: Bidder[];
  result?: CalculationResult;
}

