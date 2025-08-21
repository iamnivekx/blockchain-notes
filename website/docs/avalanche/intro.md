# Avalanche 开发指南

欢迎来到Avalanche开发指南！本指南将帮助你掌握Avalanche区块链开发的核心概念和实践技能。

## 什么是Avalanche？

Avalanche是一个高性能的Layer 1区块链平台，专注于可扩展性和低费用。它使用创新的共识机制，支持高吞吐量交易处理，并提供了三链架构来满足不同的应用需求。

## 核心特性

- **高性能**: 支持4,500+ TPS
- **低费用**: 交易费用极低（约$0.001）
- **快速确认**: 1-3秒区块确认时间
- **智能合约**: 支持EVM兼容的智能合约
- **跨链兼容**: 支持多链资产转移

## 学习路径

### 1. 账户管理
- [地址管理](./account/address.md) - 地址生成和密钥管理
- [密钥管理](./account/key-management.md) - 助记词和HD钱包

### 2. 交易操作
- [资产转移](./tx/transfer.md) - AVAX代币转账
- [SDK交易](./tx/sign-sdk.md) - 使用SDK交易创建、签名和提交
- [离线交易](./tx/sign-external.md) - 使用离线交易处理和签名
- [高级交易构建](./tx/advanced.md) - 手动构建交易
- [交易编码](./tx/decode.md) - 交易序列化

## 开发工具

- **AvalancheJS**: JavaScript/TypeScript SDK
- **Avalanche CLI**: 命令行工具
- **Avalanche Wallet**: 官方钱包
- **MetaMask**: 兼容C-Chain的以太坊钱包

## 网络环境

| 网络   | RPC URL                       | 用途     |
| ------ | ----------------------------- | -------- |
| 主网   | https://api.avax.network      | 生产环境 |
| 测试网 | https://api.avax-test.network | 测试环境 |
| 本地网 | http://localhost:9650         | 开发测试 |

## 核心概念

- **三链架构**: X-Chain、P-Chain、C-Chain各司其职
- **AVAX**: 原生代币，用于支付交易费用和质押
- **UTXO模型**: X-Chain使用UTXO模型进行资产转移
- **子网**: 可扩展的网络架构，支持自定义验证者
- **共识**: 创新的Avalanche共识协议

开始你的Avalanche开发之旅吧！

