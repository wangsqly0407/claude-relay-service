#!/bin/bash
#
# 构建 Docker 镜像并保存为 .tar 文件
# 镜像名称: evan6/claude-relay-service:$分支-$commit前8位
# tar名称: claude-relay-service-$分支-$commit前8位.tar
#

set -e

# 获取脚本所在目录的上级目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 获取当前分支名称
BRANCH=$(git rev-parse --abbrev-ref HEAD)
# 替换分支名中的斜杠为短横线（如 feature/xxx -> feature-xxx）
BRANCH_SAFE=$(echo "$BRANCH" | sed 's/\//-/g')

# 获取当前 commit 的前8位
COMMIT_SHORT=$(git rev-parse --short=8 HEAD)

# 镜像名称
IMAGE_NAME="evan6/claude-relay-service"
IMAGE_TAG="${BRANCH_SAFE}-${COMMIT_SHORT}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

# 备份目录和 tar 文件名
BACKUP_DIR="${PROJECT_DIR}/backup"
TAR_NAME="claude-relay-service-${BRANCH_SAFE}-${COMMIT_SHORT}.tar"
TAR_PATH="${BACKUP_DIR}/${TAR_NAME}"

echo "========================================"
echo "构建 Docker 镜像"
echo "========================================"
echo "分支: ${BRANCH}"
echo "Commit: ${COMMIT_SHORT}"
echo "镜像: ${FULL_IMAGE_NAME}"
echo "输出: ${TAR_PATH}"
echo "========================================"

# 确保 backup 目录存在
mkdir -p "$BACKUP_DIR"

# 构建镜像
echo ""
echo "[1/2] 构建镜像..."
docker build -t "$FULL_IMAGE_NAME" .

# 保存镜像为 tar 文件
echo ""
echo "[2/2] 保存镜像为 tar 文件..."
docker save -o "$TAR_PATH" "$FULL_IMAGE_NAME"

echo ""
echo "========================================"
echo "构建完成!"
echo "镜像: ${FULL_IMAGE_NAME}"
echo "文件: ${TAR_PATH}"
echo "大小: $(du -h "$TAR_PATH" | cut -f1)"
echo "========================================"
