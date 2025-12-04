"""
工具注册机制
用于管理和注册各个工具模块
"""
from typing import Dict, List, Optional
from fastapi import APIRouter


class ToolRegistry:
    """工具注册表"""
    
    def __init__(self):
        self._tools: Dict[str, Dict] = {}
        self._routers: List[APIRouter] = []
    
    def register_tool(
        self,
        tool_id: str,
        name: str,
        description: str = "",
        router: Optional[APIRouter] = None,
        **kwargs
    ):
        """
        注册工具
        
        Args:
            tool_id: 工具唯一标识
            name: 工具名称
            description: 工具描述
            router: FastAPI 路由对象
            **kwargs: 其他工具元数据
        """
        tool_info = {
            "id": tool_id,
            "name": name,
            "description": description,
            **kwargs
        }
        self._tools[tool_id] = tool_info
        
        if router:
            self._routers.append(router)
    
    def get_tool(self, tool_id: str) -> Optional[Dict]:
        """获取工具信息"""
        return self._tools.get(tool_id)
    
    def get_all_tools(self) -> Dict[str, Dict]:
        """获取所有工具"""
        return self._tools.copy()
    
    def get_routers(self) -> List[APIRouter]:
        """获取所有路由"""
        return self._routers.copy()


# 全局工具注册表实例
tool_registry = ToolRegistry()

