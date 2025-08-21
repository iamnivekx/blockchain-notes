---
id: sdk-sign
title: 使用SDK交易
sidebar_label: 使用SDK交易
description: Ripple 使用SDK交易创建、签名和提交的完整指南
---

# Ripple 使用SDK交易处理

使用SDK交易是 Ripple 网络中最常用的交易方式，直接使用SDK进行交易。

## 🚀 快速开始

### 环境准备

```bash
npm install ripple-lib ripple-binary-codec lodash
```

### 基本设置

```javascript
const RippleAPI = require('ripple-lib').RippleAPI;
const codec = require('ripple-binary-codec');

// 创建 API 实例
const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net/', // 测试网
  // server: 'wss://s1.ripple.com/', // 主网
});
```

## 📝 交易流程

### 1. 连接网络

```javascript
async function connect() {
  try {
    await api.connect();
    console.log('Connected to Ripple network');
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

### 2. 查询账户信息

```javascript
async function getAccountInfo(address) {
  try {
    const account = await api.getAccountInfo(address);
    console.log('Account info:', account);
    return account;
  } catch (error) {
    console.error('Failed to get account info:', error);
  }
}
```

### 3. 准备交易

```javascript
async function prepareTransaction(fromAddress, toAddress, amount) {
  try {
    const preparedTx = await api.prepareTransaction(
      {
        TransactionType: 'Payment',
        Account: fromAddress,
        Amount: api.xrpToDrops(amount), // 转换为 drops
        Destination: toAddress,
      },
      {
        maxLedgerVersionOffset: 75, // 5分钟内过期
      }
    );
    
    console.log('Transaction prepared:', preparedTx);
    return preparedTx;
  } catch (error) {
    console.error('Failed to prepare transaction:', error);
  }
}
```

### 4. 交易序列化

```javascript
function serializeTransaction(txJSON) {
  try {
    const tx = JSON.parse(txJSON);
    const serialized = codec.encode(tx);
    console.log('Transaction serialized:', serialized);
    return serialized;
  } catch (error) {
    console.error('Serialization failed:', error);
  }
}
```

### 5. 签名交易

```javascript
function signTransaction(txJSON, secret) {
  try {
    const signed = api.sign(txJSON, secret);
    console.log('Transaction signed');
    console.log('Transaction ID:', signed.id);
    console.log('Signed transaction:', signed.signedTransaction);
    return signed;
  } catch (error) {
    console.error('Signing failed:', error);
  }
}
```

### 6. 提交交易

```javascript
async function submitTransaction(signedTransaction) {
  try {
    const result = await api.submit(signedTransaction);
    console.log('Transaction submitted');
    console.log('Result code:', result.resultCode);
    console.log('Result message:', result.resultMessage);
    return result;
  } catch (error) {
    console.error('Submission failed:', error);
  }
}
```

## 🔄 完整示例

### 基本支付交易

```javascript
const from_address = 'rfXgErjK96k59evDnC22zX7vRo2hYaSiqc';
const secret = 'ssHAaRfvdDsF62da3dpDHgxHSnw4d';
const dest_address = 'rUCzEr6jrEyMpjhs4wSdQdz4g8Y382NxfM';

async function sendPayment() {
  try {
    // 1. 连接网络
    await api.connect();
    
    // 2. 查询账户信息
    const account = await api.getAccountInfo(from_address);
    console.log('Account balance:', account.xrpBalance, 'XRP');
    
    // 3. 准备交易
    const preparedTx = await api.prepareTransaction(
      {
        TransactionType: 'Payment',
        Account: from_address,
        Amount: api.xrpToDrops('1'),
        Destination: dest_address,
      },
      {
        maxLedgerVersionOffset: 75,
      }
    );
    
    // 4. 序列化交易
    const serialized = serializeTransaction(preparedTx.txJSON);
    
    // 5. 签名交易
    const signed = signTransaction(preparedTx.txJSON, secret);
    
    // 6. 提交交易
    const result = await submitTransaction(signed.signedTransaction);
    
    // 7. 断开连接
    await api.disconnect();
    
    return result;
  } catch (error) {
    console.error('Payment failed:', error);
    await api.disconnect();
  }
}
```

## ⚙️ 高级配置

### 交易参数

```javascript
const transactionParams = {
  TransactionType: 'Payment',
  Account: from_address,
  Amount: api.xrpToDrops('1'),
  Destination: dest_address,
  Fee: '10000', // 自定义费用（drops）
  Flags: 0, // 交易标志
  Memos: [ // 备注信息
    {
      Memo: {
        MemoType: Buffer.from('text/plain', 'utf8').toString('hex'),
        MemoData: Buffer.from('Payment for services', 'utf8').toString('hex'),
      },
    },
  ],
};
```

### 交易选项

```javascript
const options = {
  maxLedgerVersionOffset: 75, // 过期时间
  maxFee: '100000', // 最大费用
  sequence: 123, // 序列号
};
```

## 🔍 交易状态查询

### 查询交易结果

```javascript
async function getTransactionResult(txID) {
  try {
    const tx = await api.getTransaction(txID);
    console.log('Transaction status:', tx.outcome?.result);
    console.log('Transaction fee:', tx.outcome?.fee);
    return tx;
  } catch (error) {
    console.error('Failed to get transaction:', error);
  }
}
```

### 查询账户交易历史

```javascript
async function getAccountTransactions(address) {
  try {
    const transactions = await api.getTransactions(address);
    console.log('Transaction count:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('Failed to get transactions:', error);
  }
}
```

## 🚨 错误处理

### 常见错误类型

```javascript
function handleError(error) {
  if (error.data && error.data.error_code) {
    switch (error.data.error_code) {
      case 'actNotFound':
        console.error('Account not found');
        break;
      case 'tecPATH_DRY':
        console.error('Insufficient liquidity');
        break;
      case 'tecUNFUNDED_PAYMENT':
        console.error('Insufficient funds');
        break;
      default:
        console.error('Unknown error:', error.data.error_code);
    }
  } else {
    console.error('Network error:', error.message);
  }
}
```

### 重试机制

```javascript
async function submitWithRetry(signedTransaction, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await api.submit(signedTransaction);
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

### 批量交易

```javascript
async function batchTransactions(transactions) {
  const results = [];
  for (const tx of transactions) {
    try {
      const result = await processTransaction(tx);
      results.push(result);
    } catch (error) {
      console.error('Transaction failed:', error);
      results.push({ error: error.message });
    }
  }
  return results;
}
```

### 连接池管理

```javascript
class RippleConnectionPool {
  constructor(size = 5) {
    this.connections = [];
    this.size = size;
  }
  
  async getConnection() {
    if (this.connections.length < this.size) {
      const api = new RippleAPI({ server: 'wss://s.altnet.rippletest.net/' });
      await api.connect();
      this.connections.push(api);
    }
    return this.connections[0];
  }
  
  async releaseConnection(api) {
    // 保持连接，不释放
  }
}
```

## 🔐 安全最佳实践

1. **私钥安全**: 永远不要在代码中硬编码私钥
2. **网络验证**: 验证服务器地址和SSL证书
3. **交易验证**: 仔细检查交易参数和接收地址
4. **错误处理**: 实现完整的错误处理和日志记录
5. **连接管理**: 合理管理网络连接，避免资源泄露

## 📚 相关资源

- [Ripple API 参考](https://xrpl.org/docs/references/rippleapi/)
- [交易类型](https://xrpl.org/docs/references/protocol/transactions/)
- [错误代码](https://xrpl.org/docs/references/protocol/error-codes/)
- [网络配置](https://xrpl.org/docs/references/rippleapi/rippleapi-constructor/)
