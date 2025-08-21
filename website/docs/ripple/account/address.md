# 地址生成

基于你的实际代码实现，本指南介绍如何在 Ripple 网络中生成地址、派生密钥对和转换地址格式。

## 功能概述

Ripple 地址生成系统提供：
- 从种子（种子）派生密钥对
- 生成经典 Ripple 地址
- 转换为 X 地址格式
- 支持主网和测试网地址
- 安全的密钥派生算法

## 代码实现

### 基本地址生成

```javascript
const { classicAddressToXAddress } = require('ripple-address-codec');
const RippleAPI = require('ripple-lib').RippleAPI;

const api = new RippleAPI({});

async function generateAddress(secret) {
  try {
    console.log('=== Generating Ripple Address ===');
    
    // 从种子派生密钥对
    const keypair = api.deriveKeypair(secret);
    const { publicKey, privateKey } = keypair;
    
    // 派生经典地址
    const address = api.deriveAddress(publicKey);
    
    // 转换为 X 地址格式
    const xAddress = classicAddressToXAddress(address, false, true);
    const xTestAddress = classicAddressToXAddress(address, false, false);
    
    console.log('Secret:', secret);
    console.log('Public Key:', publicKey);
    console.log('Private Key:', privateKey);
    console.log('Classic Address:', address);
    console.log('X Address (Mainnet):', xAddress);
    console.log('X Address (Testnet):', xTestAddress);
    
    return {
      secret,
      publicKey,
      privateKey,
      address,
      xAddress,
      xTestAddress
    };
    
  } catch (error) {
    console.error('Failed to generate address:', error);
    throw error;
  }
}
```

### 批量地址生成

```javascript
async function generateMultipleAddresses(secrets) {
  const results = [];
  
  for (const secret of secrets) {
    try {
      const result = await generateAddress(secret);
      results.push(result);
    } catch (error) {
      console.error(`Failed to generate address for secret: ${secret}`, error);
    }
  }
  
  return results;
}

// 使用示例
const secrets = [
  'sapyGYwE3bh3JiYU59hFdecU2PovC',
  'snv63YPxpLsqn7NsdGxnqECviNPZ2'
];

const addresses = await generateMultipleAddresses(secrets);
console.log('Generated addresses:', addresses);
```

### 地址格式转换

```javascript
function convertAddressFormats(address) {
  try {
    // 经典地址转 X 地址（主网）
    const xAddressMainnet = classicAddressToXAddress(address, false, true);
    
    // 经典地址转 X 地址（测试网）
    const xAddressTestnet = classicAddressToXAddress(address, false, false);
    
    // 经典地址转 X 地址（带标签）
    const xAddressWithTag = classicAddressToXAddress(address, true, true);
    
    return {
      classic: address,
      xMainnet: xAddressMainnet,
      xTestnet: xAddressTestnet,
      xWithTag: xAddressWithTag
    };
    
  } catch (error) {
    console.error('Failed to convert address formats:', error);
    throw error;
  }
}

// 使用示例
const address = 'rsuUYDM8d15J44pZbdKumiDcnXHjPEuhXE';
const formats = convertAddressFormats(address);
console.log('Address formats:', formats);
```

## 完整使用示例

```javascript
const { classicAddressToXAddress } = require('ripple-address-codec');
const RippleAPI = require('ripple-lib').RippleAPI;

async function addressGenerationExample() {
  try {
    // 创建 API 实例
    const api = new RippleAPI({});
    
    // 示例种子
    const secret = 'sapyGYwE3bh3JiYU59hFdecU2PovC';
    
    console.log('=== Ripple Address Generation Example ===');
    
    // 生成地址
    const result = await generateAddress(secret);
    
    console.log('\n=== Generated Address Information ===');
    console.log('Secret:', result.secret);
    console.log('Public Key:', result.publicKey);
    console.log('Private Key:', result.privateKey);
    console.log('Classic Address:', result.address);
    console.log('X Address (Mainnet):', result.xAddress);
    console.log('X Address (Testnet):', result.xTestAddress);
    
    // 转换地址格式
    const formats = convertAddressFormats(result.address);
    console.log('\n=== Address Format Conversions ===');
    console.log('Classic:', formats.classic);
    console.log('X Mainnet:', formats.xMainnet);
    console.log('X Testnet:', formats.xTestnet);
    console.log('X With Tag:', formats.xWithTag);
    
    return result;
    
  } catch (error) {
    console.error('Address generation example failed:', error);
  }
}

// 运行示例
addressGenerationExample().catch(console.error);
```

## 关键要点

### 1. 种子格式
- 使用 Base58 编码的种子字符串
- 以 's' 开头的字符串
- 长度通常为 29 个字符

### 2. 地址格式
- **经典地址**: 以 'r' 开头的传统格式
- **X 地址**: 新的地址格式，支持标签和网络标识
- **测试网地址**: 用于开发和测试环境

### 3. 密钥派生
- 使用确定性算法从种子派生密钥对
- 公钥用于生成地址
- 私钥用于签名交易

### 4. 网络标识
- `classicAddressToXAddress(address, false, true)` - 主网
- `classicAddressToXAddress(address, false, false)` - 测试网
- `classicAddressToXAddress(address, true, true)` - 带标签的主网

## 最佳实践

1. **种子安全**: 安全存储种子，不要暴露给第三方
2. **地址验证**: 验证生成的地址格式
3. **网络选择**: 根据用途选择正确的网络
4. **错误处理**: 实现完整的错误处理机制
5. **批量生成**: 批量生成地址时注意内存使用

## 常见问题

### Q: 种子和私钥有什么区别？
A: 种子是生成私钥的种子值，私钥是从种子派生的具体密钥。

### Q: 可以重复使用同一个种子吗？
A: 可以，同一个种子总是会生成相同的密钥对和地址。

### Q: X 地址和经典地址可以互换吗？
A: 可以，X 地址可以转换为经典地址，反之亦然。

### Q: 测试网地址可以在主网上使用吗？
A: 不可以，测试网地址只能在测试网络上使用。
