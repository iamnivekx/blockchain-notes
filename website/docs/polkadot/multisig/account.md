# 多重签名账户创建

Polkadot 多重签名账户允许多个用户共同控制一个账户，需要达到指定数量的签名才能执行操作。本指南将详细介绍如何创建和管理多重签名账户。

## 多重签名账户概述

多重签名账户具有以下特点：

- **共同控制**: 多个签名者共同管理账户
- **阈值设置**: 可以设置所需的签名数量
- **安全性**: 提供比单一账户更高的安全性
- **灵活性**: 支持动态管理签名者

## 创建多重签名账户

### 基本创建流程

```javascript
const { createKeyMulti, encodeAddress, sortAddresses } = require('@polkadot/util-crypto');
const { Keyring } = require('@polkadot/keyring');

function createMultisigAccount(signatories, threshold, ss58Format = 42) {
  // 1. 对签名者地址进行排序（必需）
  const sortedSignatories = sortAddresses(signatories);
  
  // 2. 创建多重签名账户
  const multiAddress = createKeyMulti(sortedSignatories, threshold);
  
  // 3. 编码为 SS58 地址
  const ss58Address = encodeAddress(multiAddress, ss58Format);
  
  console.log('=== Multisig Account Created ===');
  console.log('Address:', ss58Address);
  console.log('Threshold:', threshold);
  console.log('Total Signatories:', sortedSignatories.length);
  console.log('Signatories:', sortedSignatories);
  
  return {
    address: ss58Address,
    threshold,
    signatories: sortedSignatories,
    raw: multiAddress
  };
}
```

### 使用示例

```javascript
async function createMultisigExample() {
  const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });
  
  // 创建测试账户
  const alice = keyring.addFromUri('//Alice');
  const bob = keyring.addFromUri('//Bob');
  const charlie = keyring.addFromUri('//Charlie');
  const dave = keyring.addFromUri('//Dave');
  
  console.log('Test accounts created:');
  console.log('Alice:', alice.address);
  console.log('Bob:', bob.address);
  console.log('Charlie:', charlie.address);
  console.log('Dave:', dave.address);
  
  // 创建多重签名账户
  const signatories = [
    alice.address,
    bob.address,
    charlie.address,
    dave.address
  ];
  
  // 设置阈值为 3（需要 3 个签名）
  const threshold = 3;
  
  const multisig = createMultisigAccount(signatories, threshold);
  
  return multisig;
}
```

## 多重签名账户配置

### 阈值设置建议

```javascript
function getThresholdRecommendations(signatoryCount) {
  const recommendations = {
    low: Math.ceil(signatoryCount * 0.5),      // 50%
    medium: Math.ceil(signatoryCount * 0.67),  // 67%
    high: Math.ceil(signatoryCount * 0.75)     // 75%
  };
  
  console.log(`For ${signatoryCount} signatories:`);
  console.log(`- Low security: ${recommendations.low} signatures required`);
  console.log(`- Medium security: ${recommendations.medium} signatures required`);
  console.log(`- High security: ${recommendations.high} signatures required`);
  
  return recommendations;
}

// 使用示例
const recommendations = getThresholdRecommendations(4);
// 输出: 2, 3, 3
```

### 网络特定配置

```javascript
function getNetworkConfig(network) {
  const configs = {
    polkadot: { ss58Format: 0, unit: 'DOT' },
    kusama: { ss58Format: 2, unit: 'KSM' },
    clover: { ss58Format: 42, unit: 'CLV' },
    rococo: { ss58Format: 42, unit: 'ROC' }
  };
  
  return configs[network] || configs.clover;
}

// 创建特定网络的多重签名账户
function createNetworkSpecificMultisig(signatories, threshold, network) {
  const config = getNetworkConfig(network);
  return createMultisigAccount(signatories, threshold, config.ss58Format);
}
```

## 多重签名账户验证

### 地址验证

```javascript
const { isAddress } = require('@polkadot/util');

function validateMultisigAccount(multisig) {
  const errors = [];
  
  // 验证多重签名地址
  if (!isAddress(multisig.address)) {
    errors.push('Invalid multisig address');
  }
  
  // 验证阈值
  if (multisig.threshold < 1 || multisig.threshold > multisig.signatories.length) {
    errors.push('Invalid threshold value');
  }
  
  // 验证签名者地址
  multisig.signatories.forEach((signatory, index) => {
    if (!isAddress(signatory)) {
      errors.push(`Invalid signatory address at index ${index}: ${signatory}`);
    }
  });
  
  // 验证签名者数量
  if (multisig.signatories.length < 2) {
    errors.push('At least 2 signatories required');
  }
  
  if (errors.length === 0) {
    console.log('✅ Multisig account validation passed');
    return true;
  } else {
    console.log('❌ Multisig account validation failed:');
    errors.forEach(error => console.log(`  - ${error}`));
    return false;
  }
}
```

### 重复地址检查

```javascript
function checkDuplicateSignatories(signatories) {
  const duplicates = signatories.filter((item, index) => 
    signatories.indexOf(item) !== index
  );
  
  if (duplicates.length > 0) {
    console.log('⚠️  Duplicate signatories found:', [...new Set(duplicates)]);
    return false;
  }
  
  console.log('✅ No duplicate signatories');
  return true;
}
```

## 多重签名账户管理

### 添加新签名者

```javascript
function addSignatory(multisig, newSignatory) {
  // 检查是否已存在
  if (multisig.signatories.includes(newSignatory)) {
    console.log('Signatory already exists');
    return multisig;
  }
  
  // 添加新签名者
  const newSignatories = [...multisig.signatories, newSignatory];
  const sortedSignatories = sortAddresses(newSignatories);
  
  // 重新创建多重签名账户
  const newMultisig = createMultisigAccount(
    sortedSignatories, 
    multisig.threshold,
    42 // 使用相同的网络格式
  );
  
  console.log('New signatory added:', newSignatory);
  console.log('New multisig address:', newMultisig.address);
  
  return newMultisig;
}
```

### 移除签名者

```javascript
function removeSignatory(multisig, signatoryToRemove) {
  // 检查是否为签名者
  if (!multisig.signatories.includes(signatoryToRemove)) {
    console.log('Signatory not found');
    return multisig;
  }
  
  // 检查移除后是否满足阈值要求
  const newSignatories = multisig.signatories.filter(s => s !== signatoryToRemove);
  
  if (newSignatories.length < multisig.threshold) {
    console.log('Cannot remove signatory: threshold would be too high');
    return multisig;
  }
  
  // 重新创建多重签名账户
  const newMultisig = createMultisigAccount(
    newSignatories,
    multisig.threshold,
    42
  );
  
  console.log('Signatory removed:', signatoryToRemove);
  console.log('New multisig address:', newMultisig.address);
  
  return newMultisig;
}
```

### 调整阈值

```javascript
function adjustThreshold(multisig, newThreshold) {
  // 验证新阈值
  if (newThreshold < 1 || newThreshold > multisig.signatories.length) {
    console.log('Invalid threshold value');
    return multisig;
  }
  
  // 重新创建多重签名账户
  const newMultisig = createMultisigAccount(
    multisig.signatories,
    newThreshold,
    42
  );
  
  console.log('Threshold adjusted from', multisig.threshold, 'to', newThreshold);
  console.log('New multisig address:', newMultisig.address);
  
  return newMultisig;
}
```

## 完整示例

```javascript
const { createKeyMulti, encodeAddress, sortAddresses } = require('@polkadot/util-crypto');
const { Keyring } = require('@polkadot/keyring');
const { isAddress } = require('@polkadot/util');

async function comprehensiveMultisigExample() {
  console.log('=== Comprehensive Multisig Account Example ===\n');
  
  // 创建密钥环
  const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });
  
  // 创建测试账户
  const accounts = [
    keyring.addFromUri('//Alice'),
    keyring.addFromUri('//Bob'),
    keyring.addFromUri('//Charlie'),
    keyring.addFromUri('//Dave'),
    keyring.addFromUri('//Eve')
  ];
  
  console.log('Test accounts created:');
  accounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.address}`);
  });
  
  // 创建多重签名账户
  const signatories = accounts.map(acc => acc.address);
  const threshold = 3;
  
  console.log(`\nCreating multisig account with threshold ${threshold}/${signatories.length}`);
  const multisig = createMultisigAccount(signatories, threshold);
  
  // 验证账户
  console.log('\n=== Validating Multisig Account ===');
  const isValid = validateMultisigAccount(multisig);
  
  if (isValid) {
    // 测试添加签名者
    console.log('\n=== Testing Signatory Management ===');
    const newAccount = keyring.addFromUri('//Frank');
    console.log('Adding new signatory:', newAccount.address);
    
    const updatedMultisig = addSignatory(multisig, newAccount.address);
    
    // 测试移除签名者
    console.log('\nRemoving signatory:', accounts[0].address);
    const finalMultisig = removeSignatory(updatedMultisig, accounts[0].address);
    
    // 测试调整阈值
    console.log('\nAdjusting threshold to 4');
    const adjustedMultisig = adjustThreshold(finalMultisig, 4);
    
    console.log('\n=== Final Multisig Account ===');
    console.log('Address:', adjustedMultisig.address);
    console.log('Threshold:', adjustedMultisig.threshold);
    console.log('Signatories:', adjustedMultisig.signatories);
  }
  
  return multisig;
}

// 运行示例
comprehensiveMultisigExample().catch(console.error);
```

## 最佳实践

1. **阈值设置**: 设置合理的阈值，平衡安全性和便利性
2. **签名者选择**: 选择可信的签名者，避免利益冲突
3. **地址验证**: 始终验证所有地址的有效性
4. **备份管理**: 安全备份所有签名者的信息
5. **定期审查**: 定期审查多重签名账户配置

## 常见问题

### Q: 多重签名账户可以有多少个签名者？
A: 理论上没有限制，但建议控制在合理范围内（如 3-10 个）。

### Q: 如何更改多重签名配置？
A: 需要创建新的多重签名账户，无法直接修改现有配置。

### Q: 多重签名账户有费用吗？
A: 创建多重签名账户需要支付押金，具体金额取决于网络配置。

### Q: 可以设置动态阈值吗？
A: 不可以，阈值是固定的，需要重新创建账户来更改。
