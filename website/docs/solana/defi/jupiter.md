# Jupiter聚合器

Jupiter是Solana上最大的去中心化交易聚合器，为用户提供最佳的交易路径和价格。本文介绍如何使用Jupiter API进行代币交换。

## Jupiter特性

- **最佳路径**: 自动找到最优交易路径
- **多DEX支持**: 集成Raydium、Orca、Serum等DEX
- **滑点保护**: 自动滑点计算和设置
- **费用优化**: 最小化交易费用
- **批量交易**: 支持一次交易中多个操作

## 基础设置

### 安装依赖

```bash
npm install @jup-ag/api @solana/web3.js
```

### 创建客户端

```typescript
import { createJupiterApiClient } from '@jup-ag/api';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

// 创建Jupiter API客户端
const jupiterClient = createJupiterApiClient();

// 连接Solana网络
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
```

## 获取报价

### 基础报价查询

```typescript
async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
) {
  try {
    const quoteResponse = await jupiterClient.quoteGet({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps,
      onlyDirectRoutes: false,
      maxAccounts: 20,
      autoSlippage: true,
    });

    console.log('Quote Response:', quoteResponse);
    return quoteResponse;
  } catch (error) {
    console.error('Error getting quote:', error);
    throw error;
  }
}

// 使用示例
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const quote = await getQuote(SOL_MINT, USDC_MINT, 0.001 * LAMPORTS_PER_SOL);
```

### 高级报价选项

```typescript
async function getAdvancedQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  options: {
    slippageBps?: number;
    onlyDirectRoutes?: boolean;
    maxAccounts?: number;
    autoSlippage?: boolean;
    platformFeeBps?: number;
    feeAccount?: string;
  } = {}
) {
  const {
    slippageBps = 50,
    onlyDirectRoutes = false,
    maxAccounts = 20,
    autoSlippage = true,
    platformFeeBps,
    feeAccount
  } = options;

  const quoteRequest: any = {
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps,
    onlyDirectRoutes,
    maxAccounts,
    autoSlippage,
  };

  if (platformFeeBps) {
    quoteRequest.platformFeeBps = platformFeeBps;
  }

  if (feeAccount) {
    quoteRequest.feeAccount = feeAccount;
  }

  return await jupiterClient.quoteGet(quoteRequest);
}
```

## 执行交换

### 获取交换指令

```typescript
async function getSwapInstructions(
  userPublicKey: string,
  quoteResponse: any
) {
  try {
    const swapInstructionsResponse = await jupiterClient.swapInstructionsPost({
      swapRequest: {
        userPublicKey,
        quoteResponse,
      },
    });

    console.log('Swap Instructions:', swapInstructionsResponse);
    return swapInstructionsResponse;
  } catch (error) {
    console.error('Error getting swap instructions:', error);
    throw error;
  }
}
```

### 构建交换交易

```typescript
import { 
  AddressLookupTableAccount,
  TransactionMessage,
  VersionedTransaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { deserializeInstruction, getAddressLookupTableAccounts } from './instruction';

async function buildSwapTransaction(
  connection: Connection,
  keypair: Keypair,
  swapInstructionsResponse: any
) {
  const {
    tokenLedgerInstruction,
    computeBudgetInstructions,
    setupInstructions,
    swapInstruction: swapInstructionPayload,
    cleanupInstruction,
    addressLookupTableAddresses,
  } = swapInstructionsResponse;

  // 获取地址查找表账户
  const addressLookupTableAccounts: AddressLookupTableAccount[] = [];
  if (addressLookupTableAddresses.length > 0) {
    addressLookupTableAccounts.push(
      ...(await getAddressLookupTableAccounts(connection, addressLookupTableAddresses))
    );
  }

  // 构建指令数组
  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions.map(deserializeInstruction),
    deserializeInstruction(swapInstructionPayload),
    deserializeInstruction(cleanupInstruction),
  ];

  // 创建交易消息
  const { blockhash } = await connection.getLatestBlockhash();
  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(addressLookupTableAccounts);

  // 创建版本化交易
  const transaction = new VersionedTransaction(messageV0);
  
  return transaction;
}
```

## 完整交换流程

### SOL到USDC交换

```typescript
async function swapSOLToUSDC(
  connection: Connection,
  keypair: Keypair,
  solAmount: number
) {
  try {
    console.log('=== Starting SOL to USDC Swap ===');
    
    // 1. 获取报价
    const quote = await getQuote(
      SOL_MINT,
      USDC_MINT,
      solAmount * LAMPORTS_PER_SOL
    );
    
    console.log('Quote received:', {
      inputAmount: quote.inputAmount,
      outputAmount: quote.outputAmount,
      priceImpact: quote.priceImpactPct,
      routes: quote.routes.length
    });

    // 2. 获取交换指令
    const swapInstructions = await getSwapInstructions(
      keypair.publicKey.toBase58(),
      quote
    );

    // 3. 构建交易
    const transaction = await buildSwapTransaction(
      connection,
      keypair,
      swapInstructions
    );

    // 4. 签名交易
    transaction.sign([keypair]);

    // 5. 发送交易
    const raw = transaction.serialize();
    const txid = await connection.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log('Swap transaction sent:', txid);

    // 6. 等待确认
    await connection.confirmTransaction(txid, 'confirmed');
    console.log('Swap completed successfully!');

    return txid;
  } catch (error) {
    console.error('Swap failed:', error);
    throw error;
  }
}
```

### USDC到SOL交换

```typescript
async function swapUSDCToSOL(
  connection: Connection,
  keypair: Keypair,
  usdcAmount: number
) {
  try {
    console.log('=== Starting USDC to SOL Swap ===');
    
    // 1. 获取报价
    const quote = await getQuote(
      USDC_MINT,
      SOL_MINT,
      usdcAmount * 1000000 // USDC有6位小数
    );
    
    console.log('Quote received:', {
      inputAmount: quote.inputAmount,
      outputAmount: quote.outputAmount,
      priceImpact: quote.priceImpactPct
    });

    // 2. 获取交换指令
    const swapInstructions = await getSwapInstructions(
      keypair.publicKey.toBase58(),
      quote
    );

    // 3. 构建交易
    const transaction = await buildSwapTransaction(
      connection,
      keypair,
      swapInstructions
    );

    // 4. 签名交易
    transaction.sign([keypair]);

    // 5. 发送交易
    const raw = transaction.serialize();
    const txid = await connection.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log('Swap transaction sent:', txid);

    // 6. 等待确认
    await connection.confirmTransaction(txid, 'confirmed');
    console.log('Swap completed successfully!');

    return txid;
  } catch (error) {
    console.error('Swap failed:', error);
    throw error;
  }
}
```

## 高级功能

### 带费用的交换

```typescript
async function swapWithFee(
  connection: Connection,
  keypair: Keypair,
  inputMint: string,
  outputMint: string,
  amount: number,
  platformFeeBps: number = 10 // 0.1%
) {
  try {
    // 1. 获取带费用的报价
    const quote = await getAdvancedQuote(inputMint, outputMint, amount, {
      platformFeeBps,
      slippageBps: 50
    });

    // 2. 获取交换指令
    const swapInstructions = await getSwapInstructions(
      keypair.publicKey.toBase58(),
      quote
    );

    // 3. 构建和执行交易
    const transaction = await buildSwapTransaction(
      connection,
      keypair,
      swapInstructions
    );

    transaction.sign([keypair]);
    const raw = transaction.serialize();
    const txid = await connection.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    await connection.confirmTransaction(txid, 'confirmed');
    return txid;
  } catch (error) {
    console.error('Fee swap failed:', error);
    throw error;
  }
}
```

### 批量交换

```typescript
async function batchSwap(
  connection: Connection,
  keypair: Keypair,
  swaps: Array<{
    inputMint: string;
    outputMint: string;
    amount: number;
  }>
) {
  const results = [];
  
  for (const swap of swaps) {
    try {
      console.log(`Executing swap: ${swap.inputMint} -> ${swap.outputMint}`);
      
      const quote = await getQuote(
        swap.inputMint,
        swap.outputMint,
        swap.amount
      );
      
      const swapInstructions = await getSwapInstructions(
        keypair.publicKey.toBase58(),
        quote
      );
      
      const transaction = await buildSwapTransaction(
        connection,
        keypair,
        swapInstructions
      );
      
      transaction.sign([keypair]);
      const raw = transaction.serialize();
      const txid = await connection.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      
      await connection.confirmTransaction(txid, 'confirmed');
      results.push({ success: true, txid, swap });
      
      console.log(`Swap ${swap.inputMint} -> ${swap.outputMint} completed`);
      
    } catch (error) {
      console.error(`Swap ${swap.inputMint} -> ${swap.outputMint} failed:`, error);
      results.push({ success: false, error, swap });
    }
  }
  
  return results;
}
```

## 完整示例

```typescript
import { createJupiterApiClient } from '@jup-ag/api';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';
import 'dotenv/config';

async function jupiterSwapExample() {
  try {
    // 1. 设置环境
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
    const keypair = Keypair.fromSecretKey(bs58.decode(process.env.SOL_SECRET_KEY || ''));
    const jupiterClient = createJupiterApiClient();
    
    console.log('User Public Key:', keypair.publicKey.toBase58());
    console.log('0.001 SOL:', 0.001 * LAMPORTS_PER_SOL);
    
    // 2. 获取报价
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    
    const quote = await jupiterClient.quoteGet({
      inputMint: SOL_MINT,
      outputMint: USDC_MINT,
      amount: (0.001 * LAMPORTS_PER_SOL).toString(),
      onlyDirectRoutes: true,
      maxAccounts: 20,
      autoSlippage: true,
    });
    
    console.log('Quote Response:', quote);
    
    // 3. 获取交换指令
    const swapInstructions = await jupiterClient.swapInstructionsPost({
      swapRequest: {
        userPublicKey: keypair.publicKey.toBase58(),
        quoteResponse: quote,
      },
    });
    
    console.log('Swap Instructions:', swapInstructions);
    
    // 4. 执行交换
    const txid = await swapSOLToUSDC(connection, keypair, 0.001);
    console.log('Swap completed! Transaction ID:', txid);
    
  } catch (error) {
    console.error('Jupiter swap example failed:', error);
  }
}

// 运行示例
jupiterSwapExample().catch(console.error);
```

## 最佳实践

1. **滑点设置**: 根据市场波动性合理设置滑点
2. **费用优化**: 使用计算预算指令优化交易费用
3. **错误处理**: 实现适当的错误处理和重试机制
4. **交易确认**: 始终等待交易确认
5. **路径选择**: 考虑直接路径vs聚合路径的权衡

## 常见问题

### Q: 交换失败的原因有哪些？
A: 常见原因包括余额不足、滑点过大、网络拥堵等。

### Q: 如何估算交换费用？
A: 使用计算预算指令和Jupiter的自动费用估算。

### Q: 交换需要多长时间？
A: 通常几秒到几分钟，取决于网络拥堵情况。

### Q: 如何设置最佳滑点？
A: 使用Jupiter的自动滑点功能或根据市场波动性手动设置。

## 参考资源

- [Jupiter官方文档](https://dev.jup.ag/docs/old/apis/swap-api)
- [Jupiter GitHub](https://github.com/jup-ag/)
- [Solana Web3.js](https://solana.com/de/docs/clients/javascript)
