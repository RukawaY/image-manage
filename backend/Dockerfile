# backend/Dockerfile

# 使用官方 Python 镜像
FROM python:3.10-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 安装编译 mysqlclient 所需的系统依赖
# - apt-get update: 更新软件包列表
# - build-essential: 包含了 C/C++ 编译器等基础编译工具
# - pkg-config: 用于帮助找到编译库
# - default-libmysqlclient-dev: 这是核心，MySQL 的 C 语言开发库
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 拷贝项目代码
COPY . /app/

# 暴露端口
EXPOSE 8000

# 运行 Gunicorn 服务器
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]