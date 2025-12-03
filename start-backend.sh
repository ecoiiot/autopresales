#!/bin/bash
# 启动后端服务

cd "$(dirname "$0")/backend"

# 检查虚拟环境是否存在，如果不存在则创建
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

python main.py

