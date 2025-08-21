---
title: USDT 跨链转移
description: 学习如何使用 AnySwap 将 USDT 从 BSC 桥接到 Polygon
---

# USDT 跨链转移

本文档介绍如何使用 AnySwap 将 USDT 代币从币安智能链（BSC）桥接到 Polygon 网络。

## 概述

跨链桥接允许你在不同的区块链网络之间转移资产。本示例演示了从 BSC 到 Polygon 的 USDT 转移过程。

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
const { utils, Wallet, providers } = require('ethers');
```

## 网络配置

### BSC 网络参数

```javascript
// BSC 网络配置
const url = 'https://bsc-dataseed1.binance.org';
const router = '0xd1c5966f9f5ee6881ff6b261bbeda45972b1b5f3'; // AnySwap 路由器
const token = '0xEDF0c420bc3b92B961C6eC411cc810CA81F5F21a';   // USDT anyToken 地址
```

### 目标网络参数

```javascript
const toAddress = '0xD383ACF980b70855AB0C2c4AF0Adaa520E39Bcb3'; // 目标地址
const toAmount = '0xa688906bd8b00000';  // 转移数量 (0.15 USDT)
const toChainId = '0x89';               // Polygon 链 ID (137)
```

## 核心代码实现

### 1. 创建桥接接口

```javascript
const iface = new utils.Interface([
  'function anySwapOutUnderlying(address token, address to, uint256 amount, uint256 toChainId)'
]);
```

### 2. 钱包初始化

```javascript
var wallet = Wallet.fromMnemonic(mnemonic);
const address = await wallet.getAddress();
console.log('wallet : ', address);
```

### 3. 网络连接

```javascript
const provider = new providers.JsonRpcProvider(url);
const network = await provider.getNetwork();
const chainId = network.chainId;

const { gasPrice } = await provider.getFeeData();
const balance = await provider.getBalance(address);
const nonce = await provider.getTransactionCount(address);
```

### 4. 编码桥接调用

```javascript
var input = iface.encodeFunctionData('anySwapOutUnderlying', [
  token, toAddress, toAmount, toChainId
]);
```

### 5. 验证编码结果

```javascript
assert.strictEqual(
  input,
  '0xedbdf5e2000000000000000000000000edf0c420bc3b92b961c6ec411cc810ca81f5f21a000000000000000000000000d383acf980b70855ab0c2c4af0adaa520e39bcb3000000000000000000000000000000000000000000000000a688906bd8b000000000000000000000000000000000000000000000000000000000000000000089',
);
```

## 完整实现示例

```javascript
require('dotenv').config();
const { strict: assert } = require('assert');
const { utils, Wallet, providers } = require('ethers');

var mnemonic = process.env.CROSS_CHAIN_MNEMONIC;

// 创建桥接接口
const iface = new utils.Interface([
  'function anySwapOutUnderlying(address token, address to, uint256 amount, uint256 toChainId)'
]);

// 配置参数
var router = '0xd1c5966f9f5ee6881ff6b261bbeda45972b1b5f3'; // 路由器地址
var token = '0xEDF0c420bc3b92B961C6eC411cc810CA81F5F21a'; // anyToken 地址
var toAddress = '0xD383ACF980b70855AB0C2c4AF0Adaa520E39Bcb3'; // 目标地址
var toAmount = '0xa688906bd8b00000'; // 转移数量 (0.15 USDT)
var toChainId = '0x89'; // polygon chainId

async function main() {
  // 创建钱包
  var wallet = Wallet.fromMnemonic(mnemonic);
  const address = await wallet.getAddress();
  console.log('wallet : ', address);

  // 连接到 BSC 网络
  const url = 'https://bsc-dataseed1.binance.org';
  const provider = new providers.JsonRpcProvider(url);
  const network = await provider.getNetwork();
  const chainId = network.chainId;

  // 获取 gas 价格和钱包信息
  const { gasPrice } = await provider.getFeeData();
  const balance = await provider.getBalance(address);
  const nonce = await provider.getTransactionCount(address);
  
  console.log('balance : ', balance);
  console.log('anySwapOutUnderlying', token, toAddress, toAmount, toChainId);
  
  // 编码桥接调用
  var input = iface.encodeFunctionData('anySwapOutUnderlying', [
    token, toAddress, toAmount, toChainId
  ]);
  
  // 验证编码结果
  assert.strictEqual(
    input,
    '0xedbdf5e2000000000000000000000000edf0c420bc3b92b961c6ec411cc810ca81f5f21a000000000000000000000000d383acf980b70855ab0c2c4af0adaa520e39bcb3000000000000000000000000000000000000000000000000a688906bd8b000000000000000000000000000000000000000000000000000000000000000000089',
  );

  // 构建交易数据
  const txData = {
    chainId,
    nonce,
    to: router,     // 目标是路由器
    data: input,    // 桥接调用数据
    gasPrice,
  };

  // 估算 gas 限制
  const gasLimit = await provider.estimateGas({ ...txData, from: address });
  var unsignedTx = {
    ...txData,
    gasLimit,
  };

  // 签名交易
  const message = utils.keccak256(utils.serializeTransaction(unsignedTx));
  var signature = wallet._signingKey().signDigest(utils.arrayify(message));
  var signedTx = utils.serializeTransaction(unsignedTx, signature);
  
  var tx = utils.parseTransaction(signedTx);
  console.log('signed tx : ', tx);

  // 发送交易
  var { hash } = await provider.sendTransaction(signedTx);
  console.log('txHash : ', hash);
}

main().catch(console.error);
```

## 关键参数详解

### 路由器地址

| 网络     | 路由器地址                                   |
| -------- | -------------------------------------------- |
| BSC      | `0xd1c5966f9f5ee6881ff6b261bbeda45972b1b5f3` |
| Ethereum | `0x6b7a87899490EcE95443e979cA9485CBE7E71522` |
| Polygon  | `0x3a1D87f206d12415f5b0A33E786967680AAb4f6d` |

### 代币地址

| 代币 | BSC 地址                                     | Polygon 地址                                 |
| ---- | -------------------------------------------- | -------------------------------------------- |
| USDT | `0xEDF0c420bc3b92B961C6eC411cc810CA81F5F21a` | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` |
| USDC | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` |

### 链 ID

| 网络     | 链 ID | 十六进制 |
| -------- | ----- | -------- |
| BSC      | 56    | 0x38     |
| Polygon  | 137   | 0x89     |
| Ethereum | 1     | 0x01     |

## 桥接流程详解

### 1. 前置检查

```javascript
async function preflightCheck() {
  // 检查钱包余额
  const ethBalance = await provider.getBalance(address);
  if (ethBalance.lt(utils.parseEther('0.01'))) {
    throw new Error('ETH 余额不足，无法支付 gas 费用');
  }
  
  // 检查代币余额
  const tokenContract = new ethers.Contract(token, [
    'function balanceOf(address account) view returns (uint256)'
  ], provider);
  
  const tokenBalance = await tokenContract.balanceOf(address);
  if (tokenBalance.lt(toAmount)) {
    throw new Error('代币余额不足');
  }
  
  // 检查授权状态
  const allowance = await tokenContract.allowance(address, router);
  if (allowance.lt(toAmount)) {
    throw new Error('代币未授权，请先执行授权操作');
  }
  
  return true;
}
```

### 2. 交易构建

```javascript
async function buildTransaction() {
  // 获取当前网络状态
  const { gasPrice } = await provider.getFeeData();
  const nonce = await provider.getTransactionCount(address);
  
  // 编码函数调用
  const input = iface.encodeFunctionData('anySwapOutUnderlying', [
    token, toAddress, toAmount, toChainId
  ]);
  
  // 构建交易数据
  const txData = {
    chainId,
    nonce,
    to: router,
    data: input,
    gasPrice,
  };
  
  // 估算 gas 限制
  const gasLimit = await provider.estimateGas({ ...txData, from: address });
  
  return {
    ...txData,
    gasLimit,
  };
}
```

### 3. 交易签名

```javascript
async function signTransaction(unsignedTx) {
  // 方法 1: 使用 _signingKey
  const message = utils.keccak256(utils.serializeTransaction(unsignedTx));
  const signature = wallet._signingKey().signDigest(utils.arrayify(message));
  const signedTx = utils.serializeTransaction(unsignedTx, signature);
  
  // 方法 2: 使用 signTransaction（推荐）
  // const signedTx = await wallet.signTransaction(unsignedTx);
  
  return signedTx;
}
```

### 4. 交易发送

```javascript
async function sendTransaction(signedTx) {
  try {
    const { hash } = await provider.sendTransaction(signedTx);
    console.log('交易已发送，哈希:', hash);
    return hash;
  } catch (error) {
    console.error('交易发送失败:', error.message);
    throw error;
  }
}
```

## 状态监控

### 1. 源链交易状态

```javascript
async function monitorSourceTransaction(txHash) {
  const receipt = await provider.waitForTransaction(txHash);
  
  if (receipt.status === 1) {
    console.log('源链交易成功确认');
    return receipt;
  } else {
    throw new Error('源链交易失败');
  }
}
```

### 2. 目标链状态检查

```javascript
async function checkDestinationStatus(sourceTx) {
  // 这里需要实现目标链的状态检查
  // 通常通过 AnySwap API 或目标链浏览器查询
  
  console.log('检查目标链状态...');
  // 实现具体的状态检查逻辑
}
```

### 3. 完整监控流程

```javascript
async function monitorBridge(txHash) {
  try {
    // 监控源链交易
    const sourceReceipt = await monitorSourceTransaction(txHash);
    console.log('源链确认完成');
    
    // 等待一段时间让桥接处理
    await delay(30000); // 等待 30 秒
    
    // 检查目标链状态
    await checkDestinationStatus(sourceReceipt);
    
  } catch (error) {
    console.error('桥接监控失败:', error.message);
  }
}
```

## 错误处理

### 1. 常见错误类型

```javascript
try {
  await main();
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('余额不足');
  } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    console.log('Gas 限制估算失败');
  } else if (error.message.includes('nonce')) {
    console.log('Nonce 错误，请重试');
  } else {
    console.log('未知错误:', error.message);
  }
}
```

### 2. 重试机制

```javascript
async function bridgeWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await main();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`尝试 ${attempt} 失败，正在重试...`);
      await delay(5000 * attempt); // 递增延迟
    }
  }
}
```

## 费用计算

### 1. Gas 费用估算

```javascript
async function estimateGasFees() {
  const { gasPrice } = await provider.getFeeData();
  const estimatedGas = 150000; // 预估 gas 使用量
  
  const gasFee = gasPrice.mul(estimatedGas);
  console.log('预估 Gas 费用:', utils.formatEther(gasFee), 'BNB');
  
  return gasFee;
}
```

### 2. 桥接费用

```javascript
// AnySwap 桥接费用通常为 0.1-0.3%
const bridgeFeeRate = 0.002; // 0.2%
const bridgeFee = parseFloat(utils.formatEther(toAmount)) * bridgeFeeRate;
console.log('桥接费用:', bridgeFee, 'USDT');
```

## 最佳实践

### 1. 测试优先

```javascript
// 先在测试网上测试
const testnetConfig = {
  url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  router: '0x...', // 测试网路由器地址
  token: '0x...',  // 测试网代币地址
};
```

### 2. 参数验证

```javascript
function validateParameters() {
  if (!utils.isAddress(token)) throw new Error('无效的代币地址');
  if (!utils.isAddress(toAddress)) throw new Error('无效的目标地址');
  if (!utils.isAddress(router)) throw new Error('无效的路由器地址');
  if (parseInt(toAmount) <= 0) throw new Error('无效的转移数量');
  if (parseInt(toChainId) <= 0) throw new Error('无效的链 ID');
}
```

### 3. 状态检查

```javascript
async function checkPrerequisites() {
  // 检查网络连接
  await provider.getNetwork();
  
  // 检查钱包余额
  const balance = await provider.getBalance(address);
  if (balance.isZero()) throw new Error('钱包余额为零');
  
  // 检查代币授权
  // ... 实现授权检查逻辑
}
```

## 安全注意事项

1. **私钥安全**: 永远不要在代码中硬编码私钥
2. **网络验证**: 确保连接到正确的网络
3. **地址验证**: 验证所有合约地址的正确性
4. **金额验证**: 确保转移金额合理
5. **测试验证**: 先在测试网上验证功能

## 总结

通过本文档，你应该能够：

- 理解 USDT 跨链桥接的完整流程
- 实现从 BSC 到 Polygon 的资产转移
- 处理各种错误情况和异常
- 监控桥接状态和交易进度

记住，跨链桥接涉及多个网络，请确保在每个步骤都进行适当的验证和错误处理。
