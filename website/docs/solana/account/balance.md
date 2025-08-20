# 余额查询

在Solana中，余额查询是基础功能之一。本文介绍如何查询SOL余额、SPL代币余额以及批量余额查询。

## SOL余额查询

### 基础SOL余额查询

```typescript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function getSOLBalance(
  connection: Connection,
  walletAddress: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(walletAddress);
    return balance / LAMPORTS_PER_SOL; // 转换为SOL单位
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    return 0;
  }
}

// 使用示例
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const walletAddress = new PublicKey('your_wallet_address');
const solBalance = await getSOLBalance(connection, walletAddress);
console.log('SOL Balance:', solBalance);
```

## SPL代币余额查询

### 单个代币余额查询

```typescript
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

async function getTokenBalance(
  connection: Connection,
  walletAddress: PublicKey,
  mintAddress: PublicKey
): Promise<number> {
  try {
    // 获取关联代币账户地址
    const tokenAccount = getAssociatedTokenAddressSync(mintAddress, walletAddress, true);
    
    // 查询代币余额
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    
    if (balance.value) {
      return parseInt(balance.value.amount);
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}

// 使用示例
const mintAddress = new PublicKey('token_mint_address');
const tokenBalance = await getTokenBalance(connection, walletAddress, mintAddress);
console.log('Token Balance:', tokenBalance);
```

## 账户资源查询

### 获取所有账户资源

```typescript
async function getAllAccountResources(
  connection: Connection,
  walletAddress: PublicKey
) {
  try {
    const resources = await connection.getAccountResources(walletAddress);
    return resources;
  } catch (error) {
    console.error('Error getting account resources:', error);
    return [];
  }
}

// 使用示例
const resources = await getAllAccountResources(connection, walletAddress);
console.log('Account Resources:', resources);
```

### 过滤代币账户

```typescript
async function getTokenAccounts(
  connection: Connection,
  walletAddress: PublicKey
): Promise<{ mint: string; balance: number; account: string }[]> {
  try {
    const resources = await connection.getAccountResources(walletAddress);
    
    // 过滤SPL代币账户
    const tokenAccounts = resources.filter(resource => 
      resource.type.startsWith('0x1::coin::CoinStore<')
    );
    
    const tokenInfo = tokenAccounts.map(resource => {
      const mintMatch = resource.type.match(/<(.+)>/);
      const mint = mintMatch ? mintMatch[1] : '';
      
      return {
        mint,
        balance: parseInt(resource.data.coin.value),
        account: resource.address
      };
    });
    
    return tokenInfo;
  } catch (error) {
    console.error('Error getting token accounts:', error);
    return [];
  }
}

// 使用示例
const tokenAccounts = await getTokenAccounts(connection, walletAddress);
tokenAccounts.forEach(({ mint, balance, account }) => {
  console.log(`Mint: ${mint}, Balance: ${balance}, Account: ${account}`);
});
```

## 完整示例

```typescript
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

async function comprehensiveBalanceExample() {
  try {
    // 1. 设置连接
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const walletAddress = new PublicKey('your_wallet_address');
    
    console.log('Wallet Address:', walletAddress.toBase58());
    
    // 2. 查询SOL余额
    console.log('\n=== SOL Balance ===');
    const solBalance = await getSOLBalance(connection, walletAddress);
    console.log(`SOL: ${solBalance}`);
    
    // 3. 查询SPL代币余额
    console.log('\n=== SPL Token Balances ===');
    const tokenAccounts = await getTokenAccounts(connection, walletAddress);
    
    if (tokenAccounts.length > 0) {
      tokenAccounts.forEach(({ mint, balance }) => {
        console.log(`${mint}: ${balance}`);
      });
    } else {
      console.log('No SPL tokens found');
    }
    
  } catch (error) {
    console.error('Balance example failed:', error);
  }
}

// 运行示例
comprehensiveBalanceExample().catch(console.error);
```

## 最佳实践

1. **错误处理**: 始终实现适当的错误处理
2. **缓存策略**: 对于频繁查询的余额，考虑实现缓存
3. **批量查询**: 使用批量查询减少RPC调用次数
4. **监控频率**: 合理设置余额监控频率，避免过度请求
5. **资源清理**: 及时清理监控定时器

## 常见问题

### Q: 为什么代币余额显示为0？
A: 可能原因包括代币账户不存在、代币已转移、网络连接问题等。

### Q: 如何优化余额查询性能？
A: 使用批量查询、实现缓存、合理设置查询间隔等。

### Q: 余额监控会消耗多少资源？
A: 取决于监控频率和账户数量，建议根据需求合理设置。

## 参考资源

- [Solana账户文档](https://solana.com/de/docs/core/accounts)
- [SPL代币标准](https://www.solana-program.com/docs/token)
- [Solana Web3.js](https://solana.com/de/docs/clients/javascript)
