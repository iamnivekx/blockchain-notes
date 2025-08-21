---
id: intro
title: Stellar 区块链介绍
sidebar_label: 介绍
---

# Stellar 区块链介绍

Stellar 是一个开源的分布式支付协议，旨在实现快速、低成本的跨境支付和资产转移。它使用联邦拜占庭协议（FBA）共识机制，支持多种资产类型和智能合约功能。

## 主要特性

- **快速交易**: 3-5秒确认时间
- **低成本**: 每笔交易费用极低
- **多资产支持**: 支持原生代币和自定义资产
- **去中心化交易所**: 内置去中心化交易功能
- **智能合约**: 支持 Stellar Smart Contracts (SSC)
- **跨链兼容**: 支持多种区块链网络

## 技术架构

### 共识机制
Stellar 使用联邦拜占庭协议（FBA），这是一种拜占庭容错算法，能够：
- 在网络中存在恶意节点时保持一致性
- 支持快速交易确认
- 实现去中心化的信任机制

### 账户模型
- 使用 Ed25519 椭圆曲线算法
- 支持多重签名
- 账户需要保持最小余额（1 XLM）
- 支持账户合并和删除

### 网络类型
- **主网**: 生产环境，真实资产
- **测试网**: 开发测试环境
- **Futurenet**: 新功能测试网络

## 核心概念

### 1. Lumens (XLM)
Stellar 的原生代币，用于：
- 支付交易费用
- 维持账户最小余额
- 网络治理

### 2. 资产 (Assets)
Stellar 支持两种类型的资产：
- **原生资产**: XLM
- **自定义资产**: 由用户发行的代币

### 3. 信任线 (Trustlines)
账户必须明确信任某个资产才能持有它，这提供了：
- 资产安全性
- 垃圾代币防护
- 用户控制权

### 4. 锚点 (Anchors)
连接传统金融系统和 Stellar 网络的机构，负责：
- 资产发行和赎回
- 法定货币转换
- 合规性管理

## 开发工具

### 核心库
- **Stellar SDK**: 官方 JavaScript/TypeScript SDK
- **Stellar Laboratory**: 在线测试工具
- **Horizon API**: 区块链数据查询 API

### 开发环境
```bash
# 安装 Stellar SDK
npm install stellar-sdk

# 安装椭圆曲线库
npm install elliptic
```

## 快速开始

### 1. 创建 Stellar 客户端
```javascript
const StellarSdk = require('stellar-sdk');

// 连接到测试网
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

// 连接到主网
const server = new StellarSdk.Server('https://horizon.stellar.org');
```

### 2. 生成账户
```javascript
// 生成随机密钥对
const pair = StellarSdk.Keypair.random();

console.log('Public Key:', pair.publicKey());
console.log('Secret Key:', pair.secret());
```

### 3. 查询账户信息
```javascript
async function getAccountInfo(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    console.log('Account ID:', account.accountId());
    console.log('Sequence Number:', account.sequenceNumber());
    
    account.balances.forEach(balance => {
      console.log(`${balance.asset_type}: ${balance.balance}`);
    });
  } catch (error) {
    console.error('Error loading account:', error);
  }
}
```

## 网络配置

### 测试网
```javascript
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;
```

### 主网
```javascript
const server = new StellarSdk.Server('https://horizon.stellar.org');
const networkPassphrase = StellarSdk.Networks.PUBLIC;
```

### Futurenet
```javascript
const server = new StellarSdk.Server('https://horizon-futurenet.stellar.org');
const networkPassphrase = StellarSdk.Networks.FUTURENET;
```

## 获取测试网 XLM

测试网水龙头：
- **Stellar lab**: https://lab.stellar.org/
