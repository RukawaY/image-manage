#!/bin/bash

# 图片管理系统 - 快速启动脚本

echo "=========================================="
echo "  图片管理系统 - 启动服务"
echo "=========================================="

# 检查Python和Node.js是否安装
command -v python3 >/dev/null 2>&1 || { echo "错误: 需要安装Python3"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "错误: 需要安装Node.js"; exit 1; }

# 启动后端
echo ""
echo ">>> 启动Django后端..."
cd backend

# 激活虚拟环境
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "创建虚拟环境..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
fi

# 执行迁移
echo "执行数据库迁移..."
python manage.py makemigrations
python manage.py migrate

# 启动后端服务（后台运行）
echo "启动Django服务器..."
python manage.py runserver > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务已启动 (PID: $BACKEND_PID)"

# 返回根目录
cd ..

# 启动前端
echo ""
echo ">>> 启动React前端..."
cd frontend

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 创建.env文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "创建.env配置文件..."
    echo "VITE_API_URL=http://localhost:8000/api" > .env
fi

# 启动前端服务（后台运行）
echo "启动Vite开发服务器..."
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务已启动 (PID: $FRONTEND_PID)"

cd ..

# 创建日志目录
mkdir -p logs

# 保存PID
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo "=========================================="
echo "  服务启动完成！"
echo "=========================================="
echo "后端地址: http://localhost:8000"
echo "前端地址: http://localhost:5173"
echo "Admin后台: http://localhost:8000/admin"
echo ""
echo "查看日志:"
echo "  后端: tail -f logs/backend.log"
echo "  前端: tail -f logs/frontend.log"
echo ""
echo "停止服务: ./stop.sh"
echo "=========================================="

