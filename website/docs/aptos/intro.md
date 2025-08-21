# Aptos 开发指南

欢迎来到Aptos开发指南！本指南将帮助你掌握Aptos区块链开发的核心概念和实践技能。

## 什么是Aptos？

Aptos是一个基于Move语言的Layer 1区块链平台，专注于安全性、可扩展性和可升级性。它使用拜占庭容错（BFT）共识机制，支持并行执行交易，并提供了强大的智能合约开发环境。

## 核心特性

- **Move语言**: 资源导向的智能合约语言
- **并行执行**: 支持交易并行处理
- **BFT共识**: 拜占庭容错共识机制
- **模块化架构**: 可升级的区块链基础设施
- **资源模型**: 基于资源的账户模型

## 学习路径

### 1. 账户管理
- [账户创建](./account/account.md) - 账户生成和密钥管理
- [地址派生](./account/address.md) - 公钥到地址的转换

### 2. 代币操作
- [代币转账](./token/transfer.md) - 基础代币转账
- [自定义代币](./token/your-coin.md) - 创建和管理自定义代币
- [代币余额](./token/balance.md) - 查询和管理代币余额

### 3. NFT功能
- [NFT创建](./nft/nft.md) - NFT创建
- [NFT转账](./nft/transfer.md) - NFT转账

### 4. 多重签名
- [多签账户](./multisig/account.md) - 多重签名账户创建
- [多签交易](./multisig/transaction.md) - 多签交易构建和签名

### 5. 交易处理
- [交易构建](./tx/transaction.md) - 交易创建和签名
- [交易提交](./tx/submit.md) - 交易广播和确认

## 开发工具

- **Aptos SDK**: 官方TypeScript/JavaScript SDK
- **Move**: 智能合约开发语言
- **Aptos CLI**: 命令行工具
- **Aptos Explorer**: 区块链浏览器

## 网络环境

| 网络   | RPC URL                                | Faucet URL                           | 用途     |
| ------ | -------------------------------------- | ------------------------------------ | -------- |
| 主网   | https://fullnode.mainnet.aptoslabs.com | -                                    | 生产环境 |
| 测试网 | https://fullnode.testnet.aptoslabs.com | https://faucet.testnet.aptoslabs.com | 测试环境 |
| 开发网 | https://fullnode.devnet.aptoslabs.com  | https://faucet.devnet.aptoslabs.com  | 开发测试 |

## 核心概念

- **账户**: 每个账户都有唯一的地址和认证密钥
- **资源**: Move语言中的核心概念，代表不可分割的数据
- **模块**: 可重用的代码单元，包含函数和资源定义
- **交易**: 状态转换的基本单位，包含payload和签名

开始你的Aptos开发之旅吧！
