#!/usr/bin/env node
/**
 * API Key 创建和发货文档生成脚本
 *
 * 功能：
 * 1. 自动登录管理后台获取认证 token
 * 2. 创建新的 API Key
 * 3. 根据模板生成发货文档
 *
 * 用法：
 *   node scripts/create-apikey-delivery.js [options]
 *
 * 参数：
 *   --name <名称>                    API Key 名称，默认：20刀体验_${当前日期}_${当前时间}
 *   --totalCostLimit <金额>          总成本限制（美元），默认：20
 *   --claudeConsoleAccountId <ID>   Claude Console 账户 ID，默认：570f1b57-bf82-4652-a0ab-0dd4ff71c0de
 *   --expirationDays <天数>          过期天数，默认：7
 *   --description <描述>             API Key 描述，默认：20刀体验组周卡-共享账户
 *   --output <路径>                  输出文档路径，默认：docs/${name}.md
 *   --help                          显示帮助信息
 *
 * 环境变量（从 .env 读取）：
 *   ADMIN_USERNAME                  管理员用户名
 *   ADMIN_PASSWORD                  管理员密码
 *   PORT                            服务端口（默认 12350）
 *   HOST                            服务地址（默认 localhost）
 */

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

// 加载 .env 配置
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

// ============================================================================
// 配置和默认值
// ============================================================================

const DEFAULT_CONFIG = {
  claudeConsoleAccountId: '570f1b57-bf82-4652-a0ab-0dd4ff71c0de',
  totalCostLimit: 20,
  expirationDays: 7,
  description: '20刀体验组周卡-共享账户',
  tags: ['20刀体验组'],
  permissions: ['claude']
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 生成默认名称（20刀体验_YYYYMMDD_HHMMSS）
 */
function generateDefaultName() {
  const now = new Date()
  const offset = parseInt(process.env.TIMEZONE_OFFSET || '8', 10)
  const localTime = new Date(now.getTime() + offset * 60 * 60 * 1000)

  const year = localTime.getUTCFullYear()
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(localTime.getUTCDate()).padStart(2, '0')
  const hours = String(localTime.getUTCHours()).padStart(2, '0')
  const minutes = String(localTime.getUTCMinutes()).padStart(2, '0')
  const seconds = String(localTime.getUTCSeconds()).padStart(2, '0')

  return `20刀体验_${year}${month}${day}_${hours}${minutes}${seconds}`
}

/**
 * 计算过期时间
 */
function calculateExpirationDate(days) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  // 设置为当天的 05:59:08.330 UTC (13:59 北京时间)
  expiresAt.setUTCHours(5, 59, 8, 330)
  return expiresAt.toISOString()
}

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    name: generateDefaultName(),
    totalCostLimit: DEFAULT_CONFIG.totalCostLimit,
    claudeConsoleAccountId: DEFAULT_CONFIG.claudeConsoleAccountId,
    expirationDays: DEFAULT_CONFIG.expirationDays,
    description: DEFAULT_CONFIG.description,
    output: null,
    help: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const nextArg = args[i + 1]

    switch (arg) {
      case '--name':
        options.name = nextArg
        i++
        break
      case '--totalCostLimit':
        options.totalCostLimit = parseFloat(nextArg)
        i++
        break
      case '--claudeConsoleAccountId':
        options.claudeConsoleAccountId = nextArg
        i++
        break
      case '--expirationDays':
        options.expirationDays = parseInt(nextArg, 10)
        i++
        break
      case '--description':
        options.description = nextArg
        i++
        break
      case '--output':
        options.output = nextArg
        i++
        break
      case '--help':
      case '-h':
        options.help = true
        break
    }
  }

  // 设置默认输出路径（data/xianyu-cc 目录，Docker 容器中已映射到宿主机）
  if (!options.output) {
    options.output = path.join(__dirname, '..', 'data', 'xianyu-cc', `${options.name}.md`)
  }

  return options
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
${chalk.blue.bold('API Key 创建和发货文档生成脚本')}

${chalk.yellow('用法:')}
  node scripts/create-apikey-delivery.js [options]

${chalk.yellow('参数:')}
  --name <名称>                    API Key 名称
                                   默认: 20刀体验_\${当前日期}_\${当前时间}
  --totalCostLimit <金额>          总成本限制（美元）
                                   默认: ${DEFAULT_CONFIG.totalCostLimit}
  --claudeConsoleAccountId <ID>   Claude Console 账户 ID
                                   默认: ${DEFAULT_CONFIG.claudeConsoleAccountId}
  --expirationDays <天数>          过期天数
                                   默认: ${DEFAULT_CONFIG.expirationDays}
  --description <描述>             API Key 描述
                                   默认: ${DEFAULT_CONFIG.description}
  --output <路径>                  输出文档路径
                                   默认: data/xianyu-cc/\${name}.md
  --help, -h                      显示帮助信息

${chalk.yellow('示例:')}
  # 使用默认参数创建
  node scripts/create-apikey-delivery.js

  # 自定义名称和金额
  node scripts/create-apikey-delivery.js --name "测试账户_001" --totalCostLimit 50

  # 指定完整参数
  node scripts/create-apikey-delivery.js \\
    --name "VIP客户_20260111" \\
    --totalCostLimit 100 \\
    --expirationDays 30 \\
    --description "VIP客户专属账户"

${chalk.yellow('环境变量:')}
  需要在 .env 文件中配置以下变量:
  - ADMIN_USERNAME: 管理员用户名
  - ADMIN_PASSWORD: 管理员密码
  - API_HOST: 服务地址 (默认 127.0.0.1)
  - PORT: 服务端口 (默认 12350)
`)
}

// ============================================================================
// HTTP 请求函数
// ============================================================================

/**
 * 发送 HTTP 请求
 */
async function httpRequest(url, options = {}) {
  const http = require('http')
  const https = require('https')

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      rejectUnauthorized: false // 允许自签名证书
    }

    const req = client.request(reqOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, data: json })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

/**
 * 管理员登录获取 token
 */
async function adminLogin(baseUrl, username, password) {
  console.log(chalk.blue('🔐 正在登录管理后台...'))

  const response = await httpRequest(`${baseUrl}/web/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })

  if (response.status !== 200 || !response.data.success) {
    throw new Error(`登录失败: ${response.data.message || '未知错误'}`)
  }

  console.log(chalk.green('✅ 登录成功'))
  return response.data.token
}

/**
 * 创建 API Key
 */
async function createApiKey(baseUrl, token, options) {
  console.log(chalk.blue('🔑 正在创建 API Key...'))

  const payload = {
    name: options.name,
    description: options.description,
    tokenLimit: 0,
    rateLimitWindow: null,
    rateLimitRequests: null,
    rateLimitCost: null,
    concurrencyLimit: 0,
    dailyCostLimit: 0,
    totalCostLimit: options.totalCostLimit,
    weeklyOpusCostLimit: 0,
    expiresAt: calculateExpirationDate(options.expirationDays),
    expirationMode: 'fixed',
    permissions: DEFAULT_CONFIG.permissions,
    tags: DEFAULT_CONFIG.tags,
    enableModelRestriction: false,
    restrictedModels: [],
    enableClientRestriction: false,
    allowedClients: [],
    claudeConsoleAccountId: options.claudeConsoleAccountId
  }

  const response = await httpRequest(`${baseUrl}/admin/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`创建 API Key 失败: ${response.data.message || JSON.stringify(response.data)}`)
  }

  if (!response.data.success) {
    throw new Error(`创建 API Key 失败: ${response.data.message || '未知错误'}`)
  }

  console.log(chalk.green('✅ API Key 创建成功'))
  return response.data.data
}

// ============================================================================
// 文档生成
// ============================================================================

/**
 * 生成发货文档
 */
function generateDeliveryDocument(apiKeyData) {
  const { id, apiKey, name } = apiKeyData

  return `# 发货信息

## 标准发货信息

\`\`\`
Hi，您的订单已发货！

【订单号】
${id}

【账号信息】
卡号：${name}
密码：${apiKey}

【使用教程】
教程地址：http://106.74.22.5:12350（请复制到浏览器打开，内含详细使用方法和配置教程）

【关于退款】
如果您改变主意不想要了，请不要使用卡密，也不要点击【申请退款】。

正确退款方式：
请直接在订单里留言"退款"，客服上线后会为您手动关闭订单并退款。

【重要提示】
- 卡密（API Key）为虚拟商品，一旦使用，无法退换
- 请妥善保管您的API Key，不要泄露给他人
- 使用期限为一周，20美元用量，不限次数
- 遇到问题请及时联系客服

感谢惠顾，期待与您再次相遇！
\`\`\`

## 简洁版发货信息

\`\`\`
Hi，您的订单已发货！

订单号：${id}
卡号：${name}
密码：${apiKey}

教程地址：http://106.74.22.5:12350（请复制到浏览器打开，内含详细使用方法和配置教程）

退款说明：
如需退款，请勿使用卡密，直接在订单留言"退款"，客服会为您处理。

注意：虚拟商品一旦使用无法退换，请确认后再使用。

感谢惠顾！
\`\`\`

## 变量说明

发货时需要替换的变量：
- \`[订单号]\`：闲鱼订单编号
- \`[编号]\`：卡号序号，用于区分不同订单
- \`[API_KEY]\`：生成的实际API Key（cr_开头）

## 配置说明

如果使用自己的域名，需要修改教程地址为：
- \`http://你的域名/admin-next/stats\`
- 或 \`http://IP地址:端口/admin-next/stats\`

例如：
- \`http://104.62.94.44:3000/admin-next/stats\`
- \`http://www.aiclaude.top/admin-next/stats\`
`
}

/**
 * 保存发货文档
 */
function saveDeliveryDocument(content, outputPath) {
  // 确保目录存在
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(outputPath, content, 'utf8')
  console.log(chalk.green(`✅ 发货文档已保存: ${outputPath}`))
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  const options = parseArgs()

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  console.log(chalk.blue.bold('\n🚀 API Key 创建和发货文档生成\n'))

  // 验证环境变量
  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD
  const port = process.env.PORT || '12350'
  const host = process.env.API_HOST || '127.0.0.1'

  if (!adminUsername || !adminPassword) {
    console.error(chalk.red('❌ 错误: 请在 .env 文件中配置 ADMIN_USERNAME 和 ADMIN_PASSWORD'))
    process.exit(1)
  }

  const baseUrl = `http://${host}:${port}`

  console.log(chalk.gray(`服务地址: ${baseUrl}`))
  console.log(chalk.gray(`API Key 名称: ${options.name}`))
  console.log(chalk.gray(`总成本限制: $${options.totalCostLimit}`))
  console.log(chalk.gray(`过期天数: ${options.expirationDays} 天`))
  console.log(chalk.gray(`输出路径: ${options.output}\n`))

  try {
    // 1. 登录
    const token = await adminLogin(baseUrl, adminUsername, adminPassword)

    // 2. 创建 API Key
    const apiKeyData = await createApiKey(baseUrl, token, options)

    // 3. 生成发货文档
    const document = generateDeliveryDocument(apiKeyData)

    // 4. 保存文档
    saveDeliveryDocument(document, options.output)

    // 5. 显示结果摘要
    console.log(chalk.green.bold('\n✅ 操作完成！\n'))
    console.log(chalk.yellow('📋 API Key 信息:'))
    console.log(`   ID:     ${chalk.cyan(apiKeyData.id)}`)
    console.log(`   名称:   ${chalk.cyan(apiKeyData.name)}`)
    console.log(`   API Key: ${chalk.cyan(apiKeyData.apiKey)}`)
    console.log(`   过期时间: ${chalk.cyan(apiKeyData.expiresAt)}`)
    console.log(`   总成本限制: ${chalk.cyan('$' + apiKeyData.totalCostLimit)}`)
    console.log(`\n📄 发货文档: ${chalk.cyan(options.output)}\n`)
  } catch (error) {
    console.error(chalk.red(`\n❌ 错误: ${error.message}`))
    process.exit(1)
  }
}

// 运行主函数
main()
