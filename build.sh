#!/bin/bash

# 设置变量
PROJECT_DIR="/root/code/sg_admin_management"
TARGET_DIR="/root/sg_web/"

# 切换到项目目录
cd "$PROJECT_DIR" || exit 1

# 拉取最新代码
echo "拉取最新代码..."
git pull || exit 1

# 构建项目
echo "构建项目..."
npm run build || exit 1

# 确保目标目录存在
mkdir -p "$TARGET_DIR"

# 复制dist到目标目录
echo "部署到 $TARGET_DIR..."
rm -rf "$TARGET_DIR"/*
cp -r dist/* "$TARGET_DIR"/

echo "部署完成！"
