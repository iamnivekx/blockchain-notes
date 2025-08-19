---
slug: bitcoin-transaction-building
title: 比特币交易构建与签名 - 完整实践指南
authors: [iamnivekx]
tags: [bitcoin, transaction, psbt, signature, bitcoinjs-lib]
---

比特币交易的构建和签名是区块链开发中的核心技能。本文将详细介绍如何使用比特币工具包构建各种类型的比特币交易，包括输入选择、输出创建、签名和广播。

<!-- truncate -->

## 交易构建基础

### 1. 环境设置

首先需要安装我们的比特币工具包：

```ts file=<rootDir>/examples/bitcoin/address/address.ts showLineNumbers

```

### 2. 密钥管理

```ts file=<rootDir>/examples/bitcoin/address/address.ts showLineNumbers

```

## PSBT 交易构建

PSBT (Partially Signed Bitcoin Transaction) 是现代比特币交易的标准格式。

```ts file=<rootDir>/examples/bitcoin/tx/bitcoin.js showLineNumbers

```

## 不同类型的交易构建

### 1. 地址生成

```ts file=<rootDir>/examples/bitcoin/address/address.ts showLineNumbers

```

### 2. 多签名交易

```ts file=<rootDir>/examples/bitcoin/address/multisig.ts showLineNumbers

```

## 交易签名

### 1. 单签名

```ts file=<rootDir>/examples/bitcoin/tx/bitcoin.js showLineNumbers

```

### 2. 多签名

```ts file=<rootDir>/examples/bitcoin/tx/bitcoin.js#L15-L42 showLineNumbers

```

## RBF (Replace-By-Fee) 交易

RBF 允许用更高手续费的交易替换未确认的交易。

```ts file=<rootDir>/examples/bitcoin/tx/rbf.js showLineNumbers

```

## 交易验证

```ts

```

## 交易广播

交易广播通常通过比特币节点或第三方 API 服务进行。你可以使用以下方式之一：

1. **本地比特币节点**: 使用 `bitcoin-cli sendrawtransaction`
2. **第三方 API**: 如 Blockstream、BlockCypher 等
3. **测试网**: 使用测试网 API 进行开发和测试

参考我们的工具函数：[packages/bitcoin/utils/crypto.ts](https://github.com/your-repo/packages/bitcoin/utils/crypto.ts) 用于交易哈希计算。

## 完整交易流程示例

```ts

```

## 安全最佳实践

1. **私钥安全**: 永远不要在代码中硬编码私钥
2. **网络选择**: 开发时使用测试网，生产时使用主网
3. **手续费计算**: 动态计算手续费以确保交易被确认
4. **输入验证**: 始终验证 UTXO 的有效性和所有权
5. **错误处理**: 实现完善的错误处理和回滚机制

## 总结

比特币交易构建是一个复杂但重要的过程。通过掌握 PSBT、各种交易类型和签名机制，开发者可以：

- 构建安全的比特币应用
- 实现复杂的交易逻辑
- 支持多种地址格式
- 优化交易费用和确认时间

在下一篇文章中，我们将探讨比特币工具函数和实用技巧。
