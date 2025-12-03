import React from 'react';
import { Button, Table, Input, InputNumber, Card, Space, Typography, Tooltip, Form } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd';
import type { Bidder, CalculationResult, BidderResult } from '../types';

const { Text } = Typography;

interface DataEntryProps {
  bidders: Bidder[];
  setBidders: React.Dispatch<React.SetStateAction<Bidder[]>>;
  onCalculate: () => void;
  loading: boolean;
  result: CalculationResult | null;
  form: FormInstance;
}

const DataEntry: React.FC<DataEntryProps> = ({
  bidders,
  setBidders,
  onCalculate,
  loading,
  result,
  form,
}) => {
  // 使用 Form.useWatch 实时监听 k_factor 的变化
  const kFactor = Form.useWatch('k_factor', form) ?? 0.95;
  // 根据单位名称获取计算结果
  const getBidderResult = (name: string): BidderResult | undefined => {
    if (!result) return undefined;
    return result.results.find(r => r.name === name);
  };

  // 获取排名（根据得分从高到低）
  const getRank = (name: string): number | null => {
    if (!result) return null;
    // 按得分从高到低排序
    const sortedResults = [...result.results].sort((a, b) => b.score - a.score);
    const index = sortedResults.findIndex(r => r.name === name);
    return index >= 0 ? index + 1 : null;
  };

  // 获取排名对应的颜色
  const getRankColor = (rank: number | null): string => {
    if (rank === null) return '#1890ff'; // 默认蓝色
    if (rank === 1) return '#FFD700'; // 金色
    if (rank === 2) return '#C0C0C0'; // 银色
    if (rank === 3) return '#CD7F32'; // 铜色
    return '#1890ff'; // 其他保持蓝色
  };

  // 将数字转换为圆圈数字
  const getCircleNumber = (num: number): string => {
    if (num >= 1 && num <= 20) {
      // 圆圈数字 ①-⑳ (U+2460-U+2473)
      return String.fromCharCode(0x245f + num);
    }
    // 超过20的数字，返回原数字加括号
    return `${num}.`;
  };

  // 投标单位表格列
  const bidderColumns: ColumnsType<Bidder & { key: string }> = [
    {
      title: '单位名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, _record: Bidder & { key: string }, index: number) => (
        <Input
          value={text}
          onChange={(e) => {
            const newBidders = [...bidders];
            newBidders[index].name = e.target.value;
            setBidders(newBidders);
          }}
          placeholder="请输入单位名称"
        />
      ),
    },
    {
      title: '报价（万元）',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      render: (value: number, _record: Bidder & { key: string }, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => {
            const newBidders = [...bidders];
            newBidders[index].price = val || 0;
            setBidders(newBidders);
          }}
          style={{ width: '100%' }}
          min={0}
          precision={2}
          placeholder="请输入报价"
        />
      ),
    },
    {
      title: '偏离度（%）',
      key: 'deviation',
      width: 120,
      align: 'right',
      render: (_: any, record: Bidder & { key: string }) => {
        const bidderResult = getBidderResult(record.name);
        if (!bidderResult) {
          return <Text type="secondary">-</Text>;
        }
        const color = bidderResult.deviation > 0 ? '#ff4d4f' : bidderResult.deviation < 0 ? '#52c41a' : '#1890ff';
        return (
          <Text style={{ color }}>
            {bidderResult.deviation > 0 ? '+' : ''}{bidderResult.deviation.toFixed(2)}%
          </Text>
        );
      },
    },
    {
      title: '最终得分',
      key: 'score',
      width: 120,
      align: 'right',
      render: (_: any, record: Bidder & { key: string }) => {
        const bidderResult = getBidderResult(record.name);
        if (!bidderResult) {
          return <Text type="secondary">-</Text>;
        }
        const rank = getRank(record.name);
        const color = getRankColor(rank);
        const circleNumber = rank !== null && rank <= 3 ? getCircleNumber(rank) : '';
        return (
          <Text strong style={{ color }}>
            {circleNumber && <span style={{ marginRight: 4 }}>{circleNumber}</span>}
            {bidderResult.score.toFixed(2)}
          </Text>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, _record: Bidder & { key: string }, index: number) => (
        <Button
          type="link"
          danger
          onClick={() => {
            const newBidders = bidders.filter((_, i) => i !== index);
            setBidders(newBidders);
          }}
        >
          删除
        </Button>
      ),
    },
  ];

  const handleAddRow = () => {
    const currentCount = bidders.length;
    const letterIndex = currentCount % 26;
    const letter = String.fromCharCode(65 + letterIndex);
    const unitName = `投标单位${letter}`;
    setBidders([...bidders, { name: unitName, price: 0 }]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>数据录入</Typography.Title>
        <Space>
          <Text strong>
            基准价：
            <Text style={{ color: '#1890ff', fontSize: 16 }}>
              ¥{result ? result.benchmark_price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </Text>
          </Text>
          <Space>
            <Text strong>=有效投标价算数平均数*K值</Text>
            <Tooltip title="K值范围：0-1">
              <InputNumber
                min={0}
                max={1}
                step={0.01}
                precision={2}
                value={kFactor}
                onChange={(val) => {
                  if (val !== null && val !== undefined) {
                    const finalValue = val < 0 ? 0 : val > 1 ? 1 : val;
                    form.setFieldValue('k_factor', finalValue);
                    // 强制更新表单字段
                    form.validateFields(['k_factor']).catch(() => {});
                  } else {
                    form.setFieldValue('k_factor', 0.95);
                  }
                }}
                style={{ 
                  width: 80,
                }}
              />
            </Tooltip>
          </Space>
          <Button type="primary" onClick={onCalculate} loading={loading}>
            计算评分
          </Button>
        </Space>
      </div>
      <Card
        extra={
          <Space>
            <Text strong>
              投标单位总数：<Text style={{ color: '#1890ff', fontSize: 16 }}>{bidders.length}</Text>
            </Text>
            <Button type="dashed" onClick={handleAddRow}>
              + 新增行
            </Button>
          </Space>
        }
      >
        <Table
          columns={bidderColumns}
          dataSource={bidders.map((bidder, index) => ({ ...bidder, key: index.toString() }))}
          pagination={false}
          size="middle"
          locale={{
            emptyText: '暂无数据，请点击"新增行"添加投标单位',
          }}
        />
      </Card>
    </div>
  );
};

export default DataEntry;

