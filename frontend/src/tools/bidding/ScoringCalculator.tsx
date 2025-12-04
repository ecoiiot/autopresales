import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Form, Typography, message, Button, Space, InputNumber, Select, Divider, Row, Col, Tooltip, Radio, Table, Input, Card, Dropdown, Modal } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd';
import type { ScoringConfig, Bidder, CalculationResult, BidderResult } from '../../types';
import ToolHeader from '../../components/ToolHeader';





// localStorage 键名
const STORAGE_KEY = 'calculator_data';

const { Text } = Typography;

// 预设模板
const templates: Record<string, ScoringConfig> = {
  template1: {
    k_factor: 1,
    base_score: 50,
    min_score: 0,
    max_score: 50,
    outlier_rules: [
      { min_count: 0, max_count: 6, remove_high: 0, remove_low: 0 },
      { min_count: 6, max_count: 20, remove_high: 1, remove_low: 1 },
    ],
    // 统一规则模式
    high_price_type: 'deduct',
    high_price_factor: 0.4,
    low_price_type: 'deduct',
    low_price_factor: 0.2,
    // 分段规则留空（统一规则模式下不使用）
    high_price_rules: [],
    low_price_rules: [],
  },
  template2: {
    k_factor: 0.95,
    base_score: 45,
    min_score: 0,
    max_score: 50,
    outlier_rules: [
      { min_count: 0, max_count: 5, remove_high: 0, remove_low: 0 },
      { min_count: 5, max_count: 20, remove_high: 1, remove_low: 1 },
    ],
    // 统一规则模式
    high_price_type: 'deduct',
    high_price_factor: 0.5,
    low_price_type: 'add',
    low_price_factor: 0.8,
    // 分段规则留空（统一规则模式下不使用）
    high_price_rules: [],
    low_price_rules: [],
  },
};

// ========== 内联组件开始 ==========

// TemplateSelector 组件
interface TemplateSelectorProps {
  templates: Record<string, ScoringConfig>;
  onSelect: (config: ScoringConfig) => void;
}

// RuleConfig 组件
interface RuleConfigProps {
  form: FormInstance<ScoringConfig>;
  onValuesChange?: () => void;
}

// DataEntry 组件
interface DataEntryProps {
  bidders: Bidder[];
  setBidders: React.Dispatch<React.SetStateAction<Bidder[]>>;
  onCalculate: () => void;
  loading: boolean;
  result: CalculationResult | null;
  form: FormInstance<ScoringConfig>;
}

// ExportRules 组件
interface ExportRulesProps {
  form: FormInstance<ScoringConfig>;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ templates, onSelect }) => {
  const templateMenuItems = [
    {
      key: 'template1',
      label: '模板1：白金配置（靶心，统一规则，K=1）',
    },
    {
      key: 'template2',
      label: '模板2：黄金配置（非靶心，统一规则，K=0.95）',
    },
  ];

  const handleSelect = ({ key }: { key: string }) => {
    const template = templates[key];
    if (template) {
      Modal.confirm({
        title: '确认加载模板',
        content: '加载模板将覆盖当前已录入的规则配置，是否继续？',
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          onSelect(template);
          message.success('模板加载成功');
        },
      });
    }
  };

  return (
    <Dropdown menu={{ items: templateMenuItems, onClick: handleSelect }}>
      <Button style={{ borderColor: '#52c41a', color: '#52c41a' }}>加载模板</Button>
    </Dropdown>
  );
};



const RuleConfig: React.FC<RuleConfigProps> = ({ form, onValuesChange }) => {
  const [ruleMode, setRuleMode] = useState<'monotonic' | 'stepped'>('monotonic');
  
  // 使用 Form.useWatch 监听字段值变化
  const highPriceFactor = Form.useWatch('high_price_factor', form);
  const lowPriceFactor = Form.useWatch('low_price_factor', form);
  
  // 初始化表单值（只在组件挂载时执行一次，延迟执行以确保 localStorage 数据已加载）
  useEffect(() => {
    // 延迟执行，确保 localStorage 数据已加载
    const timer = setTimeout(() => {
      const currentValues = form.getFieldsValue();
      
      // 只在字段不存在时才设置默认值
      const initialValues: Partial<ScoringConfig> = {};
      if (currentValues.k_factor === undefined || currentValues.k_factor === null) {
        initialValues.k_factor = 0.95;
      }
      if (currentValues.base_score === undefined || currentValues.base_score === null) {
        initialValues.base_score = 40;
      }
      if (!currentValues.outlier_rules || currentValues.outlier_rules.length === 0) {
        initialValues.outlier_rules = [{ min_count: 0, max_count: 5, remove_high: 0, remove_low: 0 }];
      }
      if (!currentValues.high_price_rules || currentValues.high_price_rules.length === 0) {
        initialValues.high_price_rules = [{ min_dev: 0, max_dev: 100, type: 'deduct', factor: 0.3 }];
      }
      if (!currentValues.low_price_rules || currentValues.low_price_rules.length === 0) {
        initialValues.low_price_rules = [{ min_dev: 0, max_dev: 5, type: 'add', factor: 0.3 }];
      }
      if (currentValues.min_score === undefined || currentValues.min_score === null) {
        initialValues.min_score = 30;
      }
      if (currentValues.max_score === undefined || currentValues.max_score === null) {
        initialValues.max_score = 50;
      }
      // 统一规则模式的默认值（只在字段不存在时设置）
      // 注意：不要覆盖用户已输入的值或从 localStorage 加载的值
      if (currentValues.high_price_type === undefined || currentValues.high_price_type === null) {
        initialValues.high_price_type = 'deduct';
      }
      // 重要：不要覆盖已存在的 high_price_factor 值
      if (currentValues.high_price_factor === undefined || currentValues.high_price_factor === null) {
        initialValues.high_price_factor = 0.3;
      }
      if (currentValues.low_price_type === undefined || currentValues.low_price_type === null) {
        initialValues.low_price_type = 'deduct';
      }
      // 重要：不要覆盖已存在的 low_price_factor 值
      if (currentValues.low_price_factor === undefined || currentValues.low_price_factor === null) {
        initialValues.low_price_factor = 0.3;
      }
      
      if (Object.keys(initialValues).length > 0) {
        form.setFieldsValue(initialValues);
      }
    }, 200); // 延迟 200ms，确保 localStorage 数据已加载
    
    return () => clearTimeout(timer);
  }, [form]);

  // 将数字转换为圆圈数字
  const getCircleNumber = (num: number): string => {
    if (num >= 1 && num <= 20) {
      // 圆圈数字 ①-⑳ (U+2460-U+2473)
      return String.fromCharCode(0x245f + num);
    }
    // 超过20的数字，返回原数字加括号
    return `${num}.`;
  };

  const handleBaseScoreChange = (value: number | null) => {
    if (value !== null && (value < 0 || value > 100)) {
      // 轻度提示：超出范围时给出提示
      if (value < 0) {
        form.setFieldValue('base_score', 0);
      } else if (value > 100) {
        form.setFieldValue('base_score', 100);
      }
    }
  };


  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onValuesChange}
    >

      <Divider orientation="left">一、基础参数</Divider>
      <Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Tooltip title="基准分为投标报价等于基准价时的得分，范围：0-100">
              <Form.Item
                name="base_score"
                label="基准分"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: '请输入基准分' },
                  { type: 'number', min: 0, max: 100, message: '基准分范围：0-100' },
                ]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  style={{ width: '100%' }}
                  onChange={handleBaseScoreChange}
                  placeholder="0-100"
                />
              </Form.Item>
            </Tooltip>
          </Col>
          <Col span={8}>
            <Form.Item
              name="min_score"
              label="报价最低分"
              style={{ marginBottom: 0 }}
              rules={[
                { required: true, message: '请输入最低分' },
                { type: 'number', min: 0, max: 100, message: '范围：0-100' },
              ]}
            >
              <InputNumber
                min={0}
                max={100}
                precision={2}
                style={{ width: '100%' }}
                placeholder="最低分（默认30）"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="max_score"
              label="报价最高分"
              style={{ marginBottom: 0 }}
              rules={[
                { required: true, message: '请输入最高分' },
                { type: 'number', min: 0, max: 100, message: '范围：0-100' },
              ]}
            >
              <InputNumber
                min={0}
                max={100}
                precision={2}
                style={{ width: '100%' }}
                placeholder="最高分（默认50）"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form.Item>
      
      {/* 隐藏的 K 值字段，用于表单验证，实际输入在 DataEntry 中 */}
      <Form.Item
        name="k_factor"
        hidden
        rules={[
          { required: true, message: '请输入K值' },
          { type: 'number', min: 0, max: 1, message: 'K值范围：0-1' },
        ]}
      >
        <InputNumber style={{ display: 'none' }} />
      </Form.Item>

      <Divider orientation="left">二、去极值规则</Divider>
      <Text>当投标方数量</Text>
      <Form.List name="outlier_rules">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field, index) => {
              const isFirstRow = index === 0;
              const prevFieldName = index > 0 ? fields[index - 1].name : null;
              
              return (
                <div key={field.key} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                  <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong style={{ marginRight: 2, minWidth: 12, display: 'inline-block' }}>
                        {getCircleNumber(index + 1)}
                      </Text>
                      <Text>&gt;= </Text>
                      {isFirstRow ? (
                        <Form.Item
                          {...field}
                          name={[field.name, 'min_count']}
                          style={{ display: 'inline-block', margin: '0 8px', width: 80 }}
                          rules={[{ required: true, message: '必填' }]}
                          initialValue={0}
                        >
                          <InputNumber 
                            min={0} 
                            precision={0} 
                            value={0}
                            disabled
                            style={{ width: 80 }}
                          />
                        </Form.Item>
                      ) : (
                        <Form.Item
                          {...field}
                          name={[field.name, 'min_count']}
                          style={{ display: 'inline-block', margin: '0 8px', width: 80 }}
                          rules={[
                            { required: true, message: '必填' },
                            {
                              validator: (_, value) => {
                                if (prevFieldName === null) {
                                  return Promise.resolve();
                                }
                                const prevMaxCount = form.getFieldValue(['outlier_rules', prevFieldName, 'max_count']) as number | null | undefined;
                                if (prevMaxCount !== null && prevMaxCount !== undefined && value !== prevMaxCount) {
                                  return Promise.reject(new Error(`必须等于上一行的最大值 ${prevMaxCount}`));
                                }
                                return Promise.resolve();
                              },
                            },
                          ]}
                          dependencies={prevFieldName !== null ? [['outlier_rules', prevFieldName, 'max_count']] : []}
                        >
                          <InputNumber 
                            min={0} 
                            precision={0} 
                            placeholder="最小"
                            style={{ width: 80 }}
                          />
                        </Form.Item>
                      )}
                      <Text> 且 &lt; </Text>
                      <Form.Item
                        {...field}
                        name={[field.name, 'max_count']}
                        style={{ display: 'inline-block', margin: '0 4px', width: 80 }}
                      >
                        <InputNumber 
                          min={0} 
                          precision={0} 
                          placeholder="最大"
                        />
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
                  {fields.length > 1 && index > 0 && (
                    <Button type="link" danger onClick={() => remove(field.name)}>
                      删除
                    </Button>
                  )}
                </Space>
              </div>
              );
            })}
            <Button type="dashed" onClick={() => add()} block>
              + 添加去极值规则
            </Button>
          </>
        )}
      </Form.List>

      <Divider orientation="left">三、扣分规则</Divider>
      
      {/* 规则模式选择 */}
      <Form.Item style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>规则模式：</Text>
          <Radio.Group
            value={ruleMode}
            onChange={(e) => {
              setRuleMode(e.target.value);
              // 切换模式时，清空规则数据
              if (e.target.value === 'monotonic') {
                // 切换到统一规则模式：清空分段规则，但保留统一规则的字段（如果不存在则设置默认值）
                const currentValues = form.getFieldsValue();
                // 只更新需要更新的字段，保留用户已输入的值
                const updates: any = {
                  high_price_rules: [],
                  low_price_rules: [],
                };
                // 如果字段不存在或为 undefined/null，才设置默认值
                if (currentValues.high_price_type === undefined || currentValues.high_price_type === null) {
                  updates.high_price_type = 'deduct';
                }
                if (currentValues.high_price_factor === undefined || currentValues.high_price_factor === null) {
                  updates.high_price_factor = 0.3;
                }
                if (currentValues.low_price_type === undefined || currentValues.low_price_type === null) {
                  updates.low_price_type = 'deduct';
                }
                if (currentValues.low_price_factor === undefined || currentValues.low_price_factor === null) {
                  updates.low_price_factor = 0.3;
                }
                form.setFieldsValue(updates);
              } else {
                // 切换到分段规则模式：清空统一规则字段，但保留分段规则
                form.setFieldsValue({
                  high_price_type: undefined,
                  high_price_factor: undefined,
                  low_price_type: undefined,
                  low_price_factor: undefined,
                });
              }
            }}
          >
            <Radio value="monotonic">统一规则</Radio>
            <Radio value="stepped">分段规则</Radio>
          </Radio.Group>
        </Space>
      </Form.Item>
      
      

      {/* 高价规则 */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ marginBottom: 8, display: 'block' }}>①高价规则（报价高于基准价）</Text>
        {ruleMode === 'monotonic' ? (
          // 统一规则：只显示加减分和系数
          <div style={{ padding: 12, background: '#fafafa', borderRadius: 4 }}>
            <Space align="baseline">
              <Text>加减分：</Text>
              <Form.Item
                name="high_price_type"
                style={{ display: 'inline-block', margin: 0, width: 100 }}
                rules={[{ required: true, message: '必填' }]}
              >
                <Select placeholder="请选择">
                  <Select.Option value="add">加分</Select.Option>
                  <Select.Option value="deduct">扣分</Select.Option>
                </Select>
              </Form.Item>
              <Text>，系数：</Text>
              <Form.Item
                name="high_price_factor"
                style={{ display: 'inline-block', margin: 0, width: 100 }}
                rules={[{ required: true, message: '必填' }]}
              >
                <Tooltip title="系数指价格偏离1%，扣/加的分数，例如，价格偏离1%扣分0.3分">
                  <InputNumber 
                    min={0} 
                    step={0.1} 
                    precision={2} 
                    placeholder="0.3" 
                    style={{ width: '100%' }}
                    value={highPriceFactor}
                    onChange={(value) => {
                      if (value !== null && value !== undefined) {
                        form.setFieldValue('high_price_factor', value);
                        form.validateFields(['high_price_factor']).catch(() => {});
                      } else {
                        form.setFieldValue('high_price_factor', 0.3);
                      }
                    }}
                  />
                </Tooltip>
              </Form.Item>
            </Space>
          </div>
        ) : (
          // 分段规则：保持原有结构
          <Form.List name="high_price_rules">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => {
                  const isFirstRow = index === 0;
                  const prevFieldName = index > 0 ? fields[index - 1].name : null;
                  
                  return (
                    <div key={field.key} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space align="baseline">
                          <Text>偏离 </Text>
                          {isFirstRow ? (
                            <Form.Item
                              {...field}
                              name={[field.name, 'min_dev']}
                              style={{ display: 'inline-block', margin: 0, width: 100 }}
                              rules={[
                                { required: true, message: '必填' },
                                { type: 'number', min: 0, max: 100, message: '偏离度范围：0-100%' },
                              ]}
                              initialValue={0}
                            >
                              <InputNumber 
                                min={0} 
                                max={100} 
                                step={0.1} 
                                precision={1} 
                                disabled
                                style={{ width: 100 }}
                              />
                            </Form.Item>
                          ) : (
                            <Form.Item
                              {...field}
                              name={[field.name, 'min_dev']}
                              style={{ display: 'inline-block', margin: 0, width: 100 }}
                              rules={[
                                { required: true, message: '必填' },
                                { type: 'number', min: 0, max: 100, message: '偏离度范围：0-100%' },
                                {
                                  validator: (_, value) => {
                                    if (prevFieldName === null) {
                                      return Promise.resolve();
                                    }
                                    const prevMaxDev = form.getFieldValue(['high_price_rules', prevFieldName, 'max_dev']) as number | null | undefined;
                                    if (prevMaxDev !== null && prevMaxDev !== undefined && value !== prevMaxDev) {
                                      return Promise.reject(new Error(`必须等于上一行的最大值 ${prevMaxDev}%`));
                                    }
                                    return Promise.resolve();
                                  },
                                },
                              ]}
                              dependencies={prevFieldName !== null ? [['high_price_rules', prevFieldName, 'max_dev']] : []}
                            >
                              <InputNumber 
                                min={0} 
                                max={100} 
                                step={0.1} 
                                precision={1} 
                                placeholder="最小%"
                                style={{ width: 100 }}
                              />
                            </Form.Item>
                          )}
                        <Text>% ~ </Text>
                        <Form.Item
                          {...field}
                          name={[field.name, 'max_dev']}
                          style={{ display: 'inline-block', margin: 0, width: 100 }}
                          rules={[
                            { required: true, message: '必填' },
                            { type: 'number', min: 0, max: 100, message: '偏离度范围：0-100%' },
                          ]}
                        >
                          <InputNumber 
                            min={0} 
                            max={100} 
                            step={0.1} 
                            precision={1} 
                            placeholder="最大%"
                          />
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
                          <Tooltip title="系数指价格偏离1%，扣/加的分数，例如，价格偏离1%扣分0.3分">
                            <InputNumber 
                              min={0} 
                              step={0.1} 
                              precision={2} 
                              placeholder="0.3"
                              onChange={(value) => {
                                if (value !== null && value !== undefined) {
                                  form.setFieldValue(['high_price_rules', field.name, 'factor'], value);
                                  form.validateFields([['high_price_rules', field.name, 'factor']]).catch(() => {});
                                } else {
                                  form.setFieldValue(['high_price_rules', field.name, 'factor'], 0.3);
                                }
                              }}
                            />
                          </Tooltip>
                        </Form.Item>
                        {fields.length > 1 && (
                          <Button type="link" danger onClick={() => remove(field.name)}>
                            删除
                          </Button>
                        )}
                      </Space>
                    </Space>
                  </div>
                  );
                })}
                <Button type="dashed" onClick={() => add()} block>
                  + 添加高价规则
                </Button>
              </>
            )}
          </Form.List>
        )}
      </div>

      {/* 低价规则 */}
      <div>
        <Text strong style={{ marginBottom: 8, display: 'block' }}>②低价规则（报价低于基准价）</Text>
        {ruleMode === 'monotonic' ? (
          // 统一规则：只显示加减分和系数
          <div style={{ padding: 12, background: '#fafafa', borderRadius: 4 }}>
            <Space align="baseline">
              <Text>加减分：</Text>
              <Form.Item
                name="low_price_type"
                style={{ display: 'inline-block', margin: 0, width: 100 }}
                rules={[{ required: true, message: '必填' }]}
              >
                <Select placeholder="请选择">
                  <Select.Option value="add">加分</Select.Option>
                  <Select.Option value="deduct">扣分</Select.Option>
                </Select>
              </Form.Item>
              <Text>，系数：</Text>
              <Form.Item
                name="low_price_factor"
                style={{ display: 'inline-block', margin: 0, width: 100 }}
                rules={[{ required: true, message: '必填' }]}
              >
                <Tooltip title="系数指价格偏离1%，扣/加的分数，例如，价格偏离1%扣分0.3分">
                  <InputNumber 
                    min={0} 
                    step={0.1} 
                    precision={2} 
                    placeholder="0.3" 
                    style={{ width: '100%' }}
                    value={lowPriceFactor}
                    onChange={(value) => {
                      if (value !== null && value !== undefined) {
                        form.setFieldValue('low_price_factor', value);
                        form.validateFields(['low_price_factor']).catch(() => {});
                      } else {
                        form.setFieldValue('low_price_factor', 0.3);
                      }
                    }}
                  />
                </Tooltip>
              </Form.Item>
            </Space>
          </div>
        ) : (
          // 分段规则：保持原有结构
          <Form.List name="low_price_rules">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => {
                  const isFirstRow = index === 0;
                  const prevFieldName = index > 0 ? fields[index - 1].name : null;
                  
                  return (
                    <div key={field.key} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space align="baseline">
                          <Text>偏离 </Text>
                          {isFirstRow ? (
                            <Form.Item
                              {...field}
                              name={[field.name, 'min_dev']}
                              style={{ display: 'inline-block', margin: 0, width: 100 }}
                              rules={[
                                { required: true, message: '必填' },
                                { type: 'number', min: 0, max: 100, message: '偏离度范围：0-100%' },
                              ]}
                              initialValue={0}
                            >
                              <InputNumber 
                                min={0} 
                                max={100} 
                                step={0.1} 
                                precision={1} 
                                disabled
                                style={{ width: 100 }}
                              />
                            </Form.Item>
                          ) : (
                            <Form.Item
                              {...field}
                              name={[field.name, 'min_dev']}
                              style={{ display: 'inline-block', margin: 0, width: 100 }}
                              rules={[
                                { required: true, message: '必填' },
                                { type: 'number', min: 0, max: 100, message: '偏离度范围：0-100%' },
                                {
                                  validator: (_, value) => {
                                    if (prevFieldName === null) {
                                      return Promise.resolve();
                                    }
                                    const prevMaxDev = form.getFieldValue(['low_price_rules', prevFieldName, 'max_dev']) as number | null | undefined;
                                    if (prevMaxDev !== null && prevMaxDev !== undefined && value !== prevMaxDev) {
                                      return Promise.reject(new Error(`必须等于上一行的最大值 ${prevMaxDev}%`));
                                    }
                                    return Promise.resolve();
                                  },
                                },
                              ]}
                              dependencies={prevFieldName !== null ? [['low_price_rules', prevFieldName, 'max_dev']] : []}
                            >
                              <InputNumber 
                                min={0} 
                                max={100} 
                                step={0.1} 
                                precision={1} 
                                placeholder="最小%"
                                style={{ width: 100 }}
                              />
                            </Form.Item>
                          )}
                        <Text>% ~ </Text>
                        <Form.Item
                          {...field}
                          name={[field.name, 'max_dev']}
                          style={{ display: 'inline-block', margin: 0, width: 100 }}
                          rules={[
                            { required: true, message: '必填' },
                            { type: 'number', min: 0, max: 100, message: '偏离度范围：0-100%' },
                          ]}
                        >
                          <InputNumber 
                            min={0} 
                            max={100} 
                            step={0.1} 
                            precision={1} 
                            placeholder="最大%"
                          />
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
                          <Tooltip title="系数指价格偏离1%，扣/加的分数，例如，价格偏离1%扣分0.3分">
                            <InputNumber 
                              min={0} 
                              step={0.1} 
                              precision={2} 
                              placeholder="0.3"
                              onChange={(value) => {
                                if (value !== null && value !== undefined) {
                                  form.setFieldValue(['low_price_rules', field.name, 'factor'], value);
                                  form.validateFields([['low_price_rules', field.name, 'factor']]).catch(() => {});
                                } else {
                                  form.setFieldValue(['low_price_rules', field.name, 'factor'], 0.3);
                                }
                              }}
                            />
                          </Tooltip>
                        </Form.Item>
                        {fields.length > 1 && (
                          <Button type="link" danger onClick={() => remove(field.name)}>
                            删除
                          </Button>
                        )}
                      </Space>
                    </Space>
                  </div>
                  );
                })}
                <Button type="dashed" onClick={() => add()} block>
                  + 添加低价规则
                </Button>
              </>
            )}
          </Form.List>
        )}
      </div>
    </Form>
  );
};



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
    return result.results.find((r: BidderResult) => r.name === name);
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
      {/* 一行：标题、按钮等 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>价格录入与计算</Typography.Title>
        <Space>
          <Button 
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认清理缓存',
                content: '如果确定数据会丢失，是否继续？',
                okText: '确认',
                cancelText: '取消',
                onOk: () => {
                  localStorage.removeItem(STORAGE_KEY);
                  message.success('缓存已清理，页面将刷新');
                  setTimeout(() => {
                    window.location.reload();
                  }, 500);
                },
              });
            }}
          >
            清理缓存
          </Button>
          <Button type="primary" onClick={onCalculate} loading={loading}>
            计算评分
          </Button>
        </Space>
      </div>
      <Card
        extra={
          <Space>
            <Text strong>
              基准价：
              <Text style={{ color: '#1890ff', fontSize: 16 }}>
                ¥{result ? result.benchmark_price.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </Text>
            </Text>
            <Space>
              <Text strong>=有效投标价均值*系数K</Text>
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
            <span style={{ color: '#d9d9d9', margin: '0 8px' }}>|</span>
            <Text strong>
              单位总数：<Text style={{ color: '#1890ff', fontSize: 16 }}>{bidders.length}</Text>
            </Text>
            <Button 
              onClick={handleAddRow}
              style={{ borderColor: '#52c41a', color: '#52c41a' }}
            >
              新增单位
            </Button>
          </Space>
        }
      >
        <Table
          columns={bidderColumns}
          dataSource={bidders.map((bidder: Bidder, index: number) => ({ ...bidder, key: index.toString() }))}
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



const ExportRules: React.FC<ExportRulesProps> = ({ form }) => {
  // 导出规则为 Word 文档
  const handleExportRules = async () => {
    try {
      const config = form.getFieldsValue();
      
      // 生成评标基准价规则文本
      const generateBenchmarkRules = (): string[] => {
        const rules: string[] = [];
        const outlierRules = config.outlier_rules || [];
        const kFactor = config.k_factor || 0.95;
        
        if (outlierRules.length === 0) {
          const kText = kFactor !== 1 ? `乘以${kFactor}` : '';
          rules.push(`(1) 取所有有效投标报价的算术平均值${kText}作为评标基准价。`);
          return rules;
        }
        
        outlierRules.forEach((rule: any, index: number) => {
          const minCount = rule.min_count || 0;
          const maxCount = rule.max_count;
          const removeHigh = rule.remove_high || 0;
          const removeLow = rule.remove_low || 0;
          
          let condition = '';
          if (maxCount !== undefined && maxCount !== null) {
            condition = `当有效投标人数量≥${minCount}家且<${maxCount}家时`;
          } else {
            condition = `当有效投标人数量≥${minCount}家时`;
          }
          
          let action = '';
          if (removeHigh > 0 && removeLow > 0) {
            action = `扣除${removeHigh}个最高有效投标报价和${removeLow}个最低有效投标报价`;
          } else if (removeHigh > 0) {
            action = `扣除${removeHigh}个最高有效投标报价`;
          } else if (removeLow > 0) {
            action = `扣除${removeLow}个最低有效投标报价`;
          } else {
            action = '不扣除任何报价';
          }
          
          const kText = kFactor !== 1 ? `乘以${kFactor}` : '';
          rules.push(`(${index + 1}) ${condition}，${action}，取其余有效投标报价的算术平均值${kText}作为评标基准价。`);
        });
        
        // 检查是否需要添加默认规则
        // 只有当第一条规则的 min_count > 0 时，才需要添加 <min_count 的默认规则
        // 如果第一条规则从 >=0 开始，说明已经覆盖了所有情况，不需要添加默认规则
        const firstRule = outlierRules[0];
        
        if (firstRule && firstRule.min_count > 0) {
          // 第一条规则不是从0开始，需要添加 <min_count 的默认规则
          const defaultKText = kFactor !== 1 ? `乘以${kFactor}` : '';
          rules.push(`(${outlierRules.length + 1}) 当有效投标人数量<${firstRule.min_count}家时，取所有有效投标报价的算术平均值${defaultKText}作为评标基准价。`);
        }
        
        return rules;
      };
      
      // 生成投标报价得分规则文本
      const generateScoringRules = (): string[] => {
        const rules: string[] = [];
        const baseScore = config.base_score || 40;
        const minScore = config.min_score || 0;
        const maxScore = config.max_score || 100;
        
        // 判断是统一规则还是分段规则
        const isMonotonic = config.high_price_type && config.high_price_factor !== undefined;
        
        if (isMonotonic) {
          // 统一规则模式
          const highType = config.high_price_type;
          const highFactor = config.high_price_factor || 0.3;
          const lowType = config.low_price_type;
          const lowFactor = config.low_price_factor || 0.3;
          
          // 根据规则类型确定公式
          if (highType === 'deduct' && lowType === 'deduct') {
            // 都是扣分
            rules.push(`Fi=${baseScore}-（Di-D）/D×100×E，式中：`);
            rules.push(`Fi=价格得分`);
            rules.push(`Di=有效投标人的投标价；`);
            rules.push(`D=评标基准价。`);
            rules.push(`当Di>D时E=${highFactor}；当Di<D时E=${lowFactor}。`);
          } else if (highType === 'deduct' && lowType === 'add') {
            // 高价扣分，低价加分
            rules.push(`Fi=${baseScore}-（Di-D）/D×100×E，式中：`);
            rules.push(`Fi=价格得分`);
            rules.push(`Di=有效投标人的投标价；`);
            rules.push(`D=评标基准价。`);
            rules.push(`当Di>D时E=${highFactor}（扣分）；当Di<D时E=${lowFactor}（加分）。`);
          } else if (highType === 'add' && lowType === 'deduct') {
            // 高价加分，低价扣分
            rules.push(`Fi=${baseScore}+（Di-D）/D×100×E，式中：`);
            rules.push(`Fi=价格得分`);
            rules.push(`Di=有效投标人的投标价；`);
            rules.push(`D=评标基准价。`);
            rules.push(`当Di>D时E=${highFactor}（加分）；当Di<D时E=${lowFactor}（扣分）。`);
          } else {
            // 都是加分
            rules.push(`Fi=${baseScore}+（Di-D）/D×100×E，式中：`);
            rules.push(`Fi=价格得分`);
            rules.push(`Di=有效投标人的投标价；`);
            rules.push(`D=评标基准价。`);
            rules.push(`当Di>D时E=${highFactor}；当Di<D时E=${lowFactor}。`);
          }
        } else {
          // 分段规则模式
          const highRules = config.high_price_rules || [];
          const lowRules = config.low_price_rules || [];
          
          rules.push(`Fi=${baseScore}±（Di-D）/D×100×E，式中：`);
          rules.push(`Fi=价格得分`);
          rules.push(`Di=有效投标人的投标价；`);
          rules.push(`D=评标基准价。`);
          
          if (highRules.length > 0) {
            rules.push(`当Di>D时：`);
            highRules.forEach((rule: any) => {
              const minDev = rule.min_dev || 0;
              const maxDev = rule.max_dev || 100;
              const type = rule.type === 'deduct' ? '扣分' : '加分';
              const factor = rule.factor || 0.3;
              
              if (maxDev === 100) {
                rules.push(`  偏离${minDev}%以上时，E=${factor}（${type}）；`);
              } else {
                rules.push(`  偏离${minDev}%-${maxDev}%时，E=${factor}（${type}）；`);
              }
            });
          }
          
          if (lowRules.length > 0) {
            rules.push(`当Di<D时：`);
            lowRules.forEach((rule: any) => {
              const minDev = rule.min_dev || 0;
              const maxDev = rule.max_dev || 100;
              const type = rule.type === 'deduct' ? '扣分' : '加分';
              const factor = rule.factor || 0.3;
              
              if (maxDev === 100) {
                rules.push(`  偏离${minDev}%以上时，E=${factor}（${type}）；`);
              } else {
                rules.push(`  偏离${minDev}%-${maxDev}%时，E=${factor}（${type}）；`);
              }
            });
          }
        }
        
        // 添加分数限制说明
        if (minScore > 0 || maxScore < 100) {
          rules.push(`最终得分限制在${minScore}分到${maxScore}分之间。`);
        }
        
        return rules;
      };
      
      // 构建 Word 文档内容
      const benchmarkRules = generateBenchmarkRules();
      const scoringRules = generateScoringRules();
      
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: "评标规则",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: "1. 评标基准价：",
                heading: HeadingLevel.HEADING_2,
              }),
              ...benchmarkRules.map(rule => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: rule,
                      font: "宋体",
                      size: 22, // 11pt
                    }),
                  ],
                })
              ),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: "2. 投标报价得分：",
                heading: HeadingLevel.HEADING_2,
              }),
              ...scoringRules.map(rule => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: rule,
                      font: "宋体",
                      size: 22, // 11pt
                    }),
                  ],
                })
              ),
            ],
          },
        ],
      });
      
      // 生成并下载文档
      const blob = await Packer.toBlob(doc);
      // 生成文件名：工具名称+导出时间（精确到分钟）
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const fileName = `报价评分计算器_${year}-${month}-${day} ${hours}:${minutes}.docx`;
      saveAs(blob, fileName);
      
      message.success('规则导出成功');
    } catch (error) {
      message.error('导出规则失败');
    }
  };

  return (
    <Button
      type="primary"
      icon={<ExportOutlined />}
      onClick={handleExportRules}
      style={{
        background: '#1890ff',
        borderColor: '#1890ff',
        color: '#fff',
      }}
    >
      导出规则
    </Button>
  );
};



// ========== 内联组件结束 ==========

const Calculator: React.FC = () => {
  const [form] = Form.useForm<ScoringConfig>();
  // 初始数据：五条示例投标单位
  const initialBidders: Bidder[] = [
    { name: '投标单位A', price: 425 },
    { name: '投标单位B', price: 500 },
    { name: '投标单位C', price: 400 },
    { name: '投标单位D', price: 400 },
    { name: '投标单位E', price: 400 },
  ];
  const [bidders, setBidders] = useState<Bidder[]>(initialBidders);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50); // 左侧宽度百分比

  // 从 localStorage 加载数据
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        
        // 恢复规则配置
        if (data.config) {
          form.setFieldsValue(data.config);
        }
        
        // 恢复投标单位数据（如果 localStorage 中有数据，优先使用；否则使用初始数据）
        if (data.bidders && Array.isArray(data.bidders) && data.bidders.length > 0) {
          setBidders(data.bidders);
        } else {
          // 如果没有保存的数据，使用初始数据
          setBidders(initialBidders);
        }
        
        // 恢复计算结果（可选）
        if (data.result) {
          setResult(data.result);
        }
        
        // 恢复左侧宽度
        if (data.leftWidth !== undefined) {
          setLeftWidth(data.leftWidth);
        }
      } else {
        // 如果没有 localStorage 数据，使用初始数据
        setBidders(initialBidders);
      }
    } catch (error) {
      // 出错时也使用初始数据
      setBidders(initialBidders);
    }
  }, [form]);

  // 保存数据的函数（使用防抖）
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveData = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      try {
        const config = form.getFieldsValue();
        const dataToSave = {
          config,
          bidders,
          result: result || null,
          leftWidth,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        // 保存失败时静默处理
      }
    }, 300);
  }, [form, bidders, result, leftWidth]);

  // 保存数据到 localStorage
  useEffect(() => {
    saveData();
  }, [saveData]);

  // 加载模板
  const handleTemplateSelect = (config: ScoringConfig) => {
    form.setFieldsValue(config);
  };

  // 计算评分
  const handleCalculate = async () => {
    try {
      // 先验证表单
      await form.validateFields();
      // 然后获取最新的表单值（确保获取到用户输入的最新值）
      const config = form.getFieldsValue();
      
      if (bidders.length === 0) {
        message.error('请至少输入一个投标单位');
        return;
      }

      // 验证所有投标单位都有名称和价格
      const invalidBidders = bidders.filter(b => !b.name || !b.price || b.price <= 0);
      if (invalidBidders.length > 0) {
        message.error('请确保所有投标单位都有有效的名称和报价');
        return;
      }

      // 处理单调式规则：将单个规则转换为数组格式
      const processedConfig = { ...config };
      
      // 判断是否为统一规则模式：如果存在 high_price_type 和 high_price_factor，说明是统一规则模式
      const isMonotonicMode = config.high_price_type !== undefined && config.high_price_factor !== undefined && config.high_price_factor !== null;
      
      if (isMonotonicMode) {
        // 统一规则模式：使用 high_price_type 和 high_price_factor
        // 高价规则：使用统一规则的系数
        if (config.high_price_type && config.high_price_factor !== undefined && config.high_price_factor !== null) {
          processedConfig.high_price_rules = [{
            min_dev: 0,
            max_dev: 100,
            type: config.high_price_type,
            factor: config.high_price_factor,
          }];
        }
        
        // 低价规则：使用统一规则的系数
        if (config.low_price_type && config.low_price_factor !== undefined && config.low_price_factor !== null) {
          processedConfig.low_price_rules = [{
            min_dev: 0,
            max_dev: 100,
            type: config.low_price_type,
            factor: config.low_price_factor,
          }];
        }
        
        // 删除临时字段
        delete processedConfig.high_price_type;
        delete processedConfig.high_price_factor;
        delete processedConfig.low_price_type;
        delete processedConfig.low_price_factor;
      } else {
        // 分段规则模式：使用 high_price_rules 和 low_price_rules
        // 删除临时字段（如果存在）
        delete processedConfig.high_price_type;
        delete processedConfig.high_price_factor;
        delete processedConfig.low_price_type;
        delete processedConfig.low_price_factor;
      }

      const requestData = {
        config: processedConfig,
        bidders,
      };

      setLoading(true);
      // 使用新的工具 API 路径，同时保持向后兼容
      const response = await axios.post<CalculationResult>('/api/tools/bidding/scoring/calculate', requestData);
      
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

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <ToolHeader />
      
      {/* Body: 左右两栏布局 */}
      <Layout.Content style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', background: '#f0f2f5' }}>
        {/* 左侧：规则配置 */}
        <div
          style={{
            width: `${leftWidth}%`,
            background: '#fff',
            padding: '24px',
            overflow: 'auto',
            borderRight: '1px solid #f0f0f0',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>规则配置</Typography.Title>
            <Space>
              <TemplateSelector templates={templates} onSelect={handleTemplateSelect} />
              <ExportRules form={form} />
            </Space>
          </div>
          <RuleConfig 
            form={form}
            onValuesChange={saveData}
          />
        </div>

        {/* 拖拽分隔条 */}
        <div
          style={{
            width: '4px',
            background: '#f0f0f0',
            cursor: 'col-resize',
            position: 'relative',
            flexShrink: 0,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startLeftWidth = leftWidth;
            const containerWidth = window.innerWidth;

            const handleMouseMove = (moveEvent: MouseEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaPercent = (deltaX / containerWidth) * 100;
              const newLeftWidth = Math.max(20, Math.min(80, startLeftWidth + deltaPercent));
              setLeftWidth(newLeftWidth);
            };

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '2px',
              height: '40px',
              background: '#d9d9d9',
              borderRadius: '1px',
            }}
          />
        </div>

        {/* 右侧：数据录入 */}
        <div
          style={{
            width: `${100 - leftWidth}%`,
            background: '#fff',
            padding: '24px',
            overflow: 'auto',
          }}
        >
          <DataEntry
            bidders={bidders}
            setBidders={setBidders}
            onCalculate={handleCalculate}
            loading={loading}
            result={result}
            form={form}
          />
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default Calculator;
