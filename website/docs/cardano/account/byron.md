# Byron 地址

Byron 是 Cardano 的第一个时代，Byron 地址是旧版本的地址格式，仍然被广泛使用。

## 地址格式

Byron 地址使用 Base58 编码，以 `Ae2` 开头：

```
Ae2tdPwUPEZ71Am6fuqG4hsnr9MmZYDiVJqqdtZEZRdvEHcnjc4sBkqfbq9
```

## 密钥派生

### 从助记词派生

```typescript
function mnemonic() {
  var mnemonic = process.env.CARDANO_MNEMONIC;
  var entropy = mnemonicToEntropy(mnemonic);
  var rootKey = Bip32PrivateKey.from_bip39_entropy(
    Buffer.from(entropy, 'hex'), 
    Buffer.from('')
  );

  var account_key = rootKey
    .derive(harden(1852))  // 目的
    .derive(harden(1815))  // 币种
    .derive(harden(0));    // 账户索引

  var prv_key = account_key.derive(0).derive(0);
  var bip32_public_key = prv_key.to_public();
  
  var byronAddr = ByronAddress.icarus_from_key(
    bip32_public_key,
    NetworkInfo.mainnet().protocol_magic()
  );
  
  return byronAddr;
}
```

### 从私钥派生

```typescript
function private() {
  const prv_key = process.env.CARDANO_PRIVATE_KEY;
  var prv_key_buf = Buffer.from(prv_key, 'hex');
  
  // 使用 Ed25519 椭圆曲线
  var pair = ec.keyFromSecret(prv_key_buf);
  const pub_key_buf = pair.getPublic();
  
  var private_key = PrivateKey.from_normal_bytes(prv_key_buf);
  var public_key = private_key.to_public();
  
  // 创建 BIP32 公钥
  var chain_code = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
  var bip32_pub_key_buf = u8aConcat(pub_key_buf, chain_code);
  var bip32_pub_key = Bip32PublicKey.from_bytes(bip32_pub_key_buf);
  
  // 生成 Byron 地址
  var byronAddr = ByronAddress.icarus_from_key(
    bip32_pub_key,
    NetworkInfo.testnet().protocol_magic()
  );
  
  return byronAddr;
}
```

## 地址生成

### Icarus 风格地址

```typescript
var byronAddr = ByronAddress.icarus_from_key(
  bip32_public_key, // Ae2* 风格的 Icarus 地址
  NetworkInfo.mainnet().protocol_magic()
);

console.log('byronAddr: ', byronAddr.to_base58());
```

### 从 Base58 字符串创建

```typescript
var byronAddress = CardanoWasm.ByronAddress.from_base58(
  'Ae2tdPwUPEYyA78QaXm3MdgQn7VYRooZjo6f5MBCvwXbGHALLtFj72pjqor'
);
```

## 网络配置

### 主网

```typescript
var byronAddr = ByronAddress.icarus_from_key(
  bip32_public_key,
  NetworkInfo.mainnet().protocol_magic()
);
```

### 测试网

```typescript
var byronAddr = ByronAddress.icarus_from_key(
  bip32_public_key,
  NetworkInfo.testnet().protocol_magic()
);
```

## 地址转换

### 获取地址对象

```typescript
var address = byronAddress.to_address();
```

### 转换为 Base58

```typescript
var base58 = byronAddress.to_base58();
```

## 完整示例

查看 `examples/cardano/account/byron.ts` 文件获取完整的 Byron 地址管理示例代码。

## 注意事项

- Byron 地址不支持质押功能
- 建议在新应用中使用 Shelley 地址
- Byron 地址仍然可以接收和发送 ADA
- 协议魔法值因网络而异
