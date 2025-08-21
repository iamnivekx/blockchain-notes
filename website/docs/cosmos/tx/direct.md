# Direct 交易

Direct 交易是 Cosmos 生态系统中的新交易格式，使用 Protocol Buffers 进行编码，比传统的 Amino 格式更高效，消耗更少的 Gas。

## 基本概念

### Direct 格式优势

- **更高效**: 二进制编码，体积更小
- **更低 Gas**: 减少交易费用
- **类型安全**: 强类型定义
- **性能更好**: 序列化/反序列化更快

## 交易构建

### 初始化客户端

```typescript
const { SigningStargateClient, defaultRegistryTypes } = require('@cosmjs/stargate');
const { DirectSecp256k1HdWallet, Registry } = require('@cosmjs/proto-signing');

async function initializeClient(mnemonic) {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
  const [firstAccount] = await wallet.getAccounts();
  
  const rpcEndpoint = 'https://rpc.testnet.cosmos.network:443';
  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);
  
  return { client, wallet, account: firstAccount };
}
```

### 创建发送消息

```typescript
function createSendMessage(senderAddress, recipientAddress, amount, denom = 'uphoton') {
  return {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
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
```

## 交易签名

### 使用客户端签名

```typescript
async function signWithClient(client, senderAddress, messages, fee, memo) {
  const signingData = {
    chainId: await client.getChainId(),
    accountNumber: (await client.getAccount(senderAddress)).accountNumber,
    sequence: (await client.getAccount(senderAddress)).sequence,
    sec256k1Pubkey: sec256k1Pubkey,
  };

  const txRaw = await client.signDirect(senderAddress, messages, fee, memo, signingData);
  return txRaw;
}
```

### 手动签名

```typescript
async function signDirect(msgs, fee, memo, signerData) {
  const { accountNumber, sequence, sec256k1Pubkey, chainId } = signerData;
  
  // 编码交易体
  const txBodyEncodeObject = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: {
      messages: msgs,
      memo: memo,
    },
  };
  
  const txBodyBytes = registry.encode(txBodyEncodeObject);
  
  // 创建认证信息
  const pubkey = encodePubkey(encodeSecp256k1Pubkey(sec256k1Pubkey));
  const gasLimit = Int53.fromString(fee.gas).toNumber();
  const authInfoBytes = makeAuthInfoBytes([{ pubkey, sequence }], fee.amount, gasLimit);
  
  // 创建签名文档
  const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
  const signBytes = makeSignBytes(signDoc);
  
  // 签名
  const hashedMessage = toHex(crypto.sha256(signBytes));
  const { r, s } = keypair.sign(hashedMessage, { canonical: true });
  
  const signatureBytes = new Uint8Array([
    ...Uint8Array.from(r.toArray()),
    ...Uint8Array.from(s.toArray())
  ]);
  
  const signature = encodeSecp256k1Signature(sec256k1Pubkey, signatureBytes);
  
  return TxRaw.fromPartial({
    bodyBytes: txBodyBytes,
    authInfoBytes,
    signatures: [fromBase64(signature.signature)],
  });
}
```

## 完整示例

查看 `examples/cosmos/tx/direct.js` 文件获取完整的 Direct 交易示例代码。

## 注意事项

- Direct 格式比 Amino 格式更高效
- 确保使用正确的签名模式
- 验证所有交易参数
- 合理设置 Gas 限制和费用
