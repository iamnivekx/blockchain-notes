---
id: transaction
title: TRX 交易处理
sidebar_label: TRX 交易
---

# Tron TRX 交易处理

TRX 是 Tron 网络的原生代币，用于支付交易费用和网络治理。本文档介绍如何构建、签名和发送 TRX 转账交易。

## 交易流程

### 1. 初始化 TronWeb
```javascript
const TronWeb = require('tronweb');

const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider('https://api.trongrid.io');
const solidityNode = new HttpProvider('https://api.trongrid.io');
const eventServer = new HttpProvider('https://api.trongrid.io');
const privateKey = 'your-private-key';

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
```

### 2. 构建交易
使用 `transactionBuilder.sendTrx` 构建 TRX 转账交易：

```javascript
async function buildTrxTransaction(toAddress, amount) {
  try {
    // 构建未签名交易
    const unsignedTx = await tronWeb.transactionBuilder.sendTrx(toAddress, amount);
    
    // 添加备注（可选）
    const txWithMemo = await tronWeb.transactionBuilder.addUpdateData(
      unsignedTx, 
      'Hello Tron!', 
      'utf8'
    );
    
    return txWithMemo;
  } catch (error) {
    throw new Error(`Failed to build transaction: ${error.message}`);
  }
}
```

### 3. 签名交易
使用私钥对交易进行签名：

```javascript
async function signTransaction(unsignedTx, privateKey) {
  try {
    // 使用 TronWeb 签名
    const signedTx = await tronWeb.trx.sign(unsignedTx);
    return signedTx;
  } catch (error) {
    throw new Error(`Failed to sign transaction: ${error.message}`);
  }
}
```

### 4. 广播交易
将签名后的交易广播到网络：

```javascript
async function broadcastTransaction(signedTx) {
  try {
    const result = await tronWeb.trx.sendRawTransaction(signedTx);
    return result;
  } catch (error) {
    throw new Error(`Failed to broadcast transaction: ${error.message}`);
  }
}
```

## 完整示例

```javascript
const TronWeb = require('tronweb');
const utils = TronWeb.utils;

// 配置网络
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider('https://api.trongrid.io');
const solidityNode = new HttpProvider('https://api.trongrid.io');
const eventServer = new HttpProvider('https://api.trongrid.io');
const privateKey = 'your-private-key';

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

async function sendTrxTransaction(toAddress, amount, memo = '') {
  try {
    console.log(`Sending ${amount} TRX to ${toAddress}`);
    
    // 1. 构建交易
    const unsignedTx = await tronWeb.transactionBuilder.sendTrx(toAddress, amount);
    console.log('Unsigned transaction:', JSON.stringify(unsignedTx, null, 2));
    
    // 2. 添加备注（如果有）
    let txWithMemo = unsignedTx;
    if (memo) {
      txWithMemo = await tronWeb.transactionBuilder.addUpdateData(
        unsignedTx, 
        memo, 
        'utf8'
      );
      console.log('Transaction with memo:', JSON.stringify(txWithMemo, null, 2));
    }
    
    // 3. 签名交易
    const signedTx = await tronWeb.trx.sign(txWithMemo);
    console.log('Signed transaction:', signedTx);
    
    // 4. 广播交易
    const result = await tronWeb.trx.sendRawTransaction(signedTx);
    console.log('Transaction broadcast result:', result);
    
    return {
      txid: signedTx.txID,
      result: result
    };
    
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

// 使用示例
const toAddress = 'TVi1ChXUW5MN6KCsurBdzkWjqPYjy7q1DT';
const amount = 10; // TRX 数量（单位：TRX）
const memo = 'Hello from Tron!';

sendTrxTransaction(toAddress, amount, memo)
  .then(result => {
    console.log('Transaction successful:', result);
  })
  .catch(error => {
    console.error('Transaction failed:', error);
  });
```

## 手动签名

如果需要手动签名交易，可以使用椭圆曲线库：

```javascript
const { ec: EC } = require('elliptic');
const ec = new EC('secp256k1');

function manualSign(txId, privateKey) {
  const key = ec.keyFromPrivate(privateKey, 'hex');
  const hashBytes = Buffer.from(txId, 'hex');
  const signature = key.sign(hashBytes);
  
  const r = signature.r;
  const s = signature.s;
  const id = signature.recoveryParam;
  
  // 格式化 r 和 s 为64位十六进制
  let rHex = r.toString('hex');
  while (rHex.length < 64) {
    rHex = `0${rHex}`;
  }
  
  let sHex = s.toString('hex');
  while (sHex.length < 64) {
    sHex = `0${sHex}`;
  }
  
  const idHex = utils.bytes.byte2hexStr(id);
  const signHex = rHex + sHex + idHex;
  
  return signHex;
}
```

## 交易序列化

### 序列化交易
```javascript
function serializeTransaction(transaction) {
  const serialized = Buffer.from(JSON.stringify(transaction)).toString('hex');
  return serialized;
}
```

### 反序列化交易
```javascript
function deserializeTransaction(serializedData) {
  const transaction = JSON.parse(Buffer.from(serializedData, 'hex').toString());
  return transaction;
}
```

## 交易验证

### 验证签名
```javascript
function verifySignature(txId, signature, publicKey) {
  try {
    const key = ec.keyFromPublic(publicKey, 'hex');
    const hashBytes = Buffer.from(txId, 'hex');
    return key.verify(hashBytes, signature);
  } catch (error) {
    return false;
  }
}
```

### 验证交易完整性
```javascript
function verifyTransaction(originalTx, recoveredTx) {
  return JSON.stringify(originalTx) === JSON.stringify(recoveredTx);
}
```

## 错误处理

### 常见错误类型
1. **余额不足**: 账户 TRX 余额不足以支付转账金额和手续费
2. **地址无效**: 目标地址格式不正确
3. **网络错误**: 网络连接问题或节点不可用
4. **签名错误**: 私钥无效或签名失败

### 错误处理示例
```javascript
async function handleTransactionError(error) {
  if (error.message.includes('balance')) {
    console.error('Insufficient balance');
  } else if (error.message.includes('address')) {
    console.error('Invalid address');
  } else if (error.message.includes('network')) {
    console.error('Network error, please try again');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```