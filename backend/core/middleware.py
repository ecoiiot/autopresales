"""
访问追踪中间件
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session

from admin.database import SessionLocal
from admin.models import ToolAccess
from core.tool_registry import tool_registry


class AccessTrackingMiddleware(BaseHTTPMiddleware):
    """访问追踪中间件"""
    
    async def dispatch(self, request: Request, call_next):
        # 处理请求
        response = await call_next(request)
        
        # 异步记录访问日志（不阻塞响应）
        asyncio.create_task(self._log_access(request))
        
        return response
    
    async def _log_access(self, request: Request):
        """记录访问日志"""
        try:
            # 获取路径
            path = request.url.path
            
            # 判断是否为工具访问（排除 API 路径和静态资源）
            if path.startswith("/api/") or path.startswith("/assets/") or path == "/":
                return
            
            # 检查是否为工具路径
            tool = None
            for tool_info in tool_registry.get_all_tools().values():
                if path.startswith(tool_info.get("path", "")):
                    tool = tool_info
                    break
            
            if not tool:
                return
            
            # 获取客户端信息
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            
            # 创建数据库会话
            db = SessionLocal()
            try:
                # 记录访问
                access_record = ToolAccess(
                    tool_id=tool["id"],
                    tool_name=tool["name"],
                    ip_address=ip_address,
                    user_agent=user_agent,
                    path=path
                )
                db.add(access_record)
                db.commit()
            except Exception as e:
                db.rollback()
                # 记录错误但不影响主流程
                print(f"记录访问日志失败: {e}")
            finally:
                db.close()
        except Exception as e:
            # 静默处理错误，不影响主流程
            print(f"访问追踪中间件错误: {e}")

