---
slug: bitcoin-transaction-classification
title: 比特币交易类型分类详解 - 识别与分析
authors: [iamnivekx]
tags: [bitcoin, transaction, p2pkh, p2sh, segwit, multisig]
---

比特币网络支持多种交易类型，每种类型都有其特定的脚本模式和用途。本文将详细介绍如何识别和分类不同的比特币交易类型，这对于理解交易结构和开发相关应用至关重要。

<!-- truncate -->

## 比特币交易类型概述

比特币支持以下主要交易类型：

1. **P2PKH (Pay-to-Public-Key-Hash)** - 最传统的交易类型
2. **P2SH (Pay-to-Script-Hash)** - 脚本哈希支付
3. **P2WPKH (Pay-to-Witness-Public-Key-Hash)** - 原生 SegWit
4. **P2WSH (Pay-to-Witness-Script-Hash)** - 见证脚本哈希
5. **P2PK (Pay-to-Public-Key)** - 直接支付给公钥
6. **Multisig** - 多签名交易
7. **Null Data** - 数据存储交易

## 核心分类函数

### 1. P2PKH 交易识别

P2PKH 是最常见的交易类型，使用公钥哈希作为锁定条件：

```ts file=<rootDir>/examples/bitcoin/classify.ts#L30-L40 showLineNumbers
```

**P2PKH 脚本结构：**
```
OP_DUP OP_HASH160 <20-byte-hash> OP_EQUALVERIFY OP_CHECKSIG
```

### 2. P2SH 交易识别

P2SH 允许支付给脚本哈希，支持更复杂的脚本：

```javascript
function p2sh(script) {
  typeforce(typeforce.Buffer, script);
  const buffer = compile(script);
  return (
    buffer.length === 23 && //
    buffer[0] === OPS.OP_HASH160 && // hash160
    buffer[1] === 0x14 && // length is 22
    buffer[22] === OPS.OP_EQUAL // equal
  );
}
```

**P2SH 脚本结构：**
```
OP_HASH160 <20-byte-hash> OP_EQUAL
```

### 3. P2WPKH 交易识别

原生 SegWit 交易，使用见证公钥哈希：

```javascript
function p2wpkh(script) {
  typeforce(typeforce.Buffer, script);
  const buffer = compile(script);

  return (
    buffer.length === 22 && //
    buffer[0] === OPS.OP_0 && // OP_0
    buffer[1] === 0x14
  );
}
```

**P2WPKH 脚本结构：**
```
OP_0 <20-byte-hash>
```

### 4. P2WSH 交易识别

见证脚本哈希交易，支持复杂的见证脚本：

```javascript
function p2wsh(script) {
  typeforce(typeforce.Buffer, script);
  const buffer = compile(script);

  return (
    buffer.length === 34 && //
    buffer[0] === OPS.OP_0 && // OP_0
    buffer[1] === 0x20
  );
}
```

**P2WSH 脚本结构：**
```
OP_0 <32-byte-hash>
```

### 5. P2PK 交易识别

直接支付给公钥的交易类型：

```javascript
function p2pk(script) {
  const chunks = decompile(script);
  return (
    chunks.length === 2 && //
    isCanonicalPubKey(chunks[0]) && //
    chunks[1] === OPS.OP_CHECKSIG
  );
}
```

**P2PK 脚本结构：**
```
<pubkey> OP_CHECKSIG
```

### 6. 多签名交易识别

多签名交易允许多个私钥共同控制资金：

```javascript
function multisig(script) {
  const chunks = decompile(script);
  const length = chunks.length;
  if (length < 4) return false;
  if (chunks[length - 1] !== OPS.OP_CHECKMULTISIG) return false;
  if (!typeforce.Number(chunks[0])) return false;
  if (!typeforce.Number(chunks[length - 2])) return false;

  const m = chunks[0] - OP_INT_BASE;
  const n = chunks[length - 2] - OP_INT_BASE;

  if (m <= 0) return false;
  if (n > 16) return false;
  if (m > n) return false;
  // m {pubkey}...{pubkey} n OP_CHECKMULTISIG - (m + n + OP_CHECKMULTISIG)
  if (n !== length - 3) return false;

  // pub keys
  const keys = chunks.slice(1, -2);
  return keys.every(isCanonicalPubKey);
}
```

**多签名脚本结构：**
```
<m> <pubkey1> <pubkey2> ... <pubkeyN> <n> OP_CHECKMULTISIG
```

### 7. 见证承诺交易识别

用于 SegWit 的见证承诺交易：

```javascript
function witness_commitment(script) {
  typeforce(typeforce.Buffer, script);
  const buffer = compile(script);
  return (
    buffer.length === 25 && //
    buffer[0] === OPS.OP_RETURN &&
    buffer[1] === 0x24 && //  Push the following 36 bytes (0x24)
    buffer.slice(2, 6).equals(Buffer.from('0x6a24aa21a9ed', 'hex'))
  );
}
```

## 交易类型分类器

创建一个综合的分类函数来识别所有交易类型：

```javascript
function classifyTransaction(script) {
  if (p2pkh(script)) return types.P2PKH;
  if (p2sh(script)) return types.P2SH;
  if (p2wpkh(script)) return types.P2WPKH;
  if (p2wsh(script)) return types.P2WSH;
  if (p2pk(script)) return types.P2PK;
  if (multisig(script)) return types.P2MS;
  if (witness_commitment(script)) return types.WITNESS_COMMITMENT;
  
  return types.NONSTANDARD;
}
```

## 实际应用示例

### 分析交易输出

```javascript
// 分析一个交易输出的脚本类型
function analyzeTransactionOutput(scriptHex) {
  const script = Buffer.from(scriptHex, 'hex');
  const type = classifyTransaction(script);
  
  console.log('Script Type:', type);
  console.log('Script ASM:', toASM(script));
  
  return {
    type,
    script,
    asm: toASM(script),
    isValid: type !== types.NONSTANDARD
  };
}

// 使用示例
const p2pkhScript = '76a914a002b6b9a3c3190ca8d9c7262ac6bdd7d4359d4a88ac';
const result = analyzeTransactionOutput(p2pkhScript);
console.log(result);
```

### 批量交易分析

```javascript
function batchAnalyzeTransactions(transactions) {
  return transactions.map(tx => {
    const outputs = tx.outputs.map(output => ({
      ...output,
      scriptType: classifyTransaction(output.script),
      scriptASM: toASM(output.script)
    }));
    
    return {
      txid: tx.txid,
      outputs
    };
  });
}
```

## 交易类型统计

```javascript
function getTransactionTypeStats(transactions) {
  const stats = {};
  
  transactions.forEach(tx => {
    tx.outputs.forEach(output => {
      const type = classifyTransaction(output.script);
      stats[type] = (stats[type] || 0) + 1;
    });
  });
  
  return stats;
}
```

## 安全考虑

1. **脚本验证**: 始终验证脚本的完整性和有效性
2. **类型检查**: 确保交易类型与预期用途匹配
3. **版本兼容**: 考虑不同比特币版本的脚本支持
4. **错误处理**: 妥善处理无法识别的脚本类型

## 性能优化

```javascript
// 缓存编译结果以提高性能
const scriptCache = new Map();

function classifyTransactionCached(script) {
  const scriptHex = script.toString('hex');
  
  if (scriptCache.has(scriptHex)) {
    return scriptCache.get(scriptHex);
  }
  
  const type = classifyTransaction(script);
  scriptCache.set(scriptHex, type);
  
  return type;
}
```

## 总结

比特币交易类型分类是理解区块链数据的基础。通过掌握各种交易类型的识别方法，开发者可以：

- 分析交易模式和趋势
- 构建智能的区块链浏览器
- 实现准确的交易验证
- 开发支持多种交易类型的钱包

在下一篇文章中，我们将探讨比特币交易的构建和签名过程。 