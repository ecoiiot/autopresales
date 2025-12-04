"""
管理后台 API 路由
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

from .database import get_db
from .models import ToolAccess, ToolStatistic, ToolVideo

router = APIRouter(prefix="/api/admin", tags=["管理后台"])


class ToolStatsResponse(BaseModel):
    """工具统计响应"""
    tool_id: str
    tool_name: str
    access_count: int
    last_access_time: Optional[datetime]


class AccessRecordResponse(BaseModel):
    """访问记录响应"""
    id: int
    tool_id: str
    tool_name: str
    access_time: datetime
    ip_address: Optional[str]
    path: Optional[str]


@router.get("/stats/tools", response_model=List[ToolStatsResponse])
async def get_tool_statistics(
    days: int = Query(7, description="统计天数", ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    获取各工具使用统计
    
    返回指定天数内各工具的访问次数和最后访问时间
    """
    # 计算起始时间
    start_time = datetime.now() - timedelta(days=days)
    
    # 查询统计信息
    stats = db.query(
        ToolAccess.tool_id,
        ToolAccess.tool_name,
        func.count(ToolAccess.id).label("access_count"),
        func.max(ToolAccess.access_time).label("last_access_time")
    ).filter(
        ToolAccess.access_time >= start_time
    ).group_by(
        ToolAccess.tool_id,
        ToolAccess.tool_name
    ).order_by(
        desc("access_count")
    ).all()
    
    return [
        ToolStatsResponse(
            tool_id=stat.tool_id,
            tool_name=stat.tool_name,
            access_count=stat.access_count,
            last_access_time=stat.last_access_time
        )
        for stat in stats
    ]


@router.get("/stats/access", response_model=List[AccessRecordResponse])
async def get_access_records(
    tool_id: Optional[str] = Query(None, description="工具ID（可选）"),
    limit: int = Query(100, description="返回记录数", ge=1, le=1000),
    offset: int = Query(0, description="偏移量", ge=0),
    db: Session = Depends(get_db)
):
    """
    获取访问记录
    
    支持按工具ID筛选，支持分页
    """
    query = db.query(ToolAccess)
    
    if tool_id:
        query = query.filter(ToolAccess.tool_id == tool_id)
    
    records = query.order_by(
        desc(ToolAccess.access_time)
    ).offset(offset).limit(limit).all()
    
    return [
        AccessRecordResponse(
            id=record.id,
            tool_id=record.tool_id,
            tool_name=record.tool_name,
            access_time=record.access_time,
            ip_address=record.ip_address,
            path=record.path
        )
        for record in records
    ]


@router.get("/stats/summary")
async def get_statistics_summary(
    days: int = Query(7, description="统计天数", ge=1, le=365),
    db: Session = Depends(get_db)
):
    """
    获取统计摘要
    
    返回总访问次数、工具数量、今日访问次数等
    """
    start_time = datetime.now() - timedelta(days=days)
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 总访问次数
    total_count = db.query(func.count(ToolAccess.id)).filter(
        ToolAccess.access_time >= start_time
    ).scalar() or 0
    
    # 今日访问次数
    today_count = db.query(func.count(ToolAccess.id)).filter(
        ToolAccess.access_time >= today_start
    ).scalar() or 0
    
    # 工具数量
    tool_count = db.query(func.count(func.distinct(ToolAccess.tool_id))).filter(
        ToolAccess.access_time >= start_time
    ).scalar() or 0
    
    return {
        "total_access_count": total_count,
        "today_access_count": today_count,
        "tool_count": tool_count,
        "period_days": days
    }


class VideoInfoResponse(BaseModel):
    """视频信息响应"""
    id: int
    tool_id: str
    tool_name: str
    video_path: str
    video_url: Optional[str]
    description: Optional[str]
    upload_time: datetime
    update_time: datetime


class VideoCreateRequest(BaseModel):
    """创建视频请求"""
    tool_id: str
    tool_name: str
    video_path: str
    video_url: Optional[str] = None
    description: Optional[str] = None


@router.get("/videos", response_model=List[VideoInfoResponse])
async def get_videos(
    tool_id: Optional[str] = Query(None, description="工具ID（可选）"),
    db: Session = Depends(get_db)
):
    """
    获取工具演示视频列表
    
    支持按工具ID筛选
    """
    query = db.query(ToolVideo)
    
    if tool_id:
        query = query.filter(ToolVideo.tool_id == tool_id)
    
    videos = query.order_by(ToolVideo.upload_time.desc()).all()
    
    return [
        VideoInfoResponse(
            id=video.id,
            tool_id=video.tool_id,
            tool_name=video.tool_name,
            video_path=video.video_path,
            video_url=video.video_url,
            description=video.description,
            upload_time=video.upload_time,
            update_time=video.update_time
        )
        for video in videos
    ]


@router.get("/videos/{tool_id}", response_model=Optional[VideoInfoResponse])
async def get_video_by_tool_id(
    tool_id: str,
    db: Session = Depends(get_db)
):
    """
    根据工具ID获取视频信息
    """
    video = db.query(ToolVideo).filter(ToolVideo.tool_id == tool_id).first()
    
    if not video:
        return None
    
    return VideoInfoResponse(
        id=video.id,
        tool_id=video.tool_id,
        tool_name=video.tool_name,
        video_path=video.video_path,
        video_url=video.video_url,
        description=video.description,
        upload_time=video.upload_time,
        update_time=video.update_time
    )


@router.post("/videos", response_model=VideoInfoResponse)
async def create_video(
    request: VideoCreateRequest,
    db: Session = Depends(get_db)
):
    """
    创建或更新工具演示视频信息
    """
    # 检查是否已存在
    existing = db.query(ToolVideo).filter(ToolVideo.tool_id == request.tool_id).first()
    
    if existing:
        # 更新现有记录
        existing.tool_name = request.tool_name
        existing.video_path = request.video_path
        existing.video_url = request.video_url
        existing.description = request.description
        existing.update_time = datetime.now()
        db.commit()
        db.refresh(existing)
        
        return VideoInfoResponse(
            id=existing.id,
            tool_id=existing.tool_id,
            tool_name=existing.tool_name,
            video_path=existing.video_path,
            video_url=existing.video_url,
            description=existing.description,
            upload_time=existing.upload_time,
            update_time=existing.update_time
        )
    else:
        # 创建新记录
        video = ToolVideo(
            tool_id=request.tool_id,
            tool_name=request.tool_name,
            video_path=request.video_path,
            video_url=request.video_url,
            description=request.description
        )
        db.add(video)
        db.commit()
        db.refresh(video)
        
        return VideoInfoResponse(
            id=video.id,
            tool_id=video.tool_id,
            tool_name=video.tool_name,
            video_path=video.video_path,
            video_url=video.video_url,
            description=video.description,
            upload_time=video.upload_time,
            update_time=video.update_time
        )


@router.delete("/videos/{tool_id}")
async def delete_video(
    tool_id: str,
    db: Session = Depends(get_db)
):
    """
    删除工具演示视频信息
    """
    video = db.query(ToolVideo).filter(ToolVideo.tool_id == tool_id).first()
    
    if not video:
        return {"message": "视频信息不存在"}
    
    db.delete(video)
    db.commit()
    
    return {"message": "视频信息已删除"}

