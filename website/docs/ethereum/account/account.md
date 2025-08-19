# 以太坊账户创建与管理

以太坊账户是区块链交互的基础，本文档将详细介绍如何创建、验证和管理以太坊账户。

## 账户类型

以太坊支持两种类型的账户：

1. **外部拥有账户（EOA）**: 由私钥控制，可以发起交易
2. **智能合约账户**: 由代码控制，执行预定义逻辑

## 私钥到地址的生成

### 核心依赖

```typescript
import { privateToAddress, privateToPublic, isValidPrivate, publicToAddress, toChecksumAddress } from 'ethereumjs-util';
import { ec as EC } from 'elliptic';
```

### 私钥验证

```typescript
// 验证私钥有效性
const isValid = isValidPrivate(privateKey);
console.log('isValidPrivate:', isValid);
```

### 公钥生成

```typescript
// 从私钥生成公钥
const publicKey = privateToPublic(privateKey);
console.log('public key:', publicKey.toString('hex'));
```

### 地址生成

```typescript
// 从私钥直接生成地址
const address = privateToAddress(privateKey);
console.log('private to address:', address.toString('hex'));

// 从公钥生成地址
const addressFromPub = publicToAddress(publicKey).toString('hex');
console.log('public to address:', addressFromPub);
```

## 椭圆曲线操作

### 创建椭圆曲线实例

```typescript
const ec = new EC('secp256k1');
const pair = ec.keyFromPrivate(privateKey);
```

### 压缩和未压缩公钥

```typescript
// 压缩公钥（33字节）
const compact = pair.getPublic(true, 'hex');
console.log('compact:', compact);

// 未压缩公钥（65字节）
const decompose = pair.getPublic(false, 'hex');
console.log('decompose:', decompose);
```

### 从未压缩公钥生成地址

```typescript
const decomposeBuf = Buffer.from(decompose, 'hex');
const addr = publicToAddress(decomposeBuf, true).toString('hex');
console.log('address:', addr);
```

## 校验和地址

以太坊支持EIP-55校验和地址，提供更好的错误检测：

```typescript
// 生成校验和地址
const checksumAddress = toChecksumAddress(publicToAddress(publicKey, true).toString('hex'));
console.log('BIP55 address:', checksumAddress);

const checksumAddr = toChecksumAddress(addr);
console.log('bip55 address:', checksumAddr);
```

## 完整示例

```typescript
import { privateToAddress, privateToPublic, isValidPrivate, publicToAddress, toChecksumAddress } from 'ethereumjs-util';
import { ec as EC } from 'elliptic';
import 'dotenv/config';

const ec = new EC('secp256k1');
const { PRIVATE_KEY } = process.env;
const privateKey = Buffer.from(PRIVATE_KEY!, 'hex');

// 验证私钥
console.log('isValidPrivate:', isValidPrivate(privateKey));

// 生成公钥和地址
const publicKey = privateToPublic(privateKey);
const address = privateToAddress(privateKey);

console.log('public key:', publicKey.toString('hex'));
console.log('private to address:', address.toString('hex'));
console.log('public to address:', publicToAddress(publicKey).toString('hex'));
console.log('BIP55 address:', toChecksumAddress(publicToAddress(publicKey, true).toString('hex')));

// 椭圆曲线操作
const pair = ec.keyFromPrivate(privateKey);
const compact = pair.getPublic(true, 'hex');
const decompose = pair.getPublic(false, 'hex');
const decomposeBuf = Buffer.from(decompose, 'hex');
const addr = publicToAddress(decomposeBuf, true).toString('hex');

console.log('compact:', compact);
console.log('decompose:', decompose);
console.log('address:', addr);
console.log('bip55 address:', toChecksumAddress(addr));
```

## 安全注意事项

1. **私钥保护**: 永远不要暴露私钥
2. **环境变量**: 使用.env文件存储敏感信息
3. **地址验证**: 始终验证生成的地址格式
4. **网络确认**: 确保在正确的网络上操作

## 常见问题

### Q: 为什么需要校验和地址？
A: 校验和地址可以检测输入错误，防止资金发送到错误地址。

### Q: 压缩和未压缩公钥有什么区别？
A: 压缩公钥更节省空间，但某些应用可能需要未压缩格式。

### Q: 如何验证地址有效性？
A: 使用`isValidAddress`函数检查地址格式和校验和。

## 下一步

- [钱包集成](./wallet.md) - 学习如何集成钱包功能
- [交易构建](../tx/transaction.md) - 了解如何构建和发送交易
- [智能合约](../smart-contracts/intro.md) - 探索智能合约开发
