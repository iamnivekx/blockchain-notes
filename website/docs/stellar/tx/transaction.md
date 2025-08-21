---
id: transaction
title: 交易处理
sidebar_label: 交易处理
---

# Stellar 交易处理

Stellar 交易是网络中的基本操作单元，包括支付、资产发行、信任线管理等。每笔交易都需要正确的签名和序列号管理。

## 交易特点

- **快速确认**: 3-5秒确认时间
- **低费用**: 每笔交易费用固定且很低
- **原子性**: 交易要么完全成功，要么完全失败
- **序列号**: 每个账户都有递增的序列号

## 交易流程

### 1. 初始化 Stellar 客户端
```javascript
const StellarSdk = require('stellar-sdk');

// 连接到测试网
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;
```

### 2. 加载源账户
```javascript
async function loadSourceAccount(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    return account;
  } catch (error) {
    throw new Error(`Failed to load account: ${error.message}`);
  }
}
```

### 3. 构建交易
使用 `TransactionBuilder` 构建交易：

```javascript
async function buildTransaction(sourceAccount, destination, amount) {
  try {
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
      timebounds: {
        minTime: Math.floor(Date.now() / 1000),
        maxTime: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24小时后过期
      }
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: destination,
      asset: StellarSdk.Asset.native(), // XLM
      amount: amount,
      source: sourceAccount.accountId()
    }))
    .addMemo(StellarSdk.Memo.text('Hello Stellar!'))
    .setTimeout(180) // 3分钟超时
    .build();
    
    return transaction;
  } catch (error) {
    throw new Error(`Failed to build transaction: ${error.message}`);
  }
}
```

### 4. 签名交易
```javascript
function signTransaction(transaction, secretKey) {
  try {
    const keypair = StellarSdk.Keypair.fromSecret(secretKey);
    transaction.sign(keypair);
    return transaction;
  } catch (error) {
    throw new Error(`Failed to sign transaction: ${error.message}`);
  }
}
```

### 5. 提交交易
```javascript
async function submitTransaction(transaction) {
  try {
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to submit transaction: ${error.message}`);
  }
}
```

## 完整示例

```javascript
const { eddsa: EdDSA } = require('elliptic');
const ec = new EdDSA('ed25519');
const StellarSdk = require('stellar-sdk');

const secretKey = 'your-secret-key';
const privateKey = 'your-private-key';
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

const sourceKeys = StellarSdk.Keypair.fromSecret(secretKey);
const sourceId = sourceKeys.publicKey();
const destinationId = 'GBH343PGYNGDQ4IQM3VU3TYREQ6KKI3IVOKF3F4YKGRHBNJXLIVIMLAH';

async function main() {
  try {
    // 1. 验证目标账户
    await server.loadAccount(destinationId);
    
    // 2. 设置时间边界
    const minTime = Math.floor(Date.now() / 1000);
    const maxTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24小时
    
    // 3. 加载源账户
    const sourceAccount = await server.loadAccount(sourceId);
    const sequenceNumber = sourceAccount.sequenceNumber();
    
    console.log('Source account:', sourceId);
    console.log('Sequence number:', sequenceNumber);
    console.log('Time bounds:', { minTime, maxTime });
    
    // 4. 创建账户对象
    const account = new StellarSdk.Account(sourceId, sequenceNumber);
    
    // 5. 构建交易
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
      timebounds: {
        minTime,
        maxTime,
      },
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: destinationId,
      asset: StellarSdk.Asset.native(), // XLM
      amount: '10',
      source: sourceId,
    }))
    .addMemo(StellarSdk.Memo.text('phcc'))
    .setTimeout(180) // 3分钟超时
    .build();
    
    console.log('Transaction hash:', transaction.hash().toString('hex'));
    console.log('Transaction XDR:', transaction.toXDR());
    
    // 6. 手动签名（使用椭圆曲线库）
    const txhash = transaction.hash().toString('hex');
    const keyPair = ec.keyFromSecret(privateKey);
    
    const message = Buffer.from(txhash, 'hex');
    const sig = keyPair.sign(message);
    
    console.log('Message hash:', txhash);
    console.log('Signature:', sig.toHex().toLowerCase());
    
    // 7. 添加签名到交易
    const xSig = Buffer.from(sig.toHex(), 'hex').toString('base64');
    console.log('Base64 signature:', xSig);
    
    transaction.addSignature(sourceId, xSig);
    
    // 8. 序列化和反序列化验证
    const serialized = transaction.toXDR();
    const recovered = StellarSdk.TransactionBuilder.fromXDR(serialized, StellarSdk.Networks.TESTNET);
    
    console.log('Recovered transaction hash:', recovered.hash().toString('hex'));
    
    // 9. 提交交易
    const result = await server.submitTransaction(recovered);
    console.log('Transaction result:', result);
    
    return result;
    
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

main().catch(console.error);
```

## 交易操作类型

### 1. 支付操作
```javascript
// 发送 XLM
StellarSdk.Operation.payment({
  destination: destinationId,
  asset: StellarSdk.Asset.native(),
  amount: '100'
})

// 发送自定义资产
StellarSdk.Operation.payment({
  destination: destinationId,
  asset: customAsset,
  amount: '50'
})
```

### 2. 创建账户
```javascript
StellarSdk.Operation.createAccount({
  destination: newAccountPublicKey,
  startingBalance: '1'
})
```

### 3. 设置选项
```javascript
StellarSdk.Operation.setOptions({
  masterWeight: 1,
  lowThreshold: 1,
  medThreshold: 2,
  highThreshold: 2
})
```

### 4. 管理数据
```javascript
StellarSdk.Operation.manageData({
  name: 'key',
  value: 'value'
})
```

## 交易选项

### 1. 手续费设置
```javascript
const options = {
  fee: StellarSdk.BASE_FEE, // 基础费用
  // 或者自定义费用
  fee: '100'
};
```

### 2. 时间边界
```javascript
const timebounds = {
  minTime: Math.floor(Date.now() / 1000),
  maxTime: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
};
```

### 3. 超时设置
```javascript
.setTimeout(180) // 3分钟超时
```

## 交易备注

### 1. 文本备注
```javascript
.addMemo(StellarSdk.Memo.text('Hello Stellar!'))
```

### 2. ID 备注
```javascript
.addMemo(StellarSdk.Memo.id('12345'))
```

### 3. 哈希备注
```javascript
.addMemo(StellarSdk.Memo.hash('hash-value'))
```

### 4. 返回备注
```javascript
.addMemo(StellarSdk.Memo.return('return-value'))
```

## 手动签名

### 1. 使用椭圆曲线库
```javascript
const { eddsa: EdDSA } = require('elliptic');
const ec = new EdDSA('ed25519');

function manualSign(transactionHash, privateKey) {
  const keyPair = ec.keyFromSecret(privateKey);
  const message = Buffer.from(transactionHash, 'hex');
  const signature = keyPair.sign(message);
  
  return {
    hex: signature.toHex().toLowerCase(),
    base64: Buffer.from(signature.toHex(), 'hex').toString('base64')
  };
}
```

### 2. 添加签名
```javascript
function addSignature(transaction, publicKey, signature) {
  transaction.addSignature(publicKey, signature);
  return transaction;
}
```

## 交易验证

### 1. 验证签名
```javascript
function verifyTransaction(transaction) {
  try {
    // 检查交易是否已签名
    const signatures = transaction.signatures;
    if (signatures.length === 0) {
      return false;
    }
    
    // 验证每个签名
    for (const signature of signatures) {
      if (!signature.isValid()) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}
```

### 2. 验证序列号
```javascript
async function verifySequenceNumber(publicKey, expectedSequence) {
  try {
    const account = await server.loadAccount(publicKey);
    return account.sequenceNumber() === expectedSequence;
  } catch (error) {
    return false;
  }
}
```

## 错误处理

### 1. 常见错误类型
- **insufficient_fee**: 手续费不足
- **bad_seq**: 序列号错误
- **bad_auth**: 签名验证失败
- **tx_expired**: 交易已过期
- **tx_bad_timebounds**: 时间边界错误

### 2. 错误处理示例
```javascript
async function handleTransactionError(error) {
  if (error.response && error.response.data) {
    const errorData = error.response.data;
    
    switch (errorData.extras.result_codes.operations[0]) {
      case 'op_underfunded':
        console.error('Insufficient balance');
        break;
      case 'op_cross_self':
        console.error('Cannot send to self');
        break;
      case 'op_no_trust':
        console.error('No trustline for asset');
        break;
      default:
        console.error('Transaction failed:', errorData.extras.result_codes);
    }
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## 最佳实践

1. **序列号管理**: 确保使用正确的序列号
2. **时间边界**: 设置合理的时间边界避免交易过期
3. **错误处理**: 实现完善的错误处理机制
4. **测试网测试**: 开发时使用测试网进行测试
5. **手续费优化**: 使用适当的手续费确保交易快速确认

## 下一步

- [代币发行](./issue.md) - 学习如何发行和管理自定义资产
- [常见问题](../FAQ.md) - 查看开发中的常见问题
- [账户管理](../account/index.md) - 学习账户管理基础知识
