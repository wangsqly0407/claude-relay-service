# Claude Relay Service - 本地开发测试指南 (macOS Intel)

> 📅 **更新日期**: 2026-01-10
> 💻 **适用平台**: macOS (Intel 芯片)
> 🔧 **Node.js 版本**: 18+

---

## 📋 目录

- [环境准备](#环境准备)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [开发调试](#开发调试)
- [测试流程](#测试流程)
- [常见问题](#常见问题)
- [开发工具](#开发工具)

---

## 🎯 环境准备

### 1. 检查系统环境

```bash
# 检查 Node.js 版��（需要 18+）
node --version
# 当前版本: v18.11.0 ✅

# 检查 npm 版本
npm --version
# 当前版本: 9.6.5 ✅

# 检查系统架构
uname -m
# Intel 芯片应显示: x86_64
```

### 2. 安装 Homebrew（如未安装）

```bash
# 安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 验证安装
brew --version
```

### 3. 安装 Redis

```bash
# 使用 Homebrew 安装 Redis
brew install redis

# 查看 Redis 版本
redis-server --version
# 应显示: Redis server v=6.x 或更高

# 启动 Redis 服务（后台运行）
brew services start redis

# 或者前台运行（用于调试）
redis-server

# 验证 Redis 是否运行
redis-cli ping
# 应返回: PONG
```

### 4. 安装 Git（如未安装）

```bash
# macOS 通常已预装 Git，检查版本
git --version

# 如需安装/更新
brew install git
```

---

## 🚀 快速开始

### Step 1: 克隆项目（如果还未克隆）

```bash
# ���隆项目到本地
cd ~/WorkStation/personal
git clone https://github.com/Wei-Shaw/claude-relay-service.git
cd claude-relay-service

# 或者如果已经克隆，拉取最新代码
git pull origin main
```

### Step 2: 安装后端依赖

```bash
# 安装 Node.js 依赖
npm install

# 如果遇到权限问题，使用
sudo npm install --unsafe-perm
```

### Step 3: 配置环境变量

```bash
# 复制配置文件模板
cp .env.example .env
cp config/config.example.js config/config.js

# 编辑 .env 文件，设置必要的配置
nano .env
# 或使用其他编辑器
code .env  # VS Code
vim .env   # Vim
```

**必须配置的环境变量**：

```bash
# .env 文件关键配置
NODE_ENV=development

# 生成 32 位随机密钥（在终端执行）
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 将生成的密钥填入以下配置
JWT_SECRET=<生成的随机密钥>
ENCRYPTION_KEY=<生成的随机密钥，必须32字符>

# Redis 配置（本地开发默认）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 开发环境配置
PORT=3000
HOST=127.0.0.1
DEBUG=true
DEBUG_HTTP_TRAFFIC=false  # 需要详细日志时设为 true
LOG_LEVEL=debug
```

### Step 4: 初始化系统

```bash
# 运行初始化脚本，生成管理员凭据
npm run setup

# 初始化成功后会显示：
# ✅ Admin credentials saved to data/init.json
#
# 📋 管理员凭据:
# Username: cr_admin_xxxxx
# Password: xxxxx
```

**重要**: 记录初始化后生成的管理员账号和密码！

### Step 5: 安装并构建前端

```bash
# 安装前端依赖
npm run install:web

# 构建前端（生成 dist 目录）
npm run build:web
```

### Step 6: 启动开发服务器

```bash
# 方式一：开发模式（推荐，支持热重载）
npm run dev

# 方式二：生产模式
npm start

# 方式三：后台守护进程模式
npm run service:start:daemon
```

### Step 7: 访问管理界面

打开浏览器访问：

- **管理界面**: http://localhost:3000/admin-next/login
- **旧版界面**: http://localhost:3000/web
- **健康检查**: http://localhost:3000/health
- **系统指标**: http://localhost:3000/metrics

使用 Step 4 生成的管理员凭据登录。

---

## ⚙️ 详细配置

### Redis 配置调整（可选）

如果需要自定义 Redis 配置：

```bash
# 查找 Redis 配置文件位置
brew --prefix redis
# 通常在: /usr/local/etc/redis.conf

# 编辑 Redis 配置
nano /usr/local/etc/redis.conf

# 常用配置项：
# bind 127.0.0.1                # 监听地址
# port 6379                     # 端口
# requirepass your_password     # 设置密码
# maxmemory 256mb              # 最大内存限制
# maxmemory-policy allkeys-lru # 内存淘汰策略

# 重启 Redis 使配置生效
brew services restart redis
```

如果设置了 Redis 密码，更新 `.env`：

```bash
REDIS_PASSWORD=your_password
```

### 开发环境推荐配置

**`.env` 开发环境配置**：

```bash
# 🌐 服务器配置
PORT=3000
HOST=127.0.0.1  # 本地开发建议使用 127.0.0.1
NODE_ENV=development

# 🔐 安全配置
JWT_SECRET=dev-secret-key-replace-in-production
ENCRYPTION_KEY=12345678901234567890123456789012  # 必须32字符

# 📊 Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 🔗 会话管理
STICKY_SESSION_TTL_HOURS=1
STICKY_SESSION_RENEWAL_THRESHOLD_MINUTES=15

# 🚫 Claude 错误处理（开发环境可禁用）
CLAUDE_OVERLOAD_HANDLING_MINUTES=0
CLAUDE_CONSOLE_BLOCKED_HANDLING_MINUTES=0

# 📝 日志配置
LOG_LEVEL=debug  # 开发环境使用 debug 级别
DEBUG=true
DEBUG_HTTP_TRAFFIC=false  # 需要时开启查看 HTTP 详情

# 🛠️ 开发配置
ENABLE_CORS=true
TRUST_PROXY=false  # 本地开发不需要代理

# 📈 系统配置
METRICS_WINDOW=1  # 开发环境可设置为 1 分钟
CLEAR_CONCURRENCY_QUEUES_ON_STARTUP=true

# 👥 用户管理（开发测试可选）
USER_MANAGEMENT_ENABLED=false
LDAP_ENABLED=false
```

---

## 🛠️ 开发调试

### 1. 使用 Nodemon 热重载

```bash
# 启动开发模式（自动监听文件变化）
npm run dev

# nodemon 会监听 src/ 目录下的 .js 和 .json 文件
# 文件修改后自动重启服务
```

### 2. 使用 VS Code 调试

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch CRS Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/app.js",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Run Setup Script",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/scripts/setup.js",
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    }
  ]
}
```

使用方法：
1. 在 VS Code 中打开项目
2. 按 `F5` 或点击左侧调试图标
3. 选择配置并启动调试

### 3. 日志调试

```bash
# 查看实时日志
tail -f logs/claude-relay-*.log

# 查看错误日志
tail -f logs/token-refresh-error.log

# 查看所有日志文件
ls -lh logs/

# 启用 HTTP 调试日志（.env 中设置）
DEBUG_HTTP_TRAFFIC=true
tail -f logs/http-debug-*.log
```

### 4. Redis 调试

```bash
# 连接到 Redis CLI
redis-cli

# 查看所有键
KEYS *

# 查看特定键
GET api_key:some-id

# 查看键的类型
TYPE api_key:some-id

# 查看哈希表内容
HGETALL api_key:some-id

# 查看集合内容
SMEMBERS some-set-key

# 查看有序集合
ZRANGE concurrency:account-id 0 -1 WITHSCORES

# 清空当前数据库（⚠️ 慎用）
FLUSHDB

# 退出 Redis CLI
exit
```

### 5. API 测试

使用 `curl` 测试 API：

```bash
# 健康检查
curl http://localhost:3000/health | jq

# 系统指标
curl http://localhost:3000/metrics | jq

# 管理员登录
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "cr_admin_xxxxx",
    "password": "your_password"
  }' | jq

# 获取仪表板数据（需要 token）
curl http://localhost:3000/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" | jq
```

### 6. 前端开发

```bash
# 进入前端目录
cd web/admin-spa

# 启动前端开发服务器（支持热重载）
npm run dev

# 前端将运行在 http://localhost:5173
# 自动代理 API 请求到后端 http://localhost:3000
```

修改前端代码后：

```bash
# 重新构建前端
npm run build

# 回到项目根目录
cd ../..
```

---

## 🧪 测试流程

### 1. 单元测试

```bash
# 运行测试套件
npm test

# 运行特定测试文件
npm test -- tests/apiKeyService.test.js

# 查看测试覆盖率
npm test -- --coverage
```

### 2. 代码检查

```bash
# 运行 ESLint 检查
npm run lint

# 自动修复代码风格问题
npm run lint -- --fix

# 或使用单独的脚本
npm run lint:check
```

### 3. 代码格式化

```bash
# 格式化所有代码
npm run format

# 检查代码格式
npm run format:check

# 格式化特定文件
npx prettier --write src/services/apiKeyService.js
```

### 4. 功能测试

#### 4.1 测试 API Key 创建

```bash
# 使用 CLI 工具创建 API Key
npm run cli keys create -- --name "Test Key" --limit 1000

# 查看所有 Keys
npm run cli keys list

# 查看 Key 详情
npm run cli keys info -- --id <keyId>
```

#### 4.2 测试账户管理

```bash
# 查看账户列表
npm run cli accounts list

# 查看账户状态
npm run cli accounts status

# 刷新账户 Token
npm run cli accounts refresh -- --id <accountId>
```

#### 4.3 测试使用统计

```bash
# 查看系统状态
npm run status

# 查看详细状态
npm run status:detail

# 监控系统
npm run monitor
```

### 5. 手动测试 OAuth 流程

在 Web 界面测试：

1. **登录管理界面**: http://localhost:3000/admin-next/login
2. **添加 Claude 账户**:
   - 进入 "账户管理" 页面
   - 点击 "添加账户"
   - 配置代理（如需要）
   - 点击 "生成授权 URL"
   - 在新窗口完成授权
   - 复制 Authorization Code
   - 返回粘贴完成添加

3. **创建 API Key**:
   - 进入 "API Keys" 页面
   - 点击 "创建 API Key"
   - 设置名称和限制
   - 保存并复制 Key

4. **测试 API 调用**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/messages \
     -H "Content-Type: application/json" \
     -H "x-api-key: YOUR_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -d '{
       "model": "claude-sonnet-4-5-20250929",
       "max_tokens": 1024,
       "messages": [
         {
           "role": "user",
           "content": "Hello, Claude!"
         }
       ]
     }'
   ```

---

## 🔍 常见问题

### 1. Redis 连接失败

**问题**: `Error: Redis connection failed`

**解决方案**:

```bash
# 检查 Redis 是否运行
brew services list | grep redis

# 如果未运行，启动 Redis
brew services start redis

# 检查 Redis 进程
ps aux | grep redis-server

# 测试 Redis 连接
redis-cli ping

# 如果返回 PONG 说明正常
```

### 2. 端口被占用

**问题**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:

```bash
# 查找占用 3000 端口的进程
lsof -ti:3000

# 杀死进程
kill -9 $(lsof -ti:3000)

# 或者修改 .env 中的端口
PORT=3001
```

### 3. 前端构建失败

**问题**: `npm run build:web` 失败

**解决方案**:

```bash
# 删除前端 node_modules 重新安装
cd web/admin-spa
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build

# 回到项目根目录
cd ../..
```

### 4. 管理员登录失败

**问题**: `Invalid credentials`

**解决方案**:

```bash
# 查看管理员凭据
cat data/init.json

# 重新初始化管理员
npm run setup

# 或使用 CLI 工具重置密码
npm run cli admin reset-password -- --username cr_admin_xxxxx
```

### 5. ESLint 报错

**问题**: `npm run lint` 报错

**解决方案**:

```bash
# 自动修复可修复的问题
npm run lint -- --fix

# 如果是配置问题，检查 .eslintrc.cjs
cat .eslintrc.cjs

# 忽略特定文件（.eslintignore）
echo "logs/" >> .eslintignore
echo "dist/" >> .eslintignore
```

### 6. Node.js 版本不兼容

**问题**: 某些依赖要求更高版本的 Node.js

**解决方案**:

```bash
# 使用 nvm 管理 Node.js 版本
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装并使用 Node.js 18
nvm install 18
nvm use 18

# 验证版本
node --version
```

### 7. 内存不足

**问题**: `JavaScript heap out of memory`

**解决方案**:

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 或在 package.json 中修改脚本
"dev": "NODE_OPTIONS='--max-old-space-size=4096' nodemon"
```

---

## 🛠️ 开发工具

### 推荐的 VS Code 扩展

```bash
# 安装推荐扩展
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension Vue.volar
code --install-extension bradlc.vscode-tailwindcss
code --install-extension christian-kohler.path-intellisense
code --install-extension humao.rest-client
```

创建 `.vscode/extensions.json`：

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "Vue.volar",
    "bradlc.vscode-tailwindcss",
    "christian-kohler.path-intellisense",
    "humao.rest-client"
  ]
}
```

### REST Client 测试文件

创建 `tests/api.http`：

```http
### 健康检查
GET http://localhost:3000/health

### 系统指标
GET http://localhost:3000/metrics

### 管理员登录
POST http://localhost:3000/admin/login
Content-Type: application/json

{
  "username": "cr_admin_xxxxx",
  "password": "your_password"
}

### 获取仪表板（需要先登录获取 token）
GET http://localhost:3000/admin/dashboard
Authorization: Bearer YOUR_JWT_TOKEN

### 测试 Claude API（需要创建 API Key）
POST http://localhost:3000/api/v1/messages
Content-Type: application/json
x-api-key: YOUR_API_KEY
anthropic-version: 2023-06-01

{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ]
}
```

### Postman Collection

可以导出 Postman Collection 用于 API 测试：

```bash
# 安装 newman（Postman CLI）
npm install -g newman

# 运行测试
newman run tests/postman-collection.json -e tests/local-env.json
```

---

## 📊 监控与性能

### 查看系统资源使用

```bash
# 查看 Node.js 进程内存使用
ps aux | grep node

# 实时监控系统资源
top -pid $(pgrep -f "node src/app.js")

# 查看 Redis 内存使用
redis-cli INFO memory

# 查看 Redis 统计信息
redis-cli INFO stats
```

### 性能分析

```bash
# 使用 Node.js 内置 profiler
node --prof src/app.js

# 生成性能报告
node --prof-process isolate-*.log > profile.txt

# 查看报告
cat profile.txt
```

---

## 🚀 生产环境部署前检查

```bash
# 1. 运行所有测试
npm test

# 2. 代码检查
npm run lint

# 3. 代码格式化
npm run format:check

# 4. 构建前端
npm run build:web

# 5. 检查环境变量
cat .env

# 6. 检查配置文件
cat config/config.js

# 7. 测试 Redis 连接
redis-cli ping

# 8. 测试服务启动
npm start

# 9. 健康检查
curl http://localhost:3000/health

# 10. 查看日志
tail -f logs/claude-relay-*.log
```

---

## 📚 相关文档

- [项目架构文档](./architecture.md)
- [API 文档](../README.md#api-endpoints)
- [部署指南](../README.md#deployment)
- [故障排除](../README.md#troubleshooting)

---

## 🤝 开发规范

### Git 提交规范

```bash
# 功能开发
git commit -m "feat: 添加 XXX 功能"

# Bug 修复
git commit -m "fix: 修复 XXX 问题"

# 文档更新
git commit -m "docs: 更新 XXX 文档"

# 代码重构
git commit -m "refactor: 重构 XXX 模块"

# 性能优化
git commit -m "perf: 优化 XXX 性能"

# 测试相关
git commit -m "test: 添加 XXX 测试"

# 构建相关
git commit -m "build: 更新依赖版本"
```

### 分支管理

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 创建修复分支
git checkout -b fix/your-fix-name

# 完成开发后合并到 main
git checkout main
git merge feature/your-feature-name
git push origin main
```

---

## 💡 最佳实践

1. **环境隔离**: 开发、测试、生产使用不同的 `.env` 配置
2. **日志管理**: 定期清理日志文件，避免磁盘占满
3. **Redis 备份**: 定期备份 Redis 数据
4. **代码审查**: 提交前进行代码检查和测试
5. **安全配置**: 生产环境使用强密码和加密
6. **版本控制**: 使用语义化版本号
7. **文档更新**: 代码修改后及时更新文档

---

## 🎓 学习资源

- **Express.js**: https://expressjs.com/
- **Vue 3**: https://vuejs.org/
- **Redis**: https://redis.io/documentation
- **Node.js**: https://nodejs.org/docs/
- **Element Plus**: https://element-plus.org/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**🎉 恭喜！你现在可以开始本地开发了！**

如有任何问题，请参考：
- [常见问题](#常见问题)
- [GitHub Issues](https://github.com/Wei-Shaw/claude-relay-service/issues)
- [项目文档](../README.md)

---

*最后更新: 2026-01-10*
