# 地址生成

Cosmos 地址生成基于 HD 钱包（分层确定性钱包）和 Bech32 编码，支持多种密钥类型和派生路径。

## 基本地址生成

### 从助记词创建钱包

```typescript
const { Secp256k1HdWallet, makeCosmoshubPath } = require('@cosmjs/amino');

async function createWallet() {
  const mnemonic = 'spice review cycle among deal estate main sport fold source face avocado';
  
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [makeCosmoshubPath(0)], // 使用 Cosmos Hub 标准路径
  });

  const [firstAccount] = await wallet.getAccounts();
  console.log('Account address:', firstAccount.address);
  console.log('Public key:', firstAccount.pubkey);
  
  return wallet;
}
```

### 标准派生路径

Cosmos Hub 使用标准的 BIP44 派生路径：

```typescript
// Cosmos Hub 标准路径
const path = makeCosmoshubPath(0); // m/44'/118'/0'/0/0

// 自定义路径
const customPath = "m/44'/118'/0'/0/0"; // 币种类型 118 代表 ATOM
```

## 公钥处理

### 公钥编码

```typescript
const { toBase64, toHex } = require('@cosmjs/encoding');

// 获取公钥
const [firstAccount] = await wallet.getAccounts();
const pub = firstAccount.pubkey;

// 转换为不同格式
console.log('Public key (Base64):', toBase64(pub));
console.log('Public key (Hex):', toHex(pub));
```

### 公钥类型

```typescript
const { pubkeyType, pubkeyToAddress } = require('@cosmjs/amino');

// 创建标准公钥对象
const pubkey = {
  type: pubkeyType.secp256k1,
  value: toBase64(pub),
};

// 从公钥生成地址
const address = pubkeyToAddress(pubkey, 'cosmos');
console.log('Generated address:', address);
```

## 地址验证

### Bech32 地址验证

```typescript
const { Bech32 } = require('@cosmjs/encoding');

function validateAddress(address, prefix = 'cosmos') {
  try {
    const decoded = Bech32.decode(address);
    return decoded.prefix === prefix;
  } catch (error) {
    return false;
  }
}

// 验证地址
const isValid = validateAddress('cosmos14hm24e5wepv5qh5ny2lc50v2hu7fy9gklcd07w');
console.log('Address valid:', isValid);
```

## 多账户支持

### 创建多个账户

```typescript
async function createMultipleAccounts() {
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [
      makeCosmoshubPath(0),  // 第一个账户
      makeCosmoshubPath(1),  // 第二个账户
      makeCosmoshubPath(2),  // 第三个账户
    ],
  });

  const accounts = await wallet.getAccounts();
  accounts.forEach((account, index) => {
    console.log(`Account ${index}:`, account.address);
  });
  
  return accounts;
}
```

## 环境变量配置

### 设置助记词

```bash
# .env 文件
MNEMONIC="your 12 or 24 word mnemonic phrase"
```

### 在代码中使用

```typescript
require('dotenv').config();

const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error('MNEMONIC environment variable is required');
}

const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic);
```

## 完整示例

查看 `examples/cosmos/account/address.js` 文件获取完整的地址生成示例代码。

## 注意事项

- 助记词应该安全存储，不要硬编码在代码中
- 使用标准的派生路径确保兼容性
- 验证生成的地址格式是否正确
- 在生产环境中使用硬件钱包
- 定期备份助记词
