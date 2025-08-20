# 密钥环管理

密钥环（Keyring）是 Polkadot 中管理多个账户和密钥对的核心组件。它提供了统一的接口来创建、存储和操作不同类型的账户。

## 密钥环概述

密钥环是一个容器，可以存储多个账户密钥对，支持不同的加密算法和地址格式。它提供了以下功能：

- 账户创建和管理
- 密钥对存储
- 签名和验证
- 地址生成

## 创建密钥环

### 基本密钥环

```javascript
const { Keyring } = require('@polkadot/keyring');

// 创建默认密钥环
const keyring = new Keyring();
```

### 指定配置的密钥环

```javascript
const { Keyring } = require('@polkadot/keyring');

// 创建指定配置的密钥环
const keyring = new Keyring({
  ss58Format: 42,        // 地址格式（42 = Westend 测试网）
  type: 'sr25519'        // 加密算法类型
});
```

## 支持的配置选项

### ss58Format

指定地址的编码格式：

- **0**: Polkadot 主网
- **2**: Kusama
- **42**: Westend 测试网
- **其他**: 自定义网络

### type

指定加密算法类型：

- **sr25519**: Schnorr 签名算法（推荐）
- **ed25519**: Ed25519 签名算法
- **ecdsa**: 椭圆曲线数字签名算法

## 添加账户

### 从助记词添加

```javascript
const { Keyring } = require('@polkadot/keyring');

const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });

// 从助记词添加账户
const pair = keyring.addFromUri('//Alice');
console.log('Alice address:', pair.address);
```

### 从种子添加

```javascript
const { Keyring } = require('@polkadot/keyring');
const { mnemonicToMiniSecret } = require('@polkadot/util-crypto');

const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });

// 从助记词生成种子
const seed = mnemonicToMiniSecret('your mnemonic here');

// 从种子添加账户
const pair = keyring.addFromSeed(seed);
console.log('Account address:', pair.address);
```

### 从公钥添加

```javascript
const { Keyring } = require('@polkadot/keyring');

const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });

// 从公钥添加账户（只读）
const pair = keyring.addFromAddress('5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtSjDnVK9Fn9dZ');
console.log('Account address:', pair.address);
```

## 账户操作

### 获取账户信息

```javascript
// 获取地址
console.log('Address:', pair.address);

// 获取公钥
console.log('Public key:', pair.publicKey);

// 获取账户类型
console.log('Type:', pair.type);

// 检查是否为锁定状态
console.log('Is locked:', pair.isLocked);
```

### 签名操作

```javascript
const { stringToU8a, u8aToHex } = require('@polkadot/util');

// 准备消息
const message = stringToU8a('Hello Polkadot');

// 签名消息
const signature = pair.sign(message);
console.log('Signature:', u8aToHex(signature));

// 验证签名
const isValid = pair.verify(message, signature);
console.log('Signature valid:', isValid);
```

### 锁定和解锁

```javascript
// 锁定账户（清除私钥）
pair.lock();

// 检查锁定状态
console.log('Is locked:', pair.isLocked);

// 解锁账户（需要密码或助记词）
pair.unlock('password');
```

## 管理多个账户

### 列出所有账户

```javascript
// 获取密钥环中的所有账户
const accounts = keyring.getAccounts();
console.log('Total accounts:', accounts.length);

accounts.forEach((account, index) => {
  console.log(`Account ${index}:`, account.address);
});
```

### 查找特定账户

```javascript
// 通过地址查找账户
const account = keyring.getPair('5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtSjDnVK9Fn9dZ');

if (account) {
  console.log('Found account:', account.address);
} else {
  console.log('Account not found');
}
```

### 删除账户

```javascript
// 从密钥环中删除账户
keyring.removePair('5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtSjDnVK9Fn9dZ');
```

## 完整示例

```javascript
const { Keyring } = require('@polkadot/keyring');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { stringToU8a, u8aToHex } = require('@polkadot/util');

async function keyringExample() {
  await cryptoWaitReady();

  // 创建密钥环
  const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });

  // 添加测试账户
  const alice = keyring.addFromUri('//Alice');
  const bob = keyring.addFromUri('//Bob');

  console.log('Alice address:', alice.address);
  console.log('Bob address:', bob.address);

  // 签名和验证示例
  const message = stringToU8a('Hello from Polkadot');
  const signature = alice.sign(message);
  const isValid = alice.verify(message, signature);

  console.log('Signature:', u8aToHex(signature));
  console.log('Signature valid:', isValid);

  // 列出所有账户
  const accounts = keyring.getAccounts();
  console.log('Total accounts:', accounts.length);
}

keyringExample().catch(console.error);
```

## 最佳实践

1. **初始化**: 在使用前调用 `cryptoWaitReady()`
2. **类型选择**: 推荐使用 `sr25519` 算法
3. **地址格式**: 根据目标网络设置正确的 `ss58Format`
4. **安全**: 及时锁定不需要的账户
5. **备份**: 安全保存助记词和种子

## 常见问题

### Q: 如何切换网络？
A: 创建新的密钥环实例，指定正确的 `ss58Format`。

### Q: 支持哪些加密算法？
A: 支持 sr25519、ed25519 和 ecdsa。

### Q: 如何备份密钥环？
A: 备份助记词，密钥环本身不存储私钥。

### Q: 可以同时使用多个网络吗？
A: 可以创建多个密钥环实例，每个使用不同的配置。
