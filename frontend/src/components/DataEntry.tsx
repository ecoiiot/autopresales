import React from 'react';
import { Button, Table, Input, InputNumber, Card, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Bidder, CalculationResult } from '../types';

const { Text } = Typography;

interface DataEntryProps {
  bidders: Bidder[];
  setBidders: React.Dispatch<React.SetStateAction<Bidder[]>>;
  onCalculate: () => void;
  loading: boolean;
  result: CalculationResult | null;
}

const DataEntry: React.FC<DataEntryProps> = ({
  bidders,
  setBidders,
  onCalculate,
  loading,
  result,
}) => {
  // 根据单位名称获取计算结果
  const getBidderResult = (name: string): BidderResult | undefined => {
    if (!result) return undefined;
    return result.results.find(r => r.name === name);
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
      title: '报价（元）',
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
        return (
          <Text strong style={{ color: '#1890ff' }}>
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
          <Button type="primary" onClick={onCalculate} loading={loading}>
            计算评分
          </Button>
          {result && (
            <Text strong>
              基准价：<Text style={{ color: '#1890ff', fontSize: 16 }}>
                ¥{result.benchmark_price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Text>
          )}
        </Space>
      </div>
      <Card
        extra={
          <div>
            <Text strong style={{ marginRight: 16 }}>投标单位总数：{bidders.length}</Text>
            <Button type="dashed" onClick={handleAddRow}>
              + 新增行
            </Button>
          </div>
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

