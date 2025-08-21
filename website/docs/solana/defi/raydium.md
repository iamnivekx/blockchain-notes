# Raydium集成

Raydium是Solana生态系统中领先的自动化做市商(AMM)协议。本文基于实际代码示例介绍如何与Raydium流动性池进行交互，包括池信息查询、价格计算和交易执行。

## 基础设置

### 安装依赖

```bash
npm install @raydium-io/raydium-sdk @solana/web3.js
```

### 环境配置

```typescript
import 'dotenv/config';
import { PublicKey, Commitment, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  LIQUIDITY_STATE_LAYOUT_V4,
  Liquidity,
  LiquidityPoolKeysV4,
  MARKET_STATE_LAYOUT_V3,
  Market,
  Percent,
  SPL_MINT_LAYOUT,
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
} from '@raydium-io/raydium-sdk';

// Raydium V4程序ID
const RAY_V4_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');

// 环境变量配置
const endpoint = process.env.SOLANA_RPC_URL;
const conn = new Connection(endpoint, { commitment: 'confirmed' });
```

## 流动性池查询

### 获取池信息 - 基于 pool.ts

```typescript
/**
 * 根据基础代币和报价代币获取池密钥
 */
async function getPoolKeys(
  connection: Connection,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  commitment: Commitment = 'finalized',
): Promise<LiquidityPoolKeysV4> {
  const markets = await getMarkets(connection, baseMint, quoteMint, commitment);
  return await getPoolKeysById(markets[0].id, connection);
}

/**
 * 根据池ID获取详细的池密钥信息
 */
async function getPoolKeysById(id: string, connection: Connection): Promise<LiquidityPoolKeysV4> {
  // 获取池账户信息
  const account = await connection.getAccountInfo(new PublicKey(id));
  if (account === null) throw Error('获取池信息失败');
  const state = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);

  // 获取市场信息
  const marketId = state.marketId;
  const marketAccount = await connection.getAccountInfo(marketId);
  if (marketAccount === null) throw Error('获取市场账户失败');
  const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);

  // 获取LP代币信息
  const lpMint = state.lpMint;
  const lpMintAccount = await connection.getAccountInfo(lpMint);
  if (lpMintAccount === null) throw Error('获取LP代币信息失败');
  const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data);

  return {
    id: new PublicKey(id),
    baseMint: state.baseMint,
    quoteMint: state.quoteMint,
    lpMint: state.lpMint,
    baseDecimals: state.baseDecimal.toNumber(),
    quoteDecimals: state.quoteDecimal.toNumber(),
    lpDecimals: lpMintInfo.decimals,
    version: 4,
    programId: account.owner,
    authority: Liquidity.getAssociatedAuthority({ programId: account.owner }).publicKey,
    openOrders: state.openOrders,
    targetOrders: state.targetOrders,
    baseVault: state.baseVault,
    quoteVault: state.quoteVault,
    withdrawQueue: state.withdrawQueue,
    lpVault: state.lpVault,
    marketVersion: 3,
    marketProgramId: state.marketProgramId,
    marketId: state.marketId,
    marketAuthority: Market.getAssociatedAuthority({
      programId: state.marketProgramId,
      marketId: state.marketId,
    }).publicKey,
    marketBaseVault: marketInfo.baseVault,
    marketQuoteVault: marketInfo.quoteVault,
    marketBids: marketInfo.bids,
    marketAsks: marketInfo.asks,
    marketEventQueue: marketInfo.eventQueue,
    lookupTableAccount: PublicKey.default,
  };
}
```

### 搜索流动性池

```typescript
/**
 * 搜索指定代币对的流动性池
 */
async function getMarkets(
  connection: Connection, 
  baseMint: PublicKey, 
  quoteMint: PublicKey, 
  commitment: Commitment = 'finalized'
) {
  const pools = await connection.getProgramAccounts(RAY_V4_PROGRAM_ID, {
    commitment,
    filters: [
      { dataSize: LIQUIDITY_STATE_LAYOUT_V4.span },
      {
        memcmp: {
          offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('baseMint'),
          bytes: baseMint.toBase58(),
        },
      },
      {
        memcmp: {
          offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf('quoteMint'),
          bytes: quoteMint.toBase58(),
        },
      },
    ],
  });
  
  return pools.map(({ pubkey, account }) => ({
    id: pubkey.toString(),
    ...LIQUIDITY_STATE_LAYOUT_V4.decode(account.data),
  }));
}
```

## 价格计算和交易模拟

### 计算交易输出 - 基于 pool.ts

```typescript
/**
 * 计算交易输出金额
 */
export async function calcAmountOut(
  connection: Connection,
  poolKeys: LiquidityPoolKeysV4,
  rawAmountIn: number,
  slippage: number = 5,
  swapInDirection: boolean,
) {
  // 获取池信息
  const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

  let currencyInMint = poolKeys.baseMint;
  let currencyInDecimals = poolInfo.baseDecimals;
  let currencyOutMint = poolKeys.quoteMint;
  let currencyOutDecimals = poolInfo.quoteDecimals;

  // 根据交易方向调整代币信息
  if (!swapInDirection) {
    currencyInMint = poolKeys.quoteMint;
    currencyInDecimals = poolInfo.quoteDecimals;
    currencyOutMint = poolKeys.baseMint;
    currencyOutDecimals = poolInfo.baseDecimals;
  }

  // 创建代币和金额对象
  const currencyIn = new Token(TOKEN_PROGRAM_ID, currencyInMint, currencyInDecimals);
  const amountIn = new TokenAmount(currencyIn, rawAmountIn.toFixed(currencyInDecimals), false);
  const currencyOut = new Token(TOKEN_PROGRAM_ID, currencyOutMint, currencyOutDecimals);
  const slippageX = new Percent(slippage, 100); // 滑点设置

  // 计算交易输出
  const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = Liquidity.computeAmountOut({
    poolKeys,
    poolInfo,
    amountIn,
    currencyOut,
    slippage: slippageX,
  });

  return {
    amountIn,
    amountOut,
    minAmountOut,
    currentPrice,
    executionPrice,
    priceImpact,
    fee,
  };
}
```

## 实际应用示例

### WSOL/USDC池交互

```typescript
/**
 * WSOL/USDC池交互示例 - 基于 pool.ts
 */
async function wsolUsdcExample() {
  try {
    console.log('🚀 开始Raydium池交互示例...');
    
    // 1. 设置连接
    const endpoint = process.env.SOLANA_RPC_URL;
    if (!endpoint) throw Error('SOLANA_RPC_URL环境变量未设置');
    const conn = new Connection(endpoint, { commitment: 'confirmed' });
    
    // 2. 获取WSOL/USDC池信息
    console.log('\n=== 获取池信息 ===');
    const poolKeys = await getPoolKeys(
      conn,
      new PublicKey('So11111111111111111111111111111111111111112'), // WSOL
      new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
    );
    
    console.log('池ID:', poolKeys.id.toBase58());
    console.log('基础代币:', poolKeys.baseMint.toBase58());
    console.log('报价代币:', poolKeys.quoteMint.toBase58());
    
    // 3. 计算交易输出
    console.log('\n=== 计算交易输出 ===');
    const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = await calcAmountOut(
      conn,
      poolKeys,
      0.01, // 0.01 SOL
      1,    // 1% 滑点
      true, // WSOL -> USDC
    );
    
    console.log('输入金额:', '0.01 SOL');
    console.log('输出金额:', amountOut.numerator.toString(), 'USDC (最小单位)');
    console.log('最小输出:', minAmountOut.numerator.toString(), 'USDC (最小单位)');
    console.log('当前价格:', currentPrice.numerator.toString());
    console.log('执行价格:', executionPrice.numerator.toString());
    console.log('价格影响:', priceImpact.numerator.toString());
    console.log('手续费:', fee.numerator.toString());
    
    console.log('\n✅ Raydium池交互示例完成!');
    
  } catch (error) {
    console.error('❌ Raydium池交互示例失败:', error);
  }
}

// 运行示例
wsolUsdcExample().catch(console.error);
```

### 多池比较

```typescript
/**
 * 比较多个池的价格
 */
async function comparePoolPrices(
  connection: Connection,
  baseMint: PublicKey,
  quoteMint: PublicKey,
  amount: number
) {
  try {
    const markets = await getMarkets(connection, baseMint, quoteMint);
    const results = [];
    
    for (const market of markets) {
      try {
        const poolKeys = await getPoolKeysById(market.id, connection);
        const calculation = await calcAmountOut(connection, poolKeys, amount, 1, true);
        
        results.push({
          poolId: market.id,
          amountOut: calculation.amountOut.numerator.toString(),
          priceImpact: calculation.priceImpact.numerator.toString(),
          fee: calculation.fee.numerator.toString(),
        });
      } catch (error) {
        console.warn(`池 ${market.id} 计算失败:`, error.message);
      }
    }
    
    // 按输出金额排序
    results.sort((a, b) => Number(b.amountOut) - Number(a.amountOut));
    
    console.log('池价格比较结果:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. 池ID: ${result.poolId}`);
      console.log(`   输出: ${result.amountOut}`);
      console.log(`   价格影响: ${result.priceImpact}`);
      console.log(`   手续费: ${result.fee}\n`);
    });
    
    return results;
  } catch (error) {
    console.error('池价格比较失败:', error);
    return [];
  }
}
```

## 高级功能

### 流动性提供

```typescript
/**
 * 计算添加流动性所需的代币数量
 */
async function calculateLiquidityAmount(
  connection: Connection,
  poolKeys: LiquidityPoolKeysV4,
  baseAmount: number,
) {
  const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
  
  const baseToken = new Token(TOKEN_PROGRAM_ID, poolKeys.baseMint, poolInfo.baseDecimals);
  const quoteToken = new Token(TOKEN_PROGRAM_ID, poolKeys.quoteMint, poolInfo.quoteDecimals);
  
  const baseAmountIn = new TokenAmount(baseToken, baseAmount.toFixed(poolInfo.baseDecimals), false);
  
  const { anotherAmount, maxAnotherAmount } = Liquidity.computeAnotherAmount({
    poolKeys,
    poolInfo,
    amount: baseAmountIn,
    anotherCurrency: quoteToken,
    slippage: new Percent(1, 100), // 1% 滑点
  });
  
  return {
    baseAmount: baseAmountIn,
    quoteAmount: anotherAmount,
    maxQuoteAmount: maxAnotherAmount,
  };
}
```

### 实时价格监控

```typescript
/**
 * 监控池价格变化
 */
async function monitorPoolPrice(
  connection: Connection,
  poolKeys: LiquidityPoolKeysV4,
  interval: number = 5000
) {
  console.log('开始监控池价格...');
  
  setInterval(async () => {
    try {
      const { currentPrice } = await calcAmountOut(
        connection,
        poolKeys,
        1, // 1个基础代币
        0, // 0滑点，仅获取价格
        true
      );
      
      const price = Number(currentPrice.numerator) / Number(currentPrice.denominator);
      console.log(`${new Date().toISOString()}: 当前价格 = ${price.toFixed(6)}`);
      
    } catch (error) {
      console.error('价格监控错误:', error);
    }
  }, interval);
}
```

## 完整示例

```typescript
// 基于 pool.ts 的完整示例
async function main() {
  try {
    console.log('🚀 开始Raydium集成示例...');
    
    // 1. 建立连接
    const endpoint = process.env.SOLANA_RPC_URL;
    if (!endpoint) throw Error('SOLANA_RPC_URL is not set');
    const conn = new Connection(endpoint, { commitment: 'confirmed' });
    
    // 2. 获取WSOL/USDC池密钥
    const poolKeys = await getPoolKeys(
      conn,
      new PublicKey('So11111111111111111111111111111111111111112'), // WSOL
      new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
    );
    
    // 3. 计算交易输出
    const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = await calcAmountOut(
      conn,
      poolKeys,
      0.01, // 0.01 SOL
      1,    // 1% 滑点
      true, // WSOL -> USDC方向
    );
    
    // 4. 输出结果
    console.log('池信息:', poolKeys);
    console.log('输出金额:', amountOut.numerator.toString());
    console.log('最小输出:', minAmountOut.numerator.toString());
    console.log('当前价格:', currentPrice.numerator.toString());
    console.log('执行价格:', executionPrice.numerator.toString());
    console.log('价格影响:', priceImpact.numerator.toString());
    console.log('手续费:', fee.numerator.toString());
    
    console.log('\n✅ Raydium集成示例完成!');
    
  } catch (error) {
    console.error('❌ Raydium集成示例失败:', error);
  }
}

main().catch(console.error);
```

## 最佳实践

1. **错误处理**: 实现适当的错误处理和重试机制
2. **滑点设置**: 根据市场条件合理设置滑点
3. **价格验证**: 在执行交易前验证价格合理性
4. **池验证**: 确保池有足够的流动性
5. **监控机制**: 实现价格和流动性监控

## 常见问题

### Q: 如何选择最优的流动性池？
A: 比较不同池的输出金额、价格影响和手续费，选择最优的交易路径。

### Q: 如何处理滑点过大的情况？
A: 可以分批执行大额交易，或者寻找流动性更深的池。

### Q: 如何实时获取池的流动性信息？
A: 使用`Liquidity.fetchInfo()`定期获取最新的池信息。

## 参考资源

- [Raydium SDK文档](https://github.com/raydium-io/raydium-sdk)
- [Raydium官方文档](https://docs.raydium.io/)
- [Solana程序库](https://spl.solana.com/)
- [Serum DEX文档](https://docs.projectserum.com/)
