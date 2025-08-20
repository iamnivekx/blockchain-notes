# 账户检查

基于你的实际代码实现，本指南介绍如何在 Ripple 网络中验证地址、检查账户信息和进行地址解码。

## 功能概述

Ripple 账户检查系统提供：
- 地址格式验证
- 账户信息查询
- 地址解码和解析
- 校验和验证
- 多种地址格式支持

## 代码实现

### 基本地址验证

```javascript
const base = require('base-x');
const { classicAddressToXAddress, decodeAccountID } = require('ripple-address-codec');
const RippleAPI = require('ripple-lib').RippleAPI;

const api = new RippleAPI({});

function isValidAddress(address) {
  try {
    const expectedLength = 20;
    const withoutSum = decodeChecked(address);
    const versionBytes = withoutSum.slice(0, -expectedLength);
    
    // 检查版本字节
    if (seqEqual(versionBytes, [0])) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

function seqEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

function decodeChecked(base58string) {
  const buffer = bs58.decode(base58string);
  if (buffer.length < 5) {
    throw new Error('invalid_input_size: decoded data must have length >= 5');
  }
  if (!verifyCheckSum(buffer)) {
    throw new Error('checksum_invalid');
  }
  return buffer.slice(0, -4);
}

function verifyCheckSum(bytes) {
  const computed = sha256(sha256(bytes.slice(0, -4))).slice(0, 4);
  const checksum = bytes.slice(-4);
  return seqEqual(computed, checksum);
}
```

### 地址信息查询

```javascript
async function getAccountInfo(address) {
  try {
    console.log('=== Getting Account Information ===');
    
    // 验证地址格式
    if (!isValidAddress(address)) {
      throw new Error('Invalid address format');
    }
    
    // 创建 API 实例并连接
    const api = new RippleAPI({
      server: 'wss://s.altnet.rippletest.net/',
    });
    
    await api.connect();
    
    // 获取账户信息
    const accountInfo = await api.getAccountInfo(address);
    
    console.log('Account:', address);
    console.log('Account Info:', accountInfo);
    
    // 解码账户 ID
    const decodedAccountID = decodeAccountID(address);
    console.log('Decoded Account ID:', decodedAccountID);
    
    // 转换为 X 地址格式
    const xAddress = classicAddressToXAddress(address, false, true);
    const xTestAddress = classicAddressToXAddress(address, false, false);
    
    console.log('X Address (Mainnet):', xAddress);
    console.log('X Address (Testnet):', xTestAddress);
    
    await api.disconnect();
    
    return {
      address,
      accountInfo,
      decodedAccountID,
      xAddress,
      xTestAddress
    };
    
  } catch (error) {
    console.error('Failed to get account info:', error);
    throw error;
  }
}
```

### 批量地址验证

```javascript
async function validateMultipleAddresses(addresses) {
  const results = [];
  
  for (const address of addresses) {
    try {
      const isValid = isValidAddress(address);
      const decoded = decodeAccountID(address);
      
      results.push({
        address,
        isValid,
        decoded,
        error: null
      });
      
    } catch (error) {
      results.push({
        address,
        isValid: false,
        decoded: null,
        error: error.message
      });
    }
  }
  
  return results;
}

// 使用示例
const addresses = [
  'rDogsAY9kUNG3b4U3NjFa447MhA5zsLXp',
  'rfXgErjK96k59evDnC22zX7vRo2hYaSiqc',
  'rUCzEr6jrEyMpjhs4wSdQdz4g8Y382NxfM'
];

const validationResults = await validateMultipleAddresses(addresses);
console.log('Validation results:', validationResults);
```

### 地址解码工具

```javascript
function decodeAddress(address) {
  try {
    console.log('=== Decoding Ripple Address ===');
    
    // 基本验证
    if (!isValidAddress(address)) {
      throw new Error('Invalid address format');
    }
    
    // 解码账户 ID
    const decodedAccountID = decodeAccountID(address);
    
    // 转换为不同格式
    const xAddress = classicAddressToXAddress(address, false, true);
    const xTestAddress = classicAddressToXAddress(address, false, false);
    
    // 解析地址组件
    const addressInfo = {
      original: address,
      decoded: decodedAccountID,
      xMainnet: xAddress,
      xTestnet: xTestAddress,
      isValid: true
    };
    
    console.log('Address Info:', addressInfo);
    
    return addressInfo;
    
  } catch (error) {
    console.error('Failed to decode address:', error);
    
    return {
      original: address,
      decoded: null,
      xMainnet: null,
      xTestnet: null,
      isValid: false,
      error: error.message
    };
  }
}
```

## 完整使用示例

```javascript
const base = require('base-x');
const { classicAddressToXAddress, decodeAccountID } = require('ripple-address-codec');
const RippleAPI = require('ripple-lib').RippleAPI;

async function accountCheckExample() {
  try {
    console.log('=== Ripple Account Check Example ===');
    
    // 示例地址
    const testAddress = 'rDogsAY9kUNG3b4U3NjFa447MhA5zsLXp';
    
    // 1. 验证地址格式
    console.log('\n--- Step 1: Address Validation ---');
    const isValid = isValidAddress(testAddress);
    console.log('Address:', testAddress);
    console.log('Is Valid:', isValid);
    
    // 2. 解码地址
    console.log('\n--- Step 2: Address Decoding ---');
    const decoded = decodeAccountID(testAddress);
    console.log('Decoded Account ID:', decoded);
    
    // 3. 获取账户信息
    console.log('\n--- Step 3: Account Information ---');
    const accountInfo = await getAccountInfo(testAddress);
    console.log('Account Info:', accountInfo);
    
    // 4. 批量验证
    console.log('\n--- Step 4: Batch Validation ---');
    const testAddresses = [
      'rDogsAY9kUNG3b4U3NjFa447MhA5zsLXp',
      'rfXgErjK96k59evDnC22zX7vRo2hYaSiqc'
    ];
    
    const batchResults = await validateMultipleAddresses(testAddresses);
    console.log('Batch validation results:', batchResults);
    
    return {
      singleValidation: isValid,
      decoded,
      accountInfo,
      batchResults
    };
    
  } catch (error) {
    console.error('Account check example failed:', error);
  }
}

// 运行示例
accountCheckExample().catch(console.error);
```

## 关键要点

### 1. 地址验证
- 使用 Base58 解码
- 验证校验和
- 检查版本字节
- 验证长度要求

### 2. 校验和验证
- 使用双重 SHA256 哈希
- 比较计算和存储的校验和
- 确保数据完整性

### 3. 地址解码
- 解码账户 ID
- 转换为不同格式
- 支持经典和 X 地址

### 4. 错误处理
- 捕获解码错误
- 提供详细的错误信息
- 优雅处理无效地址

## 最佳实践

1. **地址验证**: 始终验证地址格式 before 使用
2. **错误处理**: 实现完整的错误处理机制
3. **批量处理**: 批量验证时注意性能
4. **格式转换**: 根据需要选择合适的地址格式
5. **网络选择**: 根据用途选择正确的网络

## 常见问题

### Q: 如何判断地址是否有效？
A: 使用 `isValidAddress()` 函数验证地址格式和校验和。

### Q: 经典地址和 X 地址有什么区别？
A: X 地址是新的格式，支持标签和网络标识，经典地址是传统格式。

### Q: 地址验证失败的原因有哪些？
A: 格式错误、校验和无效、长度不正确等。

### Q: 可以离线验证地址吗？
A: 可以，基本的格式验证和校验和验证不需要网络连接。
