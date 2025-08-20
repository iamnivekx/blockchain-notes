# 交易解码

本示例演示了如何解码 Cosmos 区块链上的交易数据，包括解析交易体、认证信息和公钥信息。

## 功能概述

交易解码是区块链开发中的重要功能，它允许开发者：

- 解析已签名的交易数据
- 提取交易中的消息内容
- 验证交易签名和公钥
- 分析交易费用和 Gas 使用情况

## 核心组件

### 1. 交易结构

Cosmos 交易由以下部分组成：

- **TxRaw**: 原始交易数据
- **TxBody**: 交易体，包含消息和备忘录
- **AuthInfo**: 认证信息，包含签名者公钥和费用

### 2. 解码工具

```javascript
import { Registry } from '@cosmjs/proto-signing';
import { TxRaw, AuthInfo } from '@cosmjs/stargate';
import { fromHex, toHex, fromBase64 } from '@cosmjs/encoding';
```

## 代码示例

### 解码交易数据

```javascript
// 创建注册表
const registry = new Registry(defaultRegistryTypes);

// 解码原始交易
const serialized = '0a95010a92010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64...';
const tx = TxRaw.decode(fromHex(serialized));

// 解码认证信息
const authInfo = AuthInfo.decode(tx.authInfoBytes);

// 解码交易体
const body = registry.decodeTxBody(tx.bodyBytes);
```

### 解析公钥信息

```javascript
// 解码公钥
let pub = decodePubkey({
  typeUrl: '/cosmos.crypto.secp256k1.PubKey',
  value: fromBase64('CiECWAL2sGSujNFQU0IpBdMEgXw0GOtOefgT5QgSeo/El8k='),
});

console.log('公钥类型:', pub.typeUrl);
console.log('公钥值:', toHex(fromBase64(pub.value)));
```

## 交易数据结构

### TxRaw 结构

```javascript
{
  bodyBytes: Uint8Array,      // 交易体字节
  authInfoBytes: Uint8Array,  // 认证信息字节
  signatures: Uint8Array[]    // 签名数组
}
```

### AuthInfo 结构

```javascript
{
  signerInfos: SignerInfo[],  // 签名者信息
  fee: Fee                     // 费用信息
}
```

### TxBody 结构

```javascript
{
  messages: Any[],            // 消息数组
  memo: string,               // 备忘录
  timeoutHeight: string,      // 超时高度
  extensionOptions: Any[],    // 扩展选项
  nonCriticalExtensionOptions: Any[] // 非关键扩展选项
}
```

## 使用场景

### 1. 交易监控

```javascript
// 监控特定地址的交易
async function monitorTransactions(address) {
  const client = await StargateClient.connect(rpcEndpoint);
  const txs = await client.searchTx({ sentFromOrTo: address });
  
  for (const tx of txs) {
    const decoded = TxRaw.decode(fromHex(tx.tx));
    console.log('交易哈希:', tx.hash);
    console.log('交易内容:', registry.decodeTxBody(decoded.bodyBytes));
  }
}
```

### 2. 交易验证

```javascript
// 验证交易签名
async function verifyTransaction(txBytes) {
  const tx = TxRaw.decode(txBytes);
  const authInfo = AuthInfo.decode(tx.authInfoBytes);
  
  // 验证每个签名
  for (let i = 0; i < authInfo.signerInfos.length; i++) {
    const signerInfo = authInfo.signerInfos[i];
    const signature = tx.signatures[i];
    
    // 验证签名逻辑
    const isValid = await verifySignature(signerInfo, signature, tx.bodyBytes);
    console.log(`签名者 ${i} 验证结果:`, isValid);
  }
}
```

### 3. 费用分析

```javascript
// 分析交易费用
function analyzeFees(authInfo) {
  const fee = authInfo.fee;
  console.log('Gas 限制:', fee.gasLimit);
  console.log('费用金额:', fee.amount);
  
  // 计算实际费用
  const actualFee = fee.amount.reduce((total, coin) => {
    return total + parseInt(coin.amount);
  }, 0);
  
  console.log('总费用:', actualFee);
}
```

## 网络配置

### 测试网配置

```javascript
const rpcEndpoint = 'https://rpc.testnet.cosmos.network:443';
const addressPrefix = 'cosmos';
```

### 主网配置

```javascript
const rpcEndpoint = 'https://rpc.cosmos.network:26657';
const addressPrefix = 'cosmos';
```

## 错误处理

### 常见错误

1. **解码失败**: 检查交易数据格式是否正确
2. **公钥类型不匹配**: 确认公钥类型 URL 是否正确
3. **网络连接问题**: 检查 RPC 端点是否可用

### 错误处理示例

```javascript
try {
  const tx = TxRaw.decode(fromHex(serialized));
  console.log('交易解码成功');
} catch (error) {
  console.error('交易解码失败:', error.message);
  
  if (error.message.includes('invalid wire type')) {
    console.log('提示: 检查交易数据格式是否正确');
  }
}
```

## 最佳实践

### 1. 性能优化

- 使用缓存减少重复解码
- 批量处理多个交易
- 异步处理大量交易数据

### 2. 安全性

- 验证所有解码后的数据
- 检查公钥类型和格式
- 验证签名有效性

### 3. 调试技巧

- 使用 `console.log` 输出中间结果
- 检查字节数据的十六进制表示
- 验证网络配置和端点

## 相关资源

- [CosmJS 文档](https://github.com/cosmos/cosmjs)
- [Cosmos SDK 交易格式](https://docs.cosmos.network/)
- [Protocol Buffers 编码](https://developers.google.com/protocol-buffers)
