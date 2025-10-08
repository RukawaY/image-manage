#!/bin/bash

# 图片管理系统 - 停止服务脚本

echo "=========================================="
echo "  图片管理系统 - 停止服务"
echo "=========================================="

# 读取PID
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    rm logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    rm logs/frontend.pid
fi

# 清理可能残留的进程
echo "清理残留进程..."
pkill -f "python manage.py runserver"
pkill -f "vite"

echo ""
echo "服务已停止"
echo "=========================================="

