---
id: issue
title: 代币发行
sidebar_label: 代币发行
---

# Stellar 代币发行

Stellar 支持发行自定义代币（资产），这些代币可以是任何类型的价值表示，如法定货币、商品、积分等。代币发行需要建立信任线和进行资产转移。

## 代币特点

- **自定义性**: 可以发行任何类型的代币
- **信任机制**: 接收方必须信任代币才能持有
- **锚点支持**: 可以与传统金融系统连接
- **流动性**: 支持去中心化交易

## 代币发行流程

### 1. 创建代币资产
```javascript
const StellarSdk = require('stellar-sdk');

// 创建代币资产对象
const customAsset = new StellarSdk.Asset('PHCC', issuingKeys.publicKey());

console.log('Asset code:', customAsset.getCode());
console.log('Asset issuer:', customAsset.getIssuer());
```

### 2. 建立信任线
接收方必须先信任代币才能持有：

```javascript
async function establishTrustline(receivingKeys, asset) {
  try {
    // 加载接收方账户
    const receiver = await server.loadAccount(receivingKeys.publicKey());
    
    // 构建建立信任线的交易
    const transaction = new StellarSdk.TransactionBuilder(receiver, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.changeTrust({
      asset: asset,
      limit: '100000000', // 信任额度
    }))
    .setTimeout(100)
    .build();
    
    // 签名交易
    transaction.sign(receivingKeys);
    
    // 提交交易
    const result = await server.submitTransaction(transaction);
    console.log('Trustline established:', result);
    
    return result;
  } catch (error) {
    throw new Error(`Failed to establish trustline: ${error.message}`);
  }
}
```

### 3. 发行代币
发行方将代币发送给接收方：

```javascript
async function issueTokens(issuingKeys, receivingKeys, asset, amount) {
  try {
    // 加载发行方账户
    const issuer = await server.loadAccount(issuingKeys.publicKey());
    
    // 构建发行代币的交易
    const transaction = new StellarSdk.TransactionBuilder(issuer, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: receivingKeys.publicKey(),
      asset: asset,
      amount: amount,
    }))
    .setTimeout(100)
    .build();
    
    // 签名交易
    transaction.sign(issuingKeys);
    
    // 提交交易
    const result = await server.submitTransaction(transaction);
    console.log('Tokens issued:', result);
    
    return result;
  } catch (error) {
    throw new Error(`Failed to issue tokens: ${error.message}`);
  }
}
```

## 完整示例

```javascript
const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

// 密钥对配置
const issuingKeys = StellarSdk.Keypair.fromSecret('your-issuing-secret');
const receivingKeys = StellarSdk.Keypair.fromSecret('your-receiving-secret');
const chiveKeys = StellarSdk.Keypair.fromSecret('your-chive-secret');

// 创建代币资产
console.log('Issuer public key:', issuingKeys.publicKey());
const astroDollar = new StellarSdk.Asset('PHCC', issuingKeys.publicKey());

async function issue() {
  try {
    console.log('=== 建立信任线 ===');
    
    // 1. 加载接收方账户
    const receiver = await server.loadAccount(receivingKeys.publicKey());
    
    // 显示当前余额
    receiver.balances.forEach(function (balance) {
      console.log('Balance:', balance);
      console.log('Receiver Type:', balance.asset_type, ', Balance:', balance.balance);
    });
    
    // 2. 建立信任线
    var transaction = new StellarSdk.TransactionBuilder(receiver, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.changeTrust({
      asset: astroDollar,
      limit: '100000000', // 信任额度
    }))
    .setTimeout(100)
    .build();
    
    // 签名交易
    transaction.sign(receivingKeys);
    
    // 提交交易（注释掉以避免实际发送）
    // var result = await server.submitTransaction(transaction);
    // console.log('Trustline result:', result);
    
    console.log('=== 发行代币 ===');
    
    // 3. 加载发行方账户
    const issuer = await server.loadAccount(issuingKeys.publicKey());
    
    // 显示发行方余额
    issuer.balances.forEach(function (balance) {
      console.log('Issuer Type:', balance.asset_type, ', Balance:', balance.balance);
    });
    
    // 4. 发行代币
    var transaction = new StellarSdk.TransactionBuilder(issuer, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: receivingKeys.publicKey(),
      asset: astroDollar,
      amount: '100000001',
    }))
    .setTimeout(100)
    .build();
    
    // 签名交易
    transaction.sign(issuingKeys);
    
    // 提交交易（注释掉以避免实际发送）
    // var result = await server.submitTransaction(transaction);
    // console.log('Issue result:', result);
    
    console.log('代币发行流程完成');
    
  } catch (error) {
    console.error('Issue failed:', error);
    throw error;
  }
}

async function transfer() {
  try {
    console.log('=== 代币转账 ===');
    
    // 1. 加载接收方账户
    const receiver = await server.loadAccount(receivingKeys.publicKey());
    console.log('Receiver public key:', receivingKeys.publicKey());
    console.log('Receiver sequence:', receiver.sequenceNumber());
    
    // 2. 构建转账交易
    const minTime = '1628765951';
    const maxTime = '1628852351';
    
    var transaction = new StellarSdk.TransactionBuilder(receiver, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
      timebounds: {
        minTime,
        maxTime,
      },
    })
    .addOperation(StellarSdk.Operation.payment({
      source: receivingKeys.publicKey(),
      destination: chiveKeys.publicKey(),
      asset: astroDollar,
      amount: '1000',
    }))
    .addMemo(StellarSdk.Memo.text('phcc'))
    .setTimeout(100)
    .build();
    
    console.log('Transaction:', JSON.stringify(transaction, null, 2));
    console.log('Transaction hash:', transaction.hash().toString('hex'));
    console.log('Transaction XDR:', transaction.toXDR());
    
    // 3. 签名和提交交易（注释掉以避免实际发送）
    // transaction.sign(receivingKeys);
    // var result = await server.submitTransaction(transaction);
    // console.log('Transfer result:', result);
    
    console.log('代币转账流程完成');
    
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
}

// 运行示例
// issue().catch(console.error);
transfer().catch(console.error);
```

## 代币管理操作

### 1. 修改信任额度
```javascript
async function modifyTrustline(account, asset, newLimit) {
  try {
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.changeTrust({
      asset: asset,
      limit: newLimit,
    }))
    .setTimeout(100)
    .build();
    
    transaction.sign(account);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to modify trustline: ${error.message}`);
  }
}
```

### 2. 删除信任线
```javascript
async function removeTrustline(account, asset) {
  try {
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.changeTrust({
      asset: asset,
      limit: '0', // 设置为0删除信任线
    }))
    .setTimeout(100)
    .build();
    
    transaction.sign(account);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to remove trustline: ${error.message}`);
  }
}
```

### 3. 设置代币授权
```javascript
async function setAssetFlags(account, asset, flags) {
  try {
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.setTrustLineFlags({
      trustor: account.accountId(),
      asset: asset,
      clearFlags: flags.clear || 0,
      setFlags: flags.set || 0,
    }))
    .setTimeout(100)
    .build();
    
    transaction.sign(account);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to set asset flags: ${error.message}`);
  }
}
```

## 代币查询

### 1. 查询代币余额
```javascript
async function getAssetBalance(publicKey, assetCode, assetIssuer) {
  try {
    const account = await server.loadAccount(publicKey);
    
    const balance = account.balances.find(balance => {
      if (balance.asset_type === 'native') return false;
      return balance.asset_code === assetCode && 
             balance.asset_issuer === assetIssuer;
    });
    
    return balance ? balance.balance : '0';
  } catch (error) {
    throw new Error(`Failed to get asset balance: ${error.message}`);
  }
}
```

### 2. 查询信任线信息
```javascript
async function getTrustlines(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    
    return account.balances.filter(balance => 
      balance.asset_type !== 'native'
    );
  } catch (error) {
    throw new Error(`Failed to get trustlines: ${error.message}`);
  }
}
```

### 3. 查询代币发行信息
```javascript
async function getAssetInfo(assetCode, assetIssuer) {
  try {
    const asset = new StellarSdk.Asset(assetCode, assetIssuer);
    
    // 查询发行方账户信息
    const issuerAccount = await server.loadAccount(assetIssuer);
    
    return {
      code: assetCode,
      issuer: assetIssuer,
      issuerAccount: issuerAccount
    };
  } catch (error) {
    throw new Error(`Failed to get asset info: ${error.message}`);
  }
}
```

## 代币转账

### 1. 基本转账
```javascript
async function transferAsset(sourceKeys, destination, asset, amount, memo = '') {
  try {
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: destination,
      asset: asset,
      amount: amount,
    }));
    
    // 添加备注（如果有）
    if (memo) {
      transaction.addMemo(StellarSdk.Memo.text(memo));
    }
    
    const builtTransaction = transaction.setTimeout(100).build();
    
    // 签名交易
    builtTransaction.sign(sourceKeys);
    
    // 提交交易
    const result = await server.submitTransaction(builtTransaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to transfer asset: ${error.message}`);
  }
}
```

### 2. 批量转账
```javascript
async function batchTransfer(sourceKeys, transfers) {
  try {
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: 100 * transfers.length, // 根据操作数量计算费用
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });
    
    // 添加多个转账操作
    transfers.forEach(transfer => {
      transaction.addOperation(StellarSdk.Operation.payment({
        destination: transfer.destination,
        asset: transfer.asset,
        amount: transfer.amount,
      }));
    });
    
    const builtTransaction = transaction.setTimeout(100).build();
    
    // 签名交易
    builtTransaction.sign(sourceKeys);
    
    // 提交交易
    const result = await server.submitTransaction(builtTransaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to batch transfer: ${error.message}`);
  }
}
```

## 代币授权管理

### 1. 设置代币授权
```javascript
async function authorizeAsset(account, asset, authorize = true) {
  try {
    const flags = authorize ? 
      StellarSdk.AuthClawbackEnabledFlag : 
      StellarSdk.AuthClawbackEnabledFlag;
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.setOptions({
      setFlags: flags,
    }))
    .setTimeout(100)
    .build();
    
    transaction.sign(account);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to authorize asset: ${error.message}`);
  }
}
```

### 2. 代币回收
```javascript
async function clawbackAsset(account, asset, from, amount) {
  try {
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
    .addOperation(StellarSdk.Operation.clawback({
      asset: asset,
      from: from,
      amount: amount,
    }))
    .setTimeout(100)
    .build();
    
    transaction.sign(account);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to clawback asset: ${error.message}`);
  }
}
```

## 错误处理

### 常见错误类型
1. **op_no_trust**: 接收方没有信任该代币
2. **op_underfunded**: 发行方代币余额不足
3. **op_cross_self**: 不能向自己转账
4. **op_line_full**: 信任线额度已满

### 错误处理示例
```javascript
async function handleAssetError(error) {
  if (error.response && error.response.data) {
    const errorData = error.response.data;
    
    switch (errorData.extras.result_codes.operations[0]) {
      case 'op_no_trust':
        console.error('Receiver does not trust this asset');
        break;
      case 'op_underfunded':
        console.error('Insufficient asset balance');
        break;
      case 'op_cross_self':
        console.error('Cannot transfer to self');
        break;
      case 'op_line_full':
        console.error('Trustline limit reached');
        break;
      default:
        console.error('Asset operation failed:', errorData.extras.result_codes);
    }
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## 最佳实践

1. **信任线管理**: 合理设置信任额度
2. **错误处理**: 实现完善的错误处理机制
3. **测试网测试**: 开发时使用测试网进行测试
4. **代币命名**: 使用有意义的代币代码
5. **文档记录**: 记录代币的用途和规则

## 下一步

- [常见问题](../FAQ.md) - 查看开发中的常见问题
- [账户管理](../account/index.md) - 学习账户管理基础知识
- [交易处理](./transaction.md) - 了解基本交易处理
