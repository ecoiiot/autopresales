# 演示视频管理说明

## 视频文件位置

演示视频文件应放在 `frontend/public/videos/` 目录下，按照工具分类和ID组织：

```
frontend/public/videos/
├── bidding/
│   └── scoring.mp4          # 报价评分计算器的演示视频
├── design/
│   └── ...
├── construction/
│   └── ...
└── maintenance/
    └── ...
```

## 视频路径规则

- **默认路径格式**：`/videos/{category}/{toolId}.mp4`
- **示例**：报价评分计算器的视频路径为 `/videos/bidding/scoring.mp4`

## 后端管理 API

### 1. 获取所有视频列表
```
GET /api/admin/videos
GET /api/admin/videos?tool_id=bidding_scoring
```

### 2. 根据工具ID获取视频信息
```
GET /api/admin/videos/{tool_id}
```

### 3. 创建或更新视频信息
```
POST /api/admin/videos
Content-Type: application/json

{
  "tool_id": "bidding_scoring",
  "tool_name": "报价评分计算器",
  "video_path": "bidding/scoring.mp4",
  "video_url": null,  // 可选，用于外部视频链接
  "description": "演示视频描述"
}
```

### 4. 删除视频信息
```
DELETE /api/admin/videos/{tool_id}
```

## 数据库表结构

`tool_video` 表用于存储视频元数据：

- `tool_id`: 工具ID（唯一）
- `tool_name`: 工具名称
- `video_path`: 视频路径（相对于 /public/videos/）
- `video_url`: 视频URL（可选，用于外部视频链接）
- `description`: 视频描述
- `upload_time`: 上传时间
- `update_time`: 更新时间

## 使用说明

1. **上传视频文件**：将视频文件放到 `frontend/public/videos/{category}/{toolId}.mp4`
2. **注册视频信息**：通过后端 API 创建视频记录
3. **前端自动加载**：`ToolHeader` 组件会自动从后端获取视频路径，如果后端没有记录，则使用默认路径

## 注意事项

- 视频文件需要手动上传到 `public/videos/` 目录
- 后端 API 只管理视频元数据，不存储实际视频文件
- 支持外部视频链接（通过 `video_url` 字段）
- 视频格式建议使用 MP4，确保浏览器兼容性

