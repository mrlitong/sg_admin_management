#!/bin/bash

# 设置变量
PROJECT_DIR="/root/code/sg_admin_management"
LOG_FILE="deployment_$(date +%Y%m%d_%H%M%S).log"
TARGET_DIR="/root/sg_web/admin"  # 部署到admin子目录，避免与主前端冲突
BACKUP_DIR="/root/sg_web_backup/admin_$(date +%Y%m%d_%H%M%S)"

# 输出日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 错误处理函数
handle_error() {
    log "错误: $1"
    log "部署失败，退出脚本"
    exit 1
}

# 开始部署
log "开始部署后台管理系统"
log "项目路径: $PROJECT_DIR"
log "目标路径: $TARGET_DIR"

# 切换到项目目录
cd "$PROJECT_DIR" || handle_error "无法进入项目目录: $PROJECT_DIR"

# 放弃本地修改
log "放弃本地修改..."
git checkout -- . || handle_error "放弃本地修改失败"

# 拉取最新代码
log "拉取最新代码..."
git pull || handle_error "拉取代码失败，请检查网络或仓库权限"

# 更新版本号
log "更新npm版本号..."
# 获取当前版本号
CURRENT_VERSION=$(grep -oP '"version":\s*"\K[^"]+' package.json)
log "当前版本: $CURRENT_VERSION"

# 删除已存在的tag（如果有）
git tag -d "v$CURRENT_VERSION" 2>/dev/null || true

# 尝试更新版本号
npm version patch --no-git-tag-version || handle_error "更新版本号失败"

# 获取新版本号
NEW_VERSION=$(grep -oP '"version":\s*"\K[^"]+' package.json)
log "新版本: $NEW_VERSION"

# 提交版本更改
git add package.json package-lock.json 2>/dev/null || true
git commit -m "chore: bump version to $NEW_VERSION" 2>/dev/null || true

# 创建新tag
git tag -f "v$NEW_VERSION" || log "警告: 无法创建Git标签"

# 安装依赖（如果package.json有变化）
log "检查并安装依赖..."
npm install || handle_error "安装依赖失败"

# 清理旧的构建文件
log "清理之前的构建文件..."
if [ -d "dist" ]; then
    rm -rf dist || handle_error "清理构建文件失败"
fi

# 构建项目
log "构建后台管理系统..."
npm run build || handle_error "项目构建失败，请检查构建错误"

# 检查构建结果
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    handle_error "构建目录不存在或为空"
fi

# 备份当前生产环境
if [ -d "$TARGET_DIR" ] && [ "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
    log "备份当前生产环境..."
    mkdir -p "$BACKUP_DIR" || handle_error "创建备份目录失败"
    cp -r "$TARGET_DIR"/* "$BACKUP_DIR"/ || handle_error "备份文件失败"
    log "备份完成: $BACKUP_DIR"
fi

# 确保目标目录存在
log "准备目标目录..."
mkdir -p "$TARGET_DIR" || handle_error "创建目标目录失败"

# 清理目标目录
log "清理目标目录..."
if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"/* || handle_error "清理目标目录失败"
fi

# 复制文件到生产环境
log "部署到生产环境..."
cp -r -f dist/* "$TARGET_DIR"/ || handle_error "复制文件到目标目录失败"

# 检查部署结果
if [ -z "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
    handle_error "部署后目标目录为空，部署可能失败"
fi

# 设置正确的权限
log "设置文件权限..."
chmod -R 755 "$TARGET_DIR" || log "警告: 设置权限失败，但不影响部署"

# 部署完成
log "========================================"
log "后台管理系统部署成功！"
log "版本: $NEW_VERSION"
log "部署路径: $TARGET_DIR"
log "访问地址: https://your-domain.com/admin/"
log "========================================"