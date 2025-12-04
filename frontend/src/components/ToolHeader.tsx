import React, { useState } from 'react';
import { Layout, Typography, Button, Modal } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { PlayCircleOutlined } from '@ant-design/icons';
import { getToolById } from '../config/tools';
import Logo from './Logo';

const { Header } = Layout;
const { Title } = Typography;

interface ToolHeaderProps {
  /** 自定义视频路径（可选），如果不提供则根据路由自动生成 */
  videoPath?: string;
}

const ToolHeader: React.FC<ToolHeaderProps> = ({ videoPath }) => {
  const { category, toolId } = useParams<{ category: string; toolId: string }>();
  const [videoVisible, setVideoVisible] = useState(false);
  
  // 根据路由参数获取当前工具信息
  const currentTool = category && toolId ? getToolById(category, toolId) : undefined;

  // 生成视频路径：优先级：自定义路径 > 默认路径
  // 默认路径格式：/videos/{category}/{toolId}.mp4
  // 视频文件应放在 frontend/public/videos/{category}/{toolId}.mp4
  const getVideoPath = () => {
    if (videoPath) {
      return videoPath;
    }
    // 默认路径格式：/videos/{category}/{toolId}.mp4
    if (category && toolId) {
      return `/videos/${category}/${toolId}.mp4`;
    }
    // 如果没有路由参数，尝试使用默认路径
    return '/videos/default/demo.mp4';
  };

  const handlePlayVideo = () => {
    setVideoVisible(true);
  };

  const handleCloseVideo = () => {
    setVideoVisible(false);
  };

  return (
    <>
      <Header
        style={{
          background: '#fff',
          padding: '0 48px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo />
          {currentTool && (
            <>
              <span style={{ color: '#999', fontSize: '16px' }}>|</span>
              <Title level={4} style={{ margin: 0, color: '#000', cursor: 'default' }}>
                {currentTool.name}
              </Title>
            </>
          )}
        </div>
        <Button
          type="link"
          icon={<PlayCircleOutlined />}
          onClick={handlePlayVideo}
        >
          演示视频
        </Button>
      </Header>

      <Modal
        title="演示视频"
        open={videoVisible}
        onCancel={handleCloseVideo}
        footer={null}
        width={800}
        centered
      >
        <video
          controls
          style={{ width: '100%', maxHeight: '600px' }}
          src={getVideoPath()}
        >
          您的浏览器不支持视频播放。
        </video>
      </Modal>
    </>
  );
};

export default ToolHeader;

