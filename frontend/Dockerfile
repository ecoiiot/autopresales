# 基于 nginx:alpine 镜像
FROM nginx:alpine

# 复制本地构建好的 dist 目录到容器的 nginx 静态文件目录
COPY dist /usr/share/nginx/html

# 复制 nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# nginx:alpine 镜像默认启动 nginx，无需额外 CMD

