# 助记词生成与验证

助记词（Mnemonic）是 Polkadot 账户恢复和备份的核心机制。它是一组易于记忆的单词，可以从中派生出私钥和公钥。

## 助记词概述

助记词是 BIP-39 标准的一部分，通常由 12、15、18、21 或 24 个单词组成。这些单词来自预定义的词汇表，具有以下特点：

- 易于记忆和记录
- 可以从中恢复完整的账户信息
- 支持多种语言
- 具有错误检测和纠正功能

## 生成助记词

### 基本生成

```javascript
const { mnemonicGenerate } = require('@polkadot/util-crypto');

// 生成 12 个单词的助记词（默认）
const mnemonic12 = mnemonicGenerate();
console.log('12-word mnemonic:', mnemonic12);

// 生成 24 个单词的助记词
const mnemonic24 = mnemonicGenerate(24);
console.log('24-word mnemonic:', mnemonic24);
```

### 指定长度生成

```javascript
const { mnemonicGenerate } = require('@polkadot/util-crypto');

// 生成不同长度的助记词
const lengths = [12, 15, 18, 21, 24];

lengths.forEach(length => {
  const mnemonic = mnemonicGenerate(length);
  console.log(`${length}-word mnemonic:`, mnemonic);
});
```

## 助记词验证

### 基本验证

```javascript
const { mnemonicValidate } = require('@polkadot/util-crypto');

const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// 验证助记词是否有效
const isValid = mnemonicValidate(mnemonic);
console.log('Is valid mnemonic:', isValid);
```

### 详细验证

```javascript
const { mnemonicValidate } = require('@polkadot/util-crypto');

function validateMnemonic(mnemonic) {
  try {
    const isValid = mnemonicValidate(mnemonic);
    
    if (isValid) {
      const wordCount = mnemonic.split(' ').length;
      console.log(`✅ Valid ${wordCount}-word mnemonic`);
      return true;
    } else {
      console.log('❌ Invalid mnemonic');
      return false;
    }
  } catch (error) {
    console.log('❌ Error validating mnemonic:', error.message);
    return false;
  }
}

// 测试不同的助记词
const testMnemonics = [
  'alice mnemonic phrase',
  'invalid mnemonic phrase',
  'bob mnemonic phrase'
];

testMnemonics.forEach(mnemonic => {
  validateMnemonic(mnemonic);
});
```

## 从助记词派生

### 生成种子

```javascript
const { mnemonicToMiniSecret, mnemonicGenerate } = require('@polkadot/util-crypto');

const mnemonic = mnemonicGenerate();

// 从助记词生成种子
const seed = mnemonicToMiniSecret(mnemonic);
console.log('Seed:', seed);
```

### 生成密钥对

```javascript
const { mnemonicToMiniSecret, naclKeypairFromSeed, secp256k1KeypairFromSeed } = require('@polkadot/util-crypto');
const { u8aToHex } = require('@polkadot/util');

const mnemonic = 'your mnemonic here';

// 生成种子
const seed = mnemonicToMiniSecret(mnemonic);

// 生成 sr25519 密钥对
const sr25519Pair = naclKeypairFromSeed(seed);
console.log('sr25519 public key:', u8aToHex(sr25519Pair.publicKey));
console.log('sr25519 secret key:', u8aToHex(sr25519Pair.secretKey));

// 生成 secp256k1 密钥对
const secp256k1Pair = secp256k1KeypairFromSeed(seed);
console.log('secp256k1 public key:', u8aToHex(secp256k1Pair.publicKey));
console.log('secp256k1 secret key:', u8aToHex(secp256k1Pair.secretKey));
```

## 助记词路径

### 派生路径

Polkadot 支持 BIP-44 派生路径，可以生成多个账户：

```javascript
const { Keyring } = require('@polkadot/keyring');

const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });

const mnemonic = 'your mnemonic here';

// 不同的派生路径
const paths = [
  mnemonic,                    // 默认路径
  mnemonic + '//polkadot',    // Polkadot 特定路径
  mnemonic + '//kusama',      // Kusama 特定路径
  mnemonic + '//0',           // 第一个派生账户
  mnemonic + '//1',           // 第二个派生账户
  mnemonic + '//hard/soft'    // 硬派生和软派生
];

paths.forEach((path, index) => {
  try {
    const pair = keyring.addFromUri(path);
    console.log(`Path ${index}:`, pair.address);
  } catch (error) {
    console.log(`Path ${index} failed:`, error.message);
  }
});
```

## 完整示例

```javascript
const { mnemonicGenerate, mnemonicValidate, mnemonicToMiniSecret } = require('@polkadot/util-crypto');
const { naclKeypairFromSeed } = require('@polkadot/util-crypto');
const { u8aToHex } = require('@polkadot/util');
const { Keyring } = require('@polkadot/keyring');

async function mnemonicExample() {
  // 生成新的助记词
  const mnemonic = mnemonicGenerate(24);
  console.log('Generated mnemonic:', mnemonic);
  
  // 验证助记词
  const isValid = mnemonicValidate(mnemonic);
  console.log('Valid mnemonic:', isValid);
  
  if (isValid) {
    // 生成种子
    const seed = mnemonicToMiniSecret(mnemonic);
    console.log('Seed length:', seed.length);
    
    // 生成密钥对
    const { publicKey, secretKey } = naclKeypairFromSeed(seed);
    console.log('Public key:', u8aToHex(publicKey));
    console.log('Secret key:', u8aToHex(secretKey));
    
    // 创建账户
    const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });
    const pair = keyring.addFromUri(mnemonic);
    console.log('Account address:', pair.address);
    
    return { mnemonic, pair };
  }
}

mnemonicExample().catch(console.error);
```

## 安全注意事项

1. **保密性**: 助记词包含私钥信息，必须保密
2. **备份**: 安全备份助记词，避免丢失
3. **环境**: 在安全的环境中生成和存储助记词
4. **验证**: 始终验证生成的助记词
5. **路径**: 记录使用的派生路径

## 常见问题

### Q: 助记词的长度如何选择？
A: 12 个单词提供 128 位安全性，24 个单词提供 256 位安全性。推荐使用 24 个单词。

### Q: 可以重复使用助记词吗？
A: 可以，但建议为不同用途使用不同的派生路径。

### Q: 助记词丢失怎么办？
A: 助记词丢失意味着账户无法恢复，必须安全备份。

### Q: 支持哪些语言？
A: 目前主要支持英语，但 BIP-39 标准支持多种语言。

### Q: 如何验证助记词的正确性？
A: 使用 `mnemonicValidate` 函数进行验证，并检查单词数量。
