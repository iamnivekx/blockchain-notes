---
id: intro
title: Tron 区块链介绍
sidebar_label: 介绍
---

# Tron 区块链介绍

Tron 是一个去中心化的区块链平台，旨在构建全球数字内容娱乐系统。它使用权益证明（DPoS）共识机制，提供高吞吐量和低交易费用。

## 主要特性

- **高吞吐量**: 支持每秒数千笔交易
- **低费用**: 交易费用极低，适合小额交易
- **智能合约**: 支持 Solidity 智能合约
- **代币标准**: 支持 TRC10 和 TRC20 代币
- **去中心化应用**: 支持 DApp 开发

## 技术架构

### 共识机制
Tron 使用委托权益证明（DPoS）共识机制，由 27 个超级代表节点维护网络。

### 账户模型
- 使用椭圆曲线数字签名算法（ECDSA）
- 支持 secp256k1 曲线
- 地址格式：Base58Check 编码

### 网络类型
- **主网**: 主网环境，真实资产
- **Shasta 测试网**: 官方测试网络
- **Nile 测试网**: 社区测试网络

## 开发工具

### 核心库
- **TronWeb**: 官方 JavaScript SDK
- **TronBox**: 智能合约开发框架
- **TronGrid**: 区块链数据 API

### 开发环境
```bash
# 安装 TronWeb
npm install tronweb

# 安装 TronBox
npm install -g tronbox
```

## 快速开始

### 1. 创建 TronWeb 实例
```javascript
const TronWeb = require('tronweb');

const fullNode = 'https://api.trongrid.io';
const solidityNode = 'https://api.trongrid.io';
const eventServer = 'https://api.trongrid.io';
const privateKey = 'your-private-key';

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
```

### 2. 生成账户
```javascript
const account = await tronWeb.createAccount();
console.log('Address:', account.address.base58);
console.log('Private Key:', account.privateKey);
```

### 3. 查询余额
```javascript
const balance = await tronWeb.trx.getBalance(address);
console.log('Balance:', balance);
```
