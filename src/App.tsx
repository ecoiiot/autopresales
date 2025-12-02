import React, { useState } from 'react';
import {
  Layout,
  Form,
  InputNumber,
  Button,
  Table,
  Input,
  Select,
  Space,
  Card,
  Typography,
  Divider,
  message,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// 类型定义
interface OutlierRule {
  min_count: number;
  remove_high: number;
  remove_low: number;
}

interface IntervalRule {
  min_dev: number;
  max_dev: number;
  type: 'add' | 'deduct';
  factor: number;
}

interface ScoringConfig {
  k_factor: number;
  base_score: number;
  outlier_rules: OutlierRule[];
  high_price_factor: number;
  low_price_rules: IntervalRule[];
}

interface Bidder {
  name: string;
  price: number;
}

interface BidderResult {
  name: string;
  price: number;
  deviation: number;
  score: number;
  rank: number;
}

interface CalculationResult {
  benchmark_price: number;
  results: BidderResult[];
}

// 预设模板
const templates: Record<string, ScoringConfig> = {
  template1: {
    k_factor: 0.95,
    base_score: 100,
    outlier_rules: [
      { min_count: 5, remove_high: 1, remove_low: 1 },
    ],
    high_price_factor: 0.5,
    low_price_rules: [
      { min_dev: 0, max_dev: 5, type: 'add', factor: 0.3 },
      { min_dev: 5, max_dev: 10, type: 'add', factor: 0.2 },
      { min_dev: 10, max_dev: 15, type: 'deduct', factor: 0.1 },
    ],
  },
  template2: {
    k_factor: 1.0,
    base_score: 100,
    outlier_rules: [
      { min_count: 3, remove_high: 1, remove_low: 0 },
      { min_count: 7, remove_high: 1, remove_low: 1 },
    ],
    high_price_factor: 0.8,
    low_price_rules: [
      { min_dev: 0, max_dev: 3, type: 'add', factor: 0.5 },
      { min_dev: 3, max_dev: 8, type: 'add', factor: 0.3 },
    ],
  },
  template3: {
    k_factor: 0.98,
    base_score: 100,
    outlier_rules: [
      { min_count: 10, remove_high: 2, remove_low: 2 },
    ],
    high_price_factor: 1.0,
    low_price_rules: [
      { min_dev: 0, max_dev: 2, type: 'add', factor: 0.4 },
      { min_dev: 2, max_dev: 5, type: 'add', factor: 0.2 },
      { min_dev: 5, max_dev: 10, type: 'deduct', factor: 0.2 },
      { min_dev: 10, max_dev: 20, type: 'deduct', factor: 0.5 },
    ],
  },
  template4: {
    k_factor: 0.92,
    base_score: 100,
    outlier_rules: [
      { min_count: 5, remove_high: 1, remove_low: 1 },
      { min_count: 15, remove_high: 2, remove_low: 2 },
    ],
    high_price_factor: 0.6,
    low_price_rules: [
      { min_dev: 0, max_dev: 8, type: 'add', factor: 0.25 },
    ],
  },
};

const App: React.FC = () => {
  const [form] = Form.useForm<ScoringConfig>();
  const [biddersText, setBiddersText] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载模板
  const loadTemplate = (templateKey: string) => {
    const template = templates[templateKey];
    if (template) {
      form.setFieldsValue(template);
      message.success('模板加载成功');
    }
  };

  // 模板菜单
  const templateMenuItems: MenuProps['items'] = [
    {
      key: 'template1',
      label: '模板1：标准配置（去1高1低，K=0.95）',
    },
    {
      key: 'template2',
      label: '模板2：保守配置（K=1.0，多级去极值）',
    },
    {
      key: 'template3',
      label: '模板3：严格配置（去2高2低，多区间）',
    },
    {
      key: 'template4',
      label: '模板4：宽松配置（K=0.92，简单规则）',
    },
  ];

  // 解析投标单位文本
  const parseBidders = (text: string): Bidder[] => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const bidders: Bidder[] = [];
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const name = parts.slice(0, -1).join(' ');
        const price = parseFloat(parts[parts.length - 1]);
        if (!isNaN(price) && name) {
          bidders.push({ name, price });
        }
      }
    }
    
    return bidders;
  };

  // 计算评分
  const handleCalculate = async () => {
    try {
      const config = await form.validateFields();
      const bidders = parseBidders(biddersText);
      
      if (bidders.length === 0) {
        message.error('请至少输入一个投标单位');
        return;
      }

      setLoading(true);
      const response = await axios.post<CalculationResult>('/calculate', {
        config,
        bidders,
      });
      
      setResult(response.data);
      message.success('计算完成');
    } catch (error: any) {
      if (error.response) {
        message.error(`计算失败: ${error.response.data?.detail || error.message}`);
      } else if (error.errorFields) {
        message.error('请检查表单配置');
      } else {
        message.error(`计算失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 结果表格列
  const resultColumns: ColumnsType<BidderResult> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      align: 'center',
    },
    {
      title: '单位名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '报价（元）',
      dataIndex: 'price',
      key: 'price',
      width: 150,
      align: 'right',
      render: (value: number) => value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      title: '偏离度（%）',
      dataIndex: 'deviation',
      key: 'deviation',
      width: 120,
      align: 'right',
      render: (value: number) => {
        const color = value > 0 ? '#ff4d4f' : value < 0 ? '#52c41a' : '#1890ff';
        return <Text style={{ color }}>{value > 0 ? '+' : ''}{value.toFixed(2)}%</Text>;
      },
    },
    {
      title: '最终得分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          {value.toFixed(2)}
        </Text>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          工程招标报价评分系统
        </Title>
      </Header>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <Layout style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
          {/* 左栏：规则配置 */}
          <Layout.Sider width={500} style={{ background: '#fff', padding: '24px', borderRight: '1px solid #f0f0f0' }}>
            <Title level={4}>规则配置</Title>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                k_factor: 0.95,
                base_score: 100,
                outlier_rules: [{ min_count: 5, remove_high: 1, remove_low: 1 }],
                high_price_factor: 0.5,
                low_price_rules: [
                  { min_dev: 0, max_dev: 5, type: 'add', factor: 0.3 },
                ],
              }}
            >
              <Form.Item label="基础参数">
                <Space>
                  <Form.Item
                    name="base_score"
                    label="基准分"
                    style={{ marginBottom: 0 }}
                    rules={[{ required: true, message: '请输入基准分' }]}
                  >
                    <InputNumber min={0} max={1000} precision={2} style={{ width: 120 }} />
                  </Form.Item>
                  <Form.Item
                    name="k_factor"
                    label="K值"
                    style={{ marginBottom: 0 }}
                    rules={[{ required: true, message: '请输入K值' }]}
                  >
                    <InputNumber min={0} max={2} step={0.01} precision={2} style={{ width: 120 }} />
                  </Form.Item>
                </Space>
              </Form.Item>

              <Divider orientation="left">去极值规则</Divider>
              <Form.List name="outlier_rules">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <div key={field.key} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                        <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
                          <div>
                            <Text>当 &gt; </Text>
                            <Form.Item
                              {...field}
                              name={[field.name, 'min_count']}
                              style={{ display: 'inline-block', margin: '0 8px', width: 80 }}
                              rules={[{ required: true, message: '必填' }]}
                            >
                              <InputNumber min={0} precision={0} placeholder="数量" />
                            </Form.Item>
                            <Text> 家时，去 </Text>
                            <Form.Item
                              {...field}
                              name={[field.name, 'remove_high']}
                              style={{ display: 'inline-block', margin: '0 8px', width: 80 }}
                              rules={[{ required: true, message: '必填' }]}
                            >
                              <InputNumber min={0} precision={0} placeholder="高" />
                            </Form.Item>
                            <Text> 高 </Text>
                            <Form.Item
                              {...field}
                              name={[field.name, 'remove_low']}
                              style={{ display: 'inline-block', margin: '0 8px', width: 80 }}
                              rules={[{ required: true, message: '必填' }]}
                            >
                              <InputNumber min={0} precision={0} placeholder="低" />
                            </Form.Item>
                            <Text> 低</Text>
                          </div>
                          {fields.length > 1 && (
                            <Button type="link" danger onClick={() => remove(field.name)}>
                              删除
                            </Button>
                          )}
                        </Space>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block>
                      + 添加去极值规则
                    </Button>
                  </>
                )}
              </Form.List>

              <Divider orientation="left">高价扣分系数</Divider>
              <Form.Item
                name="high_price_factor"
                rules={[{ required: true, message: '请输入高价扣分系数' }]}
              >
                <InputNumber min={0} step={0.1} precision={2} style={{ width: '100%' }} />
              </Form.Item>

              <Divider orientation="left">低价区间规则</Divider>
              <Form.List name="low_price_rules">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <div key={field.key} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Space align="baseline">
                            <Text>偏离 </Text>
                            <Form.Item
                              {...field}
                              name={[field.name, 'min_dev']}
                              style={{ display: 'inline-block', margin: 0, width: 100 }}
                              rules={[{ required: true, message: '必填' }]}
                            >
                              <InputNumber min={0} step={0.1} precision={1} placeholder="最小%" />
                            </Form.Item>
                            <Text>% ~ </Text>
                            <Form.Item
                              {...field}
                              name={[field.name, 'max_dev']}
                              style={{ display: 'inline-block', margin: 0, width: 100 }}
                              rules={[{ required: true, message: '必填' }]}
                            >
                              <InputNumber min={0} step={0.1} precision={1} placeholder="最大%" />
                            </Form.Item>
                            <Text>%，</Text>
                            <Form.Item
                              {...field}
                              name={[field.name, 'type']}
                              style={{ display: 'inline-block', margin: 0, width: 100 }}
                              rules={[{ required: true, message: '必填' }]}
                            >
                              <Select>
                                <Select.Option value="add">加分</Select.Option>
                                <Select.Option value="deduct">扣分</Select.Option>
                              </Select>
                            </Form.Item>
                            <Text>，系数 </Text>
                            <Form.Item
                              {...field}
                              name={[field.name, 'factor']}
                              style={{ display: 'inline-block', margin: 0, width: 100 }}
                              rules={[{ required: true, message: '必填' }]}
                            >
                              <InputNumber min={0} step={0.1} precision={2} placeholder="系数" />
                            </Form.Item>
                            {fields.length > 1 && (
                              <Button type="link" danger onClick={() => remove(field.name)}>
                                删除
                              </Button>
                            )}
                          </Space>
                        </Space>
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} block>
                      + 添加低价区间规则
                    </Button>
                  </>
                )}
              </Form.List>

              <Divider />
              <Space>
                <Dropdown menu={{ items: templateMenuItems, onClick: ({ key }) => loadTemplate(key) }}>
                  <Button>加载模板</Button>
                </Dropdown>
              </Space>
            </Form>
          </Layout.Sider>

          {/* 右栏：数据录入与结果 */}
          <Layout.Content style={{ padding: '24px' }}>
            <Title level={4}>数据录入与结果</Title>
            
            <Card title="投标单位录入" style={{ marginBottom: 24 }}>
              <TextArea
                rows={8}
                placeholder="请输入投标单位信息，每行一个，格式：单位名称 报价&#10;例如：&#10;公司A 1000000&#10;公司B 950000&#10;公司C 1100000"
                value={biddersText}
                onChange={(e) => setBiddersText(e.target.value)}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  提示：支持从Excel复制粘贴，格式为"单位名称 报价"，每行一个
                </Text>
              </div>
            </Card>

            <Space style={{ marginBottom: 24 }}>
              <Button type="primary" size="large" onClick={handleCalculate} loading={loading}>
                计算评分
              </Button>
              {result && (
                <Text strong>
                  基准价：<Text style={{ color: '#1890ff', fontSize: 18 }}>
                    ¥{result.benchmark_price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </Text>
              )}
            </Space>

            {result && (
              <Card title="计算结果">
                <Table
                  columns={resultColumns}
                  dataSource={result.results}
                  rowKey="name"
                  pagination={false}
                  size="middle"
                />
              </Card>
            )}
          </Layout.Content>
        </Layout>
      </Content>
    </Layout>
  );
};

export default App;

