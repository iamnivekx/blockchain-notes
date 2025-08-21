# Cosmos 简介

Cosmos 是一个去中心化的区块链网络，旨在解决区块链的可扩展性、可用性和互操作性挑战。

## 核心特性

- **高性能**: 支持 10,000+ TPS
- **低费用**: 交易费用极低
- **快速确认**: 1-6 秒区块确认时间
- **跨链兼容**: 支持 IBC 协议和多种代币标准
- **权益证明**: 基于 PoS 的共识机制

## 技术架构

Cosmos 网络由以下组件组成：

- **Hub**: 中央区块链，负责连接其他区块链
- **Zone**: 独立的区块链网络
- **IBC**: 跨链通信协议
- **Tendermint Core**: 拜占庭容错共识引擎

## 快速开始

查看 [开发指南](./guide.md) 获取完整的学习路径和开发实践。

## 网络环境

| 网络   | RPC URL                                | 用途     |
| ------ | -------------------------------------- | -------- |
| 主网   | https://rpc.cosmos.network:26657       | 生产环境 |
| 测试网 | https://rpc.testnet.cosmos.network:443 | 测试环境 |
| 本地网 | http://localhost:26657                 | 开发测试 |

## 核心概念

- **账户**: 每个账户都有唯一的 Bech32 地址
- **ATOM**: 原生代币，用于支付交易费用和质押
- **IBC**: 跨链通信协议，实现区块链间互操作
- **交易**: 包含消息的状态转换操作

## 学习资源

- [Cosmos 官方文档](https://docs.cosmos.network/)
- [CosmJS 库](https://github.com/cosmos/cosmjs)
- [Cosmos SDK](https://github.com/cosmos/cosmos-sdk)
