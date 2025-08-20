# Solana开发指南

欢迎来到Solana开发指南！本指南将帮助你掌握Solana区块链开发的核心概念和实践技能。

## 什么是Solana？

Solana是一个高性能的Layer 1区块链平台，专注于可扩展性和低费用。它使用创新的共识机制组合，包括历史证明（PoH）和工作量证明（PoW），支持高吞吐量交易处理。

## 核心特性

- **高性能**: 支持65,000+ TPS
- **低费用**: 交易费用极低（约$0.00025）
- **快速确认**: 400ms区块确认时间
- **智能合约**: 支持Rust、C、C++等语言
- **跨链兼容**: 支持SPL代币标准

## 学习路径

### 1. 账户管理
- [余额查询](./account/balance.md) - 账户余额查询和管理

### 2. 代币操作
- [代币转账](./token/transfer.md) - 代币转账和余额管理

### 3. DeFi集成
- [Jupiter聚合器](./defi/jupiter.md) - 去中心化交易聚合
- [Raydium集成](./defi/raydium.md) - AMM流动性池操作

### 4. 多重签名
- [Squads V3](./multisig/squads-v3.md) - 传统多重签名钱包管理
- [Squads V4](./multisig/squads-v4.md) - 模块化多重签名钱包管理

### 5. 订阅和监控
- [事件订阅](./subscribes/subscribes.md) - 区块链事件监听
- [价格监控](./subscribes/price.md) - 代币价格实时监控

## 开发工具

- **Solana CLI**: 命令行工具
- **@solana/web3.js**: JavaScript/TypeScript SDK
- **@solana/spl-token**: SPL代币库
- **Anchor**: Rust智能合约框架
- **Phantom**: 钱包扩展

## 网络环境

| 网络   | RPC URL                             | 用途     |
| ------ | ----------------------------------- | -------- |
| 主网   | https://api.mainnet-beta.solana.com | 生产环境 |
| 测试网 | https://api.testnet.solana.com      | 测试环境 |
| 开发网 | https://api.devnet.solana.com       | 开发测试 |

## 核心概念

- **账户**: 每个账户都有唯一的公钥地址
- **SOL**: 原生代币，用于支付交易费用和质押
- **SPL**: Solana程序库，定义代币标准
- **交易**: 包含指令的状态转换操作
- **程序**: 可执行的智能合约代码

开始你的Solana开发之旅吧！
