---
id: external-sign
title: 离线交易
sidebar_label: 离线交易
description: Ripple 离线交易创建、签名和处理的完整指南
---

# Ripple 离线交易处理

离线交易允许你在不连接到 Ripple 网络的情况下创建和签名交易，适用于需要私钥和构建分离的场景。

## 🚀 快速开始

### 环境准备

```bash
npm install ripple-lib ripple-binary-codec lodash
```

### 基本设置

```javascript
const RippleAPI = require('ripple-lib').RippleAPI;
const codec = require('ripple-binary-codec');

// 创建离线 API 实例
const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net/',
});
```

## 📝 离线交易流程

### 1. 获取账户信息

```javascript
async function getAccountInfo(address) {
  try {
    await api.connect();
    const account = await api.getAccountInfo(address);
    await api.disconnect();
    return account;
  } catch (error) {
    console.error('Failed to get account info:', error);
    await api.disconnect();
  }
}
```

### 2. 准备离线交易

```javascript
async function prepareOfflineTransaction(fromAddress, toAddress, amount, sequence) {
  try {
    await api.connect();
    
    const preparedTx = await api.prepareTransaction(
      {
        TransactionType: 'Payment',
        Account: fromAddress,
        Amount: api.xrpToDrops(amount),
        Destination: toAddress,
        Sequence: sequence, // 手动指定序列号
      },
      {
        maxLedgerVersionOffset: 75,
      }
    );
    
    await api.disconnect();
    return preparedTx;
  } catch (error) {
    console.error('Failed to prepare transaction:', error);
    await api.disconnect();
  }
}
```

### 3. 离线签名

```javascript
function signOfflineTransaction(txJSON, secret) {
  try {
    const signed = api.sign(txJSON, secret);
    console.log('Transaction signed offline');
    console.log('Transaction ID:', signed.id);
    console.log('Signed transaction:', signed.signedTransaction);
    return signed;
  } catch (error) {
    console.error('Offline signing failed:', error);
  }
}
```

### 4. 交易序列化

```javascript
function serializeOfflineTransaction(txJSON) {
  try {
    const tx = JSON.parse(txJSON);
    const serialized = codec.encode(tx);
    console.log('Offline transaction serialized:', serialized);
    return serialized;
  } catch (error) {
    console.error('Serialization failed:', error);
  }
}
```

## 🔄 完整离线交易示例

### 基本离线支付

```javascript
const from_address = 'rfXgErjK96k59evDnC22zX7vRo2hYaSiqc';
const secret = 'ssHAaRfvdDsF62da3dpDHgxHSnw4d';
const dest_address = 'rUCzEr6jrEyMpjhs4wSdQdz4g8Y382NxfM';

async function createOfflinePayment() {
  try {
    // 1. 获取账户信息和序列号
    const account = await getAccountInfo(from_address);
    const sequence = account.sequence;
    
    console.log('Account sequence:', sequence);
    console.log('Account balance:', account.xrpBalance, 'XRP');
    
    // 2. 准备离线交易
    const preparedTx = await prepareOfflineTransaction(
      from_address,
      dest_address,
      '1',
      sequence
    );
    
    // 3. 离线签名
    const signed = signOfflineTransaction(preparedTx.txJSON, secret);
    
    // 4. 序列化交易
    const serialized = serializeOfflineTransaction(preparedTx.txJSON);
    
    // 5. 保存签名交易（用于后续提交）
    const offlineTransaction = {
      id: signed.id,
      signedTransaction: signed.signedTransaction,
      serialized: serialized,
      preparedAt: new Date().toISOString(),
      sequence: sequence,
    };
    
    console.log('Offline transaction created:', offlineTransaction);
    return offlineTransaction;
    
  } catch (error) {
    console.error('Offline payment creation failed:', error);
  }
}
```

## ⚙️ 高级离线功能

### 批量离线交易

```javascript
async function createBatchOfflineTransactions(fromAddress, transactions) {
  try {
    // 获取账户信息
    const account = await getAccountInfo(fromAddress);
    let currentSequence = account.sequence;
    
    const offlineTransactions = [];
    
    for (const tx of transactions) {
      const preparedTx = await prepareOfflineTransaction(
        fromAddress,
        tx.toAddress,
        tx.amount,
        currentSequence
      );
      
      const signed = signOfflineTransaction(preparedTx.txJSON, tx.secret);
      const serialized = serializeOfflineTransaction(preparedTx.txJSON);
      
      offlineTransactions.push({
        id: signed.id,
        signedTransaction: signed.signedTransaction,
        serialized: serialized,
        sequence: currentSequence,
        amount: tx.amount,
        toAddress: tx.toAddress,
      });
      
      currentSequence++;
    }
    
    return offlineTransactions;
  } catch (error) {
    console.error('Batch offline transactions failed:', error);
  }
}
```

### 离线交易验证

```javascript
function validateOfflineTransaction(offlineTx, expectedParams) {
  try {
    // 验证交易ID
    if (!offlineTx.id) {
      throw new Error('Missing transaction ID');
    }
    
    // 验证签名交易
    if (!offlineTx.signedTransaction) {
      throw new Error('Missing signed transaction');
    }
    
    // 验证序列化数据
    if (!offlineTx.serialized) {
      throw new Error('Missing serialized transaction');
    }
    
    // 验证序列号
    if (offlineTx.sequence !== expectedParams.sequence) {
      throw new Error('Sequence number mismatch');
    }
    
    // 验证金额
    if (offlineTx.amount !== expectedParams.amount) {
      throw new Error('Amount mismatch');
    }
    
    console.log('Offline transaction validation passed');
    return true;
  } catch (error) {
    console.error('Validation failed:', error.message);
    return false;
  }
}
```

## 🔐 安全考虑

### 私钥管理

```javascript
class SecureKeyManager {
  constructor() {
    this.keys = new Map();
  }
  
  // 安全存储私钥（仅示例，实际应用中应使用更安全的方法）
  storeKey(address, secret) {
    // 这里应该使用加密存储
    this.keys.set(address, secret);
  }
  
  // 获取私钥
  getKey(address) {
    return this.keys.get(address);
  }
  
  // 清除私钥
  clearKey(address) {
    this.keys.delete(address);
  }
}
```

### 离线环境安全

```javascript
function createSecureOfflineEnvironment() {
  // 1. 断开网络连接
  // 2. 禁用不必要的服务
  // 3. 使用专用设备
  // 4. 物理隔离
  
  console.log('Secure offline environment created');
}
```

## 📤 后续提交

### 提交离线交易

```javascript
async function submitOfflineTransaction(offlineTx) {
  try {
    await api.connect();
    
    const result = await api.submit(offlineTx.signedTransaction);
    console.log('Offline transaction submitted');
    console.log('Result code:', result.resultCode);
    console.log('Result message:', result.resultMessage);
    
    await api.disconnect();
    return result;
  } catch (error) {
    console.error('Submission failed:', error);
    await api.disconnect();
  }
}
```

### 批量提交

```javascript
async function submitBatchOfflineTransactions(offlineTransactions) {
  try {
    await api.connect();
    
    const results = [];
    for (const offlineTx of offlineTransactions) {
      try {
        const result = await api.submit(offlineTx.signedTransaction);
        results.push({
          id: offlineTx.id,
          result: result,
          success: result.resultCode === 'tesSUCCESS',
        });
      } catch (error) {
        results.push({
          id: offlineTx.id,
          error: error.message,
          success: false,
        });
      }
    }
    
    await api.disconnect();
    return results;
  } catch (error) {
    console.error('Batch submission failed:', error);
    await api.disconnect();
  }
}
```

## 🚨 错误处理

### 离线交易错误

```javascript
function handleOfflineTransactionError(error) {
  if (error.message.includes('sequence')) {
    console.error('Sequence number error - account may have been updated');
  } else if (error.message.includes('signature')) {
    console.error('Signature verification failed');
  } else if (error.message.includes('format')) {
    console.error('Transaction format error');
  } else {
    console.error('Unknown offline transaction error:', error.message);
  }
}
```

### 重试策略

```javascript
async function submitWithRetry(offlineTx, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await submitOfflineTransaction(offlineTx);
      if (result.resultCode === 'tesSUCCESS') {
        return result;
      }
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 📊 性能优化

### 离线交易缓存

```javascript
class OfflineTransactionCache {
  constructor() {
    this.cache = new Map();
  }
  
  // 缓存离线交易
  cacheTransaction(address, offlineTx) {
    if (!this.cache.has(address)) {
      this.cache.set(address, []);
    }
    this.cache.get(address).push(offlineTx);
  }
  
  // 获取缓存的交易
  getCachedTransactions(address) {
    return this.cache.get(address) || [];
  }
  
  // 清理过期交易
  cleanupExpiredTransactions() {
    const now = Date.now();
    for (const [address, transactions] of this.cache) {
      const validTransactions = transactions.filter(tx => {
        // 检查交易是否过期（基于序列号或其他时间戳）
        return true; // 简化示例
      });
      this.cache.set(address, validTransactions);
    }
  }
}
```

## 🔍 监控和日志

### 离线交易日志

```javascript
class OfflineTransactionLogger {
  constructor() {
    this.logs = [];
  }
  
  logOfflineTransaction(offlineTx, action) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      transactionId: offlineTx.id,
      action: action,
      sequence: offlineTx.sequence,
      amount: offlineTx.amount,
      toAddress: offlineTx.toAddress,
    };
    
    this.logs.push(logEntry);
    console.log('Offline transaction logged:', logEntry);
  }
  
  getLogs() {
    return this.logs;
  }
  
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

## 📚 最佳实践

1. **序列号管理**: 确保离线交易的序列号正确且唯一
2. **私钥安全**: 在离线环境中安全存储和管理私钥
3. **交易验证**: 在提交前验证离线交易的有效性
4. **错误处理**: 实现完整的错误处理和重试机制
5. **日志记录**: 记录所有离线交易操作以便审计
6. **网络隔离**: 确保离线环境与网络完全隔离

## 📚 相关资源

- [Ripple 离线交易指南](https://xrpl.org/docs/tutorials/manage-the-sending-sequence-number/)
- [交易序列化](https://xrpl.org/docs/references/protocol/serialization/)
- [安全最佳实践](https://xrpl.org/docs/tutorials/manage-account-security/)
- [多重签名](https://xrpl.org/docs/tutorials/manage-account-settings/multi-signing/)
