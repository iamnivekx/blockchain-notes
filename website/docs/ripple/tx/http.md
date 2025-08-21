---
id: http
title: HTTP交易
sidebar_label: HTTP交易
description: Ripple 通过HTTP接口处理交易的完整指南
---

# Ripple HTTP 交易处理

HTTP 交易是通过 HTTP 接口与 Ripple 网络交互的方式，适用于无法使用 WebSocket 连接的场景。

## 🚀 快速开始

### 环境准备

```bash
npm install ripple-lib ripple-binary-codec
```

### 基本设置

```javascript
const RippleAPI = require('ripple-lib').RippleAPI;
const codec = require('ripple-binary-codec');

// 创建 HTTP API 实例
const api = new RippleAPI({
  proxy: 'https://s.altnet.rippletest.net:51234/', // 测试网 HTTP 接口
  // proxy: 'https://s1.ripple.com:51234/', // 主网 HTTP 接口
});
```

## 📝 HTTP 交易流程

### 1. 配置 HTTP 代理

```javascript
function configureHttpProxy(network = 'testnet') {
  const proxies = {
    testnet: 'https://s.altnet.rippletest.net:51234/',
    mainnet: 'https://s1.ripple.com:51234/',
    devnet: 'https://s.devnet.rippletest.net:51234/',
  };
  
  return new RippleAPI({
    proxy: proxies[network],
  });
}
```

### 2. 创建 HTTP 交易

```javascript
async function createHttpTransaction(fromAddress, toAddress, amount) {
  try {
    const api = configureHttpProxy('testnet');
    
    // 准备交易
    const preparedTx = await api.prepareTransaction(
      {
        TransactionType: 'Payment',
        Account: fromAddress,
        Amount: api.xrpToDrops(amount),
        Destination: toAddress,
      },
      {
        maxLedgerVersionOffset: 75,
      }
    );
    
    console.log('HTTP transaction prepared:', preparedTx);
    return preparedTx;
  } catch (error) {
    console.error('HTTP transaction preparation failed:', error);
  }
}
```

### 3. HTTP 交易签名

```javascript
function signHttpTransaction(txJSON, secret) {
  try {
    const signed = api.sign(txJSON, secret);
    console.log('HTTP transaction signed');
    console.log('Transaction ID:', signed.id);
    console.log('Signed transaction:', signed.signedTransaction);
    return signed;
  } catch (error) {
    console.error('HTTP transaction signing failed:', error);
  }
}
```

### 4. HTTP 交易提交

```javascript
async function submitHttpTransaction(signedTransaction) {
  try {
    const api = configureHttpProxy('testnet');
    
    const result = await api.submit(signedTransaction);
    console.log('HTTP transaction submitted');
    console.log('Result code:', result.resultCode);
    console.log('Result message:', result.resultMessage);
    
    return result;
  } catch (error) {
    console.error('HTTP transaction submission failed:', error);
  }
}
```

## 🔄 完整 HTTP 交易示例

### 基本 HTTP 支付

```javascript
const from_address = 'rfXgErjK96k59evDnC22zX7vRo2hYaSiqc';
const secret = 'ssHAaRfvdDsF62da3dpDHgxHSnw4d';
const dest_address = 'rUCzEr6jrEyMpjhs4wSdQdz4g8Y382NxfM';

async function sendHttpPayment() {
  try {
    // 1. 创建 HTTP 交易
    const preparedTx = await createHttpTransaction(
      from_address,
      dest_address,
      '100'
    );
    
    // 2. 签名交易
    const signed = signHttpTransaction(preparedTx.txJSON, secret);
    
    // 3. 提交交易
    const result = await submitHttpTransaction(signed.signedTransaction);
    
    return result;
  } catch (error) {
    console.error('HTTP payment failed:', error);
  }
}
```

## ⚙️ 高级 HTTP 配置

### 自定义 HTTP 参数

```javascript
const httpTransactionParams = {
  TransactionType: 'Payment',
  Account: from_address,
  Amount: api.xrpToDrops('100'),
  Destination: dest_address,
  Fee: '12', // 自定义费用
  Flags: 2147483648, // 交易标志
  LastLedgerSequence: 19194490, // 最后账本序列
  Sequence: 19165274, // 序列号
};
```

### HTTP 请求配置

```javascript
function configureHttpOptions() {
  return {
    timeout: 30000, // 30秒超时
    retries: 3, // 重试次数
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Ripple-HTTP-Client/1.0',
    },
  };
}
```

## 🔍 HTTP 交易查询

### 查询账户信息

```javascript
async function getAccountInfoHttp(address) {
  try {
    const api = configureHttpProxy('testnet');
    
    const account = await api.getAccountInfo(address);
    console.log('Account info via HTTP:', account);
    return account;
  } catch (error) {
    console.error('Failed to get account info via HTTP:', error);
  }
}
```

### 查询交易历史

```javascript
async function getTransactionsHttp(address) {
  try {
    const api = configureHttpProxy('testnet');
    
    const transactions = await api.getTransactions(address);
    console.log('Transactions via HTTP:', transactions);
    return transactions;
  } catch (error) {
    console.error('Failed to get transactions via HTTP:', error);
  }
}
```

## 🚨 HTTP 错误处理

### HTTP 特定错误

```javascript
function handleHttpError(error) {
  if (error.code === 'ECONNREFUSED') {
    console.error('HTTP connection refused - check proxy URL');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('HTTP request timeout');
  } else if (error.response) {
    console.error('HTTP response error:', error.response.status);
  } else {
    console.error('HTTP error:', error.message);
  }
}
```

### HTTP 重试机制

```javascript
async function httpRequestWithRetry(requestFn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      console.log(`HTTP attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      
      // 指数退避
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## 📊 HTTP 性能优化

### HTTP 连接池

```javascript
class HttpConnectionPool {
  constructor(size = 5) {
    this.connections = [];
    this.size = size;
  }
  
  async getConnection() {
    if (this.connections.length < this.size) {
      const api = configureHttpProxy('testnet');
      this.connections.push(api);
    }
    return this.connections[0];
  }
  
  async releaseConnection(api) {
    // 保持连接，不释放
  }
}
```

### HTTP 请求缓存

```javascript
class HttpRequestCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 60000; // 1分钟缓存
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }
  
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.value;
    }
    return null;
  }
  
  clear() {
    this.cache.clear();
  }
}
```

## 🔐 HTTP 安全考虑

### HTTPS 验证

```javascript
function validateHttpsConnection(url) {
  if (!url.startsWith('https://')) {
    throw new Error('Only HTTPS connections are allowed for security');
  }
  
  // 验证证书（在实际应用中）
  console.log('HTTPS connection validated');
}
```

### HTTP 认证

```javascript
function configureHttpAuth(username, password) {
  return {
    auth: {
      username,
      password,
    },
    headers: {
      'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
  };
}
```

## 📱 移动端 HTTP 支持

### 移动端优化

```javascript
function configureMobileHttp() {
  return {
    timeout: 15000, // 移动端较短超时
    retries: 2, // 较少重试次数
    headers: {
      'User-Agent': 'Ripple-Mobile-Client/1.0',
      'Accept': 'application/json',
    },
  };
}
```

### 离线支持

```javascript
class MobileHttpClient {
  constructor() {
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
  }
  
  async sendRequest(request) {
    if (this.isOnline) {
      return await this.executeRequest(request);
    } else {
      this.offlineQueue.push(request);
      return { status: 'queued', message: 'Request queued for offline' };
    }
  }
  
  async processOfflineQueue() {
    if (this.isOnline && this.offlineQueue.length > 0) {
      const requests = [...this.offlineQueue];
      this.offlineQueue = [];
      
      for (const request of requests) {
        await this.executeRequest(request);
      }
    }
  }
}
```

## 🌐 网络配置

### 多网络支持

```javascript
const networks = {
  testnet: {
    http: 'https://s.altnet.rippletest.net:51234/',
    ws: 'wss://s.altnet.rippletest.net/',
    name: 'Testnet',
  },
  mainnet: {
    http: 'https://s1.ripple.com:51234/',
    ws: 'wss://s1.ripple.com/',
    name: 'Mainnet',
  },
  devnet: {
    http: 'https://s.devnet.rippletest.net:51234/',
    ws: 'wss://s.devnet.rippletest.net/',
    name: 'Devnet',
  },
};

function getNetworkConfig(network) {
  return networks[network] || networks.testnet;
}
```

## 📚 最佳实践

1. **HTTPS 优先**: 始终使用 HTTPS 连接确保安全
2. **超时设置**: 设置合理的请求超时时间
3. **重试机制**: 实现指数退避重试策略
4. **错误处理**: 处理网络和 HTTP 特定错误
5. **连接管理**: 合理管理 HTTP 连接池
6. **缓存策略**: 实现适当的请求缓存机制

## 📚 相关资源

- [Ripple HTTP API](https://xrpl.org/docs/references/http-websocket-apis/)
- [HTTP 状态码](https://xrpl.org/docs/references/http-websocket-apis/error-formatting/)
- [网络配置](https://xrpl.org/docs/references/rippleapi/rippleapi-constructor/)
- [错误处理](https://xrpl.org/docs/references/protocol/error-codes/)
