# Squads V3 多签

Squads V3是Solana上的传统多重签名协议，提供基础但安全的多签钱包解决方案。本文基于实际代码示例介绍V3的使用方法。

## 安装依赖

```bash
npm install @sqds/sdk @solana/web3.js bn.js
```

## 基础设置

```typescript
import 'dotenv/config';
import { BN } from 'bn.js';
import { Keypair, PublicKey, ComputeBudgetProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Squads, { Wallet, getTxPDA } from '@sqds/sdk';

// 创建连接和密钥对
const payer = Keypair.fromSecretKey(bs58.decode(process.env.SOL_DAVE_KEY || ''));
const multisigPDA = new PublicKey('8NC7mZZhYpn1y2egFH1khc83xQJK1q3qjRqUFsrXAkCd');
const squads = Squads.devnet(new Wallet(payer));
```

## 创建多签账户

```typescript
import Squads, { DEFAULT_MULTISIG_PROGRAM_ID, Wallet, getAuthorityPDA, getMsPDA } from '@sqds/sdk';

async function createMultisigV3() {
  try {
    // 创建成员密钥对
    const payer = Keypair.fromSecretKey(bs58.decode(process.env.SOL_SECRET_KEY || ''));
    const alice = Keypair.fromSecretKey(bs58.decode(process.env.SOL_ALICE_KEY || ''));
    const bob = Keypair.fromSecretKey(bs58.decode(process.env.SOL_BOB_KEY || ''));
    
    // 初始化Squads SDK
    const squads = Squads.devnet(new Wallet(payer));
    
    // 生成随机创建密钥
    const createKey = new Keypair().publicKey;
    const threshold = 2; // 需要2个签名
    const members = [payer.publicKey, alice.publicKey, bob.publicKey];
    
    const name = 'Test Squad V3';
    const description = 'This is a test squad for V3';
    
    // 创建多签账户
    const multisigAccount = await squads.createMultisig(
      threshold, 
      createKey, 
      members, 
      name, 
      description
    );
    
    console.log('✅ 多签账户创建成功:', multisigAccount.publicKey.toBase58());
    console.log('多签账户详情:', JSON.stringify(multisigAccount, null, 2));
    
    // 获取默认金库地址
    const authorityIndex = 1;
    const [vault] = getAuthorityPDA(
      multisigAccount.publicKey, 
      new BN(authorityIndex), 
      DEFAULT_MULTISIG_PROGRAM_ID
    );
    
    console.log('默认金库地址:', vault.toBase58());
    
    return { multisigAccount, vault };
    
  } catch (error) {
    console.error('❌ 创建多签账户失败:', error);
    throw error;
  }
}
```

## 创建多签并资助

```typescript
async function createMultisigAndFunding() {
  try {
    const payer = Keypair.fromSecretKey(bs58.decode(process.env.SOL_SECRET_KEY || ''));
    const squads = Squads.devnet(new Wallet(payer));
    
    // 生成随机创建密钥
    const createKey = new Keypair().publicKey;
    const threshold = 1;
    const members = [payer.publicKey];
    
    const name = '1-1 Squad';
    const description = '1-1 squads for testing';
    
    console.log('创建者公钥:', payer.publicKey.toBase58());
    
    // 构建创建多签指令
    const createMultisigInstruction = await squads.buildCreateMultisig(
      threshold, 
      createKey, 
      members, 
      name, 
      description
    );
    
    // 获取多签PDA
    const [multisigPDA] = getMsPDA(createKey, DEFAULT_MULTISIG_PROGRAM_ID);
    console.log('多签PDA:', multisigPDA.toBase58());
    
    // 获取权限PDA
    const authorityPDA = squads.getAuthorityPDA(multisigPDA, 1);
    console.log('权限PDA:', authorityPDA.toBase58());
    
    // 创建转账指令（资助金库）
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: authorityPDA,
      lamports: 0.001 * LAMPORTS_PER_SOL,
    });
    
    // 构建交易
    const { blockhash } = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: payer.publicKey,
    });
    
    // 设置计算预算
    const computeUnitsInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 0,
    });
    
    transaction.add(computeUnitsInstruction);
    transaction.add(createMultisigInstruction);
    transaction.add(transferInstruction);
    
    // 签名并发送交易
    const signature = await connection.sendTransaction(transaction, [payer]);
    console.log('交易签名:', signature);
    
    // 等待确认
    await connection.confirmTransaction(signature, 'confirmed');
    console.log('✅ 多签账户创建并资助成功!');
    
    return { multisigPDA, authorityPDA, signature };
    
  } catch (error) {
    console.error('❌ 创建多签并资助失败:', error);
    throw error;
  }
}
```

## 1-1 多签交易流程

### 批准交易

```typescript
/**
 * 1-1 approve-transaction
 */
async function approveTransaction() {
  const recentBlockhash = '3r6C8EKcB1FQysbWggT6zQUhB9qRZKhf8DvkANCJwvaS';
  const authorityPDA = squads.getAuthorityPDA(multisigPDA, 1);
  const toPubkey = new PublicKey('5FuQRmLQ1kNX2Teq9bgHVHvrdsb3G6PKmWithyLfxsDt');
  const transactionIndex = new BN(2);
  const [txPDA] = getTxPDA(multisigPDA, transactionIndex, squads.multisigProgramId);
  
  // 验证交易PDA
  assert.strictEqual(
    txPDA.toBase58(), 
    '3gqdLNRS9wGJdX1QeqLAQcr5dhem3nzRJcGugi2xmTX9', 
    'txPDA should be equal.'
  );

  // 设置计算单元价格
  const computeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 0,
  });

  // 创建转账指令
  const transferIx = SystemProgram.transfer({
    fromPubkey: authorityPDA,
    toPubkey: toPubkey,
    lamports: LAMPORTS_PER_SOL * 0.001,
  });

  // 构建交易
  var transaction = new Transaction({
    recentBlockhash,
    feePayer: payer.publicKey,
  });

  // 构建激活交易指令
  const activatedIx = await squads.buildActivateTransaction(multisigPDA, txPDA);
  // 构建批准交易指令
  const approveIx = await squads.buildApproveTransaction(multisigPDA, txPDA);

  // 添加所有指令
  transaction.add(transferIx);
  transaction.add(computeUnitPriceIx);
  transaction.add(activatedIx);
  transaction.add(approveIx);

  // 添加签名（这里使用预定义的签名进行演示）
  const signature = bs58.decode('2wLktm5rjGEX7vBjVtwxkzJUPKFgyXFMcChhLf3gJfwJAZNy9fTJMGcswF568cDzbHG39m8DmFQnXLtx7BBUP9D');
  transaction.addSignature(payer.publicKey, signature);

  const rawTransaction = transaction.serialize();
  console.log('RawTransaction : ', bs58.encode(rawTransaction));

  let isVerifiedSignature = transaction.verifySignatures();
  console.log(`The signatures were verified: ${isVerifiedSignature}`);

  return;
}
```

### 执行交易

```typescript
/**
 * 1-1 execute-transaction
 */
async function executeTransaction() {
  const recentBlockhash = '2AyguSPeTKK3D1jvGkjgECk3f2GSvaPfe7Sed9nc5XG4';
  const transactionIndex = new BN(2);
  const [txPDA] = getTxPDA(multisigPDA, transactionIndex, squads.multisigProgramId);
  
  // 验证交易PDA
  assert.strictEqual(
    txPDA.toBase58(), 
    '3gqdLNRS9wGJdX1QeqLAQcr5dhem3nzRJcGugi2xmTX9', 
    'txPDA should be equal.'
  );

  var transaction = new Transaction({
    recentBlockhash,
    feePayer: payer.publicKey,
  });
  
  // 设置计算单元价格
  const computeUnitPriceInstruction = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 0,
  });

  // 设置计算单元限制
  const computeUnitLimitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000,
  });

  // 构建执行交易指令
  const executeInstruction = await squads.buildExecuteTransaction(txPDA, payer.publicKey);

  // 添加所有指令
  transaction.add(computeUnitPriceInstruction);
  transaction.add(computeUnitLimitInstruction);
  transaction.add(executeInstruction);

  // 添加签名（这里使用预定义的签名进行演示）
  const signature = bs58.decode('4B26gYV3uoeWe87gaVxHgZKBRzeqfdv6Fvtd3V3YhJsw3x2U8dM5u4rCBDAr9woH38izzdgBuqbv1QBvx3qRu8LT');
  transaction.addSignature(payer.publicKey, signature);

  const rawTransaction = transaction.serialize();
  console.log('RawTransaction : ', bs58.encode(rawTransaction));

  let isVerifiedSignature = transaction.verifySignatures();
  console.log(`The signatures were verified: ${isVerifiedSignature}`);
}
```

## 完整示例

```typescript
async function main() {
  try {
    console.log('🚀 开始Squads V3多签示例...');
    
    // 1. 创建多签账户
    console.log('\n=== 创建多签账户 ===');
    const { multisigAccount, vault } = await createMultisigV3();
    
    // 2. 创建并资助多签账户
    console.log('\n=== 创建并资助多签账户 ===');
    const { multisigPDA, authorityPDA, signature } = await createMultisigAndFunding();
    
    // 3. 批准交易
    console.log('\n=== 批准交易 ===');
    await approveTransaction();
    
    // 4. 执行交易
    console.log('\n=== 执行交易 ===');
    await executeTransaction();
    
    console.log('\n🎉 V3多签示例完成!');
    console.log('多签账户:', multisigAccount.publicKey.toBase58());
    console.log('金库地址:', vault.toBase58());
    console.log('创建交易:', signature);
    
  } catch (error) {
    console.error('❌ V3多签示例失败:', error);
  }
}

// 运行示例
main().catch(console.error);
```

## V3特性

### 优势
- **简单易用**: 基础的多签功能，学习曲线平缓
- **稳定性**: 经过时间验证的协议
- **兼容性**: 与现有工具和库兼容性好

### 限制
- **权限管理**: 基础的权限控制
- **功能限制**: 不支持高级的多签功能
- **扩展性**: 架构相对固定

## 最佳实践

1. **密钥管理**: 安全存储所有成员的私钥
2. **阈值设置**: 根据安全需求合理设置签名阈值
3. **测试**: 在开发网充分测试后再部署主网
4. **监控**: 监控交易状态和异常情况

## 常见问题

### Q: V3和V4有什么区别？
A: V3是传统版本，提供基础多签功能；V4是重构版本，提供更细粒度的权限控制和高级功能。

### Q: 如何选择合适的版本？
A: 如果只需要基础多签功能，V3足够；如果需要高级权限管理，建议使用V4。

### Q: 1-1多签是什么意思？
A: 1-1表示只需要1个成员签名就可以执行交易，适用于个人多签钱包。

## 参考资源

- [Squads V3文档](https://docs.squads.so/main/v/squads-legacy)
- [Squads SDK](https://github.com/Squads-Protocol/squads)
- [Squads V3示例代码](https://github.com/Squads-Protocol/squads/tree/main/packages/sdk)
