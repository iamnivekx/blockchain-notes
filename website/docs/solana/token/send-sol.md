# SOL转账

Solana的原生代币SOL可以通过多种方式进行转账。本文基于实际代码示例介绍两种主要的SOL转账方式：传统交易和版本化交易。

## 基础设置

### 安装依赖

```bash
npm install @solana/web3.js bs58 tweetnacl @noble/hashes
```

### 环境配置

```typescript
import 'dotenv/config';
import assert from 'node:assert';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import web3, {
  clusterApiUrl,
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  Commitment,
} from '@solana/web3.js';

// 建立连接
const url = clusterApiUrl('devnet');
const connection = new Connection(url, 'confirmed');
console.log('连接已建立', url);
```

## 传统交易方式

### 基础SOL转账 - 基于 send-sol.ts

```typescript
/**
 * 传统SOL转账方式
 */
async function legacyTransfer(
  from: Keypair, 
  to: Keypair, 
  amount: number, 
  commitment: Commitment
) {
  console.log('发送方公钥:', from.publicKey.toBase58());
  console.log('接收方公钥:', to.publicKey.toBase58());

  const fromPubkey = from.publicKey;
  const toPubkey = to.publicKey;

  // 创建转账指令
  const transferIx = SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports: amount,
  });

  // 获取最新区块哈希
  const recentBlockhash = await connection.getLatestBlockhash();
  
  // 创建交易
  const transaction = new web3.Transaction({
    recentBlockhash: recentBlockhash.blockhash,
    feePayer: fromPubkey,
  });
  
  // 添加转账指令
  transaction.add(transferIx);

  // 序列化交易消息
  const transactionBuffer = transaction.serializeMessage();
  
  // 使用私钥签名
  const signature = nacl.sign.detached(transactionBuffer, from.secretKey);

  // 添加签名到交易
  transaction.addSignature(fromPubkey, Buffer.from(signature));

  // 验证签名
  let isVerifiedSignature = transaction.verifySignatures();
  console.log(`签名验证结果: ${isVerifiedSignature}`);

  // 序列化交易
  const rawTransaction = transaction.serialize();
  
  // 发送交易
  const txid = await connection.sendRawTransaction(rawTransaction, {
    preflightCommitment: commitment,
    maxRetries: 2,
  });
  
  // 验证交易ID
  assert.strictEqual(txid, bs58.encode(signature), '交易ID应该与签名相同');
  console.log('交易ID:', txid);
  
  return txid;
}
```

### 使用示例

```typescript
// 环境变量配置
const aliceKey = process.env.SOL_ALICE_KEY;
const bobKey = process.env.SOL_BOB_KEY;

// 从私钥创建密钥对
const from = Keypair.fromSecretKey(bs58.decode(aliceKey));
const to = Keypair.fromSecretKey(bs58.decode(bobKey));

// 转账金额（0.01 SOL）
const amount = LAMPORTS_PER_SOL / 100;
const commitment = 'confirmed';

// 执行传统转账
await legacyTransfer(from, to, amount, commitment);
```

## 版本化交易方式

### 版本化SOL转账 - 基于 send-sol.ts

```typescript
/**
 * 版本化SOL转账方式（推荐）
 */
async function versionedTransfer(
  from: Keypair, 
  to: Keypair, 
  amount: number, 
  commitment: Commitment
) {
  console.log('发送方公钥:', from.publicKey.toBase58());
  console.log('接收方公钥:', to.publicKey.toBase58());

  const fromPubkey = from.publicKey;
  const toPubkey = to.publicKey;
  const feePayer = from.publicKey;

  // 创建转账指令
  const transferIx = SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports: amount,
  });

  // 获取最新区块信息
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  // 创建版本化交易消息
  const messageV0 = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash: blockhash,
    instructions: [transferIx], // 注意这里是指令数组
  }).compileToV0Message();

  // 创建版本化交易
  const transactionV0 = new VersionedTransaction(messageV0);

  // 序列化消息
  const msg = messageV0.serialize();
  
  // 使用私钥签名
  const signature = nacl.sign.detached(msg, from.secretKey);
  
  // 添加签名
  transactionV0.addSignature(feePayer, signature);

  // 验证签名
  const isVerifiedSignature = nacl.sign.detached.verify(
    msg, 
    signature, 
    new PublicKey(feePayer).toBuffer()
  );
  console.log(`签名验证结果: ${isVerifiedSignature}`);

  // 序列化交易
  const raw = transactionV0.serialize();
  
  // 发送交易
  const txid = await connection.sendRawTransaction(raw, {
    preflightCommitment: commitment,
    maxRetries: 2,
  });

  // 验证交易ID
  assert.strictEqual(txid, bs58.encode(signature), '交易ID应该与签名相同');
  console.log('交易ID:', txid);
  
  return txid;
}
```

## 完整示例

```typescript
// 基于 send-sol.ts 的完整示例
async function main() {
  try {
    console.log('🚀 开始SOL转账示例...');
    
    // 1. 环境变量配置
    const aliceKey = process.env.SOL_ALICE_KEY;
    const bobKey = process.env.SOL_BOB_KEY;
    
    if (!aliceKey || !bobKey) {
      throw new Error('请设置SOL_ALICE_KEY和SOL_BOB_KEY环境变量');
    }
    
    // 2. 创建密钥对
    const from = Keypair.fromSecretKey(bs58.decode(aliceKey));
    const to = Keypair.fromSecretKey(bs58.decode(bobKey));
    
    // 3. 转账参数
    const amount = LAMPORTS_PER_SOL / 100; // 0.01 SOL
    const commitment = 'confirmed';
    
    console.log('转账参数:');
    console.log('- 发送方:', from.publicKey.toBase58());
    console.log('- 接收方:', to.publicKey.toBase58());
    console.log('- 金额:', amount / LAMPORTS_PER_SOL, 'SOL');
    console.log('- 网络:', url);
    
    // 4. 执行传统转账
    console.log('\n=== 传统转账方式 ===');
    const legacyTxid = await legacyTransfer(from, to, amount, commitment);
    
    // 5. 执行版本化转账
    console.log('\n=== 版本化转账方式 ===');
    const versionedTxid = await versionedTransfer(from, to, amount, commitment);
    
    console.log('\n✅ SOL转账示例完成!');
    console.log('传统转账ID:', legacyTxid);
    console.log('版本化转账ID:', versionedTxid);
    
  } catch (error) {
    console.error('❌ SOL转账示例失败:', error);
  }
}

// 运行示例
main().catch(console.error);
```

## 最佳实践

1. **使用版本化交易**: 版本化交易提供更好的性能和安全性
2. **合理设置计算预算**: 根据交易复杂度设置适当的计算单位
3. **错误处理**: 实现完善的错误处理和重试机制
4. **签名验证**: 在发送交易前验证签名
5. **网络选择**: 根据需求选择合适的网络（devnet/testnet/mainnet）

## 常见问题

### Q: 传统交易和版本化交易有什么区别？
A: 版本化交易提供更好的性能、更低的费用和更好的安全性，建议使用版本化交易。

### Q: 如何设置合适的计算预算？
A: 简单转账通常200,000计算单位足够，复杂操作可能需要更多。

### Q: 离线签名有什么用途？
A: 离线签名可以用于冷钱包、硬件钱包或需要安全隔离的场景。

### Q: 如何处理交易失败？
A: 检查余额、网络状态、签名有效性，并实现适当的重试机制。

## 参考资源

- [Solana Web3.js文档](https://docs.solana.com/developing/clients/javascript-api)
- [SystemProgram文档](https://docs.solana.com/developing/runtime-facilities/programs#system-program)
- [交易版本化文档](https://docs.solana.com/developing/clients/transaction-versioning)
- [Solana Cookbook](https://solanacookbook.com/references/accounts.html)
