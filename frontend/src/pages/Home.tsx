import React from 'react';
import { Layout, Typography, Row, Col, Divider } from 'antd';
import { Link } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { toolCategories } from '../config/tools';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Home: React.FC = () => {
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
        <Title level={4} style={{ margin: 0, color: '#000' }}>
        王得伏-工程工具集
        </Title>
      </Header>

      <Content style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
        {toolCategories.map((category) => (
          <div key={category.id} style={{ marginBottom: '48px' }}>
            <div style={{ marginBottom: '24px' }}>
              <Title level={4} style={{ marginBottom: '8px', color: '#777777' }}>
                {category.name}
              </Title>
            </div>

            {category.tools.length > 0 ? (
              <Row gutter={[24, 24]}>
                {category.tools
                  .filter((tool) => tool.enabled)
                  .map((tool) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={tool.id}>
                      <ToolCard tool={tool} />
                    </Col>
                  ))}
              </Row>
            ) : (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px dashed #d9d9d9',
                }}
              >
                <Text type="secondary">暂无工具，敬请期待</Text>
              </div>
            )}

            <Divider />
          </div>
        ))}
      </Content>
    </Layout>
  );
};

export default Home;

