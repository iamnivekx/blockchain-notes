---
id: trc10
title: TRC10 代币转账
sidebar_label: TRC10 代币
---

# Tron TRC10 代币转账

TRC10 是 Tron 网络的原生代币标准，类似于比特币的彩色币。TRC10 代币直接存储在 Tron 区块链上，不需要智能合约，具有更高的性能和更低的费用。

## TRC10 代币特点

- **原生支持**: 直接由 Tron 网络支持，无需智能合约
- **高性能**: 交易速度快，费用低
- **简单部署**: 通过 Tron 网络直接创建，无需编写合约代码
- **固定费用**: 创建和转账费用固定

## 代币转账流程

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

### 2. 构建 TRC10 转账交易
使用 `transactionBuilder.sendToken` 构建代币转账交易：

```javascript
async function buildTrc10Transaction(toAddress, amount, tokenId) {
  try {
    // 构建未签名交易
    const unsignedTx = await tronWeb.transactionBuilder.sendToken(
      toAddress, 
      amount, 
      tokenId
    );
    
    // 添加备注（可选）
    const txWithMemo = await tronWeb.transactionBuilder.addUpdateData(
      unsignedTx, 
      'TRC10 transfer', 
      'utf8'
    );
    
    return txWithMemo;
  } catch (error) {
    throw new Error(`Failed to build TRC10 transaction: ${error.message}`);
  }
}
```

### 3. 签名和广播交易
```javascript
async function sendTrc10Token(toAddress, amount, tokenId, memo = '') {
  try {
    console.log(`Sending ${amount} tokens (ID: ${tokenId}) to ${toAddress}`);
    
    // 1. 构建交易
    const unsignedTx = await tronWeb.transactionBuilder.sendToken(
      toAddress, 
      amount, 
      tokenId
    );
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
    console.error('TRC10 transaction failed:', error);
    throw error;
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

// 配置参数
const ACCOUNT = 'TMao9aQTrRcjH5tVSz1MzzngtY6DenaVM2';
const tokenId = '1002000'; // TRC10 代币 ID
const amount = 1; // 代币数量
const memo = 'TRC10 transfer test';

async function main() {
  try {
    console.log(`Sending ${amount} tokens (ID: ${tokenId}) to ${ACCOUNT}`);
    
    // 1. 构建 TRC10 转账交易
    const unsignedTx = await tronWeb.transactionBuilder.sendToken(
      ACCOUNT, 
      amount, 
      tokenId
    );
    console.log('Unsigned transaction:', JSON.stringify(unsignedTx, null, 2));
    
    // 2. 添加备注
    const txWithMemo = await tronWeb.transactionBuilder.addUpdateData(
      unsignedTx, 
      memo, 
      'utf8'
    );
    console.log('Transaction with memo:', JSON.stringify(txWithMemo, null, 2));
    
    // 3. 签名交易
    const signedTx = await tronWeb.trx.sign(txWithMemo);
    console.log('Signed transaction:', signedTx);
    
    // 4. 验证签名
    const signature = utils.crypto.ECKeySign(
      utils.code.hexStr2byteArray(txWithMemo.txID), 
      utils.code.hexStr2byteArray(privateKey)
    );
    console.log('Manual signature:', signature);
    console.log('Signature match:', signature === signedTx.signature[0]);
    
    // 5. 序列化交易
    const serialized = Buffer.from(JSON.stringify(signedTx)).toString('hex');
    console.log('Serialized transaction:', serialized);
    
    // 6. 反序列化验证
    const recovered = JSON.parse(Buffer.from(serialized, 'hex').toString());
    console.log('Recovered transaction:', recovered);
    console.log('Transaction integrity:', JSON.stringify(recovered) === JSON.stringify(signedTx));
    
    // 7. 广播交易（注释掉以避免实际发送）
    // const result = await tronWeb.trx.sendRawTransaction(recovered);
    // console.log('Broadcast result:', result);
    
    return {
      txid: signedTx.txID,
      success: true
    };
    
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

// 运行示例
main().catch(console.error);
```

## 代币信息查询

### 查询代币余额
```javascript
async function getTokenBalance(address, tokenId) {
  try {
    const balance = await tronWeb.trx.getTokenBalances(address);
    const tokenBalance = balance.find(token => token.key === tokenId);
    return tokenBalance ? tokenBalance.value : 0;
  } catch (error) {
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
}
```

### 查询代币信息
```javascript
async function getTokenInfo(tokenId) {
  try {
    const tokenInfo = await tronWeb.trx.getTokenByID(tokenId);
    return tokenInfo;
  } catch (error) {
    throw new Error(`Failed to get token info: ${error.message}`);
  }
}
```

### 查询账户所有代币
```javascript
async function getAllTokenBalances(address) {
  try {
    const balances = await tronWeb.trx.getTokenBalances(address);
    return balances;
  } catch (error) {
    throw new Error(`Failed to get token balances: ${error.message}`);
  }
}
```

## 手动签名实现

如果需要手动签名，可以使用椭圆曲线库：

```javascript
const { ec: EC } = require('elliptic');
const ec = new EC('secp256k1');

function manualSignTrc10(txId, privateKey) {
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

## 交易验证

### 验证交易签名
```javascript
function verifyTrc10Signature(txId, signature, publicKey) {
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
function verifyTrc10Transaction(originalTx, recoveredTx) {
  return JSON.stringify(originalTx) === JSON.stringify(recoveredTx);
}
```

## 常见 TRC10 代币

| 代币名称 | 代币 ID | 描述               |
| -------- | ------- | ------------------ |
| BTT      | 1002000 | BitTorrent Token   |
| WIN      | 1000222 | WINk               |
| USDT     | 1000001 | Tether USD (TRC10) |

## 错误处理

### 常见错误类型
1. **代币余额不足**: 账户代币余额不足以支付转账金额
2. **代币 ID 无效**: 指定的代币 ID 不存在
3. **权限不足**: 没有权限操作该代币
4. **网络错误**: 网络连接问题

### 错误处理示例
```javascript
async function handleTrc10Error(error) {
  if (error.message.includes('balance')) {
    console.error('Insufficient token balance');
  } else if (error.message.includes('token')) {
    console.error('Invalid token ID');
  } else if (error.message.includes('permission')) {
    console.error('Permission denied');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```