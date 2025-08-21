# Ripple 快速入门

欢迎来到 Ripple 快速入门指南！本指南基于你的实际代码实现，帮助你快速上手 Ripple 区块链开发。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install ripple-lib ripple-address-codec ripple-binary-codec
npm install lodash base-x
```

### 2. 连接网络
```javascript
const RippleAPI = require('ripple-lib').RippleAPI;

const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net/', // 测试网
});

await api.connect();
```

### 3. 生成地址
```javascript
const secret = 'sapyGYwE3bh3JiYU59hFdecU2PovC';
const keypair = api.deriveKeypair(secret);
const address = api.deriveAddress(keypair.publicKey);
console.log('Address:', address);
```

## 🌟 核心特性

- **快速交易**: 3-5秒确认时间
- **低费用**: 每笔交易仅需0.00001 XRP
- **多重签名**: 支持最多8个签名者
- **跨链兼容**: 支持多种资产和代币
- **地址格式**: 经典地址和X地址支持

## 📚 学习路径

### 1. 账户管理
- [地址生成](./account/address.md) - 生成和管理 Ripple 地址
- [账户检查](./account/check.md) - 验证地址和查询账户信息
- [账户启用](./account/enable.md) - 激活和配置账户
- [账户标志](./account/flag.md) - 设置账户标志

### 2. 交易处理
- [SDK交易](./tx/sign-sdk.md) - 使用SDK交易创建、签名和提交
- [离线交易](./tx/sign-external.md) - 使用离线交易处理和签名
- [HTTP交易](./tx/http.md) - 通过HTTP接口处理
- [交易编码](./tx/codec.md) - 交易序列化

### 3. 多重签名
- [多重签名账户](./multisig/account.md) - 创建多重签名账户
- [多重签名交易](./multisig/tx.md) - 处理多重签名交易
- [多重签名启用](./multisig/enable.md) - 启用多重签名功能

## 🛠️ 开发工具

- **ripple-lib** - 官方JavaScript SDK
- **ripple-address-codec** - 地址编码库
- **ripple-binary-codec** - 交易序列化库
- **base-x** - Base58编码库
- **lodash** - 实用工具库

## 🌐 网络环境

| 网络       | RPC URL                        | 状态     | 用途     |
| ---------- | ------------------------------ | -------- | -------- |
| **主网**   | wss://s1.ripple.com/           | ✅ 活跃   | 生产环境 |
| **测试网** | wss://s.altnet.rippletest.net/ | ✅ 活跃   | 开发测试 |
| **开发网** | wss://s.devnet.rippletest.net/ | 🔧 可配置 | 开发测试 |

## 🏗️ 技术架构

### 共识机制
- **共识协议** - 基于拜占庭容错的共识
- **验证节点** - 去中心化验证网络
- **区块确认** - 3-5秒快速确认

### 账户类型
- **经典地址** - 传统Ripple地址格式
- **X地址** - 新的地址格式，支持标签
- **多重签名** - 多签名者账户

## 🚀 下一步

- 查看 [完整开发文档](./README.md)
- 开始 [地址生成](./account/address.md)
- 学习 [SDK交易](./tx/sign-sdk.md)
- 探索 [多重签名](./multisig/account.md)

开始你的 Ripple 开发之旅吧！
