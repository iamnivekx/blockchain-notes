# 账户创建与管理

Polkadot 账户是访问网络和进行交易的基础。本指南将介绍如何创建、管理和使用 Polkadot 账户。

## 账户类型

Polkadot 支持多种加密算法和账户类型：

- **sr25519**: 默认的 Schnorr 签名算法，推荐使用
- **ed25519**: Ed25519 签名算法，兼容性更好
- **ecdsa**: 椭圆曲线数字签名算法，兼容以太坊

## 基本账户操作

### 1. 初始化加密库

在使用任何加密功能之前，需要等待加密库准备就绪：

```javascript
const { cryptoWaitReady } = require('@polkadot/util-crypto');

async function main() {
  // 等待加密库初始化
  await cryptoWaitReady();
  // 继续其他操作...
}
```

### 2. 生成助记词

生成新的助记词用于创建账户：

```javascript
const { mnemonicGenerate } = require('@polkadot/util-crypto');

const mnemonic = mnemonicGenerate();
console.log('Generated mnemonic:', mnemonic);
```

### 3. 创建密钥环

密钥环是管理多个账户的容器：

```javascript
const { Keyring } = require('@polkadot/keyring');

// 创建 sr25519 类型的密钥环
const keyring = new Keyring({ 
  ss58Format: 42,  // Polkadot 主网的地址格式
  type: 'sr25519'  // 使用 sr25519 算法
});

// 从助记词添加账户
const pair = keyring.addFromUri(mnemonic + '//polkadot');
console.log('Account address:', pair.address);
```

### 4. 从助记词恢复账户

```javascript
const { Keyring } = require('@polkadot/keyring');

const keyring = new Keyring({ ss58Format: 42, type: 'ecdsa' });
const pair = keyring.addFromUri('your_mnemonic_here//polkadot');

console.log('Recovered address:', pair.address);
console.log('Public key:', pair.publicKey);
```

## 地址格式

### SS58 地址格式

Polkadot 使用 SS58 地址格式，不同网络有不同的前缀：

- **Polkadot 主网**: 0 (ss58Format: 0)
- **Westend 测试网**: 42 (ss58Format: 42)
- **Kusama**: 2 (ss58Format: 2)

### 地址编码

```javascript
const { encodeAddress, blake2AsU8a } = require('@polkadot/util-crypto');

// 从公钥生成地址
const publicKey = '0x0273082f8d8e82aced358aa4bcfec5fbe4084fd87ac5f124c7cc326c7044812ebb';
const address = encodeAddress(blake2AsU8a(publicKey), 42);
console.log('Encoded address:', address);
```

## 账户验证

### 验证助记词

```javascript
const { mnemonicValidate } = require('@polkadot/util-crypto');

const isValid = mnemonicValidate(mnemonic);
console.log('Is valid mnemonic:', isValid);
```

### 验证地址

```javascript
const { isAddress } = require('@polkadot/util');

const isValidAddress = isAddress(address);
console.log('Is valid address:', isValidAddress);
```

## 完整示例

```javascript
const { Keyring } = require('@polkadot/api');
const {
  cryptoWaitReady,
  mnemonicGenerate,
  mnemonicValidate,
  encodeAddress,
  blake2AsU8a,
} = require('@polkadot/util-crypto');
const { isAddress } = require('@polkadot/util');

async function createAccount() {
  await cryptoWaitReady();
  
  // 生成助记词
  const mnemonic = mnemonicGenerate();
  console.log('Generated mnemonic:', mnemonic);
  
  // 验证助记词
  const isValid = mnemonicValidate(mnemonic);
  console.log('Valid mnemonic:', isValid);
  
  // 创建密钥环
  const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });
  const pair = keyring.addFromUri(mnemonic + '//polkadot');
  
  console.log('Account address:', pair.address);
  console.log('Public key:', pair.publicKey);
  
  return { mnemonic, pair };
}

createAccount().catch(console.error);
```

## 安全注意事项

1. **助记词安全**: 永远不要在代码中硬编码助记词
2. **环境变量**: 使用环境变量存储敏感信息
3. **网络选择**: 确保使用正确的网络地址格式
4. **算法选择**: 推荐使用 sr25519 算法以获得最佳性能

## 常见问题

### Q: 如何切换网络？
A: 在创建 Keyring 时指定正确的 `ss58Format` 参数。

### Q: 支持哪些加密算法？
A: 支持 sr25519、ed25519 和 ecdsa 三种算法。

### Q: 如何备份账户？
A: 安全保存助记词，可以使用硬件钱包进行额外保护。
