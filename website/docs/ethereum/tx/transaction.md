# 以太坊交易构建与签名

以太坊交易是区块链上状态变更的载体，本文档将详细介绍如何使用ethers.js和ethereumjs-tx构建、签名和验证交易。

## 交易类型

以太坊支持多种交易类型：

1. **Legacy交易（类型0）**: 传统的交易格式
2. **EIP-1559交易（类型2）**: 支持动态燃料定价的新格式
3. **EIP-2930交易（类型1）**: 支持访问列表的交易

## 核心依赖

```javascript
const { ethers, utils } = require('ethers');
const { TransactionFactory } = require('@ethereumjs/tx');
const { default: Common, Hardfork } = require('@ethereumjs/common');
```

## 使用ethereumjs-tx签名

### 基本签名流程

```javascript
async function ethereumjs(chainId, txData) {
  // 创建Common实例，指定链ID和硬分叉
  const common = Common.custom(chainId, { 
    hardfork: Hardfork.London, 
    chain: chainId 
  });
  
  // 从交易数据创建类型化交易
  const typedTransaction = TransactionFactory.fromTxData(txData, { common });
  
  // 获取要签名的消息
  const messageToSign = typedTransaction.getMessageToSign(true);
  const message = utils.hexlify(messageToSign);
  
  // 构建请求对象
  const request = {
    ...typedTransaction.toJSON(),
    chainId,
    type: typedTransaction.type,
  };
  
  // 序列化交易
  const serializedTransaction = ethers.utils.serializeTransaction(request);
  const msg = ethers.utils.keccak256(serializedTransaction);
  
  // 验证消息哈希
  assert.strictEqual(msg, message, 'message mismatch');
  
  // 使用私钥签名交易
  const signedTransaction = typedTransaction.sign(Buffer.from(privateKey, 'hex'));
  return utils.hexlify(signedTransaction.hash());
}
```

### 交易数据结构

```javascript
const txData = {
  chainId,
  gasLimit: "0x5208",        // 21000 gas
  accessList: [],             // 访问列表
  data: "0x",                // 交易数据
  maxFeePerGas: "0x59682f1e", // 最大燃料费用
  maxPriorityFeePerGas: "0x59682f00", // 最大优先费用
  nonce: "0x76",             // 交易序号
  to: "0x2501a57b3625f9762698097c72e3ec06f8de1ee7", // 目标地址
  type: 2,                   // EIP-1559交易类型
  value: "0x38d7ea4c68000"   // 发送的以太币数量
};
```

## 使用ethers.js签名

### 基本签名流程

```javascript
async function ethersjs(chainId, txData) {
  // 构建未签名交易
  const unsignedTransaction = {
    ...txData,
    chainId,
  };
  
  // 计算消息哈希
  const message = ethers.utils.keccak256(
    ethers.utils.serializeTransaction(unsignedTransaction)
  );
  
  // 创建钱包实例
  const wallet = new ethers.Wallet(privateKey);
  
  // 签名消息
  const signature = wallet._signingKey().signDigest(
    ethers.utils.arrayify(message)
  );
  
  // 序列化签名交易
  const signedTransaction = utils.serializeTransaction(
    unsignedTransaction, 
    signature
  );
  
  // 计算交易哈希
  const hash = ethers.utils.keccak256(signedTransaction);
  return hash;
}
```

## 交易验证

### 哈希验证

```javascript
// 验证交易哈希
const ethereumjsHash = await ethereumjs(chainId, txData);
const ethersjsHash = await ethersjs(chainId, txData);

// 验证两个库生成的哈希是否一致
assert.strictEqual(ethereumjsHash, hash, 'ethereumjs hash mismatch');
assert.strictEqual(ethersjsHash, hash, 'ethersjs hash mismatch');
```

### 实际交易示例

```javascript
async function main() {
  const chainId = 5; // Goerli测试网
  const hash = '0x6d9a2610589239b175d50a70c640fb659e7d3c75390fff98fc52dd543c63c097';
  
  const txData = {
    chainId,
    gasLimit: "0x5208",
    accessList: [],
    data: "0x",
    maxFeePerGas: "0x59682f1e",
    maxPriorityFeePerGas: "0x59682f00",
    nonce: "0x76",
    to: "0x2501a57b3625f9762698097c72e3ec06f8de1ee7",
    type: 2,
    value: "0x38d7ea4c68000"
  };
  
  // 使用两个库签名并验证
  const ethereumjsHash = await ethereumjs(chainId, txData);
  const ethersjsHash = await ethersjs(chainId, txData);
  
  console.log('EthereumJS hash:', ethereumjsHash);
  console.log('EthersJS hash:', ethersjsHash);
  console.log('Expected hash:', hash);
}
```

## 高级功能

### 自定义Common配置

```javascript
// 创建自定义Common实例
const customCommon = Common.custom(chainId, {
  hardfork: Hardfork.London,
  chain: chainId,
  // 可以添加更多配置
  eips: [1559, 2930]
});
```

### 交易类型检测

```javascript
function getTransactionType(txData) {
  if (txData.type === 2) {
    return 'EIP-1559';
  } else if (txData.type === 1) {
    return 'EIP-2930';
  } else {
    return 'Legacy';
  }
}
```

## 错误处理

### 常见错误类型

```javascript
try {
  const result = await ethereumjs(chainId, txData);
  return result;
} catch (error) {
  if (error.message.includes('message mismatch')) {
    console.error('交易消息哈希不匹配');
  } else if (error.message.includes('invalid chainId')) {
    console.error('无效的链ID');
  } else {
    console.error('未知错误:', error.message);
  }
  throw error;
}
```

## 性能优化

### 批量交易处理

```javascript
async function batchSignTransactions(transactions, privateKey) {
  const signedTxs = [];
  
  for (const tx of transactions) {
    try {
      const signed = await signTransaction(tx, privateKey);
      signedTxs.push(signed);
    } catch (error) {
      console.error('交易签名失败:', error);
    }
  }
  
  return signedTxs;
}
```

## 安全注意事项

1. **私钥保护**: 永远不要在代码中硬编码私钥
2. **网络验证**: 确保在正确的网络上操作
3. **Gas估算**: 合理设置Gas限制和价格
4. **交易验证**: 始终验证签名和哈希的正确性

## 常见问题

### Q: 为什么需要两个库？
A: 不同库有不同的优势，ethereumjs-tx更底层，ethers.js更易用。

### Q: 如何选择交易类型？
A: 根据网络支持情况，EIP-1559提供更好的Gas费用控制。

### Q: 交易失败怎么办？
A: 检查Gas设置、nonce值和网络连接状态。

