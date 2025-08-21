# 比特币传统地址格式

比特币支持多种地址格式，从传统的Legacy地址到现代的SegWit地址。本文档将详细介绍各种地址类型的生成方法和使用场景。

## 地址格式概述

比特币地址格式的发展历程：

1. **Legacy (P2PKH)** - 第一代地址，以"1"开头
2. **P2SH** - 脚本哈希地址，以"3"开头
3. **Native SegWit (P2WPKH)** - 原生见证地址，以"bc1"开头
4. **Nested SegWit (P2SH-P2WPKH)** - 嵌套见证地址，以"3"开头

## 核心依赖

```javascript
const { payments, networks } = require('bitcoinjs-lib');
```

## 网络配置

```javascript
// 主网络
const network = networks.bitcoin;

// 测试网络
// const network = networks.testnet;

// 回归测试网络
// const network = networks.regtest;
```

## P2PKH地址 (Legacy)

### 基本生成

```javascript
export function p2pkh_address(pubkey, network) {
  const { address } = payments.p2pkh({ pubkey, network });
  return address;
}
```

### 使用示例

```javascript
const network = networks.bitcoin;
const pubKey = '031b98c9f3bee12048d0ea57db25372db8da504b65b2adf023123c3cc464c6f283';
const pubkey = Buffer.from(pubKey, 'hex');

const p2pkhAddr = p2pkh_address(pubkey, network);
console.log('P2PKH Address:', p2pkhAddr); // 1开头
```

### 特点说明

- **格式**: 以"1"开头（主网）或"m"/"n"开头（测试网）
- **大小**: 25字节
- **编码**: Base58Check
- **优势**: 兼容性最好，所有钱包都支持
- **劣势**: 交易费用较高，不支持SegWit

## P2WPKH地址 (Native SegWit)

### 基本生成

```javascript
export function p2wpkh_address(pubkey, network) {
  const { address } = payments.p2wpkh({ pubkey, network });
  return address;
}
```

### 使用示例

```javascript
const p2wpkhAddr = p2wpkh_address(pubkey, network);
console.log('P2WPKH Address:', p2wpkhAddr); // bc1开头
```

### 特点说明

- **格式**: 以"bc1"开头（主网）或"tb1"开头（测试网）
- **大小**: 22字节
- **编码**: Bech32
- **优势**: 交易费用最低，支持SegWit
- **劣势**: 部分老钱包可能不支持

## P2SH-P2WPKH地址 (Nested SegWit)

### 基本生成

```javascript
export function p2sh_p2wpkh_address(pubkey, network) {
  const p2sh = payments.p2sh({
    redeem: payments.p2wpkh({
      pubkey,
      network
    }),
    network
  });
  return p2sh.address;
}
```

### 使用示例

```javascript
const p2sh_p2wpkhAddr = p2sh_p2wpkh_address(pubkey, network);
console.log('P2SH-P2WPKH Address:', p2sh_p2wpkhAddr); // 3开头
```

### 特点说明

- **格式**: 以"3"开头（主网）或"2"开头（测试网）
- **大小**: 23字节
- **编码**: Base58Check
- **优势**: 兼容性好，支持SegWit
- **劣势**: 交易费用介于P2PKH和P2WPKH之间

## 完整示例

```javascript
const { payments, networks } = require('bitcoinjs-lib');

function generateAllAddressTypes(pubkey, network) {
  // P2PKH地址
  const p2pkhAddr = p2pkh_address(pubkey, network);
  
  // P2WPKH地址
  const p2wpkhAddr = p2wpkh_address(pubkey, network);
  
  // P2SH-P2WPKH地址
  const p2sh_p2wpkhAddr = p2sh_p2wpkh_address(pubkey, network);
  
  return {
    p2pkh: p2pkhAddr,
    p2wpkh: p2wpkhAddr,
    p2sh_p2wpkh: p2sh_p2wpkhAddr
  };
}

// 使用示例
function main() {
  const network = networks.bitcoin;
  const pubKey = '031b98c9f3bee12048d0ea57db25372db8da504b65b2adf023123c3cc464c6f283';
  const pubkey = Buffer.from(pubKey, 'hex');

  const addresses = generateAllAddressTypes(pubkey, network);
  
  console.log('P2PKH Address:', addresses.p2pkh);
  console.log('P2WPKH Address:', addresses.p2wpkh);
  console.log('P2SH-P2WPKH Address:', addresses.p2sh_p2wpkh);
}

main();
```

## 地址类型比较

| 地址类型    | 前缀       | 编码   | 大小   | 费用 | 兼容性 | 推荐度 |
| ----------- | ---------- | ------ | ------ | ---- | ------ | ------ |
| P2PKH       | 1 (主网)   | Base58 | 25字节 | 高   | 最好   | ⭐⭐     |
| P2WPKH      | bc1 (主网) | Bech32 | 22字节 | 最低 | 中等   | ⭐⭐⭐⭐⭐  |
| P2SH-P2WPKH | 3 (主网)   | Base58 | 23字节 | 中等 | 好     | ⭐⭐⭐⭐   |

## 高级功能

### 批量地址生成

```javascript
function generateBatchAddresses(pubkeys, network, addressType = 'all') {
  const results = [];
  
  for (const pubkey of pubkeys) {
    const pubkeyBuffer = Buffer.from(pubkey, 'hex');
    
    switch (addressType) {
      case 'p2pkh':
        results.push({
          pubkey: pubkey,
          address: p2pkh_address(pubkeyBuffer, network),
          type: 'P2PKH'
        });
        break;
        
      case 'p2wpkh':
        results.push({
          pubkey: pubkey,
          address: p2wpkh_address(pubkeyBuffer, network),
          type: 'P2WPKH'
        });
        break;
        
      case 'p2sh_p2wpkh':
        results.push({
          pubkey: pubkey,
          address: p2sh_p2wpkh_address(pubkeyBuffer, network),
          type: 'P2SH-P2WPKH'
        });
        break;
        
      case 'all':
      default:
        results.push({
          pubkey: pubkey,
          p2pkh: p2pkh_address(pubkeyBuffer, network),
          p2wpkh: p2wpkh_address(pubkeyBuffer, network),
          p2sh_p2wpkh: p2sh_p2wpkh_address(pubkeyBuffer, network)
        });
        break;
    }
  }
  
  return results;
}

// 使用示例
const pubkeys = [
  '031b98c9f3bee12048d0ea57db25372db8da504b65b2adf023123c3cc464c6f283',
  '02f4147da97162a214dbe25828ee4c4acc4dc721cd0c15b2761b43ed0292ed82b5',
  '0377155e520059d3b85c6afc5c617b7eb519afadd0360f1ef03aff3f7e3f5438dd'
];

const batchAddresses = generateBatchAddresses(pubkeys, networks.bitcoin, 'all');
console.log('Batch addresses:', batchAddresses);
```

### 地址验证

```javascript
function validateAddress(address, network) {
  try {
    // 检查地址格式
    if (network === networks.bitcoin) {
      // 主网地址格式
      if (address.startsWith('1')) return 'P2PKH';
      if (address.startsWith('3')) return 'P2SH or P2SH-P2WPKH';
      if (address.startsWith('bc1')) return 'P2WPKH or P2WSH';
      if (address.startsWith('bc1p')) return 'P2TR';
    } else if (network === networks.testnet) {
      // 测试网地址格式
      if (address.startsWith('m') || address.startsWith('n')) return 'P2PKH';
      if (address.startsWith('2')) return 'P2SH or P2SH-P2WPKH';
      if (address.startsWith('tb1')) return 'P2WPKH or P2WSH';
      if (address.startsWith('tb1p')) return 'P2TR';
    }
    return 'Unknown';
  } catch (error) {
    return 'Invalid';
  }
}

// 使用示例
const addressTypes = [
  '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // P2PKH
  '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
  'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' // P2WPKH
];

addressTypes.forEach(address => {
  const type = validateAddress(address, networks.bitcoin);
  console.log(`${address}: ${type}`);
});
```

### 网络切换

```javascript
function switchNetwork(pubkey, fromNetwork, toNetwork) {
  const addresses = {
    from: generateAllAddressTypes(pubkey, fromNetwork),
    to: generateAllAddressTypes(pubkey, toNetwork)
  };
  
  return addresses;
}

// 使用示例
const pubkey = Buffer.from('031b98c9f3bee12048d0ea57db25372db8da504b65b2adf023123c3cc464c6f283', 'hex');

// 从测试网切换到主网
const networkSwitch = switchNetwork(pubkey, networks.testnet, networks.bitcoin);
console.log('Network switch:', networkSwitch);
```

## 最佳实践

### 地址选择建议

```javascript
function recommendAddressType(useCase, compatibility, feeSensitivity) {
  if (compatibility === 'high' && feeSensitivity === 'low') {
    return 'P2PKH'; // 最高兼容性
  } else if (compatibility === 'medium' && feeSensitivity === 'high') {
    return 'P2WPKH'; // 最低费用
  } else {
    return 'P2SH-P2WPKH'; // 平衡选择
  }
}

// 使用示例
const recommendation = recommendAddressType('wallet', 'medium', 'high');
console.log('Recommended address type:', recommendation);
```

### 迁移策略

```javascript
function createMigrationPlan(currentAddress, targetType) {
  const plan = {
    current: currentAddress,
    target: targetType,
    steps: []
  };
  
  if (targetType === 'P2WPKH') {
    plan.steps = [
      '1. 创建新的P2WPKH地址',
      '2. 将资金从旧地址转移到新地址',
      '3. 更新所有服务中的地址记录',
      '4. 验证新地址功能正常'
    ];
  }
  
  return plan;
}
```

## 错误处理

### 常见错误类型

```javascript
function handleAddressErrors(error) {
  if (error.message.includes('Invalid public key')) {
    console.error('公钥格式无效');
  } else if (error.message.includes('Invalid network')) {
    console.error('网络配置无效');
  } else if (error.message.includes('Encoding failed')) {
    console.error('地址编码失败');
  } else {
    console.error('未知错误:', error.message);
  }
}
```

## 性能优化

### 缓存机制

```javascript
const addressCache = new Map();

function getCachedAddress(pubkey, network, type) {
  const key = `${pubkey.toString('hex')}_${network}_${type}`;
  
  if (addressCache.has(key)) {
    return addressCache.get(key);
  }
  
  let address;
  switch (type) {
    case 'p2pkh':
      address = p2pkh_address(pubkey, network);
      break;
    case 'p2wpkh':
      address = p2wpkh_address(pubkey, network);
      break;
    case 'p2sh_p2wpkh':
      address = p2sh_p2wpkh_address(pubkey, network);
      break;
  }
  
  addressCache.set(key, address);
  return address;
}
```

## 常见问题

### Q: 什么时候使用P2PKH地址？
A: 当需要最高兼容性，或者交易费用不是主要考虑因素时。

### Q: P2WPKH地址有什么优势？
A: 交易费用最低，支持SegWit，但部分老钱包可能不支持。

### Q: 如何选择最适合的地址类型？
A: 根据兼容性要求、费用敏感度和使用场景综合考虑。

### Q: 地址格式可以转换吗？
A: 不能直接转换，需要创建新地址并转移资金。