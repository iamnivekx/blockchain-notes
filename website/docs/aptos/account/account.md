# 账户创建和管理

在Aptos中，账户是区块链交互的基本单位。每个账户都有唯一的地址、认证密钥和资源存储。

## 账户结构

Aptos账户包含以下核心组件：

- **地址**: 32字节的唯一标识符
- **认证密钥**: 用于签名交易的密钥
- **序列号**: 防止重放攻击的计数器
- **资源**: 存储代币、NFT等数据
- **模块**: 可执行的智能合约代码

## 创建新账户

### 随机生成账户

```typescript
import { AptosAccount } from "aptos";

// 创建新账户（随机生成密钥）
const account = new AptosAccount();

// 获取账户信息
const address = account.address();
const privateKeyObject = account.toPrivateKeyObject();

console.log('Address:', address.hex());
console.log('Private Key:', privateKeyObject);
```

### 从私钥创建账户

```typescript
import { AptosAccount, HexString } from "aptos";

// 从私钥创建账户
const privateKeyHex = '0x...';
const privateKeyBytes = new HexString(privateKeyHex).toUint8Array();
const account = new AptosAccount(privateKeyBytes);

console.log('Address:', account.address().hex());
```

## 密钥管理

### 获取密钥信息

```typescript
// 获取私钥对象
const privateKeyObject = account.toPrivateKeyObject();
console.log('Private Key Object:', privateKeyObject);

// 获取公钥
const publicKey = account.signingKey.publicKey;
console.log('Public Key:', HexString.fromUint8Array(publicKey).hex());

// 获取认证密钥
const authKey = account.authKey;
console.log('Auth Key:', authKey.hex());
```

### 密钥验证

```typescript
// 验证私钥格式
function isValidPrivateKey(privateKeyHex: string): boolean {
  try {
    const privateKeyBytes = new HexString(privateKeyHex).toUint8Array();
    return privateKeyBytes.length === 32;
  } catch {
    return false;
  }
}

// 验证公钥格式
function isValidPublicKey(publicKeyHex: string): boolean {
  try {
    const publicKeyBytes = new HexString(publicKeyHex).toUint8Array();
    return publicKeyBytes.length === 32;
  } catch {
    return false;
  }
}
```

## 地址派生

### 从公钥生成地址

```typescript
import { sha3_256 } from '@noble/hashes/sha3';

function pubKeyToAddress(publicKey: Uint8Array): HexString {
  const hash = sha3_256.create();
  hash.update(publicKey);
  hash.update("\0"); // 添加空字节分隔符
  return HexString.fromUint8Array(hash.digest());
}

// 使用示例
const publicKey = account.signingKey.publicKey;
const derivedAddress = pubKeyToAddress(publicKey);
console.log('Derived Address:', derivedAddress.hex());
console.log('Account Address:', account.address().hex());
console.log('Addresses Match:', derivedAddress.hex() === account.address().hex());
```

## 账户状态查询

### 获取账户信息

```typescript
import { AptosClient } from "aptos";

const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);

async function getAccountInfo(address: string) {
  try {
    const accountInfo = await client.getAccount(address);
    console.log('Account Info:', accountInfo);
    
    return {
      sequenceNumber: accountInfo.sequence_number,
      authenticationKey: accountInfo.authentication_key,
      chainId: accountInfo.chain_id
    };
  } catch (error) {
    console.error('Error getting account info:', error);
    return null;
  }
}
```

### 查询账户资源

```typescript
async function getAccountResources(address: string) {
  try {
    const resources = await client.getAccountResources(address);
    console.log('Account Resources:', resources);
    
    // 查找APT代币余额
    const aptosCoinStore = '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>';
    const coinResource = resources.find(r => r.type === aptosCoinStore);
    
    if (coinResource) {
      const balance = parseInt(coinResource.data.coin.value);
      console.log('APT Balance:', balance);
      return balance;
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting account resources:', error);
    return 0;
  }
}
```

## 测试代币获取

### 使用水龙头获取测试代币

```typescript
import { FaucetClient } from "aptos";

const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);

async function fundAccount(address: string, amount: number) {
  try {
    await faucetClient.fundAccount(address, amount);
    console.log(`Funded account ${address} with ${amount} octas`);
    
    // 等待账户更新
    await client.waitForTransaction(await faucetClient.getLastTransactionHash());
    
    return true;
  } catch (error) {
    console.error('Error funding account:', error);
    return false;
  }
}

// 资助账户
await fundAccount(account.address(), 100_000_000); // 100 APT
```

## 完整示例

```typescript
import { AptosAccount, AptosClient, FaucetClient, HexString } from "aptos";
import { sha3_256 } from '@noble/hashes/sha3';

async function accountManagementExample() {
  // 1. 创建账户
  const account = new AptosAccount();
  console.log('New Account Address:', account.address().hex());
  
  // 2. 连接网络
  const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
  const FAUCET_URL = "https://faucet.devnet.aptoslabs.com";
  const client = new AptosClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  
  // 3. 验证地址派生
  const publicKey = account.signingKey.publicKey;
  const derivedAddress = pubKeyToAddress(publicKey);
  console.log('Address Derivation Valid:', 
    derivedAddress.hex() === account.address().hex());
  
  // 4. 资助账户
  await faucetClient.fundAccount(account.address(), 100_000_000);
  
  // 5. 查询账户状态
  const accountInfo = await client.getAccount(account.address());
  console.log('Sequence Number:', accountInfo.sequence_number);
  
  const resources = await client.getAccountResources(account.address());
  const aptosCoinStore = '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>';
  const coinResource = resources.find(r => r.type === aptosCoinStore);
  
  if (coinResource) {
    const balance = parseInt(coinResource.data.coin.value);
    console.log('APT Balance:', balance);
  }
}

// 运行示例
accountManagementExample().catch(console.error);
```

## 最佳实践

1. **密钥安全**: 永远不要在代码中硬编码私钥
2. **地址验证**: 始终验证地址格式和有效性
3. **错误处理**: 实现适当的错误处理和重试机制
4. **资源管理**: 正确管理账户资源和序列号
5. **测试环境**: 在开发网充分测试后再使用主网

## 参考

- [Aptos官方文档](https://aptos.dev/guides/aptos-accounts)
- [Aptos SDK](https://github.com/aptos-labs/aptos-core/tree/main/ecosystem/typescript/sdk)
