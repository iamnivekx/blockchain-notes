---
title: 代币授权
description: 学习如何在 AnySwap 中授权代币给路由器合约
---

# 代币授权

本文档介绍如何在 AnySwap 中进行代币授权操作，这是跨链桥接前的必要步骤。

## 概述

在桥接代币之前，必须授权 AnySwap 路由器合约使用你的代币。授权操作允许路由器合约代表你转移指定数量的代币。

## 前置条件

```bash
npm install ethers dotenv
```

## 环境配置

### 1. 创建环境变量文件

```env
CROSS_CHAIN_MNEMONIC="你的十二个单词助记词"
```

### 2. 导入依赖

```javascript
require('dotenv').config();
const { utils, Wallet, providers } = require('ethers');
```

## 基本授权流程

### 1. 创建钱包实例

```javascript
const mnemonic = process.env.CROSS_CHAIN_MNEMONIC;
var wallet = Wallet.fromMnemonic(mnemonic);
const address = await wallet.getAddress();
console.log('wallet : ', address);
```

### 2. 配置网络参数

```javascript
// BSC 网络配置
var url = 'https://bsc-dataseed2.binance.org/';
var router = '0xd1c5966f9f5ee6881ff6b261bbeda45972b1b5f3'; // AnySwap 路由器
var token = '0xEDF0c420bc3b92B961C6eC411cc810CA81F5F21a';   // 代币合约地址

// 最大授权数量（无限授权）
var amount = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
```

### 3. 创建授权接口

```javascript
const iface = new utils.Interface([
  'function approve(address spender, uint256 amount)',
]);
```

### 4. 编码授权调用

```javascript
var input = iface.encodeFunctionData('approve', [router, amount]);
```

## 完整授权示例

```javascript
require('dotenv').config();
const { utils, Wallet, providers } = require('ethers');

const mnemonic = process.env.CROSS_CHAIN_MNEMONIC;

const iface = new utils.Interface([
  'function approve(address spender, uint256 amount)',
]);

async function approve() {
  // 从助记词创建钱包
  var wallet = Wallet.fromMnemonic(mnemonic);
  const address = await wallet.getAddress();
  console.log('wallet : ', address);

  // BSC 网络配置
  var url = 'https://bsc-dataseed2.binance.org/';
  var router = '0xd1c5966f9f5ee6881ff6b261bbeda45972b1b5f3';
  var token = '0xEDF0c420bc3b92B961C6eC411cc810CA81F5F21a';
  
  // 最大授权数量（无限授权）
  var amount = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
  
  // 连接到 BSC 网络
  const provider = new providers.JsonRpcProvider(url);
  const network = await provider.getNetwork();
  const chainId = network.chainId;

  // 获取 gas 价格
  const { gasPrice } = await provider.getFeeData();
  
  // 获取钱包余额和 nonce
  const balance = await provider.getBalance(address);
  const nonce = await provider.getTransactionCount(address);
  console.log('balance : ', balance);

  // 编码授权调用
  var input = iface.encodeFunctionData('approve', [router, amount]);

  // 构建交易数据
  const txData = {
    chainId,
    nonce,
    to: token,        // 目标是代币合约，不是路由器
    data: input,      // 授权调用数据
    value: '0x00',    // 不需要发送 ETH
    gasPrice,
  };

  // 估算 gas 限制
  const gasLimit = await provider.estimateGas({ ...txData, from: address });
  var unsignedTx = {
    ...txData,
    gasLimit,
  };

  // 签名并发送交易
  var signedTx = await wallet.signTransaction(unsignedTx);
  var { hash } = await provider.sendTransaction(signedTx);
  console.log('txHash : ', hash);
}

approve().catch(console.error);
```

## 关键参数说明

### 路由器地址

| 网络     | 路由器地址                                   |
| -------- | -------------------------------------------- |
| BSC      | `0xd1c5966f9f5ee6881ff6b261bbeda45972b1b5f3` |
| Ethereum | `0x6b7a87899490EcE95443e979cA9485CBE7E71522` |
| Polygon  | `0x3a1D87f206d12415f5b0A33E786967680AAb4f6d` |

### 授权数量

```javascript
// 无限授权（推荐用于频繁桥接）
var infiniteAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

// 指定数量授权
var specificAmount = utils.parseEther('1000'); // 1000 代币

// 精确数量授权
var exactAmount = '1000000000000000000000'; // 1000 代币（18位小数）
```

### 代币合约地址

```javascript
// USDT 代币地址（BSC）
var usdtAddress = '0xEDF0c420bc3b92B961C6eC411cc810CA81F5F21a';

// 其他常见代币
var tokens = {
  'USDT': '0xEDF0c420bc3b92B961C6eC411cc810CA81F5F21a',
  'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  'BUSD': '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
};
```

## 授权类型

### 1. 无限授权

```javascript
// 一次性授权，路由器可以无限次使用你的代币
var infiniteAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
```

**优点：**
- 只需授权一次
- 节省 gas 费用
- 适合频繁桥接

**缺点：**
- 安全风险较高
- 路由器可以转移所有代币

### 2. 指定数量授权

```javascript
// 授权特定数量的代币
var specificAmount = utils.parseEther('1000'); // 1000 代币
```

**优点：**
- 安全性更高
- 控制风险敞口
- 适合一次性桥接

**缺点：**
- 需要多次授权
- 增加 gas 费用

### 3. 精确数量授权

```javascript
// 授权精确数量的代币（考虑小数位）
var exactAmount = '1000000000000000000000'; // 1000 代币
```

## 授权状态检查

### 1. 检查当前授权数量

```javascript
const tokenContract = new ethers.Contract(token, [
  'function allowance(address owner, address spender) view returns (uint256)'
], provider);

const allowance = await tokenContract.allowance(address, router);
console.log('当前授权数量:', utils.formatEther(allowance));
```

### 2. 检查代币余额

```javascript
const tokenContract = new ethers.Contract(token, [
  'function balanceOf(address account) view returns (uint256)'
], provider);

const balance = await tokenContract.balanceOf(address);
console.log('代币余额:', utils.formatEther(balance));
```

### 3. 授权状态监控

```javascript
async function checkApprovalStatus(token, router, wallet) {
  const tokenContract = new ethers.Contract(token, [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)'
  ], provider);
  
  const allowance = await tokenContract.allowance(wallet, router);
  const balance = await tokenContract.balanceOf(wallet);
  
  console.log('授权数量:', utils.formatEther(allowance));
  console.log('代币余额:', utils.formatEther(balance));
  console.log('是否已授权:', allowance.gt(0));
  
  return {
    allowance: allowance.toString(),
    balance: balance.toString(),
    isApproved: allowance.gt(0)
  };
}
```

## 批量授权

### 1. 批量授权多个代币

```javascript
async function batchApprove(tokens, router, wallet) {
  const results = [];
  
  for (const token of tokens) {
    try {
      const result = await approveToken(token, router, wallet);
      results.push({ token, success: true, hash: result.hash });
    } catch (error) {
      results.push({ token, success: false, error: error.message });
    }
  }
  
  return results;
}
```

### 2. 批量检查授权状态

```javascript
async function batchCheckApproval(tokens, router, wallet) {
  const statuses = [];
  
  for (const token of tokens) {
    const status = await checkApprovalStatus(token, router, wallet);
    statuses.push({ token, ...status });
  }
  
  return statuses;
}
```

## 错误处理

### 1. 常见错误类型

```javascript
try {
  const result = await approve();
} catch (error) {
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('余额不足，无法支付 gas 费用');
  } else if (error.code === 'NONCE_EXPIRED') {
    console.log('Nonce 已过期，请重新获取');
  } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    console.log('无法估算 gas 限制');
  } else {
    console.log('未知错误:', error.message);
  }
}
```

### 2. 重试机制

```javascript
async function approveWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await approve();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`尝试 ${attempt} 失败，正在重试...`);
      await delay(1000 * attempt); // 指数退避
    }
  }
}
```

## 安全注意事项

### 1. 私钥安全

- 永远不要在代码中硬编码私钥
- 使用环境变量存储助记词
- 定期更换助记词

### 2. 授权安全

- 只授权给可信的路由器
- 定期检查授权状态
- 考虑使用指定数量授权而非无限授权

### 3. 网络安全

- 验证 RPC 节点的可靠性
- 使用 HTTPS 连接
- 避免在公共网络执行授权操作

## 最佳实践

1. **测试优先**: 先在测试网上测试授权功能
2. **Gas 优化**: 选择合适的 gas 价格
3. **状态监控**: 实时监控授权状态
4. **错误处理**: 实现完善的错误处理机制
5. **批量操作**: 对于多个代币，考虑批量授权

## 总结

代币授权是跨链桥接的基础操作。通过本文档，你应该能够：

- 理解授权的必要性
- 实现基本的授权功能
- 处理各种授权场景
- 确保操作的安全性

记住，授权操作是不可逆的，请谨慎操作并确保理解其影响。
