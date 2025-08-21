# Gnosis Safe集成指南

Gnosis Safe是以太坊上最流行的多重签名钱包解决方案，本文档将详细介绍如何集成和操作Gnosis Safe。

## Gnosis Safe概述

Gnosis Safe提供以下功能：

1. **多重签名**: 需要多个所有者批准交易
2. **阈值控制**: 可配置的签名阈值
3. **安全交易**: 支持批量交易和复杂操作
4. **模块化设计**: 可扩展的插件系统

## 核心依赖

```typescript
const { _TypedDataEncoder } = require('@ethersproject/hash');
const { hexlify, arrayify, splitSignature, hexZeroPad, joinSignature } = require('@ethersproject/bytes');
const { utils } = require('ethers');
const EC = require('elliptic').ec;
const { stripHexPrefix } = require('ethjs-util');
```

## 常量定义

```typescript
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const EIP712_SAFE_TX_TYPE = {
  SafeTx: [
    { type: 'address', name: 'to' },
    { type: 'uint256', name: 'value' },
    { type: 'bytes', name: 'data' },
    { type: 'uint8', name: 'operation' },
    { type: 'uint256', name: 'safeTxGas' },
    { type: 'uint256', name: 'baseGas' },
    { type: 'uint256', name: 'gasPrice' },
    { type: 'address', name: 'gasToken' },
    { type: 'address', name: 'refundReceiver' },
    { type: 'uint256', name: 'nonce' },
  ],
};
```

## 交易发送

### 基本发送函数

```typescript
export function sendTx(web3, data) {
  return new Promise((resolve, reject) => {
    web3.eth
      .sendSignedTransaction(data)
      .once('transactionHash', (hash) => {
        resolve(hash);
      })
      .on('error', function (error) {
        reject(error);
      });
  });
}
```

### 使用示例

```typescript
// 发送签名交易
const hash = await sendTx(web3, signedTransactionData);
console.log('Transaction sent:', hash);
```

## 安全交易构建

### 构建交易模板

```typescript
export function buildSafeTransaction(template) {
  return {
    to: template.to,
    value: template.value || 0,
    data: template.data || '0x',
    operation: template.operation || 0,
    safeTxGas: template.safeTxGas || 0,
    baseGas: template.baseGas || 0,
    gasPrice: template.gasPrice || 0,
    gasToken: template.gasToken || ZERO_ADDRESS,
    refundReceiver: template.refundReceiver || ZERO_ADDRESS,
    nonce: template.nonce,
  };
}
```

### 使用示例

```typescript
const safeTx = buildSafeTransaction({
  to: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
  value: ethers.utils.parseEther('0.1'),
  data: '0x',
  nonce: 0
});

console.log('Safe transaction:', safeTx);
```

## 交易哈希计算

### EIP-712哈希计算

```typescript
export function calculateSafeTransactionHash(chainId, verifyingContract, safeTx) {
  return _TypedDataEncoder.hash(
    { verifyingContract, chainId }, 
    EIP712_SAFE_TX_TYPE, 
    safeTx
  );
}
```

### 使用示例

```typescript
const chainId = 1; // 主网
const safeAddress = '0x...'; // Safe合约地址

const safeTxHash = calculateSafeTransactionHash(chainId, safeAddress, safeTx);
console.log('Safe transaction hash:', safeTxHash);
```

## 签名管理

### 构建签名字节

```typescript
export function buildSignatureBytes(signatures) {
  // 按签名者地址排序
  signatures.sort((left, right) => 
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
  );
  
  let signatureBytes = '0x';
  for (const sig of signatures) {
    signatureBytes += stripHexPrefix(sig.data);
  }
  return signatureBytes;
}
```

### 使用示例

```typescript
const signatures = [
  { signer: '0x1234...', data: '0x...' },
  { signer: '0x5678...', data: '0x...' }
];

const signatureBytes = buildSignatureBytes(signatures);
console.log('Combined signatures:', signatureBytes);
```

## 私钥签名

### 哈希签名

```typescript
export function keySignHash(privateKey, hash) {
  const typedDataHash = arrayify(hash);
  const keyPair = ec.keyFromPrivate(privateKey);
  
  var signature = keyPair.sign(typedDataHash, { canonical: true });
  
  return joinSignature(
    splitSignature({
      recoveryParam: signature.recoveryParam,
      r: hexZeroPad('0x' + signature.r.toString(16), 32),
      s: hexZeroPad('0x' + signature.s.toString(16), 32),
    }),
  );
}
```

### 使用示例

```typescript
const privateKey = '0x...'; // 私钥
const hash = '0x...'; // 要签名的哈希

const signature = keySignHash(privateKey, hash);
console.log('Signature:', signature);
```

## 类型化数据签名

### 签名类型化数据

```typescript
async function signTypedData(privateKey, domain, safeTx, provider) {
  const populated = await _TypedDataEncoder.resolveNames(
    domain, 
    EIP712_SAFE_TX_TYPE, 
    safeTx, 
    (name) => {
      return provider?.resolveName(name);
    }
  );
  
  const safeHash = calculateSafeTransactionHash(
    populated.domain.chainId, 
    populated.domain.verifyingContract, 
    populated.value
  );
  
  console.log('safeHash:', safeHash);
  
  const typedDataHash = arrayify(safeHash);
  return keySignHash(privateKey, typedDataHash);
}
```

### 使用示例

```typescript
const domain = {
  chainId: 1,
  verifyingContract: '0x...'
};

const signature = await signTypedData(privateKey, domain, safeTx, provider);
console.log('Typed data signature:', signature);
```

## 辅助功能

### 安全批准哈希

```typescript
export function safeApproveHash(signerAddress) {
  return {
    signer: signerAddress,
    data: '0x000000000000000000000000' +
          stripHexPrefix(signerAddress) +
          '0000000000000000000000000000000000000000000000000000000000000000' +
          '01',
  };
}
```

### 元交易编码

```typescript
export function encodeMetaTransaction(tx) {
  const data = utils.arrayify(tx.data);
  const encoded = utils.solidityPack(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [tx.operation, tx.to, tx.value, data.length, data],
  );
  return encoded.slice(2);
}
```

### 批量发送编码

```typescript
export function encodeMultiSend(txs) {
  return '0x' + txs.map((tx) => encodeMetaTransaction(tx)).join('');
}
```

## 完整工作流程

### 1. 创建安全交易

```typescript
const safeTx = buildSafeTransaction({
  to: recipientAddress,
  value: ethers.utils.parseEther('0.1'),
  data: '0x',
  nonce: currentNonce
});
```

### 2. 计算交易哈希

```typescript
const safeTxHash = calculateSafeTransactionHash(
  chainId, 
  safeAddress, 
  safeTx
);
```

### 3. 收集签名

```typescript
const signatures = [];
for (const owner of owners) {
  const signature = await signTypedData(
    owner.privateKey, 
    domain, 
    safeTx, 
    provider
  );
  signatures.push({
    signer: owner.address,
    data: signature
  });
}
```

### 4. 构建签名字节

```typescript
const signatureBytes = buildSignatureBytes(signatures);
```

### 5. 执行交易

```typescript
// 调用Safe合约的execTransaction方法
const txData = safeContract.interface.encodeFunctionData('execTransaction', [
  safeTx.to,
  safeTx.value,
  safeTx.data,
  safeTx.operation,
  safeTx.safeTxGas,
  safeTx.baseGas,
  safeTx.gasPrice,
  safeTx.gasToken,
  safeTx.refundReceiver,
  signatureBytes
]);

const tx = await safeContract.execTransaction(
  safeTx.to,
  safeTx.value,
  safeTx.data,
  safeTx.operation,
  safeTx.safeTxGas,
  safeTx.baseGas,
  safeTx.gasPrice,
  safeTx.gasToken,
  safeTx.refundReceiver,
  signatureBytes
);

await tx.wait();
```

## 安全最佳实践

1. **私钥管理**: 安全存储所有者的私钥
2. **阈值设置**: 合理设置签名阈值
3. **网络验证**: 确保在正确的网络上操作
4. **签名验证**: 验证所有签名的有效性
5. **Gas估算**: 合理设置Gas限制

## 常见问题

### Q: 如何设置签名阈值？
A: 在部署Safe时设置，通常为所有者数量的一半以上。

### Q: 交易失败怎么办？
A: 检查签名数量是否达到阈值，以及Gas设置是否合理。

### Q: 如何添加新所有者？
A: 需要现有所有者投票，达到阈值后执行添加操作。
