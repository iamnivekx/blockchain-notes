# Squads V4 多签

Squads V4是Solana上的模块化多重签名协议，提供细粒度权限控制和高级多签功能。本文基于实际代码示例介绍V4的使用方法。

## 安装依赖

```bash
npm install @sqds/multisig @solana/web3.js
```

## 基础设置

```typescript
import 'dotenv/config';
import { clusterApiUrl, Connection, Keypair, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import * as multisig from '@sqds/multisig';

const { Permissions, Permission } = multisig.types;
const { Multisig } = multisig.accounts;

// 创建连接
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const { almighty, proposer, voter, creator } = generateMultisigMembers();
```

## 创建多签账户

```typescript
async function createMultisigV4() {
  try {
    // 创建成员密钥对
    const payer = Keypair.fromSecretKey(bs58.decode(process.env.SOL_SECRET_KEY || ''));
    const alice = Keypair.fromSecretKey(bs58.decode(process.env.SOL_ALICE_KEY || ''));
    const bob = Keypair.fromSecretKey(bs58.decode(process.env.SOL_BOB_KEY || ''));
    
    // 生成随机创建密钥
    const createKey = Keypair.generate();
    
    // 获取多签PDA
    const [multisigPda, multisigDump] = multisig.getMultisigPda({
      createKey: createKey.publicKey,
    });
    
    // 获取程序配置PDA
    const [programConfigPda] = multisig.getProgramConfigPda({});
    const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
      connection, 
      programConfigPda
    );
    
    const configTreasury = programConfig.treasury;
    
    // 创建多签账户
    const signature = await multisig.rpc.multisigCreateV2({
      connection,
      createKey,
      creator: payer,
      multisigPda,
      configAuthority: null,
      timeLock: 0,
      members: [
        {
          key: payer.publicKey,
          permissions: Permissions.all(), // 所有权限
        },
        {
          key: alice.publicKey,
          permissions: Permissions.fromPermissions([Permission.Vote]), // 只能投票
        },
        {
          key: bob.publicKey,
          permissions: Permissions.fromPermissions([Permission.Vote, Permission.Execute]), // 投票和执行
        },
      ],
      threshold: 2, // 需要2个投票
      rentCollector: null,
      treasury: configTreasury,
      sendOptions: { skipPreflight: true },
    });
    
    console.log('✅ V4多签账户创建成功!');
    console.log('多签PDA:', multisigPda.toBase58());
    console.log('交易签名:', signature);
    
    return { multisigPda, signature };
    
  } catch (error) {
    console.error('❌ 创建V4多签账户失败:', error);
    throw error;
  }
}
```

## 配置交易（Config Transaction）

### 一键配置多签

```typescript
/**
 * 一键配置多签 - 基于 config-in-one.ts
 */
async function configMultisigInOne() {
  try {
    const { blockhash } = await connection.getLatestBlockhash();
    console.log('创建者地址:', creator.publicKey.toBase58());
    console.log('管理员地址:', almighty.publicKey.toBase58());

    const rentCollector = almighty.publicKey;
    
    // 创建自治多签账户
    var [multisigPda] = await createAutonomousMultisig({
      connection,
      creator,
      members: [
        { key: almighty.publicKey, permissions: Permissions.all() },
        { key: proposer.publicKey, permissions: Permissions.fromPermissions([Permission.Initiate]) },
        { key: voter.publicKey, permissions: Permissions.fromPermissions([Permission.Vote]) },
      ],
      threshold: 1,
      timeLock: 0,
    });
    
    // 使用现有的多签账户
    var multisigPda = new PublicKey('5jScQQdYLABuQmhczMCmnPbAtPKyRaHDrdknSDq6oNrF');

    var multisigAccount = await Multisig.fromAccountAddress(connection, multisigPda);
    const transactionIndex = multisig.utils.toBigInt(multisigAccount.transactionIndex) + 1n;
    console.log('交易索引:', transactionIndex);

    // 创建配置交易指令
    const createTransactionIx = multisig.instructions.configTransactionCreate({
      multisigPda,
      transactionIndex,
      creator: almighty.publicKey,
      // 可以修改阈值: actions: [{ __kind: 'ChangeThreshold', newThreshold: 2 }],
      actions: [{ __kind: 'SetRentCollector', newRentCollector: rentCollector }],
    });

    // 创建提案指令
    const createProposalIx = multisig.instructions.proposalCreate({
      multisigPda,
      transactionIndex,
      creator: almighty.publicKey,
    });

    // 第一个成员批准
    const approveProposalIx1 = multisig.instructions.proposalApprove({
      multisigPda,
      transactionIndex,
      member: almighty.publicKey,
    });

    // 第二个成员批准
    const approveProposalIx2 = multisig.instructions.proposalApprove({
      multisigPda,
      transactionIndex,
      member: voter.publicKey,
    });

    // 执行交易指令
    const executeTransactionIx = multisig.instructions.configTransactionExecute({
      multisigPda,
      transactionIndex,
      member: almighty.publicKey,
      rentPayer: almighty.publicKey,
    });

    // 创建交易消息
    const message = new TransactionMessage({
      payerKey: almighty.publicKey,
      recentBlockhash: blockhash,
      instructions: [
        createTransactionIx,    // 创建交易
        createProposalIx,       // 创建提案
        approveProposalIx1,     // 第一个成员批准
        approveProposalIx2,     // 第二个成员批准
        executeTransactionIx,   // 执行交易
      ],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign([almighty, voter]);

    const signature = await connection.sendTransaction(tx);
    console.log('交易签名:', signature);
    await connection.confirmTransaction(signature);

    // 验证多签账户
    var multisigAccount = await Multisig.fromAccountAddress(connection, multisigPda);
    const threshold = multisigAccount.threshold;
    console.log('阈值:', threshold);
    
    return { multisigPda, signature, threshold };
    
  } catch (error) {
    console.error('❌ 配置多签失败:', error);
    throw error;
  }
}
```

## 代币铸造（Mint to）

### 一键代币铸造

```typescript
/**
 * 一键代币铸造 - 基于 mint-to-in-one.ts
 */
async function mintTokenInOne() {
  try {
    const lookupTablePda = new PublicKey('F8EKrArN5677PYF7NTjepUbBNNW2r2w17doziWWKjmSw');
    const multisigPda = new PublicKey('5jScQQdYLABuQmhczMCmnPbAtPKyRaHDrdknSDq6oNrF');
    const vaultIndex = 0;

    // 获取当前多签账户
    const multisigAccount = await Multisig.fromAccountAddress(connection, multisigPda);
    const transactionIndex = multisig.utils.toBigInt(multisigAccount.transactionIndex) + 1n;

    // 获取金库PDA
    const [vaultPda] = multisig.getVaultPda({
      multisigPda,
      index: vaultIndex,
    });

    // 获取交易PDA
    const [transactionPda] = multisig.getTransactionPda({
      multisigPda,
      index: transactionIndex,
    });

    // 创建代币铸造指令
    const mintKeypair = Keypair.generate();
    const mintRent = getMinimumBalanceForRentExemptMint(connection);
    
    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: vaultPda,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintRent,
      space: MINT_SIZE,
      programId: TOKEN_2022_PROGRAM_ID,
    });

    const initializeMintIx = createInitializeMint2Instruction(
      mintKeypair.publicKey,
      6, // 小数位数
      vaultPda,
      vaultPda,
      TOKEN_2022_PROGRAM_ID
    );

    const mintToIx = createMintToInstruction(
      mintKeypair.publicKey,
      vaultPda,
      vaultPda,
      1000000, // 铸造数量
      [],
      TOKEN_2022_PROGRAM_ID
    );

    // 创建交易消息
    const transactionMessage = new TransactionMessage({
      instructions: [
        createMintAccountIx,
        initializeMintIx,
        mintToIx,
      ],
      payerKey: almighty.publicKey,
      recentBlockhash: blockhash,
    });

    // 创建金库交易
    const vaultSignature = await multisig.rpc.vaultTransactionCreate({
      connection,
      multisigPda,
      transactionIndex,
      vaultIndex,
      ephemeralSigners: 1, // 需要1个临时签名者
      transactionMessage,
      memo: 'Mint new token',
      creator: almighty.publicKey,
      feePayer: creator,
      rentPayer: creator.publicKey,
      signers: [almighty, creator],
    });

    console.log('✅ 代币铸造交易创建成功:', vaultSignature);
    return { vaultSignature, mintKeypair, transactionIndex };
    
  } catch (error) {
    console.error('❌ 代币铸造失败:', error);
    throw error;
  }
}
```

## SOL转账（Send SOL）

### 一键SOL转账

```typescript
/**
 * 一键SOL转账 - 基于 send-sol-all-in-one.ts
 */
async function sendSolAllInOne() {
  try {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    console.log('创建者地址:', creator.publicKey.toBase58());
    console.log('管理员地址:', almighty.publicKey.toBase58());

    var multisigPda = new PublicKey('5jScQQdYLABuQmhczMCmnPbAtPKyRaHDrdknSDq6oNrF');

    const multisigAccount = await Multisig.fromAccountAddress(connection, multisigPda);
    const transactionIndex = multisig.utils.toBigInt(multisigAccount.transactionIndex) + 1n;

    const vaultIndex = 0;
    // 默认金库，索引0
    const [vaultPda] = multisig.getVaultPda({
      multisigPda,
      index: vaultIndex,
    });
    
    const [proposalPda] = multisig.getProposalPda({
      multisigPda,
      transactionIndex,
    });

    const [transactionPda] = multisig.getTransactionPda({
      multisigPda,
      index: transactionIndex,
    });

    // 创建转账消息
    const transactionMessage = new TransactionMessage({
      instructions: [
        SystemProgram.transfer({
          fromPubkey: vaultPda,
          toPubkey: proposer.publicKey,
          lamports: LAMPORTS_PER_SOL * 0.001,
        }),
      ],
      payerKey: almighty.publicKey,
      recentBlockhash: blockhash,
    });

    // 创建金库交易指令
    const createTransactionIx = multisig.instructions.vaultTransactionCreate({
      multisigPda,
      transactionIndex,
      vaultIndex,
      ephemeralSigners: 2, // 需要2个临时签名者
      transactionMessage,
      memo: 'send 0.001 sol',
      creator: almighty.publicKey,
      feePayer: creator,
      rentPayer: creator.publicKey,
    });

    // 创建提案指令
    const createProposalIx = multisig.instructions.proposalCreate({
      multisigPda,
      transactionIndex,
      creator: almighty.publicKey,
    });

    // 第一个成员批准
    const approveProposalIx1 = multisig.instructions.proposalApprove({
      multisigPda,
      transactionIndex,
      member: almighty.publicKey,
    });

    // 第二个成员批准
    const approveProposalIx2 = multisig.instructions.proposalApprove({
      multisigPda,
      transactionIndex,
      member: voter.publicKey,
    });

    // 执行交易指令
    const executeTransactionIx = multisig.instructions.vaultTransactionExecute({
      multisigPda,
      transactionIndex,
      member: almighty.publicKey,
      rentPayer: almighty.publicKey,
    });

    // 创建交易消息
    const message = new TransactionMessage({
      payerKey: almighty.publicKey,
      recentBlockhash: blockhash,
      instructions: [
        createTransactionIx,    // 创建交易
        createProposalIx,       // 创建提案
        approveProposalIx1,     // 第一个成员批准
        approveProposalIx2,     // 第二个成员批准
        executeTransactionIx,   // 执行交易
      ],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);
    tx.sign([almighty, voter, creator]);

    const signature = await connection.sendTransaction(tx);
    console.log('✅ SOL转账完成:', signature);
    
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    return { signature, transactionIndex };
    
  } catch (error) {
    console.error('❌ SOL转账失败:', error);
    throw error;
  }
}
```

## 权限管理

### V4权限类型

```typescript
import { Permissions, Permission } from '@sqds/multisig';

// 所有权限
const allPermissions = Permissions.all();

// 特定权限组合
const customPermissions = Permissions.fromPermissions([
  Permission.Vote,        // 投票权限
  Permission.Execute,     // 执行权限
  Permission.Initiate,    // 发起权限
  Permission.Approve,     // 批准权限
]);

// 只读权限
const readOnlyPermissions = Permissions.fromPermissions([
  Permission.View,        // 查看权限
]);
```

### 成员管理

```typescript
async function addMember(multisigPda: PublicKey, newMember: PublicKey) {
  try {
    const signature = await multisig.rpc.memberAdd({
      connection,
      multisigPda,
      newMember,
      creator: payer,
      feePayer: payer,
    });
    
    console.log('✅ 成员添加成功:', signature);
    return signature;
    
  } catch (error) {
    console.error('❌ 添加成员失败:', error);
    throw error;
  }
}

async function removeMember(multisigPda: PublicKey, memberToRemove: PublicKey) {
  try {
    const signature = await multisig.rpc.memberRemove({
      connection,
      multisigPda,
      member: memberToRemove,
      creator: payer,
      feePayer: payer,
    });
    
    console.log('✅ 成员移除成功:', signature);
    return signature;
    
  } catch (error) {
    console.error('❌ 移除成员失败:', error);
    throw error;
  }
}
```

## 完整示例

```typescript
async function comprehensiveV4Example() {
  try {
    console.log('🚀 开始Squads V4多签示例...');
    
    // 1. 创建V4多签账户
    console.log('\n=== 创建V4多签账户 ===');
    const { multisigPda } = await createMultisigV4();
    
    // 2. 配置多签账户
    console.log('\n=== 配置多签账户 ===');
    const { threshold } = await configMultisigInOne();
    
    // 3. 铸造代币
    console.log('\n=== 铸造代币 ===');
    const { vaultSignature, mintKeypair } = await mintTokenInOne();
    
    // 4. 转账SOL
    console.log('\n=== 转账SOL ===');
    const { signature } = await sendSolAllInOne();
    
    console.log('\n🎉 V4多签示例完成!');
    console.log('多签PDA:', multisigPda.toBase58());
    console.log('阈值:', threshold);
    console.log('代币铸造:', vaultSignature);
    console.log('SOL转账:', signature);
    
  } catch (error) {
    console.error('❌ V4多签示例失败:', error);
  }
}

// 运行示例
comprehensiveV4Example().catch(console.error);
```

## V4特性

### 优势
- **细粒度权限**: 支持多种权限组合
- **一键操作**: 支持在一个交易中完成多个操作
- **高级功能**: 支持代币铸造、配置修改等
- **模块化架构**: 更灵活的设计

### 新功能
- **配置交易**: 修改多签参数
- **代币操作**: 铸造、转账代币
- **临时签名者**: 支持动态签名者
- **地址查找表**: 优化交易性能

## 最佳实践

1. **权限设计**: 合理设计权限结构，遵循最小权限原则
2. **一键操作**: 利用V4的一键功能减少交易数量
3. **临时签名者**: 合理使用临时签名者优化交易
4. **测试**: 在开发网充分测试后再部署主网

## 常见问题

### Q: V4相比V3有什么改进？
A: V4提供更细粒度的权限控制、一键操作功能、代币操作支持等。

### Q: 什么是一键操作？
A: 一键操作允许在一个交易中完成创建、提案、批准和执行等所有步骤。

### Q: 如何选择合适的权限组合？
A: 根据成员角色和安全需求选择合适的权限组合，遵循最小权限原则。

## 参考资源

- [Squads V4文档](https://docs.squads.so/)
- [Squads V4 GitHub](https://github.com/Squads-Protocol/v4)
- [Squads V4示例](https://github.com/Squads-Protocol/v4-examples)
- [Squads V4 SDK](https://github.com/Squads-Protocol/v4)

