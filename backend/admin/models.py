"""
管理后台数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime, BigInteger, Text
from sqlalchemy.sql import func
from .database import Base


class ToolAccess(Base):
    """工具访问记录表"""
    __tablename__ = "tool_access"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tool_id = Column(String(100), nullable=False, index=True, comment="工具ID")
    tool_name = Column(String(200), nullable=False, comment="工具名称")
    access_time = Column(DateTime, nullable=False, server_default=func.now(), index=True, comment="访问时间")
    ip_address = Column(String(50), nullable=True, comment="IP地址")
    user_agent = Column(Text, nullable=True, comment="用户代理")
    path = Column(String(500), nullable=True, comment="访问路径")
    
    def __repr__(self):
        return f"<ToolAccess(id={self.id}, tool_id={self.tool_id}, access_time={self.access_time})>"


class ToolStatistic(Base):
    """工具统计表（用于缓存统计数据）"""
    __tablename__ = "tool_statistic"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tool_id = Column(String(100), nullable=False, unique=True, index=True, comment="工具ID")
    tool_name = Column(String(200), nullable=False, comment="工具名称")
    access_count = Column(Integer, nullable=False, default=0, comment="访问次数")
    last_access_time = Column(DateTime, nullable=True, comment="最后访问时间")
    update_time = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<ToolStatistic(tool_id={self.tool_id}, access_count={self.access_count})>"


class ToolVideo(Base):
    """工具演示视频表"""
    __tablename__ = "tool_video"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    tool_id = Column(String(100), nullable=False, unique=True, index=True, comment="工具ID")
    tool_name = Column(String(200), nullable=False, comment="工具名称")
    video_path = Column(String(500), nullable=False, comment="视频路径（相对于 /public/videos/）")
    video_url = Column(String(500), nullable=True, comment="视频URL（可选，用于外部视频链接）")
    description = Column(Text, nullable=True, comment="视频描述")
    upload_time = Column(DateTime, nullable=False, server_default=func.now(), comment="上传时间")
    update_time = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def __repr__(self):
        return f"<ToolVideo(tool_id={self.tool_id}, video_path={self.video_path})>"


class AdminUser(Base):
    """管理员用户表"""
    __tablename__ = "admin_user"
    
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True, index=True, comment="用户名")
    password = Column(String(255), nullable=False, comment="密码（加密后）")
    is_active = Column(Integer, nullable=False, default=1, comment="是否激活（1=激活，0=禁用）")
    create_time = Column(DateTime, nullable=False, server_default=func.now(), comment="创建时间")
    last_login_time = Column(DateTime, nullable=True, comment="最后登录时间")
    
    def __repr__(self):
        return f"<AdminUser(username={self.username}, is_active={self.is_active})>"

