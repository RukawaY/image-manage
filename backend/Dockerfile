# backend/Dockerfile

# 使用官方 Python 镜像
FROM python:3.10-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

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