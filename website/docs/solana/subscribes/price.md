# 价格监控

Solana上的价格监控是DeFi应用的重要组成部分。本文基于实际代码示例介绍如何监控代币价格、流动性池状态和价格变化。

## 基础设置

### 安装依赖

```bash
npm install @raydium-io/raydium-sdk @solana/spl-token decimal.js
```

### 环境配置

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { PoolInfoLayout, SqrtPriceMath } from '@raydium-io/raydium-sdk';
import { AccountLayout, MintLayout } from '@solana/spl-token';
import Decimal from 'decimal.js';
import 'dotenv/config';

// 常用地址
const marketId = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const CLMM_PROGRAM_ID = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK');
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// 初始化SOL价格
let solUsd = new Decimal(197.7);
```

## WSOL/USDC价格监控

### 基础价格监控

```typescript
/**
 * 基础WSOL/USDC价格监控 - 基于 wsol-usdc.ts
 */
function onPriceChange(conn: Connection) {
  conn.onAccountChange(
    marketId,
    async (accountInfo) => {
      try {
        const poolData = PoolInfoLayout.decode(accountInfo.data);
        const price = SqrtPriceMath.sqrtPriceX64ToPrice(
          poolData.sqrtPriceX64, 
          poolData.mintDecimalsA, 
          poolData.mintDecimalsB
        ).toFixed(6);
        
        console.log(`WSOL/USDC: ${price}`);
      } catch (error) {
        console.error('解码池数据错误:', error);
      }
    },
    {
      commitment: 'confirmed',
    },
  );
}

// 使用示例
function main() {
  const { SOLANA_RPC_URL, SOLANA_WS_URL } = process.env;
  console.log('SOLANA_RPC_URL:', SOLANA_WS_URL);

  const conn = new Connection(SOLANA_RPC_URL, {
    commitment: 'confirmed',
    wsEndpoint: SOLANA_WS_URL,
  });
  
  onPriceChange(conn);
}

main();
```

### 高级价格监控

```typescript
/**
 * 高级WSOL/USDC价格监控 - 基于 token-usd.ts
 */
function onSolPriceChange(conn: Connection) {
  conn.onAccountChange(
    marketId,
    async (accountInfo) => {
      try {
        const poolData = PoolInfoLayout.decode(accountInfo.data);
        const price = SqrtPriceMath.sqrtPriceX64ToPrice(
          poolData.sqrtPriceX64, 
          poolData.mintDecimalsA, 
          poolData.mintDecimalsB
        );
        
        console.log(`WSOL/USDC: ${price}`);
        solUsd = price;
        
        // 可以在这里添加价格变化通知逻辑
        if (price > 200) {
          console.log('🚀 SOL价格突破200美元!');
        } else if (price < 190) {
          console.log('📉 SOL价格跌破190美元!');
        }
      } catch (error) {
        console.error('解码池数据错误:', error);
      }
    },
    {
      commitment: 'confirmed',
    },
  );
}
```

## 代币价格监控

### 监听代币程序变化

```typescript
/**
 * 监听代币程序账户变化 - 基于 token-usd.ts
 */
function onTokenPriceChange(conn: Connection) {
  conn.onAccountChange(USDC_MINT, async (accountInfo) => {
    try {
      const decodedAccount = decodeTokenAccount(accountInfo.data);
      if (decodedAccount) {
        console.log('USDC账户变化:', {
          mint: decodedAccount.mint.toBase58(),
          owner: decodedAccount.owner.toBase58(),
          amount: decodedAccount.amount.toString(),
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('解码USDC账户错误:', error);
    }
  });
}

// 代币账户解码函数
function decodeTokenAccount(data: Uint8Array) {
  if (data.length !== AccountLayout.span) return;
  return AccountLayout.decode(data);
}

function decodeMintLayout(data: Uint8Array) {
  if (data.length !== MintLayout.span) return;
  return MintLayout.decode(data);
}
```

### 监听所有代币账户变化

```typescript
/**
 * 监听所有代币账户变化 - 基于 token-usd.ts
 */
function onAllTokenAccountChanges(conn: Connection) {
  conn.onProgramAccountChange(
    TOKEN_PROGRAM_ID,
    (account, context) => {
      console.log('--------------------------');
      console.log('账户ID:', account.accountId.toBase58());
      console.log('账户所有者:', account.accountInfo.owner.toBase58());
      console.log('SOL余额:', account.accountInfo.lamports);
      console.log('租金周期:', account.accountInfo.rentEpoch);
      console.log('槽位:', context.slot);
      
      // 尝试解码代币账户
      const decodedAccount = decodeTokenAccount(account.accountInfo.data);
      if (decodedAccount) {
        console.log('代币账户信息:', {
          tokenAccount: account.accountId.toBase58(),
          tokenMint: decodedAccount.mint.toBase58(),
          tokenOwner: decodedAccount.owner.toBase58(),
          tokenBalance: decodedAccount.amount.toString()
        });
        return;
      }

      // 尝试解码铸造账户
      const decodedMint = decodeMintLayout(account.accountInfo.data);
      if (decodedMint) {
        console.log('铸造账户信息:', {
          isInitialized: decodedMint.isInitialized,
          mintAuthorityOption: decodedMint.mintAuthorityOption,
          mintAuthority: decodedMint.mintAuthority.toBase58(),
          freezeAuthorityOption: decodedMint.freezeAuthorityOption,
          freezeAuthority: decodedMint.freezeAuthority?.toBase58(),
          supply: decodedMint.supply.toString(),
          decimals: decodedMint.decimals
        });
        return;
      }
    },
    {
      commitment: 'confirmed',
    },
  );
}
```

## CLMM池价格监控

### 监听CLMM池变化

```typescript
/**
 * 监听CLMM池变化 - 基于 wsol-mint.ts
 */
function onWSolToMint(conn: Connection) {
  conn.onProgramAccountChange(
    CLMM_PROGRAM_ID,
    (account) => {
      try {
        // 验证账户所有者
        if (!CLMM_PROGRAM_ID.equals(account.accountInfo.owner)) {
          console.warn('不是CLMM池账户');
          return;
        }
        
        const poolInfo = PoolInfoLayout.decode(account.accountInfo.data);
        const currentPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
          poolInfo.sqrtPriceX64,
          poolInfo.mintDecimalsA,
          poolInfo.mintDecimalsB,
        ).toDecimalPlaces(10);
        
        const priceUsd = new Decimal(solUsd).div(currentPrice);

        console.log('CLMM池信息更新:', {
          poolAddress: account.accountId.toBase58(),
          mintA: poolInfo.mintA.toBase58(), // WSOL
          mintB: poolInfo.mintB.toBase58(), // 代币
          price: currentPrice.toString(),
          priceUsd: priceUsd.toString(),
          timestamp: new Date().toISOString(),
          liquidity: poolInfo.liquidity.toString(),
        });
        
        // 价格变化通知
        if (priceUsd.gt(1000)) {
          console.log('💰 代币价格突破1000美元!');
        }
      } catch (error) {
        console.error('处理池更新错误:', error);
      }
    },
    {
      commitment: 'confirmed',
      filters: [
        { dataSize: PoolInfoLayout.span },
        {
          memcmp: {
            offset: PoolInfoLayout.offsetOf('mintA'),
            bytes: WSOL_MINT.toBase58(),
          },
        },
      ],
    },
  );
}
```

## 最佳实践

1. **连接管理**: 合理管理WebSocket连接，避免连接泄漏
2. **错误处理**: 实现适当的错误处理和重连机制
3. **数据验证**: 验证接收到的数据格式和有效性
4. **性能优化**: 使用过滤器减少不必要的数据传输
5. **历史记录**: 合理管理价格历史数据，避免内存泄漏

## 常见问题

### Q: 如何获取历史价格数据？
A: 使用Solana RPC API的getAccountInfo方法，或实现本地价格记录器。

### Q: 价格监控会影响性能吗？
A: 会，建议只监控必要的池和账户，使用适当的过滤器。

### Q: 如何处理价格数据异常？
A: 实现数据验证和异常处理，过滤掉异常的价格数据。

## 参考资源

- [Raydium SDK](https://raydium.io/developers/)
- [Solana WebSocket API](https://docs.solana.com/developing/clients/websocket)
- [SPL代币标准](https://spl.solana.com/token)
- [Decimal.js文档](https://mikemcl.github.io/decimal.js/)
