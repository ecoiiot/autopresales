import React from 'react';
import { Form, InputNumber, Select, Space, Divider, Typography, Button, Row, Col, Tooltip } from 'antd';
import type { FormInstance } from 'antd';
import type { ScoringConfig } from '../types';

const { Text } = Typography;

interface RuleConfigProps {
  form: FormInstance<ScoringConfig>;
}

const RuleConfig: React.FC<RuleConfigProps> = ({ form }) => {
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

  const handleKFactorChange = (value: number | null) => {
    if (value !== null && (value < 0 || value > 1)) {
      // 轻度提示：超出范围时给出提示
      if (value < 0) {
        form.setFieldValue('k_factor', 0);
      } else if (value > 1) {
        form.setFieldValue('k_factor', 1);
      }
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        k_factor: 0.95,
        base_score: 100,
        outlier_rules: [{ min_count: 5, remove_high: 1, remove_low: 1 }],
        high_price_rules: [],
        low_price_rules: [
          { min_dev: 0, max_dev: 5, type: 'add', factor: 0.3 },
        ],
        min_score: 0,
        max_score: 100,
      }}
    >

      <Divider orientation="left">一、基础参数</Divider>
      <Form.Item>
        <Row gutter={16}>
          <Col span={12}>
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
          <Col span={12}>
            <Tooltip title="K值范围：0-1">
              <Form.Item
                name="k_factor"
                label="K值"
                style={{ marginBottom: 0 }}
                rules={[
                  { required: true, message: '请输入K值' },
                  { type: 'number', min: 0, max: 1, message: 'K值范围：0-1' },
                ]}
              >
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  onChange={handleKFactorChange}
                  placeholder="0-1"
                />
              </Form.Item>
            </Tooltip>
          </Col>
        </Row>
      </Form.Item>

      <Divider orientation="left">二、去极值规则</Divider>
      <Form.List name="outlier_rules">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <div key={field.key} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
                  <div>
                    <Text>当投标单位 &gt;= </Text>
                    <Form.Item
                      {...field}
                      name={[field.name, 'min_count']}
                      style={{ display: 'inline-block', margin: '0 8px', width: 80 }}
                      rules={[{ required: true, message: '必填' }]}
                    >
                      <InputNumber min={0} precision={0} placeholder="最小" />
                    </Form.Item>
                    <Text> 家且 &lt; </Text>
                    <Form.Item
                      {...field}
                      name={[field.name, 'max_count']}
                      style={{ display: 'inline-block', margin: '0 8px', width: 80 }}
                    >
                      <InputNumber min={0} precision={0} placeholder="最大" />
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

      <Divider orientation="left">三、扣分规则</Divider>
      
      {/* 极值设置 */}
      <Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="min_score"
              label="扣分最小值"
              style={{ marginBottom: 0 }}
              rules={[
                { required: true, message: '请输入扣分最小值' },
                { type: 'number', min: 0, max: 100, message: '范围：0-100' },
              ]}
            >
              <InputNumber
                min={0}
                max={100}
                precision={2}
                style={{ width: '100%' }}
                placeholder="扣分最小值（默认0）"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="max_score"
              label="加分最大值"
              style={{ marginBottom: 0 }}
              rules={[
                { required: true, message: '请输入加分最大值' },
                { type: 'number', min: 0, max: 100, message: '范围：0-100' },
              ]}
            >
              <InputNumber
                min={0}
                max={100}
                precision={2}
                style={{ width: '100%' }}
                placeholder="加分最大值（默认100）"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form.Item>

      {/* 高价规则 */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ marginBottom: 8, display: 'block' }}>①高价规则（报价高于基准价）</Text>
        <Form.List name="high_price_rules">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <div key={field.key} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space align="baseline">
                      <Text>偏离 </Text>
                      <Form.Item
                        {...field}
                        name={[field.name, 'min_dev']}
                        style={{ display: 'inline-block', margin: 0, width: 100 }}
                        rules={[
                          { required: true, message: '必填' },
                          { type: 'number', min: 0, max: 100, message: '偏离度范围：0-100%' },
                        ]}
                      >
                        <InputNumber min={0} max={100} step={0.1} precision={1} placeholder="最小%" />
                      </Form.Item>
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
                        <InputNumber min={0} max={100} step={0.1} precision={1} placeholder="最大%" />
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
                + 添加高价规则
              </Button>
            </>
          )}
        </Form.List>
      </div>

      {/* 低价规则 */}
      <div>
        <Text strong style={{ marginBottom: 8, display: 'block' }}>②低价规则（报价低于基准价）</Text>
        <Form.List name="low_price_rules">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <div key={field.key} style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space align="baseline">
                      <Text>偏离 </Text>
                      <Form.Item
                        {...field}
                        name={[field.name, 'min_dev']}
                        style={{ display: 'inline-block', margin: 0, width: 100 }}
                        rules={[
                          { required: true, message: '必填' },
                          { type: 'number', min: 0, max: 100, message: '偏离度范围：0-100%' },
                        ]}
                      >
                        <InputNumber min={0} max={100} step={0.1} precision={1} placeholder="最小%" />
                      </Form.Item>
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
                        <InputNumber min={0} max={100} step={0.1} precision={1} placeholder="最大%" />
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
                + 添加低价规则
              </Button>
            </>
          )}
        </Form.List>
      </div>
    </Form>
  );
};

export default RuleConfig;

