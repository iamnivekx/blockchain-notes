---
id: trc20
title: TRC20 智能合约
sidebar_label: TRC20 合约
---

# Tron TRC20 智能合约

TRC20 是 Tron 网络的智能合约代币标准，类似于以太坊的 ERC20。TRC20 代币通过智能合约实现，支持复杂的代币逻辑和功能。

## TRC20 代币特点

- **智能合约**: 基于 Solidity 智能合约实现
- **功能丰富**: 支持转账、授权、销毁等高级功能
- **兼容性**: 与以太坊 ERC20 标准兼容
- **可扩展**: 可以添加自定义逻辑和功能

## 智能合约交互流程

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

### 2. 构建智能合约调用
使用 `transactionBuilder.triggerSmartContract` 构建合约调用交易：

```javascript
async function buildTrc20Transfer(toAddress, amount, contractAddress) {
  try {
    // 定义函数参数
    const parameter = [
      { type: 'address', value: toAddress },
      { type: 'uint256', value: amount },
    ];
    
    // 设置交易选项
    const options = {
      feeLimit: 100000000, // 手续费限制（单位：sun）
      callValue: 0, // 发送的 TRX 数量
    };
    
    // 构建未签名交易
    const { transaction: unsignedTx } = await tronWeb.transactionBuilder.triggerSmartContract(
      contractAddress,
      'transfer(address,uint256)',
      options,
      parameter,
      tronWeb.defaultAddress.base58 // 调用者地址
    );
    
    return unsignedTx;
  } catch (error) {
    throw new Error(`Failed to build TRC20 transaction: ${error.message}`);
  }
}
```

### 3. 签名和广播交易
```javascript
async function sendTrc20Token(toAddress, amount, contractAddress, memo = '') {
  try {
    console.log(`Sending ${amount} TRC20 tokens to ${toAddress}`);
    
    // 1. 构建交易
    const parameter = [
      { type: 'address', value: toAddress },
      { type: 'uint256', value: amount },
    ];
    
    const options = {
      feeLimit: 100000000,
      callValue: 0,
    };
    
    const { transaction: unsignedTx } = await tronWeb.transactionBuilder.triggerSmartContract(
      contractAddress,
      'transfer(address,uint256)',
      options,
      parameter,
      tronWeb.defaultAddress.base58
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
    console.error('TRC20 transaction failed:', error);
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
const quantity = 100000000000000; // 代币数量（考虑小数位）
const memo = 'TRC20 transfer test';
const CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT 合约地址

async function main() {
  try {
    console.log(`Sending ${quantity} TRC20 tokens to ${ACCOUNT}`);
    
    // 1. 构建智能合约调用
    const parameter = [
      { type: 'address', value: ACCOUNT },
      { type: 'uint256', value: quantity },
    ];
    
    const options = {
      feeLimit: 100000000,
      callValue: 0,
    };
    
    const { transaction: unsignedTx, result } = await tronWeb.transactionBuilder.triggerSmartContract(
      CONTRACT,
      'transfer(address,uint256)',
      options,
      parameter,
      tronWeb.defaultAddress.base58
    );
    
    console.log('Contract call result:', result);
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

## 常用 TRC20 函数

### 1. 转账 (transfer)
```javascript
async function transfer(toAddress, amount, contractAddress) {
  const parameter = [
    { type: 'address', value: toAddress },
    { type: 'uint256', value: amount },
  ];
  
  const options = {
    feeLimit: 100000000,
    callValue: 0,
  };
  
  const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
    contractAddress,
    'transfer(address,uint256)',
    options,
    parameter,
    tronWeb.defaultAddress.base58
  );
  
  return transaction;
}
```

### 2. 授权 (approve)
```javascript
async function approve(spenderAddress, amount, contractAddress) {
  const parameter = [
    { type: 'address', value: spenderAddress },
    { type: 'uint256', value: amount },
  ];
  
  const options = {
    feeLimit: 100000000,
    callValue: 0,
  };
  
  const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
    contractAddress,
    'approve(address,uint256)',
    options,
    parameter,
    tronWeb.defaultAddress.base58
  );
  
  return transaction;
}
```

### 3. 代理转账 (transferFrom)
```javascript
async function transferFrom(fromAddress, toAddress, amount, contractAddress) {
  const parameter = [
    { type: 'address', value: fromAddress },
    { type: 'address', value: toAddress },
    { type: 'uint256', value: amount },
  ];
  
  const options = {
    feeLimit: 100000000,
    callValue: 0,
  };
  
  const { transaction } = await tronWeb.transactionBuilder.triggerSmartContract(
    contractAddress,
    'transferFrom(address,address,uint256)',
    options,
    parameter,
    tronWeb.defaultAddress.base58
  );
  
  return transaction;
}
```

## 合约信息查询

### 查询代币余额
```javascript
async function getTrc20Balance(address, contractAddress) {
  try {
    const result = await tronWeb.contract().at(contractAddress);
    const balance = await result.balanceOf(address).call();
    return balance.toString();
  } catch (error) {
    throw new Error(`Failed to get TRC20 balance: ${error.message}`);
  }
}
```

### 查询代币信息
```javascript
async function getTrc20Info(contractAddress) {
  try {
    const contract = await tronWeb.contract().at(contractAddress);
    
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name().call(),
      contract.symbol().call(),
      contract.decimals().call(),
      contract.totalSupply().call()
    ]);
    
    return {
      name: name.toString(),
      symbol: symbol.toString(),
      decimals: decimals.toString(),
      totalSupply: totalSupply.toString()
    };
  } catch (error) {
    throw new Error(`Failed to get TRC20 info: ${error.message}`);
  }
}
```

### 查询授权额度
```javascript
async function getAllowance(ownerAddress, spenderAddress, contractAddress) {
  try {
    const contract = await tronWeb.contract().at(contractAddress);
    const allowance = await contract.allowance(ownerAddress, spenderAddress).call();
    return allowance.toString();
  } catch (error) {
    throw new Error(`Failed to get allowance: ${error.message}`);
  }
}
```

## 常见 TRC20 代币

| 代币名称 | 合约地址                           | 描述             |
| -------- | ---------------------------------- | ---------------- |
| USDT     | TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t | Tether USD       |
| USDC     | TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8 | USD Coin         |
| BTT      | TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnKVp | BitTorrent Token |

## 错误处理

### 常见错误类型
1. **合约调用失败**: 合约函数执行失败
2. **余额不足**: 代币余额不足以支付转账
3. **授权不足**: 没有足够的授权额度
4. **合约地址无效**: 指定的合约地址不存在

### 错误处理示例
```javascript
async function handleTrc20Error(error) {
  if (error.message.includes('revert')) {
    console.error('Contract call reverted');
  } else if (error.message.includes('balance')) {
    console.error('Insufficient token balance');
  } else if (error.message.includes('allowance')) {
    console.error('Insufficient allowance');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```