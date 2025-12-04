import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Table, Space, Select, Statistic, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Header, Content } = Layout;
const { Title } = Typography;

interface ToolStats {
  tool_id: string;
  tool_name: string;
  access_count: number;
  last_access_time: string | null;
}

interface AccessRecord {
  id: number;
  tool_id: string;
  tool_name: string;
  access_time: string;
  ip_address: string | null;
  path: string | null;
}

interface Summary {
  total_access_count: number;
  today_access_count: number;
  tool_count: number;
  period_days: number;
}

const Admin: React.FC = () => {
  const [toolStats, setToolStats] = useState<ToolStats[]>([]);
  const [accessRecords, setAccessRecords] = useState<AccessRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(7);

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const [statsRes, summaryRes] = await Promise.all([
        axios.get(`/api/admin/stats/tools?days=${days}`),
        axios.get(`/api/admin/stats/summary?days=${days}`),
      ]);
      setToolStats(statsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      // 获取统计数据失败时静默处理
    } finally {
      setLoading(false);
    }
  };

  // 获取访问记录
  const fetchAccessRecords = async (toolId?: string) => {
    try {
      const params: any = { limit: 100 };
      if (toolId) {
        params.tool_id = toolId;
      }
      const response = await axios.get('/api/admin/stats/access', { params });
      setAccessRecords(response.data);
    } catch (error) {
      // 获取访问记录失败时静默处理
    }
  };

  useEffect(() => {
    fetchStatistics();
    fetchAccessRecords();
  }, [days]);

  // 图表配置
  const chartOption = {
    title: {
      text: '工具访问统计',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: toolStats.map((stat) => stat.tool_name),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
      name: '访问次数',
    },
    series: [
      {
        name: '访问次数',
        type: 'bar',
        data: toolStats.map((stat) => stat.access_count),
        itemStyle: {
          color: '#1890ff',
        },
      },
    ],
  };

  // 表格列定义
  const columns: ColumnsType<AccessRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '工具名称',
      dataIndex: 'tool_name',
      key: 'tool_name',
    },
    {
      title: '访问时间',
      dataIndex: 'access_time',
      key: 'access_time',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
    },
    {
      title: '访问路径',
      dataIndex: 'path',
      key: 'path',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 48px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <Link to="/" style={{ color: '#1890ff', textDecoration: 'none' }}>
            <Title level={3} style={{ margin: 0, color: '#000000' }}>
            王得伏の工具箱
            </Title>
          </Link>
          <span style={{ color: '#999' }}>/</span>
          <Title level={4} style={{ margin: 0 }}>
            管理后台
          </Title>
        </Space>
      </Header>

      <Content style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* 统计摘要 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总访问次数"
                value={summary?.total_access_count || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日访问"
                value={summary?.today_access_count || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="工具数量"
                value={summary?.tool_count || 0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="统计周期"
                value={`${summary?.period_days || 0} 天`}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 工具访问统计图表 */}
        <Card
          title="工具访问统计"
          extra={
            <Select
              value={days}
              onChange={setDays}
              style={{ width: 120 }}
            >
              <Select.Option value={7}>最近7天</Select.Option>
              <Select.Option value={30}>最近30天</Select.Option>
              <Select.Option value={90}>最近90天</Select.Option>
              <Select.Option value={365}>最近一年</Select.Option>
            </Select>
          }
          style={{ marginBottom: '24px' }}
        >
          {toolStats.length > 0 ? (
            <ReactECharts option={chartOption} style={{ height: '400px' }} />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              暂无数据
            </div>
          )}
        </Card>

        {/* 工具统计列表 */}
        <Card title="工具使用统计" style={{ marginBottom: '24px' }}>
          <Table
            columns={[
              {
                title: '工具名称',
                dataIndex: 'tool_name',
                key: 'tool_name',
              },
              {
                title: '访问次数',
                dataIndex: 'access_count',
                key: 'access_count',
                sorter: (a, b) => a.access_count - b.access_count,
                defaultSortOrder: 'descend',
              },
              {
                title: '最后访问时间',
                dataIndex: 'last_access_time',
                key: 'last_access_time',
                render: (text: string | null) =>
                  text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
              },
            ]}
            dataSource={toolStats}
            rowKey="tool_id"
            loading={loading}
            pagination={false}
          />
        </Card>

        {/* 访问记录 */}
        <Card title="访问记录">
          <Table
            columns={columns}
            dataSource={accessRecords}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default Admin;

