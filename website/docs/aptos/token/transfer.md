# 代币转账

在Aptos中，代币转账是最基本的操作之一。Aptos支持多种代币类型，包括原生APT代币和自定义代币。本文将详细介绍如何进行代币转账操作。

## 转账类型

Aptos支持以下转账类型：

- **APT代币转账**: 原生代币转账
- **自定义代币转账**: 用户创建的代币转账
- **批量转账**: 一次交易中转账给多个地址
- **条件转账**: 基于特定条件的转账

## 基础转账

### 使用CoinClient转账

```typescript
import { AptosClient, AptosAccount, CoinClient, FaucetClient } from "aptos";

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";

async function basicTransfer() {
  // 创建客户端
  const client = new AptosClient(NODE_URL);
  const coinClient = new CoinClient(client);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  
  // 创建账户
  const sender = new AptosAccount();
  const receiver = new AptosAccount();
  
  // 资助发送者账户
  await faucetClient.fundAccount(sender.address(), 100_000_000);
  
  console.log("=== 转账前余额 ===");
  console.log(`发送者: ${await coinClient.checkBalance(sender)}`);
  console.log(`接收者: ${await coinClient.checkBalance(receiver)}`);
  
  // 执行转账
  const txnHash = await coinClient.transfer(
    sender,           // 发送者账户
    receiver,         // 接收者账户
    1000,            // 转账金额（octas）
    { gasUnitPrice: BigInt(100) } // gas设置
  );
  
  // 等待交易确认
  await client.waitForTransaction(txnHash);
  
  console.log("=== 转账后余额 ===");
  console.log(`发送者: ${await coinClient.checkBalance(sender)}`);
  console.log(`接收者: ${await coinClient.checkBalance(receiver)}`);
  console.log(`交易哈希: ${txnHash}`);
}

// 运行示例
basicTransfer().catch(console.error);
```

### 使用TransactionBuilder转账

```typescript
import { 
  AptosClient, 
  AptosAccount, 
  TxnBuilderTypes, 
  BCS,
  TransactionBuilder 
} from "aptos";

async function transferWithBuilder() {
  const client = new AptosClient(NODE_URL);
  
  // 创建账户
  const sender = new AptosAccount();
  const receiver = new AptosAccount();
  
  // 资助发送者
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  await faucetClient.fundAccount(sender.address(), 100_000_000);
  
  // 创建转账payload
  const token = new TxnBuilderTypes.TypeTagStruct(
    TxnBuilderTypes.StructTag.fromString("0x1::aptos_coin::AptosCoin")
  );
  
  const entryFunctionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
      "0x1::coin",           // 模块名
      "transfer",             // 函数名
      [token],                // 代币类型
      [
        BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(receiver.address())),
        BCS.bcsSerializeUint64(1000)
      ]
    )
  );
  
  // 获取账户信息
  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(sender.address()),
    client.getChainId(),
  ]);
  
  // 创建原始交易
  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(sender.address()),
    BigInt(sequenceNumber),
    entryFunctionPayload,
    BigInt(10000),  // max gas
    BigInt(100),    // gas price
    BigInt(Math.floor(Date.now() / 1000) + 10), // expiration
    new TxnBuilderTypes.ChainId(chainId),
  );
  
  // 签名交易
  const signingMsg = TransactionBuilder.getSigningMessage(rawTxn);
  const signature = sender.signBuffer(signingMsg);
  
  // 创建签名交易
  const authenticator = new TxnBuilderTypes.TransactionAuthenticatorEd25519(
    new TxnBuilderTypes.Ed25519PublicKey(sender.signingKey.publicKey),
    new TxnBuilderTypes.Ed25519Signature(signature.toUint8Array())
  );
  
  const signedTxn = new TxnBuilderTypes.SignedTransaction(rawTxn, authenticator);
  
  // 提交交易
  const bcsTxn = BCS.bcsToBytes(signedTxn);
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
  
  // 等待确认
  await client.waitForTransaction(transactionRes.hash);
  console.log(`转账完成，交易哈希: ${transactionRes.hash}`);
}
```

## 自定义代币转账

### 转账自定义代币

```typescript
async function transferCustomToken(
  sender: AptosAccount,
  receiver: AptosAccount,
  coinTypeAddress: string,
  amount: number
) {
  const client = new AptosClient(NODE_URL);
  
  // 创建自定义代币类型标签
  const token = new TxnBuilderTypes.TypeTagStruct(
    TxnBuilderTypes.StructTag.fromString(`${coinTypeAddress}::moon_coin::MoonCoin`)
  );
  
  // 创建转账payload
  const entryFunctionPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
      "0x1::coin",
      "transfer",
      [token],
      [
        BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(receiver.address())),
        BCS.bcsSerializeUint64(amount)
      ]
    )
  );
  
  // 获取账户信息
  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(sender.address()),
    client.getChainId(),
  ]);
  
  // 创建原始交易
  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(sender.address()),
    BigInt(sequenceNumber),
    entryFunctionPayload,
    BigInt(10000),
    BigInt(100),
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId),
  );
  
  // 签名并提交
  const signingMsg = TransactionBuilder.getSigningMessage(rawTxn);
  const signature = sender.signBuffer(signingMsg);
  
  const authenticator = new TxnBuilderTypes.TransactionAuthenticatorEd25519(
    new TxnBuilderTypes.Ed25519PublicKey(sender.signingKey.publicKey),
    new TxnBuilderTypes.Ed25519Signature(signature.toUint8Array())
  );
  
  const signedTxn = new TxnBuilderTypes.SignedTransaction(rawTxn, authenticator);
  const bcsTxn = BCS.bcsToBytes(signedTxn);
  
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
  await client.waitForTransaction(transactionRes.hash);
  
  return transactionRes.hash;
}
```

## 批量转账

### 一次转账给多个地址

```typescript
async function batchTransfer(
  sender: AptosAccount,
  recipients: { address: string; amount: number }[]
) {
  const client = new AptosClient(NODE_URL);
  
  // 创建批量转账payload
  const token = new TxnBuilderTypes.TypeTagStruct(
    TxnBuilderTypes.StructTag.fromString("0x1::aptos_coin::AptosCoin")
  );
  
  // 为每个接收者创建转账指令
  const transfers = recipients.map(recipient => 
    TxnBuilderTypes.EntryFunction.natural(
      "0x1::coin",
      "transfer",
      [token],
      [
        BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(recipient.address)),
        BCS.bcsSerializeUint64(recipient.amount)
      ]
    )
  );
  
  // 创建脚本payload（批量转账）
  const scriptPayload = new TxnBuilderTypes.TransactionPayloadScript(
    new TxnBuilderTypes.Script(
      // 这里需要实际的Move脚本字节码
      new Uint8Array(),
      [],
      transfers.map(transfer => BCS.bcsToBytes(transfer))
    )
  );
  
  // 获取账户信息
  const [{ sequence_number: sequenceNumber }, chainId] = await Promise.all([
    client.getAccount(sender.address()),
    client.getChainId(),
  ]);
  
  // 创建原始交易
  const rawTxn = new TxnBuilderTypes.RawTransaction(
    TxnBuilderTypes.AccountAddress.fromHex(sender.address()),
    BigInt(sequenceNumber),
    scriptPayload,
    BigInt(20000), // 更高的gas限制
    BigInt(100),
    BigInt(Math.floor(Date.now() / 1000) + 10),
    new TxnBuilderTypes.ChainId(chainId),
  );
  
  // 签名并提交
  const signingMsg = TransactionBuilder.getSigningMessage(rawTxn);
  const signature = sender.signBuffer(signingMsg);
  
  const authenticator = new TxnBuilderTypes.TransactionAuthenticatorEd25519(
    new TxnBuilderTypes.Ed25519PublicKey(sender.signingKey.publicKey),
    new TxnBuilderTypes.Ed25519Signature(signature.toUint8Array())
  );
  
  const signedTxn = new TxnBuilderTypes.SignedTransaction(rawTxn, authenticator);
  const bcsTxn = BCS.bcsToBytes(signedTxn);
  
  const transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
  await client.waitForTransaction(transactionRes.hash);
  
  return transactionRes.hash;
}

// 使用示例
const recipients = [
  { address: "0x123...", amount: 1000 },
  { address: "0x456...", amount: 2000 },
  { address: "0x789...", amount: 3000 }
];

await batchTransfer(sender, recipients);
```

## 转账验证

### 检查转账状态

```typescript
async function verifyTransfer(txnHash: string) {
  const client = new AptosClient(NODE_URL);
  
  try {
    // 获取交易详情
    const transaction = await client.getTransactionByHash(txnHash);
    console.log('Transaction Details:', transaction);
    
    // 检查交易状态
    if (transaction.success) {
      console.log('✅ 转账成功');
      
      // 获取交易事件
      const events = await client.getEventsByEventHandle(
        transaction.sender,
        "0x1::coin::CoinStore",
        "withdraw_events"
      );
      
      console.log('Transfer Events:', events);
    } else {
      console.log('❌ 转账失败');
      console.log('Error:', transaction.vm_status);
    }
    
    return transaction.success;
  } catch (error) {
    console.error('Error verifying transfer:', error);
    return false;
  }
}
```

### 检查代币余额

```typescript
async function checkTokenBalance(
  address: string, 
  coinType: string
): Promise<number> {
  const client = new AptosClient(NODE_URL);
  
  try {
    const resources = await client.getAccountResources(address);
    const coinStore = `0x1::coin::CoinStore<${coinType}>`;
    
    const coinResource = resources.find(r => r.type === coinStore);
    
    if (coinResource) {
      return parseInt(coinResource.data.coin.value);
    }
    
    return 0;
  } catch (error) {
    console.error('Error checking balance:', error);
    return 0;
  }
}

// 使用示例
const aptBalance = await checkTokenBalance(
  sender.address(), 
  "0x1::aptos_coin::AptosCoin"
);
console.log('APT Balance:', aptBalance);

const customTokenBalance = await checkTokenBalance(
  sender.address(), 
  "0x123::moon_coin::MoonCoin"
);
console.log('Custom Token Balance:', customTokenBalance);
```

## 转账配置

### Gas设置

```typescript
interface TransferConfig {
  gasUnitPrice: bigint;
  maxGasAmount: bigint;
  expirationTimestampSecs: bigint;
}

function createTransferConfig(
  gasUnitPrice: number = 100,
  maxGasAmount: number = 10000,
  expirationMinutes: number = 10
): TransferConfig {
  return {
    gasUnitPrice: BigInt(gasUnitPrice),
    maxGasAmount: BigInt(maxGasAmount),
    expirationTimestampSecs: BigInt(Math.floor(Date.now() / 1000) + expirationMinutes * 60)
  };
}

// 使用配置进行转账
const config = createTransferConfig(100, 15000, 15);
const txnHash = await coinClient.transfer(sender, receiver, 1000, config);
```

## 完整示例

```typescript
import { 
  AptosClient, 
  AptosAccount, 
  CoinClient, 
  FaucetClient,
  TxnBuilderTypes,
  BCS,
  TransactionBuilder
} from "aptos";

async function comprehensiveTransferExample() {
  // 1. 设置环境
  const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
  const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
  
  const client = new AptosClient(NODE_URL);
  const coinClient = new CoinClient(client);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  
  // 2. 创建账户
  const sender = new AptosAccount();
  const receiver1 = new AptosAccount();
  const receiver2 = new AptosAccount();
  
  console.log('发送者地址:', sender.address().hex());
  console.log('接收者1地址:', receiver1.address().hex());
  console.log('接收者2地址:', receiver2.address().hex());
  
  // 3. 资助发送者
  await faucetClient.fundAccount(sender.address(), 100_000_000);
  console.log('已资助发送者账户');
  
  // 4. 检查初始余额
  console.log('\n=== 初始余额 ===');
  console.log(`发送者: ${await coinClient.checkBalance(sender)}`);
  console.log(`接收者1: ${await coinClient.checkBalance(receiver1)}`);
  console.log(`接收者2: ${await coinClient.checkBalance(receiver2)}`);
  
  // 5. 执行转账
  console.log('\n=== 执行转账 ===');
  
  // 转账给接收者1
  const txn1 = await coinClient.transfer(
    sender, 
    receiver1, 
    10000, 
    { gasUnitPrice: BigInt(100) }
  );
  console.log(`转账1哈希: ${txn1}`);
  
  // 转账给接收者2
  const txn2 = await coinClient.transfer(
    sender, 
    receiver2, 
    20000, 
    { gasUnitPrice: BigInt(100) }
  );
  console.log(`转账2哈希: ${txn2}`);
  
  // 6. 等待交易确认
  await client.waitForTransaction(txn1);
  await client.waitForTransaction(txn2);
  console.log('所有转账已确认');
  
  // 7. 检查最终余额
  console.log('\n=== 最终余额 ===');
  console.log(`发送者: ${await coinClient.checkBalance(sender)}`);
  console.log(`接收者1: ${await coinClient.checkBalance(receiver1)}`);
  console.log(`接收者2: ${await coinClient.checkBalance(receiver2)}`);
  
  // 8. 验证转账
  console.log('\n=== 验证转账 ===');
  await verifyTransfer(txn1);
  await verifyTransfer(txn2);
}

// 运行示例
comprehensiveTransferExample().catch(console.error);
```

## 最佳实践

1. **Gas估算**: 根据网络拥堵情况调整gas价格
2. **错误处理**: 实现适当的错误处理和重试机制
3. **交易确认**: 始终等待交易确认后再进行下一步操作
4. **余额检查**: 转账前检查发送者余额是否充足
5. **地址验证**: 验证接收者地址的有效性

## 常见问题

### Q: 转账失败的原因有哪些？
A: 常见原因包括余额不足、gas不足、地址无效、网络拥堵等。

### Q: 如何估算合适的gas费用？
A: 使用`estimateGasPrice()`获取当前网络gas价格，根据交易复杂度调整。

### Q: 转账需要多长时间确认？
A: 通常几秒到几分钟，取决于网络拥堵情况。

### Q: 可以取消已提交的转账吗？
A: 不能取消已提交的交易，但可以在交易确认前使用RBF（Replace-By-Fee）替换。
