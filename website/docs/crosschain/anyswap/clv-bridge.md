---
title: CLV 桥接
description: 学习如何使用 AnySwap 桥接 CLV 原生代币
---

# CLV 原生代币桥接

本文档介绍如何使用 AnySwap 桥接 CLV 原生代币，包括从 CLV Para Chain 到 BSC 和从 BSC 到 CLV Para Chain 的双向桥接。

## 概述

CLV 是一个基于 Substrate 的区块链网络，支持与以太坊生态的互操作。本文档演示了两种桥接场景：
- CLV Para Chain → BSC
- BSC → CLV Para Chain

## 前置条件

```bash
npm install ethers dotenv
```

## 环境配置

### 1. 环境变量

```env
CROSS_CHAIN_MNEMONIC="你的十二个单词助记词"
```

### 2. 导入依赖

```javascript
require('dotenv').config();
const { strict: assert } = require('assert');
const { utils, Wallet, providers, BigNumber } = require('ethers');
```

## 网络配置

### CLV Para Chain 配置

```javascript
// CLV Para Chain 网络配置
const clvUrl = 'wss://clover.api.onfinality.io/public-ws';
const clvRouter = '0x218c3c3d49d0e7b37aff0d8bb079de36ae61a4c0';
const clvAnyToken = '0xc1be9a4d5d45beeacae296a7bd5fadbfc14602c4';
```

### BSC 配置

```javascript
// BSC 网络配置
const bscUrl = 'https://bsc-dataseed1.binance.org/';
const bscRouter = '0xf9736ec3926703e85c843fc972bd89a7f8e827c0';
const bscAnyToken = '0x845ab325e3e4ec379c68047313d66bbd631e59a9';
```

## 桥接函数接口

```javascript
const iface = new utils.Interface([
  'function anySwapOutNative(address token, address to, uint256 toChainID) payable',
  'function anySwapOutUnderlying(address token, address to, uint256 amount, uint256 toChainID)',
]);
```

## 1. CLV Para Chain 到 BSC

### 功能说明
从 CLV Para Chain 桥接原生 CLV 代币到 BSC 网络。

### 完整实现

```javascript
async function clv_para_to_bsc() {
  var anySwapRouter = '0x218c3c3d49d0e7b37aff0d8bb079de36ae61a4c0'; // 路由器地址
  var anyTokenAddress = '0xc1be9a4d5d45beeacae296a7bd5fadbfc14602c4'; // anyToken 地址
  var toAddress = '0x0495EE61A6c19494Aa18326d08A961c446423cA2'; // 目标地址
  var toChainId = '0x38'; // BSC 链 ID

  var wallet = Wallet.fromMnemonic(mnemonic);
  const address = await wallet.getAddress();
  console.log('wallet address: ', address);

  const value = '4000000000000000000'; // 4 CLV (18位小数)
  const url = 'wss://clover.api.onfinality.io/public-ws';

  const provider = new providers.getDefaultProvider(url);
  const network = await provider.getNetwork();
  const chainId = network.chainId;

  console.log('network : ', network);
  console.log('chainId : ', chainId);

  const { gasPrice } = await provider.getFeeData();
  console.log('gasPrice : ', gasPrice);
  const balance = await provider.getBalance(address);
  console.log('balance  : ', balance);

  var nonce = await provider.getTransactionCount(address);
  console.log('nonce : ', nonce);
  
  console.log('anySwapOutNative', anyTokenAddress, toAddress, toChainId);
  
  // 编码原生代币桥接调用
  var input = iface.encodeFunctionData('anySwapOutNative', [
    anyTokenAddress, toAddress, toChainId
  ]);
  console.log('input :', input);

  // 验证编码结果
  assert.strictEqual(
    input,
    '0xa5e56571000000000000000000000000c1be9a4d5d45beeacae296a7bd5fadbfc14602c40000000000000000000000000495ee61a6c19494aa18326d08a961c446423ca20000000000000000000000000000000000000000000000000000000000000038',
  );

  // 构建交易数据
  const txData = {
    chainId,
    nonce: nonce,
    to: anySwapRouter,
    data: input,
    gasPrice: gasPrice,
    gasLimit: BigNumber.from('0x01a289').toHexString(), // 108,681 gas
    value: BigNumber.from(value).toHexString(), // 关键：发送原生代币
  };

  var unsignedTx = { ...txData };

  // 签名交易
  const message = utils.keccak256(utils.serializeTransaction(unsignedTx));
  var signature = wallet._signingKey().signDigest(utils.arrayify(message));
  var signedTx = utils.serializeTransaction(unsignedTx, signature);
  
  console.log('signedTx : ', signedTx);
  var tx = utils.parseTransaction(signedTx);
  var txHash = tx.hash;
  console.log('txHash    : ', txHash);
  console.log('signed tx : ', tx);

  // 发送交易
  var { hash } = await provider.sendTransaction(signedTx);
  console.log('txHash : ', hash);
}
```

### 关键点

- **`anySwapOutNative`**: 用于桥接原生代币
- **`value` 字段**: 必须设置要桥接的原生代币数量
- **Gas 限制**: 硬编码为 108,681 gas
- **目标链**: BSC (链 ID: 0x38)

## 2. BSC 到 CLV Para Chain

### 功能说明
从 BSC 桥接 CLV 代币到 CLV Para Chain 网络。

### 完整实现

```javascript
async function bsc_to_clv_para() {
  var anySwapRouter = '0xf9736ec3926703e85c843fc972bd89a7f8e827c0'; // 路由器地址
  var anyTokenAddress = '0x845ab325e3e4ec379c68047313d66bbd631e59a9'; // anyToken 地址
  var toAddress = '0x0495EE61A6c19494Aa18326d08A961c446423cA2'; // 目标地址
  var toChainId = '1024'; // CLV para chainId

  var wallet = Wallet.fromMnemonic(mnemonic);
  const address = await wallet.getAddress();

  const toAmount = '4000000000000000000'; // 4 CLV
  const url = 'https://bsc-dataseed1.binance.org/';

  const provider = new providers.JsonRpcProvider(url);
  const network = await provider.getNetwork();
  const chainId = network.chainId;

  console.log('network : ', network);
  console.log('chainId : ', chainId);

  const { gasPrice } = await provider.getFeeData();
  console.log('gasPrice : ', gasPrice);
  const balance = await provider.getBalance(address);
  console.log('balance  : ', balance);

  var nonce = await provider.getTransactionCount(address);

  // 编码代币桥接调用
  var input = iface.encodeFunctionData('anySwapOutUnderlying', [
    anyTokenAddress, toAddress, toAmount, toChainId
  ]);
  console.log('input :', input);
  
  // 验证编码结果
  assert.strictEqual(
    input,
    '0xedbdf5e2000000000000000000000000845ab325e3e4ec379c68047313d66bbd631e59a90000000000000000000000000495ee61a6c19494aa18326d08a961c446423ca20000000000000000000000000000000000000000000000003782dace9d9000000000000000000000000000000000000000000000000000000000000000000400',
  );

  // 构建交易数据
  const txData = {
    chainId,
    nonce: 0x1 || nonce,
    to: anySwapRouter,
    data: input,
    gasPrice: BigNumber.from(0x12a05f200).toHexString() || gasPrice, // 硬编码 gas 价格
    gasLimit: BigNumber.from(96855).toHexString(), // 硬编码 gas 限制
    value: BigNumber.from(0).toHexString(), // 不发送原生代币
  };

  var unsignedTx = { ...txData };

  // 签名交易
  const message = utils.keccak256(utils.serializeTransaction(unsignedTx));
  var signature = wallet._signingKey().signDigest(utils.arrayify(message));
  var signedTx = utils.serializeTransaction(unsignedTx, signature);
  
  console.log('signedTx : ', signedTx);
  var tx = utils.parseTransaction(signedTx);
  var txHash = tx.hash;
  console.log('txHash    : ', txHash);
  console.log('signed tx : ', tx);
  
  // 注意：这里提前返回，不发送交易
  return;
  
  // 发送交易
  var { hash } = await provider.sendTransaction(signedTx);
  console.log('txHash : ', hash);
}
```

### 关键点

- **`anySwapOutUnderlying`**: 用于桥接代币
- **`value: '0x00'`**: 不发送原生代币
- **硬编码参数**: Gas 价格和限制都是硬编码的
- **目标链**: CLV Para Chain (链 ID: 1024)

## 网络参数对比

| 参数          | CLV Para Chain                               | BSC                                          |
| ------------- | -------------------------------------------- | -------------------------------------------- |
| RPC URL       | `wss://clover.api.onfinality.io/public-ws`   | `https://bsc-dataseed1.binance.org/`         |
| 路由器地址    | `0x218c3c3d49d0e7b37aff0d8bb079de36ae61a4c0` | `0xf9736ec3926703e85c843fc972bd89a7f8e827c0` |
| anyToken 地址 | `0xc1be9a4d5d45beeacae296a7bd5fadbfc14602c4` | `0x845ab325e3e4ec379c68047313d66bbd631e59a9` |
| 链 ID         | 1024                                         | 56 (0x38)                                    |

## 桥接函数对比

| 函数                   | 用途         | 是否需要 value | 示例      |
| ---------------------- | ------------ | -------------- | --------- |
| `anySwapOutNative`     | 桥接原生代币 | 是             | CLV → BSC |
| `anySwapOutUnderlying` | 桥接代币     | 否             | BSC → CLV |

## 实际交易示例

### CLV Para Chain → BSC

```javascript
// 交易哈希: 0x2c6a01b4ff0b90c0d9c3c9ad2ba55768d155e3e9b55f0937987dbaa0656f4486
// 源链: https://clvscan.com/tx/0x2c6a01b4ff0b90c0d9c3c9ad2ba55768d155e3e9b55f0937987dbaa0656f4486
// 桥接状态: https://bridgeapi.anyswap.exchange/v2/history/details?params=0x2c6a01b4ff0b90c0d9c3c9ad2ba55768d155e3e9b55f0937987dbaa0656f4486
// 目标链: https://bscscan.com/tx/0xd37f0d47a77e7bb49795c2c80c1ea9eac7faf6029578d7ee5491012b6c0661cd
```

### BSC → CLV Para Chain

```javascript
// 交易哈希: 0x6dead5bef6712facd86d83ee88917d1e7c2ebc0193b14104db9012e8e10ff1ef
// 源链: https://bscscan.com/tx/0x6dead5bef6712facd86d83ee88917d1e7c2ebc0193b14104db9012e8e10ff1ef
// 桥接状态: https://bridgeapi.anyswap.exchange/v2/history/details?params=0x6dead5bef6712facd86d83ee88917d1e7c2ebc0193b14104db9012e8e10ff1ef
// 目标链: https://clvscan.com/tx/0xdc449325e32816afd3971ace69102d9bf7b52fa102bff1b85a4b34d4010377ed
```

## 桥接流程详解

### 1. 前置检查

```javascript
async function preflightCheck(sourceChain, targetChain) {
  // 检查源链余额
  const sourceBalance = await getSourceChainBalance(sourceChain);
  if (sourceBalance.lt(getRequiredAmount(sourceChain))) {
    throw new Error('源链余额不足');
  }
  
  // 检查目标链状态
  const targetStatus = await checkTargetChainStatus(targetChain);
  if (!targetStatus.isAvailable) {
    throw new Error('目标链不可用');
  }
  
  return true;
}
```

### 2. 参数验证

```javascript
function validateBridgeParameters(params) {
  const { sourceChain, targetChain, amount, toAddress } = params;
  
  if (!isValidChainId(sourceChain)) {
    throw new Error('无效的源链 ID');
  }
  
  if (!isValidChainId(targetChain)) {
    throw new Error('无效的目标链 ID');
  }
  
  if (!utils.isAddress(toAddress)) {
    throw new Error('无效的目标地址');
  }
  
  if (amount <= 0) {
    throw new Error('无效的转移数量');
  }
  
  return true;
}
```

### 3. 交易构建

```javascript
async function buildBridgeTransaction(params) {
  const { sourceChain, targetChain, amount, toAddress, isNative } = params;
  
  // 选择正确的路由器地址
  const router = getRouterAddress(sourceChain);
  
  // 选择正确的函数
  const functionName = isNative ? 'anySwapOutNative' : 'anySwapOutUnderlying';
  
  // 编码函数调用
  const functionParams = isNative 
    ? [getAnyTokenAddress(sourceChain), toAddress, targetChain]
    : [getAnyTokenAddress(sourceChain), toAddress, amount, targetChain];
    
  const input = iface.encodeFunctionData(functionName, functionParams);
  
  // 构建交易数据
  const txData = {
    chainId: getChainId(sourceChain),
    nonce: await getNonce(sourceChain),
    to: router,
    data: input,
    gasPrice: await getGasPrice(sourceChain),
    gasLimit: getGasLimit(sourceChain, functionName),
    value: isNative ? amount : '0x00',
  };
  
  return txData;
}
```

## 状态监控

### 1. 源链交易监控

```javascript
async function monitorSourceTransaction(txHash, sourceChain) {
  const provider = getProvider(sourceChain);
  
  try {
    const receipt = await provider.waitForTransaction(txHash);
    
    if (receipt.status === 1) {
      console.log('源链交易成功确认');
      return receipt;
    } else {
      throw new Error('源链交易失败');
    }
  } catch (error) {
    console.error('源链交易监控失败:', error.message);
    throw error;
  }
}
```

### 2. 桥接状态查询

```javascript
async function queryBridgeStatus(txHash) {
  const bridgeApi = 'https://bridgeapi.anyswap.exchange/v2/history/details';
  const params = `?params=${txHash}`;
  
  try {
    const response = await fetch(bridgeApi + params);
    const data = await response.json();
    
    console.log('桥接状态:', data);
    return data;
  } catch (error) {
    console.error('查询桥接状态失败:', error.message);
    throw error;
  }
}
```

### 3. 目标链状态检查

```javascript
async function checkDestinationStatus(bridgeData, targetChain) {
  const provider = getProvider(targetChain);
  
  // 根据桥接数据查找目标链交易
  const targetTxHash = bridgeData.targetTxHash;
  
  if (targetTxHash) {
    const receipt = await provider.waitForTransaction(targetTxHash);
    return {
      success: receipt.status === 1,
      hash: targetTxHash,
      receipt
    };
  }
  
  return { success: false, message: '目标链交易未找到' };
}
```

## 错误处理

### 1. 网络错误

```javascript
async function handleNetworkError(error, chain) {
  if (error.code === 'NETWORK_ERROR') {
    console.log(`${chain} 网络连接失败，尝试重连...`);
    await reconnectToNetwork(chain);
  } else if (error.code === 'TIMEOUT') {
    console.log(`${chain} 网络超时，请检查网络状态`);
  } else {
    console.log(`未知网络错误:`, error.message);
  }
}
```

### 2. 交易错误

```javascript
async function handleTransactionError(error, txData) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('余额不足，无法支付 gas 费用');
  } else if (error.code === 'NONCE_EXPIRED') {
    console.log('Nonce 已过期，请重新获取');
  } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    console.log('无法估算 gas 限制，使用硬编码值');
    txData.gasLimit = getHardcodedGasLimit(txData.to);
  } else {
    console.log('未知交易错误:', error.message);
  }
}
```

## 最佳实践

### 1. 参数配置

```javascript
// 使用配置文件管理网络参数
const networkConfig = {
  'clv': {
    url: 'wss://clover.api.onfinality.io/public-ws',
    router: '0x218c3c3d49d0e7b37aff0d8bb079de36ae61a4c0',
    anyToken: '0xc1be9a4d5d45beeacae296a7bd5fadbfc14602c4',
    chainId: 1024,
    gasLimit: '0x01a289'
  },
  'bsc': {
    url: 'https://bsc-dataseed1.binance.org/',
    router: '0xf9736ec3926703e85c843fc972bd89a7f8e827c0',
    anyToken: '0x845ab325e3e4ec379c68047313d66bbd631e59a9',
    chainId: 56,
    gasLimit: '96855'
  }
};
```

### 2. 错误重试

```javascript
async function bridgeWithRetry(params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await executeBridge(params);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`尝试 ${attempt} 失败，正在重试...`);
      await delay(1000 * Math.pow(2, attempt - 1)); // 指数退避
    }
  }
}
```

### 3. 状态监控

```javascript
async function monitorBridgeProgress(txHash, sourceChain, targetChain) {
  console.log('开始监控桥接进度...');
  
  // 监控源链交易
  const sourceReceipt = await monitorSourceTransaction(txHash, sourceChain);
  console.log('✅ 源链交易确认完成');
  
  // 查询桥接状态
  const bridgeStatus = await queryBridgeStatus(txHash);
  console.log('🔍 桥接状态:', bridgeStatus.status);
  
  // 监控目标链交易
  const targetStatus = await checkDestinationStatus(bridgeStatus, targetChain);
  if (targetStatus.success) {
    console.log('✅ 目标链交易确认完成');
    console.log('🎉 桥接成功！');
  } else {
    console.log('❌ 目标链交易失败');
  }
  
  return { sourceReceipt, bridgeStatus, targetStatus };
}
```

## 安全注意事项

1. **私钥安全**: 使用环境变量存储助记词
2. **网络验证**: 确保连接到正确的网络
3. **地址验证**: 验证所有合约地址
4. **金额验证**: 确保转移金额合理
5. **测试优先**: 先在测试网上验证

## 总结

通过本文档，你应该能够：

- 理解 CLV 原生代币桥接的完整流程
- 实现双向桥接（CLV ↔ BSC）
- 区分原生代币和代币桥接的区别
- 处理各种错误情况和异常
- 监控桥接状态和交易进度

记住，原生代币桥接需要发送 `value`，而代币桥接不需要。始终验证参数和网络配置，确保桥接操作的安全性和可靠性。
