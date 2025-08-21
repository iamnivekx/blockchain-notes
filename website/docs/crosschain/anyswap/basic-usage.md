---
title: AnySwap 基本使用
description: 基于实际代码示例学习 AnySwap 的基本使用方法
---

# AnySwap 基本使用

本指南基于实际的代码示例，展示如何使用 AnySwap 进行跨链资产转移。

## 前置条件

- 安装 Node.js 和 npm
- 配置环境变量（助记词）
- 安装必要的依赖包

## 环境设置

1. 安装依赖：
```bash
npm install ethers dotenv
```

2. 创建 `.env` 文件：
```env
CROSS_CHAIN_MNEMONIC="你的十二个单词助记词"
```

## 1. ABI 编码和解码

### 解码交易数据

```javascript
const { utils } = require('ethers');

// 示例交易数据
var data = '0xedbdf5e2000000000000000000000000edf0c420bc3b92b961c6ec411cc810ca81f5f21a000000000000000000000000d383acf980b70855ab0c2c4af0adaa520e39bcb3000000000000000000000000000000000000000000000000a688906bd8b000000000000000000000000000000000000000000000000000000000000000000089';

// 创建接口
var iface = new utils.Interface([
  'function anySwapOutUnderlying(address token, address to, uint256 amount, uint256 toChainID)',
  'function transfer(address recipient, uint256 amount)',
]);

// 解码函数数据
var input = iface.decodeFunctionData('anySwapOutUnderlying', data);
console.log('input : ', input);
```

### 编码函数调用

```javascript
// 编码 anySwapOutUnderlying 调用
var iface = new utils.Interface([
  'function anySwapOutUnderlying(anyToken,toAddress,amount,toChainID)'
]);

var anyToken = '0xEDF0c420bc3b92B961C6eC411cc810CA81F5F21a';
var toAddress = '0xD383ACF980b70855AB0C2c4AF0Adaa520E39Bcb3';
var amount = '0xa688906bd8b00000';
var toChainID = '0x89';

var data = [anyToken, toAddress, amount, toChainID];
var input = iface.encodeFunctionData('anySwapOutUnderlying', data);
console.log('input : ', input);
```

## 2. 代币授权

在桥接代币之前，需要先授权 AnySwap 路由器使用你的代币：

```javascript
require('dotenv').config();
const { utils, Wallet, providers } = require('ethers');

const mnemonic = process.env.CROSS_CHAIN_MNEMONIC;

// 创建授权接口
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
  
  const provider = new providers.JsonRpcProvider(url);
  const network = await provider.getNetwork();
  const chainId = network.chainId;

  const { gasPrice } = await provider.getFeeData();
  const balance = await provider.getBalance(address);
  const nonce = await provider.getTransactionCount(address);
  
  console.log('balance : ', balance);

  // 编码授权调用
  var input = iface.encodeFunctionData('approve', [router, amount]);

  const txData = {
    chainId,
    nonce,
    to: token,
    data: input,
    value: '0x00',
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

## 3. USDT 跨链转移

从 BSC 桥接 USDT 到 Polygon：

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
var toChainId = '0x89'; // Polygon 链 ID

async function main() {
  var wallet = Wallet.fromMnemonic(mnemonic);
  const address = await wallet.getAddress();
  console.log('wallet : ', address);

  // 连接到 BSC 网络
  const url = 'https://bsc-dataseed1.binance.org';
  const provider = new providers.JsonRpcProvider(url);
  const network = await provider.getNetwork();
  const chainId = network.chainId;

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

  const txData = {
    chainId,
    nonce,
    to: router,
    data: input,
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

## 4. 原生代币桥接

### CLV Para Chain 到 BSC

```javascript
async function clv_para_to_bsc() {
  var anySwapRouter = '0x218c3c3d49d0e7b37aff0d8bb079de36ae61a4c0';
  var anyTokenAddress = '0xc1be9a4d5d45beeacae296a7bd5fadbfc14602c4';
  var toAddress = '0x0495EE61A6c19494Aa18326d08A961c446423cA2';
  var toChainId = '0x38'; // BSC 链 ID

  var wallet = Wallet.fromMnemonic(mnemonic);
  const address = await wallet.getAddress();
  console.log('wallet address: ', address);

  const value = '4000000000000000000'; // 4 CLV
  const url = 'wss://clover.api.onfinality.io/public-ws';

  const provider = new providers.getDefaultProvider(url);
  const network = await provider.getNetwork();
  const chainId = network.chainId;

  const { gasPrice } = await provider.getFeeData();
  const balance = await provider.getBalance(address);
  const nonce = await provider.getTransactionCount(address);

  // 编码原生代币桥接调用
  var input = iface.encodeFunctionData('anySwapOutNative', [
    anyTokenAddress, toAddress, toChainId
  ]);

  const txData = {
    chainId,
    nonce: nonce,
    to: anySwapRouter,
    data: input,
    gasPrice: gasPrice,
    gasLimit: BigNumber.from('0x01a289').toHexString(),
    value: BigNumber.from(value).toHexString(), // 注意：这里需要发送原生代币
  };

  var unsignedTx = { ...txData };

  // 签名并发送交易
  const message = utils.keccak256(utils.serializeTransaction(unsignedTx));
  var signature = wallet._signingKey().signDigest(utils.arrayify(message));
  var signedTx = utils.serializeTransaction(unsignedTx, signature);
  
  var { hash } = await provider.sendTransaction(signedTx);
  console.log('txHash : ', hash);
}
```

### BSC 到 CLV Para Chain

```javascript
async function bsc_to_clv_para() {
  var anySwapRouter = '0xf9736ec3926703e85c843fc972bd89a7f8e827c0';
  var anyTokenAddress = '0x845ab325e3e4ec379c68047313d66bbd631e59a9';
  var toAddress = '0x0495EE61A6c19494Aa18326d08A961c446423cA2';
  var toChainId = '1024'; // CLV para chainId

  var wallet = Wallet.fromMnemonic(mnemonic);
  const address = await wallet.getAddress();

  const toAmount = '4000000000000000000';
  const url = 'https://bsc-dataseed1.binance.org/';

  const provider = new providers.JsonRpcProvider(url);
  const network = await provider.getNetwork();
  const chainId = network.chainId;

  const { gasPrice } = await provider.getFeeData();
  const balance = await provider.getBalance(address);
  const nonce = await provider.getTransactionCount(address);

  // 编码代币桥接调用
  var input = iface.encodeFunctionData('anySwapOutUnderlying', [
    anyTokenAddress, toAddress, toAmount, toChainId
  ]);

  const txData = {
    chainId,
    nonce: 0x1 || nonce,
    to: anySwapRouter,
    data: input,
    gasPrice: BigNumber.from(0x12a05f200).toHexString() || gasPrice,
    gasLimit: BigNumber.from(96855).toHexString(),
    value: BigNumber.from(0).toHexString(),
  };

  var unsignedTx = { ...txData };

  // 签名并发送交易
  const message = utils.keccak256(utils.serializeTransaction(unsignedTx));
  var signature = wallet._signingKey().signDigest(utils.arrayify(message));
  var signedTx = utils.serializeTransaction(unsignedTx, signature);
  
  var { hash } = await provider.sendTransaction(signedTx);
  console.log('txHash : ', hash);
}
```

## 重要参数说明

### 路由器地址
- BSC: `0xd1c5966f9f5ee6881ff6b261bbeda45972b1b5f3`
- CLV Para Chain: `0x218c3c3d49d0e7b37aff0d8bb079de36ae61a4c0`

### 链 ID
- BSC: `56` (0x38)
- Polygon: `137` (0x89)
- CLV Para Chain: `1024`

### 函数选择器
- `anySwapOutUnderlying`: 桥接代币
- `anySwapOutNative`: 桥接原生代币

## 注意事项

1. **授权**: 桥接前必须先授权路由器使用代币
2. **Gas 费用**: 确保源链和目标链都有足够的 gas 费用
3. **原生代币**: 使用 `anySwapOutNative` 时需要发送 `value`
4. **测试**: 始终先在测试网上测试
5. **验证**: 使用 assert 验证编码结果是否正确
