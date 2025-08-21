# 事件订阅

Solana提供了强大的事件订阅功能，允许开发者实时监听区块链上的各种事件。本文基于实际代码示例介绍如何使用WebSocket连接监听日志、账户变化和程序账户变化。

## 基础设置

### 环境变量配置

```bash
# .env 文件
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
```

### 连接设置

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import 'dotenv/config';

// 建立连接
const { SOLANA_RPC_URL, SOLANA_WS_URL } = process.env;
const conn = new Connection(SOLANA_RPC_URL, {
  commitment: 'confirmed',
  wsEndpoint: SOLANA_WS_URL,
});

console.log('连接信息:', SOLANA_RPC_URL, SOLANA_WS_URL);
```

## 日志监听

### 监听特定账户的日志

```typescript
/**
 * 监听Raydium流动性池初始化 - 基于 initialize.ts
 */
function onLogs(conn: Connection, poolId: PublicKey) {
  conn.onLogs(
    poolId,
    ({ err, logs, signature }) => {
      if (err) return;
      
      // 检查是否包含初始化相关的日志
      if (logs && logs.some((log) => log.includes('initialize') || log.includes('initialize2'))) {
        console.log(`Raydium流动性池已初始化: https://solscan.io/tx/${signature}`);
      }
      
      console.log('日志:', logs);
    },
    'confirmed',
  );
}

// 使用示例
function main() {
  const url = process.env.SOLANA_RPC_URL!;
  const conn = new Connection(url, {
    commitment: 'confirmed',
    wsEndpoint: process.env.SOLANA_WS_URL!,
  });

  // Raydium流动性池V4
  const poolId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
  onLogs(conn, poolId);
}

main();
```

### 监听程序日志

```typescript
/**
 * 监听特定程序的日志
 */
function onProgramLogs(conn: Connection, programId: PublicKey) {
  conn.onLogs(
    programId,
    ({ err, logs, signature, slot }) => {
      if (err) {
        console.error('日志错误:', err);
        return;
      }
      
      console.log('程序日志:', {
        signature: signature,
        slot: slot,
        logs: logs
      });
    },
    'confirmed',
  );
}

// 使用示例
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
onProgramLogs(conn, TOKEN_PROGRAM_ID);
```

## 账户变化监听

### 监听特定账户变化

```typescript
/**
 * 监听账户变化 - 基于 token-usd.ts
 */
function onAccountChange(conn: Connection, accountAddress: PublicKey) {
  conn.onAccountChange(
    accountAddress,
    async (accountInfo, context) => {
      console.log('账户变化:', {
        address: accountAddress.toBase58(),
        lamports: accountInfo.lamports,
        owner: accountInfo.owner.toBase58(),
        slot: context.slot,
        data: accountInfo.data
      });
    },
    {
      commitment: 'confirmed',
    },
  );
}

// 使用示例
const marketId = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj');
onAccountChange(conn, marketId);
```

### 监听程序账户变化

```typescript
/**
 * 监听程序账户变化 - 基于 token-usd.ts
 */
function onProgramAccountChange(conn: Connection, programId: PublicKey) {
  conn.onProgramAccountChange(
    programId,
    (account, context) => {
      console.log('程序账户变化:', {
        accountId: account.accountId.toBase58(),
        owner: account.accountInfo.owner.toBase58(),
        lamports: account.accountInfo.lamports,
        rentEpoch: account.accountInfo.rentEpoch,
        slot: context.slot
      });
      
      // 解码账户数据
      const decodedAccount = decodeTokenAccount(account.accountInfo.data);
      if (decodedAccount) {
        console.log('代币账户信息:', {
          tokenAccount: account.accountId.toBase58(),
          tokenMint: decodedAccount.mint.toBase58(),
          tokenOwner: decodedAccount.owner.toBase58(),
          tokenBalance: decodedAccount.amount
        });
      }
    },
    {
      commitment: 'confirmed',
    },
  );
}

// 使用示例
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
onProgramAccountChange(conn, TOKEN_PROGRAM_ID);
```

## 价格监控

### 监听WSOL/USDC价格变化

```typescript
/**
 * 监听WSOL/USDC价格变化 - 基于 wsol-usdc.ts
 */
import { PoolInfoLayout, SqrtPriceMath } from '@raydium-io/raydium-sdk';

function onPriceChange(conn: Connection) {
  const marketId = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj');
  
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
onPriceChange(conn);
```

### 监听代币价格变化

```typescript
/**
 * 监听代币价格变化 - 基于 token-usd.ts
 */
let solUsd = new Decimal(197.7);

function onSolPriceChange(conn: Connection) {
  const marketId = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj');
  
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
onSolPriceChange(conn);
```

## 高级监听功能

### 带过滤器的程序账户监听

```typescript
/**
 * 带过滤器的程序账户监听 - 基于 wsol-mint.ts
 */
function onFilteredProgramAccountChange(conn: Connection) {
  const CLMM_PROGRAM_ID = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK');
  const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
  
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

        console.log('池信息更新:', {
          poolAddress: account.accountId.toBase58(),
          mintA: poolInfo.mintA.toBase58(), // WSOL
          mintB: poolInfo.mintB.toBase58(), // 代币
          price: currentPrice.toString(),
          priceUsd: priceUsd.toString(),
          timestamp: new Date().toISOString(),
          liquidity: poolInfo.liquidity.toString(),
        });
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

// 使用示例
onFilteredProgramAccountChange(conn);
```

## 数据解码

### 代币账户解码

```typescript
import { AccountLayout, MintLayout } from '@solana/spl-token';

/**
 * 解码代币账户 - 基于 token-usd.ts
 */
function decodeTokenAccount(data: Uint8Array) {
  if (data.length !== AccountLayout.span) return;
  return AccountLayout.decode(data);
}

/**
 * 解码代币铸造账户 - 基于 token-usd.ts
 */
function decodeMintLayout(data: Uint8Array) {
  if (data.length !== MintLayout.span) return;
  return MintLayout.decode(data);
}

// 使用示例
function onTokenAccountChange(conn: Connection) {
  conn.onAccountChange(USDC_MINT, async (accountInfo) => {
    const decodedAccount = decodeTokenAccount(accountInfo.data);
    if (decodedAccount) {
      console.log('代币账户解码成功:', decodedAccount);
    }
    
    const decodedMint = decodeMintLayout(accountInfo.data);
    if (decodedMint) {
      console.log('铸造账户信息:', {
        isInitialized: decodedMint.isInitialized,
        mintAuthority: decodedMint.mintAuthority.toBase58(),
        freezeAuthority: decodedMint.freezeAuthority?.toBase58(),
        supply: decodedMint.supply.toString(),
        decimals: decodedMint.decimals
      });
    }
  });
}
```

## 完整示例

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { PoolInfoLayout, SqrtPriceMath } from '@raydium-io/raydium-sdk';
import { AccountLayout, MintLayout } from '@solana/spl-token';
import Decimal from 'decimal.js';
import 'dotenv/config';

async function comprehensiveSubscriptionExample() {
  try {
    console.log('🚀 开始事件订阅示例...');
    
    // 1. 建立连接
    const { SOLANA_RPC_URL, SOLANA_WS_URL } = process.env;
    const conn = new Connection(SOLANA_RPC_URL, {
      commitment: 'confirmed',
      wsEndpoint: SOLANA_WS_URL,
    });
    
    console.log('连接信息:', SOLANA_RPC_URL, SOLANA_WS_URL);
    
    // 2. 监听Raydium池初始化
    console.log('\n=== 监听Raydium池初始化 ===');
    const poolId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
    onLogs(conn, poolId);
    
    // 3. 监听WSOL/USDC价格
    console.log('\n=== 监听WSOL/USDC价格 ===');
    onPriceChange(conn);
    
    // 4. 监听代币程序账户变化
    console.log('\n=== 监听代币程序账户变化 ===');
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    onProgramAccountChange(conn, TOKEN_PROGRAM_ID);
    
    // 5. 监听CLMM池变化
    console.log('\n=== 监听CLMM池变化 ===');
    onFilteredProgramAccountChange(conn);
    
    console.log('\n✅ 所有监听器已启动!');
    console.log('按Ctrl+C停止监听...');
    
  } catch (error) {
    console.error('❌ 事件订阅示例失败:', error);
  }
}

// 运行示例
comprehensiveSubscriptionExample().catch(console.error);
```

## 最佳实践

1. **连接管理**: 合理管理WebSocket连接，避免连接泄漏
2. **错误处理**: 实现适当的错误处理和重连机制
3. **过滤器使用**: 使用过滤器减少不必要的数据传输
4. **资源清理**: 及时清理监听器，释放资源

## 常见问题

### Q: WebSocket连接断开怎么办？
A: 实现自动重连机制，监听连接状态变化。

### Q: 如何优化监听性能？
A: 使用适当的过滤器，避免监听不相关的账户。

### Q: 监听器太多会影响性能吗？
A: 是的，监听器过多会影响性能，建议合理控制监听器数量。

## 参考资源

- [Solana WebSocket API](https://docs.solana.com/developing/clients/websocket)
- [Raydium SDK](https://raydium.io/developers/)
- [SPL代币标准](https://spl.solana.com/token)
