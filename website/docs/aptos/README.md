# Aptos 开发文档

欢迎来到Aptos开发文档！这里包含了完整的Aptos区块链开发指南，从基础概念到高级应用。

## 📚 文档结构

### 1. 账户管理
- **[账户创建](./account/account.md)** - 账户生成、密钥管理和地址派生
- **[地址管理](./account/address.md)** - 公钥到地址的转换和验证

### 2. 代币操作
- **[代币转账](./token/transfer.md)** - 基础代币转账操作
- **[自定义代币](./token/your-coin.md)** - 创建和管理自定义代币
- **[代币余额](./token/balance.md)** - 查询和管理代币余额

### 3. NFT功能
- **[NFT创建](./nft/nft.md)** - 创建和管理NFT集合
- **[NFT转账](./nft/transfer.md)** - NFT所有权转移

### 4. 多重签名
- **[多签账户](./multisig/account.md)** - 多重签名账户创建
- **[多签交易](./multisig/transaction.md)** - 多签交易构建和签名

### 5. 交易处理
- **[交易构建](./tx/transaction.md)** - 交易创建和签名
- **[交易提交](./tx/submit.md)** - 交易广播和确认

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
npm install aptos

# 或者使用yarn
yarn add aptos
```

### 创建账户
```typescript
import { AptosAccount } from "aptos";

// 创建新账户
const account = new AptosAccount();
console.log('Address:', account.address().hex());
console.log('Private Key:', account.toPrivateKeyObject());
```

### 连接网络
```typescript
import { AptosClient } from "aptos";

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);

// 获取链信息
const chainId = await client.getChainId();
console.log('Chain ID:', chainId);
```

### 查询余额
```typescript
import { CoinClient } from "aptos";

const coinClient = new CoinClient(client);
const balance = await coinClient.checkBalance(account);
console.log('Balance:', balance);
```

### 发送交易
```typescript
import { FaucetClient } from "aptos";

const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

// 资助账户
await faucetClient.fundAccount(account.address(), 100_000_000);

// 转账
const txnHash = await coinClient.transfer(
  account, 
  receiverAccount, 
  1000, 
  { gasUnitPrice: BigInt(100) }
);

// 等待交易确认
await client.waitForTransaction(txnHash);
```

## 🔧 开发工具

- **Aptos SDK** - 官方TypeScript/JavaScript SDK
- **Move** - 智能合约开发语言
- **Aptos CLI** - 命令行工具
- **Aptos Explorer** - 区块链浏览器
- **Aptos Faucet** - 测试网代币获取

## 🌐 网络环境

| 网络   | RPC URL                                | Faucet URL                           | 状态     |
| ------ | -------------------------------------- | ------------------------------------ | -------- |
| 主网   | https://fullnode.mainnet.aptoslabs.com | -                                    | ✅ 活跃   |
| 测试网 | https://fullnode.testnet.aptoslabs.com | https://faucet.testnet.aptoslabs.com | ✅ 活跃   |
| 开发网 | https://fullnode.devnet.aptoslabs.com  | https://faucet.devnet.aptoslabs.com  | 🔧 可配置 |

## 📖 核心概念

### 账户模型
Aptos使用基于资源的账户模型，每个账户都有：
- 唯一的地址
- 认证密钥
- 资源存储
- 模块代码

### 资源系统
Move语言中的资源是：
- 不可分割的数据单元
- 具有类型安全
- 支持所有权转移
- 防止资源丢失

### 交易结构
每个Aptos交易包含：
- 发送者地址
- 序列号
- 有效载荷
- 最大gas费用
- gas单价
- 过期时间
- 链ID

### 多重签名
支持多种签名方案：
- Ed25519单签
- MultiEd25519多签
- 可配置阈值
- 位图签名验证

## 🎯 最佳实践

1. **错误处理**: 始终检查交易状态和错误
2. **Gas估算**: 合理设置gas限制和价格
3. **资源管理**: 正确管理Move资源生命周期
4. **安全考虑**: 使用安全的密钥管理方案
5. **测试**: 在开发网充分测试后再部署主网

## 📚 学习资源

- [Aptos官方文档](https://aptos.dev/)
- [Move语言教程](https://move-book.com/)
- [Aptos SDK文档](https://aptos-labs.github.io/ts-sdk-doc/)
- [Aptos论坛](https://forum.aptoslabs.com/)

开始构建你的Aptos应用吧！
