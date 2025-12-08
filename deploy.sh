#!/bin/bash

# 服务器配置
SERVER_IP="59.110.81.12"
SERVER_USER="root"
REMOTE_DIR="/opt/autopresales/"

echo "🚀 === 开始自动化部署流程 ==="

# 1. 编译前端
echo "📦 [1/3] 正在编译前端..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端编译失败，终止部署！"
    exit 1
fi
cd ..

# 2. 同步文件到服务器
echo "jg [2/3] 正在同步文件到服务器..."
# 使用 rsync 增量上传：
# -a: 归档模式
# -v: 显示过程
# -z: 压缩传输
# --delete: (可选) 如果你想让服务器和本地完全一致，删除服务器上多余的文件，可以用这个参数，但新手建议先不用
rsync -avz \
    --exclude 'node_modules' \
    --exclude 'frontend/node_modules' \
    --exclude 'backend/venv' \
    --exclude 'backend/__pycache__' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    --exclude 'deploy.sh' \
    ./ ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}

# 3. 远程执行服务器脚本
echo "Typing [3/3] 正在触发服务器重启..."
ssh ${SERVER_USER}@${SERVER_IP} "/root/server_update.sh"

echo "🎉 === 部署完成！请访问 http://${SERVER_IP} 验证 ==="
