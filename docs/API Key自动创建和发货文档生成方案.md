# API Key 自动创建和发货文档生成方案

## 概述

本方案实现了一个自动化脚本，用于：
1. 自动登录管理后台获取认证 token
2. 创建新的 API Key
3. 根据模板生成发货文档

## 脚本位置

```
scripts/create-apikey-delivery.js
```

## 功能特性

- 支持命令行参数配置
- 自动从 `.env` 文件读取认证信息
- 自动生成带时间戳的默认名称
- 生成标准格式的发货文档

## 环境要求

### 依赖项

脚本使用项目已有的依赖：
- `chalk` - 终端彩色输出
- `dotenv` - 环境变量加载

### 环境变量配置（.env）

```bash
# 管理员凭据（必须）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Passw0rd123!@#

# 服务配置（可选，有默认值）
PORT=12350
HOST=localhost

# 时区配置（可选，用于生成默认名称）
TIMEZONE_OFFSET=8
```

## 使用方法

### 基本用法

```bash
# 使用所有默认参数创建
docker exec claude-relay-service-claude-relay-1 node scripts/create-apikey-delivery.js

# 或通过 npm 脚本运行（需要先在 package.json 添加）
docker exec claude-relay-service-claude-relay-1 npm run create:apikey
```

### 命令行参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--name <名称>` | API Key 名称 | `20刀体验_${日期}_${时间}` |
| `--totalCostLimit <金额>` | 总成本限制（美元） | `20` |
| `--claudeConsoleAccountId <ID>` | Claude Console 账户 ID | `570f1b57-bf82-4652-a0ab-0dd4ff71c0de` |
| `--expirationDays <天数>` | 过期天数 | `7` |
| `--description <描述>` | API Key 描述 | `20刀体验组周卡-共享账户` |
| `--output <路径>` | 输出文档路径 | `data/xianyu-cc/${name}.md` |
| `--help` | 显示帮助信息 | - |

### 使用示例

```bash
# 示例 1: 使用默认参数
docker exec claude-relay-service-claude-relay-1 node scripts/create-apikey-delivery.js

# 示例 2: 自定义名称和金额
docker exec claude-relay-service-claude-relay-1 node scripts/create-apikey-delivery.js --name "测试账户_001" --totalCostLimit 50

# 示例 3: 指定完整参数
docker exec claude-relay-service-claude-relay-1 node scripts/create-apikey-delivery.js \
  --name "VIP客户_20260111" \
  --totalCostLimit 100 \
  --expirationDays 30 \
  --description "VIP客户专属账户"

# 示例 4: 指定输出路径
docker exec claude-relay-service-claude-relay-1 node scripts/create-apikey-delivery.js --output /tmp/delivery.md
```

## 实现细节

### 1. 认证流程

```
┌─────────────────┐     POST /web/auth/login      ┌─────────────────┐
│  脚本读取 .env  │ ──────────────────────────────▶│   管理后台      │
│  获取用户名密码  │     { username, password }    │   返回 token    │
└─────────────────┘                                └─────────────────┘
```

登录接口：
```
POST /web/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Passw0rd123!@#"
}
```

响应：
```json
{
  "success": true,
  "token": "dbb5c549e49473f440168c7264cea68f...",
  "expiresIn": 86400000,
  "username": "admin"
}
```

### 2. 创建 API Key

```
┌─────────────────┐     POST /admin/api-keys      ┌─────────────────┐
│  使用 token     │ ──────────────────────────────▶│   管理后台      │
│  创建 API Key   │     Authorization: Bearer     │   返回 API Key  │
└─────────────────┘                                └─────────────────┘
```

创建接口：
```
POST /admin/api-keys
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "20刀体验_20260111_135801",
  "description": "20刀体验组周卡-共享账户",
  "tokenLimit": 0,
  "concurrencyLimit": 0,
  "dailyCostLimit": 0,
  "totalCostLimit": 20,
  "weeklyOpusCostLimit": 0,
  "expiresAt": "2026-01-18T05:59:08.330Z",
  "expirationMode": "fixed",
  "permissions": ["claude"],
  "tags": ["20刀体验组"],
  "enableModelRestriction": false,
  "restrictedModels": [],
  "enableClientRestriction": false,
  "allowedClients": [],
  "claudeConsoleAccountId": "570f1b57-bf82-4652-a0ab-0dd4ff71c0de"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "id": "8b947baf-5179-4856-95d8-f9bf7b89f95e",
    "apiKey": "cr_9c41ef5ca1769f5a3e2b40078502ec4780cba27e45d5deaf6ae3d6663025c27a",
    "name": "20刀体验_20260111_135801",
    ...
  }
}
```

### 3. 生成发货文档

从 API 响应中提取字段填充到模板：

| 模板变量 | API 响应字段 | 说明 |
|----------|--------------|------|
| `[订单号]` | `data.id` | API Key 的唯一 ID |
| `[卡号]` | `data.name` | API Key 名称 |
| `[密码]` | `data.apiKey` | 实际的 API Key（cr_ 开头）|

## 输出文件格式

生成的发货文档包含：

1. **标准发货信息** - 完整版，包含所有说明
2. **简洁版发货信息** - 精简版，便于快速复制
3. **变量说明** - 字段对应关系
4. **配置说明** - 自定义域名配置方法

## 添加 npm 脚本（可选）

在 `package.json` 中添加：

```json
{
  "scripts": {
    "create:apikey": "node scripts/create-apikey-delivery.js",
    "create:apikey:help": "node scripts/create-apikey-delivery.js --help"
  }
}
```

## 错误处理

脚本会处理以下错误情况：

1. **环境变量缺失** - 提示配置 ADMIN_USERNAME 和 ADMIN_PASSWORD
2. **登录失败** - 显示具体错误信息（用户名密码错误等）
3. **API Key 创建失败** - 显示 API 返回的错误信息
4. **文件写入失败** - 显示文件系统错误

## 安全注意事项

1. `.env` 文件包含敏感信息，不要提交到版本控制
2. 生成的发货文档包含 API Key，注意保管
3. 建议定期更换管理员密码

## 流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        脚本执行流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                              │
│  │ 解析命令行参数 │                                              │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ 读取 .env 配置│                                              │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐    失败    ┌──────────────┐                  │
│  │   管理员登录  │──────────▶│   显示错误    │                  │
│  └──────┬───────┘            └──────────────┘                  │
│         │ 成功                                                  │
│         ▼                                                       │
│  ┌──────────────┐    失败    ┌──────────────┐                  │
│  │ 创建 API Key │──────────▶│   显示错误    │                  │
│  └──────┬───────┘            └──────────────┘                  │
│         │ 成功                                                  │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ 生成发货文档  │                                              │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  保存到文件   │                                              │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │  显示结果摘要 │                                              │
│  └──────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 常见问题

### Q: 如何修改默认的 Claude Console 账户 ID？

A: 有三种方式：
1. 通过命令行参数：`--claudeConsoleAccountId <新ID>`
2. 修改脚本中的 `DEFAULT_CONFIG.claudeConsoleAccountId`
3. 可以扩展支持环境变量配置

### Q: 如何修改发货文档模板？

A: 修改脚本中的 `generateDeliveryDocument` 函数。

### Q: 如何批量创建 API Key？

A: 可以通过 shell 脚本循环调用：

```bash
for i in {1..10}; do
  node scripts/create-apikey-delivery.js --name "批量测试_$i"
done
```
