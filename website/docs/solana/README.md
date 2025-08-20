# Solana开发文档

欢迎来到Solana开发文档！这里包含了完整的Solana区块链开发指南，从基础概念到高级应用。

## 📚 文档结构

### 1. 账户管理
- **[账户创建](./account/account.md)** - 账户生成、密钥管理和地址派生
- **[余额查询](./account/balance.md)** - 账户余额查询和管理

### 2. SOL/SPL-TOKEN
- **[SPL代币](./token/spl-token.md)** - SPL代币操作
- **[SOL转账](./token/send-sol.md)** - 原生SOL代币转账

### 3. DeFi集成
- **[Jupiter聚合器](./defi/jupiter.md)** - 去中心化交易聚合
- **[Raydium集成](./defi/raydium.md)** - AMM流动性池操作

### 4. 多重签名
- **[Squads V3](./multisig/squads-v3.md)** - 传统多重签名钱包管理
- **[Squads V4](./multisig/squads-v4.md)** - 模块化多重签名钱包管理

### 5. 订阅和监控
- **[事件订阅](./subscribes/subscribes.md)** - 区块链事件监听
- **[价格监控](./subscribes/price.md)** - 代币价格实时监控

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
npm install @solana/web3.js @solana/spl-token

# 或者使用yarn
yarn add @solana/web3.js @solana/spl-token
```

### 创建账户
```typescript
import { Keypair } from '@solana/web3.js';

// 创建新账户
const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toBase58());
console.log('Secret Key:', bs58.encode(keypair.secretKey));
```

### 连接网络
```typescript
import { Connection, clusterApiUrl } from '@solana/web3.js';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const balance = await connection.getBalance(keypair.publicKey);
console.log('Balance:', balance / LAMPORTS_PER_SOL, 'SOL');
```

### 发送SOL
```typescript
import { SystemProgram, Transaction } from '@solana/web3.js';

const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver.publicKey,
    lamports: amount * LAMPORTS_PER_SOL,
  })
);

const signature = await connection.sendTransaction(transaction, [sender]);
await connection.confirmTransaction(signature);
```

## 🔧 开发工具

- **@solana/web3.js** - 官方JavaScript/TypeScript SDK
- **@solana/spl-token** - SPL代币标准库
- **@jup-ag/api** - Jupiter聚合器API
- **Anchor** - Rust智能合约框架
- **Solana CLI** - 命令行工具

## 🌐 网络环境

| 网络   | RPC URL                             | 状态     |
| ------ | ----------------------------------- | -------- |
| 主网   | https://api.mainnet-beta.solana.com | ✅ 活跃   |
| 测试网 | https://api.testnet.solana.com      | ✅ 活跃   |
| 开发网 | https://api.devnet.solana.com       | 🔧 可配置 |

## 📖 核心概念

### 账户模型
Solana使用账户模型，每个账户都有：
- 唯一的公钥地址
- 可选的私钥（系统账户没有私钥）
- 数据存储空间
- SOL余额

### SPL代币标准
SPL（Solana Program Library）定义了：
- 代币铸造和销毁
- 代币转账
- 代币账户管理
- 元数据标准

### 交易结构
每个Solana交易包含：
- 发送者账户
- 接收者账户
- 指令列表
- 签名
- 最近区块哈希

### 程序调用
Solana程序是：
- 可执行的智能合约
- 支持Rust、C、C++等语言
- 运行在Solana运行时中
- 可以修改账户状态

## 🎯 最佳实践

1. **错误处理**: 实现适当的错误处理和重试机制
2. **交易确认**: 始终等待交易确认
3. **费用估算**: 合理设置计算预算
4. **安全考虑**: 使用安全的密钥管理方案
5. **测试**: 在开发网充分测试后再部署主网

## 📚 学习资源

- [Solana官方文档](https://docs.solana.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor文档](https://book.anchor-lang.com/)
- [Jupiter文档](https://station.jup.ag/docs/apis/swap-api)

开始构建你的Solana应用吧！
