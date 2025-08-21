# 多重签名交易

Aptos支持多重签名交易，允许多个账户共同控制一个地址。本文介绍如何创建多签账户和执行多签交易。

## 多签类型

Aptos支持以下多签方案：

- **MultiEd25519**: 基于Ed25519的多重签名
- **可配置阈值**: 支持M-of-N签名要求
- **位图验证**: 使用位图标识签名者

## 创建多签账户

### 生成密钥对

```typescript
import { AptosAccount, TxnBuilderTypes, HexString } from "aptos";

async function createMultisigAccount() {
  // 生成3个密钥对
  const account1 = new AptosAccount();
  const account2 = new AptosAccount();
  const account3 = new AptosAccount();
  
  console.log('账户1地址:', account1.address().hex());
  console.log('账户2地址:', account2.address().hex());
  console.log('账户3地址:', account3.address().hex());
  
  // 创建2-of-3多重签名公钥
  const multiSigPublicKey = new TxnBuilderTypes.MultiEd25519PublicKey(
    [
      new TxnBuilderTypes.Ed25519PublicKey(account1.signingKey.publicKey),
      new TxnBuilderTypes.Ed25519PublicKey(account2.signingKey.publicKey),
      new TxnBuilderTypes.Ed25519PublicKey(account3.signingKey.publicKey),
    ],
    2 // 阈值：需要2个签名
  );
  
  // 从多重签名公钥生成认证密钥
  const authKey = TxnBuilderTypes.AuthenticationKey.fromMultiEd25519PublicKey(
    multiSigPublicKey
  );
  
  // 派生多签账户地址
  const multisigAccountAddress = authKey.derivedAddress();
  console.log('多签账户地址:', multisigAccountAddress.hex());
  
  return {
    accounts: [account1, account2, account3],
    multiSigPublicKey,
    multisigAccountAddress
  };
}
```

### 资助多签账户

```typescript
import { FaucetClient } from "aptos";

async function fundMultisigAccount(address: string) {
  const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
  const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
  
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  
  // 资助多签账户
  await faucetClient.fundAccount(address, 100_000_000);
  console.log(`已资助多签账户 ${address} 100 APT`);
  
  // 验证余额
  const client = new AptosClient(NODE_URL);
  const resources = await client.getAccountResources(address);
  const aptosCoinStore = '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>';
  const accountResource = resources.find((r) => r.type === aptosCoinStore);
  
  if (accountResource) {
    const balance = parseInt(accountResource.data.coin.value);
    console.log(`多签账户余额: ${balance} octas`);
  }
}
```

## 构建多签交易

### 创建交易Payload

```typescript
async function createTransferPayload(
  receiverAddress: string, 
  amount: number
) {
  const token = new TxnBuilderTypes.TypeTagStruct(
    TxnBuilderTypes.StructTag.fromString("0x1::aptos_coin::AptosCoin")
  );
  
  // 创建转账payload
  const entryFunctionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
      "0x1::coin",           // 模块名
      "transfer",             // 函数名
      [token],                // 代币类型
      [
        BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(receiverAddress)),
        BCS.bcsSerializeUint64(amount)
      ]
    )
  );
  
  return entryFunctionPayload;
}
```

### 构建原始交易

```typescript
async function buildRawTransaction(
  senderAddress: string,
  payload: TxnBuilderTypes.TransactionPayload
) {
  const client = new AptosClient(NODE_URL);
  
  // 获取账户信息和链ID
  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(senderAddress),
    client.getChainId(),
  ]);
  
  // 创建原始交易
  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(senderAddress),
    BigInt(sequenceNumber),
    payload,
    BigInt(10000),  // max gas
    BigInt(100),    // gas price
    BigInt(Math.floor(Date.now() / 1000) + 10), // expiration
    new TxnBuilderTypes.ChainId(chainId),
  );
  
  return rawTxn;
}
```

## 签名和提交

### 多签签名

```typescript
import nacl from 'tweetnacl';

async function signMultisigTransaction(
  rawTxn: TxnBuilderTypes.RawTransaction,
  signers: AptosAccount[],
  signerIndices: number[],
  multiSigPublicKey: TxnBuilderTypes.MultiEd25519PublicKey
) {
  // 获取签名消息
  const signingMsg = TransactionBuilder.getSigningMessage(rawTxn);
  
  // 收集签名
  const signatures: TxnBuilderTypes.Ed25519Signature[] = [];
  signers.forEach((signer, index) => {
    const signedMsg = nacl.sign(signingMsg, signer.signingKey.secretKey);
    const sigHexStr = HexString.fromUint8Array(signedMsg.slice(0, 64));
    signatures.push(new TxnBuilderTypes.Ed25519Signature(sigHexStr.toUint8Array()));
  });
  
  // 创建位图标识签名者
  const bitmap = TxnBuilderTypes.MultiEd25519Signature.createBitmap(signerIndices);
  
  // 创建多重签名
  const multiEd25519Sig = new TxnBuilderTypes.MultiEd25519Signature(
    signatures,
    bitmap
  );
  
  // 创建认证器
  const authenticator = new TxnBuilderTypes.TransactionAuthenticatorMultiEd25519(
    multiSigPublicKey,
    multiEd25519Sig
  );
  
  return authenticator;
}
```

### 提交多签交易

```typescript
async function submitMultisigTransaction(
  rawTxn: TxnBuilderTypes.RawTransaction,
  authenticator: TxnBuilderTypes.TransactionAuthenticator
) {
  const client = new AptosClient(NODE_URL);
  
  // 创建签名交易
  const signedTxn = new TxnBuilderTypes.SignedTransaction(rawTxn, authenticator);
  
  // 序列化交易
  const bcsTxn = BCS.bcsToBytes(signedTxn);
  
  // 提交交易
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
  console.log('多签交易已提交，哈希:', transactionRes.hash);
  
  // 等待确认
  await client.waitForTransaction(transactionRes.hash);
  console.log('多签交易已确认');
  
  return transactionRes.hash;
}
```

## 完整示例

```typescript
async function multisigTransferExample() {
  try {
    // 1. 创建多签账户
    console.log("=== 创建多签账户 ===");
    const { accounts, multiSigPublicKey, multisigAccountAddress } = await createMultisigAccount();
    
    // 2. 资助多签账户
    console.log("\n=== 资助多签账户 ===");
    await fundMultisigAccount(multisigAccountAddress.hex());
    
    // 3. 创建接收者账户
    const receiver = new AptosAccount();
    console.log('接收者地址:', receiver.address().hex());
    
    // 4. 构建转账交易
    console.log("\n=== 构建转账交易 ===");
    const payload = await createTransferPayload(receiver.address().hex(), 123);
    const rawTxn = await buildRawTransaction(multisigAccountAddress.hex(), payload);
    
    // 5. 多签签名（账户1和账户3签名）
    console.log("\n=== 多签签名 ===");
    const signers = [accounts[0], accounts[2]]; // 账户1和账户3
    const signerIndices = [0, 2]; // 对应的索引
    const authenticator = await signMultisigTransaction(
      rawTxn, 
      signers, 
      signerIndices, 
      multiSigPublicKey
    );
    
    // 6. 提交交易
    console.log("\n=== 提交多签交易 ===");
    const txnHash = await submitMultisigTransaction(rawTxn, authenticator);
    
    // 7. 验证结果
    console.log("\n=== 验证结果 ===");
    const client = new AptosClient(NODE_URL);
    
    // 检查多签账户余额
    const multisigResources = await client.getAccountResources(multisigAccountAddress.hex());
    const multisigCoinResource = multisigResources.find((r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
    const multisigBalance = multisigCoinResource ? parseInt(multisigCoinResource.data.coin.value) : 0;
    console.log(`多签账户余额: ${multisigBalance}`);
    
    // 检查接收者余额
    const receiverResources = await client.getAccountResources(receiver.address().hex());
    const receiverCoinResource = receiverResources.find((r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
    const receiverBalance = receiverCoinResource ? parseInt(receiverCoinResource.data.coin.value) : 0;
    console.log(`接收者余额: ${receiverBalance}`);
    
    console.log("\n✅ 多签转账示例完成！");
    
  } catch (error) {
    console.error("❌ 错误:", error);
  }
}

// 运行示例
multisigTransferExample().catch(console.error);
```


## 最佳实践

1. **密钥安全**: 安全存储所有签名者的私钥
2. **阈值设置**: 合理设置签名阈值，平衡安全性和便利性
3. **备份策略**: 备份多签账户配置和密钥
4. **测试环境**: 在开发网充分测试多签功能
5. **监控交易**: 监控多签账户的所有交易活动

## 常见问题

### Q: 如何恢复多签账户？
A: 需要收集足够的签名者私钥来重建多签账户。

### Q: 可以动态添加签名者吗？
A: 需要重新部署多签账户或使用可升级的多签合约。

### Q: 多签交易失败怎么办？
A: 检查签名数量是否达到阈值，以及交易参数是否正确。

### Q: 如何验证多签交易？
A: 使用位图和签名验证多签交易的有效性。
