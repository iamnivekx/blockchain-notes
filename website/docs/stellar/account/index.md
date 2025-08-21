---
id: index
title: 账户管理
sidebar_label: 账户管理
---

# Stellar 账户管理

Stellar 账户是网络中的基本实体，每个账户都有一个公钥和私钥对。账户可以持有多种资产，包括原生 XLM 和自定义代币。

## 账户特点

- **唯一标识**: 每个账户由公钥唯一标识
- **最小余额**: 账户必须保持至少 1 XLM 余额
- **多资产支持**: 可以持有多种类型的资产
- **信任线**: 需要明确信任自定义资产才能持有

## 密钥生成

### 1. 随机生成密钥对
```javascript
const StellarSdk = require('stellar-sdk');

// 生成随机密钥对
const pair = StellarSdk.Keypair.random();

console.log('Public Key:', pair.publicKey());
console.log('Secret Key:', pair.secret());
```

### 2. 从私钥恢复密钥对
```javascript
// 从私钥字符串恢复密钥对
const secretKey = 'your-secret-key';
const pair = StellarSdk.Keypair.fromSecret(secretKey);

console.log('Public Key:', pair.publicKey());
console.log('Secret Key:', pair.secret());
```

### 3. 从公钥创建密钥对
```javascript
// 从公钥创建密钥对（只读，无法签名）
const publicKey = 'your-public-key';
const pair = StellarSdk.Keypair.fromPublicKey(publicKey);

console.log('Public Key:', pair.publicKey());
// 注意：这种密钥对无法签名交易
```

## 密钥格式

### 1. 公钥格式
Stellar 使用 StrKey 编码格式的公钥：

```javascript
const pair = StellarSdk.Keypair.random();

// 获取不同格式的公钥
const publicKey = pair.publicKey(); // StrKey 格式
const rawPublicKey = pair.rawPublicKey().toString('hex'); // 原始十六进制
const xdrAccountId = pair.xdrAccountId(); // XDR 格式
const xdrBase64 = pair.xdrAccountId().toXDR('base64'); // Base64 编码

console.log('StrKey format:', publicKey);
console.log('Raw hex:', rawPublicKey);
console.log('XDR format:', xdrAccountId);
console.log('XDR Base64:', xdrBase64);
```

### 2. 私钥格式
```javascript
const pair = StellarSdk.Keypair.random();

// 获取私钥的不同表示
const secretKey = pair.secret(); // StrKey 格式
const rawSecretKey = pair.rawSecretKey().toString('hex'); // 原始十六进制

console.log('Secret Key:', secretKey);
console.log('Raw Secret:', rawSecretKey);
```

## 地址验证

### 1. 验证公钥格式
```javascript
// 验证 Ed25519 公钥格式
const isValid = StellarSdk.StrKey.isValidEd25519PublicKey(publicKey);

if (isValid) {
  console.log('Valid Stellar public key');
} else {
  console.log('Invalid public key format');
}
```

### 2. 验证私钥格式
```javascript
// 验证私钥格式
const isValidSecret = StellarSdk.StrKey.isValidEd25519SecretSeed(secretKey);

if (isValidSecret) {
  console.log('Valid Stellar secret key');
} else {
  console.log('Invalid secret key format');
}
```

## 完整示例

```javascript
const StellarSdk = require('stellar-sdk');
const { eddsa: EdDSA } = require('elliptic');

// 初始化椭圆曲线
const ec = new EdDSA('ed25519');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

async function main() {
  // 1. 生成随机密钥对
  const pair = StellarSdk.Keypair.random();
  
  console.log('=== 随机生成的密钥对 ===');
  console.log('Public Key:', pair.publicKey());
  console.log('Secret Key:', pair.secret());
  
  // 2. 从公钥创建密钥对
  const pub = Buffer.from('01ac1a962dbf53b43fbd5a2b30a5016ac93051a62b81b5721c7842bc32fc47b3', 'hex');
  const pair1 = new StellarSdk.Keypair({ type: 'ed25519', publicKey: pub });
  console.log('\n=== 从公钥创建的密钥对 ===');
  console.log('Public Key:', pair1.publicKey());
  
  // 3. 获取不同格式的公钥
  const publicKey = pair.publicKey();
  const rawPublicKey = pair.rawPublicKey().toString('hex');
  const xdrAccountId = pair.xdrAccountId();
  const type = pair.xdrAccountId().switch();
  const xdr = pair.xdrAccountId().toXDR('base64');
  
  console.log('\n=== 公钥的不同格式 ===');
  console.log('StrKey format:', publicKey);
  console.log('Raw hex:', rawPublicKey);
  console.log('XDR type:', type);
  console.log('XDR Base64:', xdr);
  
  // 4. 验证公钥格式
  const isValid = StellarSdk.StrKey.isValidEd25519PublicKey(publicKey);
  console.log('\n=== 格式验证 ===');
  console.log('Is valid Ed25519 public key:', isValid);
  
  // 5. 编码公钥
  const encodeEd25519PublicKey = StellarSdk.StrKey.encodeEd25519PublicKey(pub);
  console.log('Encoded public key:', encodeEd25519PublicKey);
  
  // 6. 加载账户信息（如果账户已激活）
  try {
    const account = await server.loadAccount(publicKey);
    console.log('\n=== 账户信息 ===');
    console.log('Account ID:', account.accountId());
    console.log('Sequence Number:', account.sequenceNumber());
    
    console.log('\n=== 账户余额 ===');
    account.balances.forEach(function (balance) {
      console.log('Type:', balance.asset_type, ', Balance:', balance.balance);
    });
  } catch (error) {
    console.log('\n账户未激活或不存在，需要先激活账户');
  }
}

main().catch(console.error);
```

## 账户激活

### 1. 检查账户状态
```javascript
async function checkAccountStatus(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    return {
      exists: true,
      account: account
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return {
        exists: false,
        account: null
      };
    }
    throw error;
  }
}
```

### 2. 创建账户
新账户需要至少 1 XLM 才能激活：

```javascript
async function createAccount(fundingAccount, newAccountPublicKey) {
  try {
    const transaction = new StellarSdk.TransactionBuilder(fundingAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
    .addOperation(StellarSdk.Operation.createAccount({
      destination: newAccountPublicKey,
      startingBalance: '1'
    }))
    .setTimeout(30)
    .build();
    
    transaction.sign(fundingAccount);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to create account: ${error.message}`);
  }
}
```

## 账户信息查询

### 1. 查询账户详情
```javascript
async function getAccountDetails(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    
    return {
      accountId: account.accountId(),
      sequenceNumber: account.sequenceNumber(),
      balances: account.balances,
      signers: account.signers,
      thresholds: account.thresholds,
      flags: account.flags,
      homeDomain: account.homeDomain()
    };
  } catch (error) {
    throw new Error(`Failed to load account: ${error.message}`);
  }
}
```

### 2. 查询账户余额
```javascript
async function getAccountBalances(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    
    const balances = {};
    account.balances.forEach(balance => {
      if (balance.asset_type === 'native') {
        balances.XLM = balance.balance;
      } else {
        const assetKey = `${balance.asset_code}:${balance.asset_issuer}`;
        balances[assetKey] = balance.balance;
      }
    });
    
    return balances;
  } catch (error) {
    throw new Error(`Failed to get balances: ${error.message}`);
  }
}
```

## 多重签名

### 1. 设置多重签名
```javascript
async function setMultiSig(account, signers, thresholds) {
  try {
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
    .addOperation(StellarSdk.Operation.setOptions({
      signer: {
        ed25519PublicKey: signers[0],
        weight: thresholds.low
      }
    }))
    .addOperation(StellarSdk.Operation.setOptions({
      masterWeight: thresholds.master,
      lowThreshold: thresholds.low,
      medThreshold: thresholds.medium,
      highThreshold: thresholds.high
    }))
    .setTimeout(30)
    .build();
    
    transaction.sign(account);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    throw new Error(`Failed to set multi-sig: ${error.message}`);
  }
}
```

## 安全注意事项

1. **私钥安全**: 私钥必须保密，不要泄露给任何人
2. **备份**: 安全备份私钥，可以使用助记词或硬件钱包
3. **测试网**: 开发时使用测试网进行测试
4. **多重签名**: 重要账户考虑使用多重签名

## 最佳实践

1. **密钥管理**: 使用安全的密钥存储方案
2. **账户分离**: 为不同用途创建不同的账户
3. **余额管理**: 确保账户保持足够的最小余额
4. **错误处理**: 实现完善的错误处理机制

## 下一步

- [交易处理](../tx/transaction.md) - 学习如何发送和签名交易
- [代币发行](../tx/issue.md) - 了解如何发行和管理自定义资产
- [常见问题](../FAQ.md) - 查看开发中的常见问题
