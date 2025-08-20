# 代币转账

在Solana中，SPL代币转账是最基本的操作之一。Solana使用SPL（Solana Program Library）代币标准，支持各种代币类型的转账操作。

## 转账类型

Solana支持以下转账类型：

- **SPL代币转账**: 使用SPL代币标准的代币转账
- **SOL转账**: 原生SOL代币转账
- **批量转账**: 一次交易中转账多个代币
- **条件转账**: 基于特定条件的转账

## SPL代币转账

### 基础代币转账

```typescript
import {
  Connection,
  PublicKey,
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function tokenTransfer(
  fromWallet: Keypair,
  toPublicKey: PublicKey,
  mint: PublicKey,
  amount: number
) {
  const fromPublicKey = fromWallet.publicKey;
  const feePayer = fromWallet.publicKey;

  // 获取发送者的代币账户
  const fromTokenAccount = getAssociatedTokenAddressSync(mint, fromPublicKey, true);
  const fromAssociatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromPublicKey,
    true
  );

  // 验证余额
  const balance = await connection.getTokenAccountBalance(fromAssociatedTokenAccount.address);
  console.log('Current balance:', balance.value);
  
  if (BigInt(balance.value.amount) <= BigInt(0)) {
    throw new Error('Insufficient token balance');
  }

  // 获取接收者的代币账户
  const toTokenAccount = getAssociatedTokenAddressSync(mint, toPublicKey, true);

  // 创建转账指令
  const instructions = [
    // 如果接收者没有代币账户，创建它
    createAssociatedTokenAccountIdempotentInstruction(
      fromPublicKey,
      toTokenAccount,
      toPublicKey,
      mint
    ),
    // 转账指令
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPublicKey,
      BigInt(amount)
    ),
  ];

  // 构建交易
  const { blockhash } = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: fromPublicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  const transactionV0 = new VersionedTransaction(messageV0);

  // 签名交易
  const msg = messageV0.serialize();
  const signature = nacl.sign.detached(msg, fromWallet.secretKey);
  transactionV0.addSignature(feePayer, signature);

  // 验证签名
  const isVerifiedSignature = nacl.sign.detached.verify(
    msg,
    signature,
    new PublicKey(feePayer).toBuffer()
  );
  console.log(`Signature verified: ${isVerifiedSignature}`);

  // 发送交易
  const raw = transactionV0.serialize();
  const txid = await connection.sendRawTransaction(raw, {
    preflightCommitment: 'confirmed',
    maxRetries: 2,
  });

  console.log('Transaction ID:', txid);
  return txid;
}
```

### 代币铸造

```typescript
import { mintTo } from '@solana/spl-token';

async function tokenMint(
  fromWallet: Keypair,
  decimals: number,
  amount: number
): Promise<PublicKey> {
  const fromPublicKey = fromWallet.publicKey;
  
  // 使用现有代币mint或创建新的
  const mint = new PublicKey('HecDWFMjyn9LMHvRvFmUouzmDWz77HRoJg8w5Lv1BtiJ');
  
  // 获取或创建代币账户
  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromPublicKey,
    true
  );

  // 铸造代币
  const signature = await mintTo(
    connection,
    fromWallet,
    mint,
    fromTokenAccount.address,
    fromWallet.publicKey,
    amount * 10 ** decimals,
  );
  
  console.log('Mint transaction:', signature);
  await connection.confirmTransaction(signature, 'confirmed');
  
  return mint;
}
```

## SOL转账

### 基础SOL转账

```typescript
import { SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function transferSOL(
  connection: Connection,
  fromKeypair: Keypair,
  toPublicKey: PublicKey,
  amount: number
) {
  // 检查余额
  const balance = await connection.getBalance(fromKeypair.publicKey);
  const lamports = amount * LAMPORTS_PER_SOL;
  
  if (balance < lamports) {
    throw new Error('Insufficient SOL balance');
  }

  // 创建转账指令
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: fromKeypair.publicKey,
    toPubkey: toPublicKey,
    lamports: lamports,
  });

  // 创建交易
  const transaction = new Transaction().add(transferInstruction);
  
  // 发送交易
  const signature = await connection.sendTransaction(transaction, [fromKeypair]);
  console.log('SOL transfer signature:', signature);
  
  // 等待确认
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
}
```

### 批量SOL转账

```typescript
async function batchTransferSOL(
  connection: Connection,
  fromKeypair: Keypair,
  recipients: { address: PublicKey; amount: number }[]
) {
  const instructions = recipients.map(recipient =>
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: recipient.address,
      lamports: recipient.amount * LAMPORTS_PER_SOL,
    })
  );

  // 创建批量交易
  const transaction = new Transaction().add(...instructions);
  
  // 发送交易
  const signature = await connection.sendTransaction(transaction, [fromKeypair]);
  console.log('Batch transfer signature:', signature);
  
  // 等待确认
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
}
```

## 转账验证

### 检查转账状态

```typescript
async function verifyTransfer(connection: Connection, signature: string) {
  try {
    // 获取交易详情
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
    });
    
    if (transaction) {
      console.log('Transaction confirmed');
      console.log('Block time:', new Date(transaction.blockTime! * 1000));
      console.log('Fee:', transaction.meta?.fee);
      
      return transaction.meta?.err === null;
    } else {
      console.log('Transaction not found');
      return false;
    }
  } catch (error) {
    console.error('Error verifying transfer:', error);
    return false;
  }
}
```

### 检查代币余额

```typescript
async function checkTokenBalance(
  connection: Connection,
  walletAddress: PublicKey,
  mintAddress: PublicKey
): Promise<number> {
  try {
    const tokenAccount = getAssociatedTokenAddressSync(mintAddress, walletAddress, true);
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    
    if (balance.value) {
      return parseInt(balance.value.amount);
    }
    
    return 0;
  } catch (error) {
    console.error('Error checking token balance:', error);
    return 0;
  }
}

// 使用示例
const walletAddress = new PublicKey('your_wallet_address');
const mintAddress = new PublicKey('token_mint_address');
const balance = await checkTokenBalance(connection, walletAddress, mintAddress);
console.log('Token balance:', balance);
```

## 完整示例

```typescript
import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

async function comprehensiveTransferExample() {
  try {
    // 1. 设置连接
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // 2. 创建账户
    const sender = Keypair.generate();
    const receiver = Keypair.generate();
    
    console.log('Sender address:', sender.publicKey.toBase58());
    console.log('Receiver address:', receiver.publicKey.toBase58());
    
    // 3. 资助发送者账户
    const airdropSignature = await connection.requestAirdrop(
      sender.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropSignature);
    console.log('Sender funded');
    
    // 4. 检查SOL余额
    const solBalance = await connection.getBalance(sender.publicKey);
    console.log('Sender SOL balance:', solBalance / LAMPORTS_PER_SOL);
    
    // 5. 转账SOL
    console.log('\n=== SOL Transfer ===');
    const solTransferSig = await transferSOL(
      connection,
      sender,
      receiver.publicKey,
      0.5
    );
    console.log('SOL transfer completed:', solTransferSig);
    
    // 6. 转账SPL代币
    console.log('\n=== SPL Token Transfer ===');
    const mintAddress = new PublicKey('HecDWFMjyn9LMHvRvFmUouzmDWz77HRoJg8w5Lv1BtiJ');
    const tokenTransferSig = await tokenTransfer(
      sender,
      receiver.publicKey,
      mintAddress,
      100
    );
    console.log('Token transfer completed:', tokenTransferSig);
    
    // 7. 验证转账
    console.log('\n=== Verification ===');
    const receiverSolBalance = await connection.getBalance(receiver.publicKey);
    const receiverTokenBalance = await checkTokenBalance(
      connection,
      receiver.publicKey,
      mintAddress
    );
    
    console.log('Receiver SOL balance:', receiverSolBalance / LAMPORTS_PER_SOL);
    console.log('Receiver token balance:', receiverTokenBalance);
    
    console.log('\n✅ All transfers completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// 运行示例
comprehensiveTransferExample().catch(console.error);
```

## 最佳实践

1. **余额检查**: 转账前始终检查账户余额
2. **错误处理**: 实现适当的错误处理和重试机制
3. **交易确认**: 等待交易确认后再进行下一步操作
4. **费用估算**: 考虑交易费用和租金费用
5. **地址验证**: 验证接收者地址的有效性

## 常见问题

### Q: 转账失败的原因有哪些？
A: 常见原因包括余额不足、代币账户不存在、交易费用不足等。

### Q: 如何估算交易费用？
A: 使用`connection.getFeeForMessage()`估算交易费用。

### Q: 转账需要多长时间确认？
A: 通常几秒到几分钟，取决于网络拥堵情况。

### Q: 可以取消已提交的转账吗？
A: 不能取消已提交的交易，但可以在交易确认前使用RBF替换。

## 参考资源

- [Solana SPL代币标准](https://spl.solana.com/token)
- [Solana Web3.js文档](https://docs.solana.com/developing/clients/javascript-api)
- [SPL代币库文档](https://github.com/solana-labs/solana-program-library)
