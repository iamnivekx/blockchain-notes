# 比特币多重签名地址

多重签名地址允许多个私钥共同控制资金，本文档将详细介绍如何使用BitGo和bitcoinjs-lib创建和管理多重签名地址。

## 多重签名概述

多重签名地址具有以下特点：

1. **阈值控制**: 需要指定数量的签名才能花费资金
2. **安全性提升**: 分散私钥管理，降低单点风险
3. **灵活配置**: 支持多种M-of-N配置
4. **企业应用**: 适用于企业钱包和托管服务

## 核心依赖

```typescript
import bitgoV1 from '@bitgo/utxo-lib';
import { payments } from 'bitcoinjs-lib';
```

## 密钥配置

### 公钥准备

```typescript
// 定义公钥数组
const pubKeys = [
  '02f4147da97162a214dbe25828ee4c4acc4dc721cd0c15b2761b43ed0292ed82b5',
  '0377155e520059d3b85c6afc5c617b7eb519afadd0360f1ef03aff3f7e3f5438dd',
  '02f44bce3eecd274e7aa24ec975388d12905dfc670a99b16e1d968e6ab5f69b266',
].map(function (hex) {
  return Buffer.from(hex, 'hex');
});

// 设置阈值 (2-of-3)
const threshold = 2;
```

### 网络配置

```typescript
// 测试网络
const network = bitgoV1.networks.testnet;

// 主网络
// const network = bitgoV1.networks.bitcoin;

// 回归测试网络
// const network = bitgoV1.networks.regtest;
```

## 使用BitGo创建多重签名

### 创建赎回脚本

```typescript
// 使用BitGo创建多重签名赎回脚本
var redeemScript = bitgoV1.script.multisig.output.encode(threshold, pubKeys);
console.log('Redeem script:', redeemScript.toString('hex'));
```

### 创建脚本公钥

```typescript
// 计算赎回脚本的哈希
var scriptPubKey = bitgoV1.script.scriptHash.output.encode(
  bitgoV1.crypto.hash160(redeemScript)
);
console.log('Script public key:', scriptPubKey.toString('hex'));
```

### 生成地址

```typescript
// 从脚本公钥生成地址
var address = bitgoV1.address.fromOutputScript(scriptPubKey, network);
console.log('BitGo address:', address);
```

## 使用bitcoinjs-lib创建多重签名

### 创建多重签名脚本

```typescript
// 使用bitcoinjs-lib创建多重签名脚本
const { address } = payments.p2sh({
  redeem: payments.p2ms({ 
    m: threshold, 
    pubkeys: pubKeys, 
    network 
  }),
  network,
});

console.log('Bitcoin address:', address);
```

## 完整示例

```typescript
import bitgoV1 from '@bitgo/utxo-lib';
import { payments } from 'bitcoinjs-lib';

function createMultisigAddress(pubKeys: Buffer[], threshold: number, network: any) {
  // 方法1: 使用BitGo
  const redeemScript = bitgoV1.script.multisig.output.encode(threshold, pubKeys);
  const scriptPubKey = bitgoV1.script.scriptHash.output.encode(
    bitgoV1.crypto.hash160(redeemScript)
  );
  const bitgoAddress = bitgoV1.address.fromOutputScript(scriptPubKey, network);
  
  // 方法2: 使用bitcoinjs-lib
  const { address: bitcoinAddress } = payments.p2sh({
    redeem: payments.p2ms({ 
      m: threshold, 
      pubkeys: pubKeys, 
      network 
    }),
    network,
  });
  
  return {
    bitgoAddress,
    bitcoinAddress,
    redeemScript: redeemScript.toString('hex'),
    scriptPubKey: scriptPubKey.toString('hex')
  };
}

// 使用示例
const pubKeys = [
  '02f4147da97162a214dbe25828ee4c4acc4dc721cd0c15b2761b43ed0292ed82b5',
  '0377155e520059d3b85c6afc5c617b7eb519afadd0360f1ef03aff3f7e3f5438dd',
  '02f44bce3eecd274e7aa24ec975388d12905dfc670a99b16e1d968e6ab5f69b266',
].map(hex => Buffer.from(hex, 'hex'));

const threshold = 2;
const network = bitgoV1.networks.testnet;

const result = createMultisigAddress(pubKeys, threshold, network);
console.log('Multisig addresses:', result);
```

## 多重签名类型

### P2SH多重签名

```typescript
// P2SH多重签名地址 (以"3"开头)
function createP2SHMultisig(m: number, pubkeys: Buffer[], network: any) {
  const { address } = payments.p2sh({
    redeem: payments.p2ms({ m, pubkeys, network }),
    network,
  });
  return address;
}
```

### P2WSH多重签名

```typescript
// P2WSH多重签名地址 (以"bc1"开头)
function createP2WSHMultisig(m: number, pubkeys: Buffer[], network: any) {
  const { address } = payments.p2wsh({
    redeem: payments.p2ms({ m, pubkeys, network }),
    network,
  });
  return address;
}
```

### 嵌套SegWit多重签名

```typescript
// 嵌套SegWit多重签名地址
function createNestedSegWitMultisig(m: number, pubkeys: Buffer[], network: any) {
  const { address } = payments.p2sh({
    redeem: payments.p2wsh({
      redeem: payments.p2ms({ m, pubkeys, network }),
      network,
    }),
    network,
  });
  return address;
}
```

## 地址验证

### 验证多重签名地址

```typescript
function validateMultisigAddress(address: string, network: any): boolean {
  try {
    // 检查地址格式
    if (network === bitgoV1.networks.bitcoin) {
      // 主网地址格式
      if (address.startsWith('3') || address.startsWith('bc1')) {
        return true;
      }
    } else if (network === bitgoV1.networks.testnet) {
      // 测试网地址格式
      if (address.startsWith('2') || address.startsWith('tb1')) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}
```

### 验证公钥格式

```typescript
function validatePublicKeys(pubkeys: Buffer[]): boolean {
  if (pubkeys.length === 0) return false;
  
  for (const pubkey of pubkeys) {
    // 检查公钥长度
    if (pubkey.length !== 33 && pubkey.length !== 65) {
      return false;
    }
    
    // 检查公钥前缀
    const prefix = pubkey[0];
    if (pubkey.length === 33 && (prefix !== 0x02 && prefix !== 0x03)) {
      return false;
    }
    if (pubkey.length === 65 && prefix !== 0x04) {
      return false;
    }
  }
  
  return true;
}
```

## 高级功能

### 动态阈值调整

```typescript
function createFlexibleMultisig(
  pubkeys: Buffer[], 
  minThreshold: number, 
  maxThreshold: number
) {
  const addresses = [];
  
  for (let m = minThreshold; m <= maxThreshold; m++) {
    if (m <= pubkeys.length) {
      const address = createP2SHMultisig(m, pubkeys, bitgoV1.networks.testnet);
      addresses.push({ threshold: m, address });
    }
  }
  
  return addresses;
}

// 使用示例
const flexibleAddresses = createFlexibleMultisig(pubKeys, 1, 3);
console.log('Flexible multisig addresses:', flexibleAddresses);
```

### 批量地址生成

```typescript
function generateMultipleMultisigAddresses(
  pubkeySets: Buffer[][], 
  thresholds: number[], 
  network: any
) {
  if (pubkeySets.length !== thresholds.length) {
    throw new Error('Public key sets and thresholds must have the same length');
  }
  
  return pubkeySets.map((pubkeys, index) => {
    const threshold = thresholds[index];
    return createMultisigAddress(pubkeys, threshold, network);
  });
}

// 使用示例
const pubkeySet1 = [pubKeys[0], pubKeys[1]]; // 2个公钥
const pubkeySet2 = [pubKeys[0], pubKeys[1], pubKeys[2]]; // 3个公钥

const multipleAddresses = generateMultipleMultisigAddresses(
  [pubkeySet1, pubkeySet2],
  [2, 2], // 都是2-of-N
  network
);

console.log('Multiple multisig addresses:', multipleAddresses);
```

## 常见配置

### 2-of-3 多重签名

```typescript
// 最常见的多重签名配置
function create2of3Multisig(pubkeys: Buffer[], network: any) {
  return createMultisigAddress(pubkeys, 2, network);
}

// 适用于：
// - 个人钱包（主密钥 + 备份密钥 + 硬件钱包）
// - 企业钱包（CEO + CFO + 技术负责人）
```

### 3-of-5 多重签名

```typescript
// 高安全性配置
function create3of5Multisig(pubkeys: Buffer[], network: any) {
  return createMultisigAddress(pubkeys, 3, network);
}

// 适用于：
// - 高价值资产保护
// - 多方托管服务
// - 企业资金管理
```

## 错误处理

### 常见错误类型

```typescript
function handleMultisigErrors(error: Error) {
  if (error.message.includes('Invalid public key')) {
    console.error('公钥格式无效');
  } else if (error.message.includes('Threshold exceeds')) {
    console.error('阈值超过公钥数量');
  } else if (error.message.includes('Invalid network')) {
    console.error('网络配置无效');
  } else {
    console.error('未知错误:', error.message);
  }
}
```

## 最佳实践

1. **阈值设置**: 根据安全需求合理设置阈值
2. **密钥分散**: 将私钥存储在不同位置
3. **网络选择**: 开发时使用测试网络
4. **地址验证**: 验证生成地址的正确性
5. **备份策略**: 实现可靠的密钥备份机制

## 常见问题

### Q: 如何选择合适的阈值？
A: 根据安全需求和可用性要求，通常设置为公钥数量的50%-80%。

### Q: 多重签名地址可以升级吗？
A: 不能直接升级，需要创建新地址并转移资金。

### Q: 如何处理密钥丢失？
A: 如果丢失的密钥数量超过阈值，资金将无法花费。

## 下一步

- [脚本系统](../script/script.md) - 了解多重签名脚本的工作原理
- [交易构建](../tx/bitcoin.md) - 学习如何使用多重签名地址
- [BitGo集成](../tx/bitgo.md) - 探索企业级多重签名解决方案
