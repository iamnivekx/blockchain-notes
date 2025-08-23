# 比特币地址生成 (原理篇)

本文将带你**从零开始，深入理解比特币地址的底层构造原理**，并手动实现地址生成。如果你希望在项目中快速应用，可以参考《使用 bitcoinjs-lib 库生成地址》。

比特币地址是接收比特币的标识符，本文档将详细介绍如何生成和验证不同格式的比特币地址。

## 地址类型

比特币支持多种地址格式：

1. **Base58地址**: 传统的Legacy格式
2. **Bech32地址**: SegWit原生格式
3. **P2SH地址**: 脚本哈希地址
4. **Taproot地址**: 最新的P2TR格式

## 核心依赖

```typescript
import bech32 from 'bech32';
import base58 from 'bs58';
import { sha256x2, sha256, ripemd160 } from '../utils/crypto';
```

## Bech32地址生成

### 基本生成

```typescript
export function toBech32Address(pubkey: Buffer, pubKeyHash = 0x00): string {
  // 第一步：计算SHA256哈希
  const hash256 = sha256(pubkey);
  
  // 第二步：计算RIPEMD160哈希
  const hash160 = ripemd160(hash256);

  // 第三步：转换为Bech32格式
  const words = bech32.toWords(hash160);
  words.unshift(pubKeyHash);
  
  // 第四步：编码为Bech32地址
  return bech32.encode('bc', words);
}
```

### 使用示例

```typescript
// 从公钥生成Bech32地址
const publicKey = Buffer.from('031b98c9f3bee12048d0ea57db25372db8da504b65b2adf023123c3cc464c6f283', 'hex'); // 压缩公钥
const bech32Address = toBech32Address(publicKey);
console.log('Bech32 Address:', bech32Address); // bc1...

// 生成不同版本的见证地址
const p2wpkhAddress = toBech32Address(publicKey, 0x00); // P2WPKH
console.log('P2WPKH Address:', p2wpkhAddress);
```

## Base58地址生成

### 详细步骤

```typescript
export function toBase58Address(pubkey: Buffer, pubKeyHash = 0x00): string {
  // 第一步：计算公钥哈希
  const hash256 = sha256(pubkey);
  const hash160 = ripemd160(hash256);

  // 第二步：添加版本字节
  const payload = Buffer.allocUnsafe(21);
  payload.writeUInt8(pubKeyHash, 0);  // 版本字节
  hash160.copy(payload, 1);           // 公钥哈希

  // 第三步：计算校验和
  const checksum = sha256x2(payload).slice(0, 4);

  // 第四步：拼接最终数据
  const buffer = Buffer.allocUnsafe(25);
  payload.copy(buffer);               // 版本 + 公钥哈希
  checksum.copy(buffer, 21);          // 校验和

  // 第五步：Base58编码
  return base58.encode(buffer);
}
```

### 使用示例

```typescript
// 生成Legacy地址 (P2PKH)
const publicKey = Buffer.from('031b98c9f3bee12048d0ea57db25372db8da504b65b2adf023123c3cc464c6f283', 'hex');
const legacyAddress = toBase58Address(publicKey, 0x00);
console.log('Legacy Address:', legacyAddress); // 1...

// 生成P2SH地址
const p2shAddress = toBase58Address(publicKey, 0x05);
console.log('P2SH Address:', p2shAddress); // 3...

// 测试网地址
const testnetAddress = toBase58Address(publicKey, 0x6f);
console.log('Testnet Address:', testnetAddress); // m... 或 n...
```

## 地址验证

### Base58地址验证

```typescript
function validateBase58Address(address: string): boolean {
  try {
    const decoded = base58.decode(address);
    
    // 检查长度
    if (decoded.length !== 25) return false;
    
    // 提取版本、载荷和校验和
    const version = decoded[0];
    const payload = decoded.slice(0, 21);
    const checksum = decoded.slice(21);
    
    // 验证校验和
    const calculatedChecksum = sha256x2(payload).slice(0, 4);
    
    return checksum.equals(calculatedChecksum);
  } catch (error) {
    return false;
  }
}
```

### Bech32地址验证

```typescript
function validateBech32Address(address: string): boolean {
  try {
    const decoded = bech32.decode(address);
    
    // 检查前缀和数据
    return decoded.prefix === 'bc' && decoded.words.length > 0;
  } catch (error) {
    return false;
  }
}
```

## 网络版本字节

### 主网版本

```typescript
const MAINNET_VERSIONS = {
  P2PKH: 0x00,      // 地址以"1"开头
  P2SH: 0x05,       // 地址以"3"开头
  BECH32: 'bc'      // 地址以"bc1"开头
};
```

### 测试网版本

```typescript
const TESTNET_VERSIONS = {
  P2PKH: 0x6f,      // 地址以"m"或"n"开头
  P2SH: 0xc4,       // 地址以"2"开头
  BECH32: 'tb'      // 地址以"tb1"开头
};
```

### 回归测试网版本

```typescript
const REGTEST_VERSIONS = {
  P2PKH: 0x6f,      // 同测试网
  P2SH: 0xc4,       // 同测试网
  BECH32: 'bcrt'    // 地址以"bcrt1"开头
};
```

## 高级功能

### 地址类型检测

```typescript
function detectAddressType(address: string): string {
  if (address.startsWith('1')) return 'P2PKH';
  if (address.startsWith('3')) return 'P2SH';
  if (address.startsWith('bc1q')) return 'P2WPKH';
  if (address.startsWith('bc1p')) return 'P2TR';
  if (address.startsWith('tb1')) return 'Testnet SegWit';
  if (address.startsWith('m') || address.startsWith('n')) return 'Testnet P2PKH';
  if (address.startsWith('2')) return 'Testnet P2SH';
  return 'Unknown';
}
```

### 地址转换

```typescript
function convertAddress(pubkey: Buffer, fromFormat: string, toFormat: string) {
  const formats = {
    'base58': () => toBase58Address(pubkey),
    'bech32': () => toBech32Address(pubkey),
    'p2sh': () => toBase58Address(pubkey, 0x05)
  };
  
  if (!formats[toFormat]) {
    throw new Error(`Unsupported format: ${toFormat}`);
  }
  
  return formats[toFormat]();
}
```

## 批量地址生成

```typescript
function generateMultipleAddresses(
  publicKeys: Buffer[], 
  format: 'base58' | 'bech32' = 'base58'
): string[] {
  const generator = format === 'bech32' ? toBech32Address : toBase58Address;
  
  return publicKeys.map(pubkey => generator(pubkey));
}

// 使用示例
const pubKeys = [
  Buffer.from('02...', 'hex'),
  Buffer.from('03...', 'hex'),
  // 更多公钥...
];

const addresses = generateMultipleAddresses(pubKeys, 'bech32');
console.log('Generated addresses:', addresses);
```

## 最佳实践

1. **格式选择**: 优先使用Bech32格式，手续费更低
2. **版本验证**: 确保使用正确的网络版本字节
3. **校验和验证**: 始终验证地址的校验和
4. **长度检查**: 验证地址长度的合法性
5. **错误处理**: 实现完善的错误处理机制

## 常见问题

### Q: 为什么要使用Bech32地址？
A: Bech32地址支持SegWit，交易费用更低，错误检测能力更强。

### Q: 如何在测试网和主网之间切换？
A: 修改版本字节参数和Bech32前缀即可。

### Q: 地址生成失败怎么办？
A: 检查公钥格式、网络参数和编码库版本。
