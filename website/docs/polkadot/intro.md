# Polkadot 快速入门

欢迎来到 Polkadot 快速入门指南！本指南基于你的实际代码实现，帮助你快速上手 Polkadot 区块链开发。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install @polkadot/api @polkadot/keyring @polkadot/util-crypto @polkadot/util
npm install @clover-network/node-types bn.js bignumber.js
```

### 2. 连接网络
```javascript
const cloverTypes = require('@clover-network/node-types');
const { ApiPromise, WsProvider } = require('@polkadot/api');

const wsProvider = new WsProvider('wss://api.clover.finance');
const api = await ApiPromise.create({ 
  provider: wsProvider, 
  types: cloverTypes 
});
```

### 3. 创建账户
```javascript
const { Keyring } = require('@polkadot/api');
const { cryptoWaitReady, mnemonicGenerate } = require('@polkadot/util-crypto');

await cryptoWaitReady();
const keyring = new Keyring({ type: 'sr25519' });
const mnemonic = mnemonicGenerate();
const account = keyring.addFromMnemonic(mnemonic);
```

## 🌟 核心特性

- **多重签名**: 支持多种操作类型的多重签名账户
- **质押系统**: 完整的质押、提名和奖励管理
- **批量操作**: 高效的批量交易处理
- **跨链兼容**: 支持多种网络和地址格式

## 📚 学习路径

### 1. 账户管理
- [账户创建与管理](./account/account.md) - 生成和管理 Polkadot 账户
- [密钥环管理](./account/keyring.md) - 配置和使用密钥环
- [助记词管理](./account/mnemonic.md) - 助记词生成和验证

### 2. 交易处理
- [交易构建与签名](./tx/transaction.md) - 创建和发送交易
- [交易解码](./tx/decode.md) - 解析交易数据和事件
- [多重签名交易](./tx/multi.md) - 多重签名交易流程
- [离线交易](./tx/offline.md) - 离线交易处理

### 3. 多重签名
- [多重签名账户创建](./multisig/account.md) - 创建多重签名账户
- [多重签名交易](./multisig/tx.md) - 多重签名交易流程
- [质押额外代币](./multisig/bond_extra.md) - 增加质押数量
- [质押和提名验证人](./multisig/bond_nominate.md) - 组合质押和提名
- [提名验证人](./multisig/nominate.md) - 提名验证人操作
- [多重签名启用](./multisig/enable.md) - 启用多重签名功能

### 4. 批量操作
- [批量转账](./batch/transfer.md) - 批量转账和条件处理

### 5. 质押功能
- [质押操作](./staking/apy.md) - 质押、提名和奖励管理

## 🛠️ 开发工具

- **@polkadot/api** - Polkadot JavaScript API
- **@polkadot/keyring** - 密钥管理库
- **@polkadot/util-crypto** - 加密工具库
- **@polkadot/util** - 通用工具库
- **@clover-network/node-types** - Clover 网络类型定义
- **bn.js** - 大数处理库

## 🌐 网络环境

| 网络         | RPC URL                       | SS58前缀 | 状态         |
| ------------ | ----------------------------- | -------- | ------------ |
| **Polkadot** | wss://rpc.polkadot.io         | 0        | ✅ 主网       |
| **Kusama**   | wss://kusama-rpc.polkadot.io  | 2        | ✅ 金丝雀网络 |
| **Clover**   | wss://api.clover.finance      | 42       | ✅ 活跃网络   |
| **Westend**  | wss://westend-rpc.polkadot.io | 42       | 🔧 测试网     |
| **Rococo**   | wss://rococo-rpc.polkadot.io  | 42       | 🔧 测试网     |

## 🏗️ 技术架构

### 共识机制
- **NPoS** - 提名权益证明
- **BABE** - 区块生成算法
- **GRANDPA** - 最终性工具

### 账户类型
- **sr25519** - 默认的加密算法
- **ed25519** - 兼容 Ed25519 的账户
- **ecdsa** - 兼容以太坊的账户

## 🚀 下一步

- 查看 [完整开发文档](./README.md)
- 开始 [账户管理](./account/account.md)
- 学习 [多重签名](./multisig/account.md)
- 探索 [质押系统](./staking/apy.md)

开始你的 Polkadot 开发之旅吧！
