---
slug: bitcoin-script-system
title: 比特币脚本系统详解 - 从理论到实践
authors: [iamnivekx]
tags: [bitcoin, script, blockchain, development]
---

比特币脚本系统是比特币网络的核心组件之一，它定义了如何验证交易的有效性。本文将深入探讨比特币脚本的工作原理，并通过实际代码示例来展示如何操作脚本。

以下代码参考 bitcoinjs-lib 的实现, 并进行了一些修改. 请参考 [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) 了解更多信息.

<!-- truncate -->

## 什么是比特币脚本？

比特币脚本是一种基于栈的编程语言，用于定义比特币交易的解锁和锁定条件。每个比特币交易都包含输入脚本（scriptSig）和输出脚本（scriptPubKey），通过执行这些脚本来验证交易的有效性。

## 核心功能模块

### 1. 脚本编译 (compile)

脚本编译是将脚本块（chunks）转换为字节码的过程：

```ts file=<rootDir>/examples/bitcoin/script.ts#L29-L74 showLineNumbers

compile
```

### 2. 脚本反编译 (decompile)

反编译是将字节码转换回脚本块的过程：

```ts file=<rootDir>/examples/bitcoin/script.ts#L76-L111 showLineNumbers
```

### 3. ASM 格式转换

比特币脚本支持人类可读的 ASM（Assembly）格式：

```ts file=<rootDir>/examples/bitcoin/script.ts#L113-L150 showLineNumbers
```

## 实际应用示例

### 创建 P2PKH 脚本

```ts
// 创建一个标准的 P2PKH 脚本
const pubkeyHash = Buffer.from('1234567890abcdef1234567890abcdef12345678', 'hex');
const p2pkhScript = [
  OPS.OP_DUP,
  OPS.OP_HASH160,
  pubkeyHash,
  OPS.OP_EQUALVERIFY,
  OPS.OP_CHECKSIG
];

const compiledScript = compile(p2pkhScript);
console.log('Compiled script:', compiledScript.toString('hex'));
```

### 验证公钥格式

```ts
const pubkey = Buffer.from('02...', 'hex'); // 你的公钥
if (isCanonicalPubKey(pubkey)) {
  console.log('Valid canonical public key');
} else {
  console.log('Invalid public key format');
}
```

## 最小推送策略 (BIP62.3)

比特币脚本遵循最小推送策略，确保数据以最紧凑的方式表示：

```ts file=<rootDir>/examples/bitcoin/script.ts#L13-L18 showLineNumbers
```

## 总结

比特币脚本系统提供了强大的灵活性来定义各种交易条件。通过理解脚本的编译、反编译和 ASM 格式转换，开发者可以：

1. 创建自定义的交易类型
2. 验证交易脚本的有效性
3. 调试和优化脚本性能
4. 实现复杂的智能合约逻辑

在下一篇文章中，我们将探讨比特币地址的生成和验证机制。 