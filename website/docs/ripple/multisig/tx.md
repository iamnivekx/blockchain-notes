---
id: tx
title: 多重签名交易
sidebar_label: 多重签名交易
description: Ripple 多重签名交易处理和签名的完整指南
---

# Ripple 多重签名交易

多重签名交易需要多个签名者共同签名才能执行，提供更高的安全性和控制权。

## 🚀 快速开始

### 环境准备

```bash
npm install ripple-lib
```

### 基本设置

```javascript
const RippleAPI = require('ripple-lib').RippleAPI;

// 创建 API 实例
const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net/', // 测试网
  // server: 'wss://s1.ripple.com/', // 主网
});
```

## 📝 多重签名交易流程

### 1. 准备多重签名交易

```javascript
async function prepareMultisigTransaction(accountAddress, transactionData) {
  try {
    const preparedTx = await api.prepareTransaction(
      {
        ...transactionData,
        Account: accountAddress,
      },
      {
        maxLedgerVersionOffset: 75,
      }
    );
    
    console.log('Multisig transaction prepared:', preparedTx);
    return preparedTx;
  } catch (error) {
    console.error('Failed to prepare multisig transaction:', error);
  }
}
```

### 2. 创建多重签名交易

```javascript
async function createMultisigTransaction(preparedTx, signerSecrets) {
  try {
    const multisigTx = api.multisign(preparedTx.txJSON, signerSecrets);
    console.log('Multisig transaction created:', multisigTx);
    return multisigTx;
  } catch (error) {
    console.error('Failed to create multisig transaction:', error);
  }
}
```

### 3. 提交多重签名交易

```javascript
async function submitMultisigTransaction(multisigTx) {
  try {
    const result = await api.submit(multisigTx);
    console.log('Multisig transaction submitted');
    console.log('Result code:', result.resultCode);
    console.log('Result message:', result.resultMessage);
    
    return result;
  } catch (error) {
    console.error('Failed to submit multisig transaction:', error);
  }
}
```

## 🔄 完整多重签名交易示例

### 基本多重签名支付

```javascript
const account_address = 'rfXgErjK96k59evDnC22zX7vRo2hYaSiqc';
const dest_address = 'rUCzEr6jrEyMpjhs4wSdQdz4g8Y382NxfM';

// 签名者私钥（实际应用中应安全存储）
const signerSecrets = [
  'ssHAaRfvdDsF62da3dpDHgxHSnw4d', // 主账户
  'snQ8ipa9zdwX1taPZCmLq5RLNTrJR', // 签名者1
  'snQ8ipa9zdwX1taPZCmLq5RLNTrJR', // 签名者2
];

async function sendMultisigPayment() {
  try {
    // 1. 连接网络
    await api.connect();
    
    // 2. 准备支付交易
    const paymentData = {
      TransactionType: 'Payment',
      Amount: api.xrpToDrops('1'),
      Destination: dest_address,
    };
    
    const preparedTx = await prepareMultisigTransaction(
      account_address,
      paymentData
    );
    
    // 3. 创建多重签名交易
    const multisigTx = await createMultisigTransaction(
      preparedTx,
      signerSecrets
    );
    
    // 4. 提交交易
    const result = await submitMultisigTransaction(multisigTx);
    
    // 5. 断开连接
    await api.disconnect();
    
    return result;
  } catch (error) {
    console.error('Multisig payment failed:', error);
    await api.disconnect();
  }
}
```

## ⚙️ 高级多重签名功能

### 动态签名者管理

```javascript
class MultisigTransactionManager {
  constructor(accountAddress, api) {
    this.accountAddress = accountAddress;
    this.api = api;
    this.signers = new Map();
    this.pendingTransactions = new Map();
  }
  
  // 添加签名者
  addSigner(signerAddress, secret, weight) {
    this.signers.set(signerAddress, {
      address: signerAddress,
      secret: secret,
      weight: weight,
      addedAt: new Date(),
    });
  }
  
  // 移除签名者
  removeSigner(signerAddress) {
    this.signers.delete(signerAddress);
  }
  
  // 创建待签名交易
  async createPendingTransaction(transactionData) {
    try {
      const preparedTx = await this.api.prepareTransaction(
        {
          ...transactionData,
          Account: this.accountAddress,
        },
        {
          maxLedgerVersionOffset: 75,
        }
      );
      
      const txId = preparedTx.txJSON ? JSON.parse(preparedTx.txJSON).Sequence : Date.now();
      this.pendingTransactions.set(txId, {
        preparedTx,
        status: 'pending',
        signatures: [],
        createdAt: new Date(),
      });
      
      return { txId, preparedTx };
    } catch (error) {
      console.error('Failed to create pending transaction:', error);
    }
  }
  
  // 添加签名
  addSignature(txId, signerAddress, signature) {
    const pendingTx = this.pendingTransactions.get(txId);
    if (pendingTx) {
      pendingTx.signatures.push({
        signer: signerAddress,
        signature: signature,
        timestamp: new Date(),
      });
      
      // 检查是否达到签名要求
      this.checkSigningCompletion(txId);
    }
  }
  
  // 检查签名完成状态
  checkSigningCompletion(txId) {
    const pendingTx = this.pendingTransactions.get(txId);
    if (pendingTx) {
      const totalWeight = pendingTx.signatures.reduce((sum, sig) => {
        const signer = this.signers.get(sig.signer);
        return sum + (signer ? signer.weight : 0);
      }, 0);
      
      // 假设需要权重 3（实际应从账户配置获取）
      if (totalWeight >= 3) {
        pendingTx.status = 'ready';
        console.log(`Transaction ${txId} is ready for submission`);
      }
    }
  }
  
  // 提交已签名的交易
  async submitSignedTransaction(txId) {
    const pendingTx = this.pendingTransactions.get(txId);
    if (pendingTx && pendingTx.status === 'ready') {
      try {
        // 这里需要实现实际的签名合并逻辑
        const result = await this.api.submit(pendingTx.preparedTx.txJSON);
        pendingTx.status = 'submitted';
        pendingTx.result = result;
        
        return result;
      } catch (error) {
        pendingTx.status = 'failed';
        pendingTx.error = error.message;
        throw error;
      }
    }
  }
}
```

### 多重签名策略配置

```javascript
function configureMultisigStrategy(strategy, signers) {
  const strategies = {
    // 2-of-3 策略
    '2-of-3': {
      requiredSigners: 2,
      totalSigners: 3,
      weightThreshold: 2,
      description: '需要任意2个签名者签名',
    },
    
    // 3-of-5 策略
    '3-of-5': {
      requiredSigners: 3,
      totalSigners: 5,
      weightThreshold: 3,
      description: '需要任意3个签名者签名',
    },
    
    // 加权策略
    'weighted': {
      requiredWeight: 4,
      totalSigners: signers.length,
      weightThreshold: 4,
      description: '需要总权重达到4',
    },
    
    // 分层策略
    'hierarchical': {
      requiredSigners: 2,
      totalSigners: signers.length,
      weightThreshold: 3,
      description: '需要至少1个高级签名者',
      levels: {
        admin: { weight: 3, required: true },
        manager: { weight: 2, required: false },
        user: { weight: 1, required: false },
      },
    },
  };
  
  return strategies[strategy] || strategies['2-of-3'];
}
```

## 🔍 多重签名交易查询

### 查询待签名交易

```javascript
async function getPendingMultisigTransactions(accountAddress) {
  try {
    const account = await api.getAccountInfo(accountAddress);
    
    if (account.signers) {
      // 获取待处理的交易
      const pendingTxs = await api.getTransactions(accountAddress, {
        limit: 100,
        start: 0,
      });
      
      // 过滤出需要多重签名的交易
      const multisigTxs = pendingTxs.filter(tx => 
        tx.outcome && tx.outcome.result === 'tesSUCCESS' &&
        tx.outcome.engine_result === 'tesSUCCESS'
      );
      
      console.log('Pending multisig transactions:', multisigTxs);
      return multisigTxs;
    } else {
      console.log('Account does not have multisig enabled');
      return [];
    }
  } catch (error) {
    console.error('Failed to get pending multisig transactions:', error);
  }
}
```

### 查询签名状态

```javascript
async function getTransactionSigningStatus(txId, accountAddress) {
  try {
    const tx = await api.getTransaction(txId);
    
    if (tx.outcome && tx.outcome.engine_result === 'tesSUCCESS') {
      const status = {
        txId: txId,
        status: 'success',
        signatures: tx.outcome.engine_result_message || 'No signature info',
        timestamp: tx.date,
      };
      
      console.log('Transaction signing status:', status);
      return status;
    } else {
      const status = {
        txId: txId,
        status: 'pending',
        signatures: 'Waiting for signatures',
        timestamp: new Date(),
      };
      
      console.log('Transaction signing status:', status);
      return status;
    }
  } catch (error) {
    console.error('Failed to get transaction signing status:', error);
  }
}
```

## 🚨 错误处理

### 多重签名特定错误

```javascript
function handleMultisigTransactionError(error) {
  if (error.data && error.data.error_code) {
    switch (error.data.error_code) {
      case 'temINSUFFICIENT_WEIGHT':
        console.error('Insufficient signer weight for transaction');
        break;
      case 'temBAD_SIGNATURE':
        console.error('Invalid signature in multisig transaction');
        break;
      case 'temMALFORMED':
        console.error('Malformed multisig transaction');
        break;
      case 'tecNO_PERMISSION':
        console.error('No permission to execute transaction');
        break;
      default:
        console.error('Unknown multisig transaction error:', error.data.error_code);
    }
  } else {
    console.error('Network error:', error.message);
  }
}
```

### 签名验证

```javascript
function validateMultisigSignatures(signatures, requiredWeight) {
  try {
    // 1. 验证签名数量
    if (signatures.length === 0) {
      throw new Error('No signatures provided');
    }
    
    // 2. 验证签名者权限
    const validSignatures = signatures.filter(sig => {
      // 这里应该验证签名的有效性
      return sig.signer && sig.signature;
    });
    
    // 3. 计算总权重
    const totalWeight = validSignatures.reduce((sum, sig) => {
      // 这里应该从账户配置获取签名者权重
      return sum + 1; // 简化示例
    }, 0);
    
    // 4. 检查是否达到要求
    if (totalWeight < requiredWeight) {
      throw new Error(`Insufficient weight: ${totalWeight}/${requiredWeight}`);
    }
    
    console.log('Multisig signatures validated');
    return true;
  } catch (error) {
    console.error('Signature validation failed:', error.message);
    return false;
  }
}
```

## 📊 多重签名分析

### 交易分析工具

```javascript
class MultisigTransactionAnalyzer {
  constructor(transactions) {
    this.transactions = transactions;
  }
  
  // 分析签名模式
  analyzeSigningPatterns() {
    const patterns = {};
    
    for (const tx of this.transactions) {
      if (tx.outcome && tx.outcome.engine_result === 'tesSUCCESS') {
        const signers = this.extractSigners(tx);
        const pattern = signers.sort().join('+');
        patterns[pattern] = (patterns[pattern] || 0) + 1;
      }
    }
    
    return patterns;
  }
  
  // 提取签名者信息
  extractSigners(transaction) {
    // 这里应该从交易中提取实际的签名者信息
    // 简化示例
    return ['signer1', 'signer2'];
  }
  
  // 分析交易成功率
  analyzeSuccessRate() {
    const total = this.transactions.length;
    const successful = this.transactions.filter(tx => 
      tx.outcome && tx.outcome.engine_result === 'tesSUCCESS'
    ).length;
    
    return {
      total,
      successful,
      failed: total - successful,
      successRate: (successful / total) * 100,
    };
  }
  
  // 分析签名延迟
  analyzeSigningDelay() {
    const delays = [];
    
    for (const tx of this.transactions) {
      if (tx.date && tx.outcome) {
        // 计算从创建到签名完成的时间
        const delay = this.calculateDelay(tx);
        if (delay > 0) {
          delays.push(delay);
        }
      }
    }
    
    if (delays.length > 0) {
      const avgDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
      const maxDelay = Math.max(...delays);
      const minDelay = Math.min(...delays);
      
      return {
        average: avgDelay,
        maximum: maxDelay,
        minimum: minDelay,
        total: delays.length,
      };
    }
    
    return null;
  }
  
  // 计算延迟时间
  calculateDelay(transaction) {
    // 这里应该实现实际的延迟计算逻辑
    return 0; // 简化示例
  }
}
```

## 🔐 安全最佳实践

### 多重签名安全配置

```javascript
function configureSecureMultisigTransactions() {
  return {
    // 1. 签名者验证
    signerVerification: {
      enabled: true,
      requireAddressValidation: true,
      maxSigners: 8,
      minSigners: 2,
    },
    
    // 2. 权重策略
    weightStrategy: {
      type: 'balanced', // balanced, hierarchical, democratic
      minWeight: 2,
      maxWeight: 10,
      weightDistribution: 'even', // even, proportional, custom
    },
    
    // 3. 交易限制
    transactionLimits: {
      maxAmount: '1000000000', // 1000 XRP
      maxDailyTransactions: 100,
      requireApproval: true,
    },
    
    // 4. 时间限制
    timeLimits: {
      maxPendingTime: 24 * 60 * 60 * 1000, // 24小时
      autoExpire: true,
      requireTimelySigning: true,
    },
    
    // 5. 审计和监控
    audit: {
      enabled: true,
      logAllSignatures: true,
      requireConfirmation: true,
      alertOnSuspicious: true,
    },
  };
}
```

### 私钥安全

```javascript
class SecureMultisigKeyManager {
  constructor() {
    this.keys = new Map();
    this.encryptionKey = null;
    this.accessLog = [];
  }
  
  // 安全存储私钥
  storeSecureKey(address, encryptedKey, metadata) {
    this.keys.set(address, {
      encrypted: encryptedKey,
      metadata: metadata,
      storedAt: new Date(),
      lastAccessed: null,
      accessCount: 0,
    });
    
    this.logAccess('store', address);
  }
  
  // 获取私钥（需要验证）
  getSecureKey(address, verification) {
    if (this.verifyAccess(verification)) {
      const keyData = this.keys.get(address);
      if (keyData) {
        keyData.lastAccessed = new Date();
        keyData.accessCount++;
        this.logAccess('access', address);
        return keyData.encrypted;
      }
    }
    
    throw new Error('Access denied or key not found');
  }
  
  // 验证访问权限
  verifyAccess(verification) {
    // 这里应该实现实际的访问验证逻辑
    return verification && verification.valid;
  }
  
  // 记录访问日志
  logAccess(action, address) {
    this.accessLog.push({
      timestamp: new Date().toISOString(),
      action: action,
      address: address,
      ip: '127.0.0.1', // 实际应用中应获取真实IP
    });
  }
  
  // 清理过期日志
  cleanupLogs(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30天
    const cutoff = Date.now() - maxAge;
    this.accessLog = this.accessLog.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );
  }
}
```

## 📱 移动端支持

### 移动端多重签名

```javascript
class MobileMultisigClient {
  constructor() {
    this.api = null;
    this.offlineMode = false;
    this.pendingSignatures = [];
  }
  
  // 配置移动端 API
  configureMobileAPI() {
    return {
      timeout: 15000,
      retries: 2,
      compression: true,
      mobileOptimized: true,
      offlineSupport: true,
    };
  }
  
  // 离线签名
  async signOffline(transactionData, secret) {
    try {
      // 创建离线签名
      const signature = await this.createOfflineSignature(transactionData, secret);
      
      // 存储待同步的签名
      this.pendingSignatures.push({
        signature: signature,
        transaction: transactionData,
        timestamp: new Date().toISOString(),
      });
      
      return signature;
    } catch (error) {
      console.error('Offline signing failed:', error);
    }
  }
  
  // 同步离线签名
  async syncOfflineSignatures() {
    if (this.pendingSignatures.length === 0) {
      return { synced: 0, message: 'No pending signatures' };
    }
    
    let synced = 0;
    const failed = [];
    
    for (const pending of this.pendingSignatures) {
      try {
        await this.submitSignature(pending.signature, pending.transaction);
        synced++;
      } catch (error) {
        failed.push({
          signature: pending.signature,
          error: error.message,
        });
      }
    }
    
    // 移除已同步的签名
    this.pendingSignatures = this.pendingSignatures.filter((_, index) => 
      index >= synced
    );
    
    return { synced, failed, remaining: this.pendingSignatures.length };
  }
}
```

## 📚 最佳实践

1. **签名者管理**: 定期审查和更新签名者列表
2. **权重分配**: 合理分配权重，避免单点故障
3. **交易验证**: 在签名前仔细验证交易内容
4. **安全存储**: 安全存储所有签名者的私钥
5. **监控审计**: 实现完整的签名监控和审计日志
6. **备份策略**: 为多重签名账户实现备份和恢复策略

## 📚 相关资源

- [Ripple 多重签名交易](https://xrpl.org/docs/tutorials/manage-account-settings/multi-signing/)
- [多重签名交易类型](https://xrpl.org/docs/references/protocol/transactions/)
- [签名验证](https://xrpl.org/docs/references/protocol/transactions/signing/)
- [交易提交](https://xrpl.org/docs/references/protocol/transactions/submission/)
