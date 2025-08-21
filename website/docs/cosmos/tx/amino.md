# Amino 交易

Amino 是 Cosmos 生态系统中传统的交易编码格式，使用 JSON 结构来表示交易数据。虽然新的 Direct 格式更高效，但 Amino 仍然被广泛使用，特别是在需要向后兼容的场景中。

## 基本概念

### Amino 编码特点

- **JSON 格式**: 人类可读的交易结构
- **向后兼容**: 支持旧版本的 Cosmos SDK
- **类型安全**: 内置类型验证
- **签名支持**: 支持多种签名模式

## 交易构建

### 初始化客户端

```typescript
const { AminoTypes, StargateClient, defaultRegistryTypes } = require('@cosmjs/stargate');
const { Registry, makeAuthInfoBytes, encodePubkey } = require('@cosmjs/proto-signing');

async function initializeClient() {
  const prefix = 'cosmos';
  const aminoTypes = new AminoTypes({ prefix });
  const registry = new Registry(defaultRegistryTypes);
  
  const rpcEndpoint = 'https://rpc.testnet.cosmos.network:443';
  const client = await StargateClient.connect(rpcEndpoint);
  
  return { client, aminoTypes, registry };
}
```

### 创建发送消息

```typescript
const { coins } = require('@cosmjs/amino');

function createSendMessage(senderAddress, recipientAddress, amount, denom = 'uphoton') {
  return {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      fromAddress: senderAddress,
      toAddress: recipientAddress,
      amount: [{
        denom: denom,
        amount: amount.toString(),
      }],
    },
  };
}

// 使用示例
const sendMsg = createSendMessage(
  'cosmos14hm24e5wepv5qh5ny2lc50v2hu7fy9gklcd07w',
  'cosmos1xv9tklw7d82sezh9haa573wufgy59vmwe6xxe5',
  '1234567'
);
```

## 交易签名

### 准备签名数据

```typescript
async function prepareSigningData(client, signerAddress) {
  // 获取账户信息
  const signerAccount = await client.getAccount(signerAddress);
  const chainId = await client.getChainId();
  
  // 准备签名指令
  const signingInstruction = {
    accountNumber: signerAccount.accountNumber,
    sequence: signerAccount.sequence,
    chainId: chainId,
    msgs: [sendMsg],
    fee: {
      amount: coins(2000, 'uphoton'),
      gas: '200000',
    },
    memo: 'Amino transaction',
  };
  
  return signingInstruction;
}
```

### 创建签名文档

```typescript
const { makeSignDoc, serializeSignDoc } = require('@cosmjs/amino');

function createSignDoc(signingInstruction, aminoTypes) {
  const { accountNumber, sequence, chainId, msgs, fee, memo } = signingInstruction;
  
  // 转换消息为 Amino 格式
  const aminoMsgs = msgs.map((msg) => aminoTypes.toAmino(msg));
  
  // 创建签名文档
  const signDoc = makeSignDoc(
    aminoMsgs,
    fee,
    chainId,
    memo,
    accountNumber,
    sequence
  );
  
  return signDoc;
}
```

### 签名交易

```typescript
const { encodeSecp256k1Signature } = require('@cosmjs/amino');
const { fromHex, toHex } = require('@cosmjs/encoding');
const crypto = require('@cosmjs/crypto');

async function signTransaction(signDoc, privateKey) {
  // 序列化签名文档
  const signBytes = serializeSignDoc(signDoc);
  
  // 计算消息哈希
  const message = toHex(crypto.sha256(signBytes));
  
  // 使用私钥签名
  const ec = new EC('secp256k1');
  const keypair = ec.keyFromPrivate(Buffer.from(privateKey, 'hex'));
  
  const { r, s } = keypair.sign(message, { canonical: true });
  const signatureBytes = new Uint8Array([
    ...Uint8Array.from(r.toArray()),
    ...Uint8Array.from(s.toArray())
  ]);
  
  // 编码签名
  const sec256k1Pubkey = fromHex(keypair.getPublic(true, 'hex'));
  const signature = encodeSecp256k1Signature(sec256k1Pubkey, signatureBytes);
  
  return signature;
}
```

## 交易编码

### 编码交易体

```typescript
function encodeTransactionBody(signedSignDoc, aminoTypes, registry) {
  // 转换签名后的消息
  const signedTxBody = {
    messages: signedSignDoc.msgs.map((msg) => aminoTypes.fromAmino(msg)),
    memo: signedSignDoc.memo,
  };
  
  // 编码交易体
  const signedTxBodyEncodeObject = {
    typeUrl: '/cosmos.tx.v1beta1.TxBody',
    value: signedTxBody,
  };
  
  const signedTxBodyBytes = registry.encode(signedTxBodyEncodeObject);
  return signedTxBodyBytes;
}
```

### 编码认证信息

```typescript
const { SignMode } = require('cosmjs-types/cosmos/tx/signing/v1beta1/signing');
const { Int53 } = require('@cosmjs/math');

function encodeAuthInfo(signature, fee, sequence, registry) {
  const pubkey = encodePubkey(encodeSecp256k1Pubkey(sec256k1Pubkey));
  const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
  
  const gasLimit = Int53.fromString(fee.gas).toNumber();
  const authInfoBytes = makeAuthInfoBytes(
    [{ pubkey, sequence }],
    fee.amount,
    gasLimit,
    signMode
  );
  
  return authInfoBytes;
}
```

## 交易广播

### 构建最终交易

```typescript
const { TxRaw } = require('cosmjs-types/cosmos/tx/v1beta1/tx');

function buildFinalTransaction(bodyBytes, authInfoBytes, signature) {
  const txRaw = TxRaw.fromPartial({
    bodyBytes: bodyBytes,
    authInfoBytes: authInfoBytes,
    signatures: [fromBase64(signature.signature)],
  });
  
  return txRaw;
}

// 广播交易
async function broadcastTransaction(client, txRaw) {
  const txBytes = TxRaw.encode(txRaw).finish();
  const result = await client.broadcastTx(txBytes);
  
  console.log('Transaction result:', result);
  return result;
}
```

## 完整流程示例

### 执行 Amino 交易

```typescript
async function executeAminoTransaction() {
  try {
    // 1. 初始化
    const { client, aminoTypes, registry } = await initializeClient();
    
    // 2. 准备交易数据
    const signerAddress = 'cosmos14hm24e5wepv5qh5ny2lc50v2hu7fy9gklcd07w';
    const signingInstruction = await prepareSigningData(client, signerAddress);
    
    // 3. 创建签名文档
    const signDoc = createSignDoc(signingInstruction, aminoTypes);
    
    // 4. 签名交易
    const privateKey = process.env.PRIV_KEY;
    const signature = await signTransaction(signDoc, privateKey);
    
    // 5. 编码交易
    const bodyBytes = encodeTransactionBody(signDoc, aminoTypes, registry);
    const authInfoBytes = encodeAuthInfo(signature, signingInstruction.fee, signingInstruction.sequence, registry);
    
    // 6. 构建最终交易
    const txRaw = buildFinalTransaction(bodyBytes, authInfoBytes, signature);
    
    // 7. 广播交易
    const result = await broadcastTransaction(client, txRaw);
    
    console.log('Transaction successful:', result);
    return result;
    
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}
```

## 费用和 Gas 设置

### 费用计算

```typescript
function calculateFee(gasLimit, gasPrice = '1000uphoton') {
  return {
    amount: coins(2000, 'uphoton'),
    gas: gasLimit.toString(),
  };
}

// 推荐的 Gas 限制
const GAS_LIMITS = {
  SEND: 200000,      // 转账交易
  DELEGATE: 180000,  // 委托交易
  UNDELEGATE: 180000, // 取消委托
  REDELEGATE: 180000, // 重新委托
};
```

## 错误处理

### 常见错误类型

```typescript
function handleTransactionError(error) {
  if (error.message.includes('insufficient funds')) {
    console.error('余额不足');
  } else if (error.message.includes('sequence number')) {
    console.error('序列号错误，请重试');
  } else if (error.message.includes('gas')) {
    console.error('Gas 不足，请增加 Gas 限制');
  } else {
    console.error('未知错误:', error.message);
  }
}
```

## 注意事项

- Amino 格式比 Direct 格式消耗更多 Gas
- 确保使用正确的签名模式
- 验证所有交易参数
- 处理序列号冲突
- 合理设置 Gas 限制和费用
- 在生产环境中使用硬件钱包

## 完整示例

查看 `examples/cosmos/tx/amino.js` 文件获取完整的 Amino 交易示例代码。
