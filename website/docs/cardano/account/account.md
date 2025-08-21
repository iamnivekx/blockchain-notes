# 账户管理

Cardano 账户管理涉及密钥派生、地址生成和多种地址类型的支持。

## 密钥派生路径

Cardano 使用 BIP44 和 CIP1852 标准进行密钥派生：

```typescript
// 硬化函数
function harden(num) {
  return 0x80000000 + num;
}

// 目的值 (BIP43)
var Purpose = {
  CIP1852: 1852, // CIP 1852 标准
};

// 币种类型 (SLIP 44)
var CoinTypes = {
  CARDANO: 1815,
};

// 链派生路径
var ChainDerivation = {
  EXTERNAL: 0,  // 外部链 (BIP44)
  INTERNAL: 1,  // 内部链 (BIP44)
  CHIMERIC: 2,  // 嵌合链 (CIP1852)
};
```

## 账户密钥派生

从根密钥派生账户密钥：

```typescript
var mnemonic = process.env.CARDANO_MNEMONIC;
var entropy = mnemonicToEntropy(mnemonic);
var rootKey = Bip32PrivateKey.from_bip39_entropy(
  Buffer.from(entropy, 'hex'), 
  Buffer.from('')
);

// 派生账户 #0
var account_key = rootKey
  .derive(harden(1852))  // 目的
  .derive(harden(1815))  // 币种
  .derive(harden(0));    // 账户索引
```

## 地址生成

### Base Address (基础地址)

支持质押的完整功能地址：

```typescript
var utxo_pub_key = account_key
  .derive(0) // external
  .derive(0)
  .to_public();

var stake_key = account_key
  .derive(2) // chimeric
  .derive(0)
  .to_public();

var baseAddr = BaseAddress.new(
  NetworkInfo.mainnet().network_id(),
  StakeCredential.from_keyhash(utxo_pub_key.to_raw_key().hash()),
  StakeCredential.from_keyhash(stake_key.to_raw_key().hash())
);

console.log('baseAddr: ', baseAddr.to_address().to_bech32());
```

### Enterprise Address (企业地址)

不支持质押的地址，适合交易所使用：

```typescript
var enterpriseAddr = EnterpriseAddress.new(
  NetworkInfo.mainnet().network_id(),
  StakeCredential.from_keyhash(utxo_pub_key.to_raw_key().hash())
);

console.log('enterpriseAddr: ', enterpriseAddr.to_address().to_bech32());
```

### Pointer Address (指针地址)

可以更短的地址格式：

```typescript
var ptrAddr = PointerAddress.new(
  NetworkInfo.mainnet().network_id(),
  StakeCredential.from_keyhash(utxo_pub_key.to_raw_key().hash()),
  Pointer.new(
    100, // slot
    2,   // tx index in slot
    0    // cert index in tx
  )
);

console.log('ptrAddr: ', ptrAddr.to_address().to_bech32());
```

### Reward Address (奖励地址)

用于接收质押奖励：

```typescript
var rewardAddr = RewardAddress.new(
  NetworkInfo.mainnet().network_id(),
  StakeCredential.from_keyhash(stake_key.to_raw_key().hash())
);

console.log('rewardAddr: ', rewardAddr.to_address().to_bech32());
```

## 密钥管理

### 私钥操作

```typescript
var private_key = account_key.to_raw_key();
var bytes = private_key.as_bytes();

console.log('private key: ', u8aToHex(bytes));
console.log('private bech32: ', private_key.to_bech32());
```

### 公钥操作

```typescript
var public_key = private_key.to_public();
var public_key_bytes = public_key.as_bytes();

console.log('public key: ', u8aToHex(public_key_bytes));
console.log('public bech32: ', public_key.to_bech32());
```

### BIP32 密钥

```typescript
var bip32_private_bytes = account_key.as_bytes();
var bip32_public_key = account_key.to_public();

console.log('bip32 private: ', u8aToHex(bip32_private_bytes));
console.log('bip32 public: ', u8aToHex(bip32_public_key.as_bytes()));
```

## 环境变量

确保设置以下环境变量：

```bash
CARDANO_MNEMONIC="your 12 or 24 word mnemonic phrase"
```

## 完整示例

查看 `examples/cardano/account/account.ts` 文件获取完整的账户管理示例代码。
