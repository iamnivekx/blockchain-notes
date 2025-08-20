# 多重签名启用

Polkadot 多重签名功能需要正确配置和启用才能使用。本指南将介绍如何启用多重签名功能，包括权限设置、费用配置和网络支持。

## 多重签名启用概述

启用多重签名功能涉及以下方面：

- **网络支持**: 确保目标网络支持多重签名
- **权限配置**: 设置正确的账户权限
- **费用设置**: 配置多重签名操作的费用
- **类型定义**: 确保正确的类型支持

## 检查网络支持

### 验证多重签名模块

```javascript
async function checkMultisigSupport(api) {
  try {
    console.log('=== Checking Multisig Support ===');
    
    // 检查多重签名模块是否存在
    const hasMultisigModule = api.tx.multisig !== undefined;
    console.log('Multisig module available:', hasMultisigModule);
    
    if (hasMultisigModule) {
      // 检查可用的多重签名方法
      const methods = Object.keys(api.tx.multisig);
      console.log('Available multisig methods:', methods);
      
      // 检查常量配置
      const depositBase = api.consts.multisig?.depositBase;
      const depositFactor = api.consts.multisig?.depositFactor;
      
      if (depositBase && depositFactor) {
        console.log('Deposit base:', depositBase.toHuman());
        console.log('Deposit factor:', depositFactor.toHuman());
      }
      
      return true;
    } else {
      console.log('❌ Multisig module not available on this network');
      return false;
    }
    
  } catch (error) {
    console.error('Error checking multisig support:', error);
    return false;
  }
}
```

### 检查网络类型

```javascript
async function checkNetworkType(api) {
  try {
    const [chain, nodeName, nodeVersion] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.system.name(),
      api.rpc.system.version()
    ]);
    
    console.log('=== Network Information ===');
    console.log('Chain:', chain.toString());
    console.log('Node:', nodeName.toString());
    console.log('Version:', nodeVersion.toString());
    
    // 检查是否为测试网络
    const isTestnet = chain.toString().toLowerCase().includes('westend') || 
                     chain.toString().toLowerCase().includes('rococo');
    
    console.log('Is testnet:', isTestnet);
    
    return {
      chain: chain.toString(),
      isTestnet,
      nodeName: nodeName.toString(),
      nodeVersion: nodeVersion.toString()
    };
    
  } catch (error) {
    console.error('Error getting network information:', error);
    return null;
  }
}
```

## 权限配置

### 检查账户权限

```javascript
async function checkAccountPermissions(api, address) {
  try {
    console.log(`=== Checking Permissions for ${address} ===`);
    
    // 检查账户是否存在
    const accountInfo = await api.query.system.account(address);
    console.log('Account exists:', accountInfo.isSome);
    
    if (accountInfo.isSome) {
      const { nonce, data: balance } = accountInfo.unwrap();
      console.log('Nonce:', nonce.toNumber());
      console.log('Free balance:', balance.free.toHuman());
      console.log('Reserved balance:', balance.reserved.toHuman());
      
      // 检查是否有足够的余额进行多重签名操作
      const hasEnoughBalance = balance.free.gt(0);
      console.log('Has sufficient balance:', hasEnoughBalance);
      
      return {
        exists: true,
        nonce: nonce.toNumber(),
        balance: balance.free,
        hasEnoughBalance
      };
    } else {
      console.log('❌ Account does not exist');
      return { exists: false };
    }
    
  } catch (error) {
    console.error('Error checking account permissions:', error);
    return null;
  }
}
```

### 验证签名者身份

```javascript
async function validateSignatories(api, signatories) {
  try {
    console.log('=== Validating Signatories ===');
    
    const validationResults = [];
    
    for (const signatory of signatories) {
      const accountInfo = await api.query.system.account(signatory);
      const exists = accountInfo.isSome;
      
      if (exists) {
        const { data: balance } = accountInfo.unwrap();
        const hasBalance = balance.free.gt(0);
        
        validationResults.push({
          address: signatory,
          exists: true,
          hasBalance,
          balance: balance.free.toHuman()
        });
        
        console.log(`✅ ${signatory}: Valid (Balance: ${balance.free.toHuman()})`);
      } else {
        validationResults.push({
          address: signatory,
          exists: false,
          hasBalance: false,
          balance: '0'
        });
        
        console.log(`❌ ${signatory}: Invalid (Account does not exist)`);
      }
    }
    
    const allValid = validationResults.every(result => result.exists && result.hasBalance);
    console.log('All signatories valid:', allValid);
    
    return {
      results: validationResults,
      allValid
    };
    
  } catch (error) {
    console.error('Error validating signatories:', error);
    return null;
  }
}
```

## 费用配置

### 计算多重签名费用

```javascript
async function calculateMultisigFees(api, signatoryCount) {
  try {
    console.log('=== Calculating Multisig Fees ===');
    
    // 获取费用常量
    const depositBase = api.consts.multisig.depositBase;
    const depositFactor = api.consts.multisig.depositFactor;
    
    // 计算总费用
    const totalDeposit = depositBase.add(depositFactor.muln(signatoryCount));
    
    console.log('Deposit base:', depositBase.toHuman());
    console.log('Deposit factor per signatory:', depositFactor.toHuman());
    console.log('Number of signatories:', signatoryCount);
    console.log('Total deposit required:', totalDeposit.toHuman());
    
    // 估算交易费用
    const estimatedTxFee = depositFactor.muln(2); // 粗略估算
    console.log('Estimated transaction fee:', estimatedTxFee.toHuman());
    
    return {
      depositBase: depositBase.toHuman(),
      depositFactor: depositFactor.toHuman(),
      totalDeposit: totalDeposit.toHuman(),
      estimatedTxFee: estimatedTxFee.toHuman()
    };
    
  } catch (error) {
    console.error('Error calculating multisig fees:', error);
    return null;
  }
}
```

### 检查费用支付能力

```javascript
async function checkFeePaymentAbility(api, signatories, fees) {
  try {
    console.log('=== Checking Fee Payment Ability ===');
    
    const paymentChecks = [];
    
    for (const signatory of signatories) {
      const accountInfo = await api.query.system.account(signatory);
      
      if (accountInfo.isSome) {
        const { data: balance } = accountInfo.unwrap();
        const canPayDeposit = balance.free.gte(fees.totalDeposit);
        const canPayTxFee = balance.free.gte(fees.estimatedTxFee);
        
        paymentChecks.push({
          address: signatory,
          balance: balance.free.toHuman(),
          canPayDeposit,
          canPayTxFee,
          canParticipate: canPayDeposit && canPayTxFee
        });
        
        console.log(`${signatory}: Balance ${balance.free.toHuman()}, Can participate: ${canPayDeposit && canPayTxFee}`);
      }
    }
    
    const allCanPay = paymentChecks.every(check => check.canParticipate);
    console.log('All signatories can pay fees:', allCanPay);
    
    return {
      checks: paymentChecks,
      allCanPay
    };
    
  } catch (error) {
    console.error('Error checking fee payment ability:', error);
    return null;
  }
}
```

## 类型定义配置

### 检查类型支持

```javascript
async function checkTypeSupport(api) {
  try {
    console.log('=== Checking Type Support ===');
    
    // 检查基本类型
    const hasExtrinsic = api.createType('Extrinsic') !== undefined;
    const hasSignerPayload = api.createType('SignerPayload') !== undefined;
    const hasExtrinsicPayload = api.createType('ExtrinsicPayload') !== undefined;
    
    console.log('Extrinsic type support:', hasExtrinsic);
    console.log('SignerPayload type support:', hasSignerPayload);
    console.log('ExtrinsicPayload type support:', hasExtrinsicPayload);
    
    // 检查多重签名特定类型
    const hasMultisigTypes = api.registry.metadata.asLatest.pallets.some(
      pallet => pallet.name.toString() === 'Multisig'
    );
    
    console.log('Multisig metadata support:', hasMultisigTypes);
    
    return {
      hasExtrinsic,
      hasSignerPayload,
      hasExtrinsicPayload,
      hasMultisigTypes
    };
    
  } catch (error) {
    console.error('Error checking type support:', error);
    return null;
  }
}
```

### 自定义类型支持

```javascript
async function setupCustomTypes(api, customTypes) {
  try {
    console.log('=== Setting Up Custom Types ===');
    
    if (customTypes && Object.keys(customTypes).length > 0) {
      // 创建带有自定义类型的 API
      const apiWithTypes = await ApiPromise.create({
        provider: api.provider,
        types: customTypes
      });
      
      console.log('Custom types loaded successfully');
      return apiWithTypes;
    } else {
      console.log('No custom types provided, using default types');
      return api;
    }
    
  } catch (error) {
    console.error('Error setting up custom types:', error);
    return api; // 回退到原始 API
  }
}
```

## 完整启用检查

```javascript
async function enableMultisigComprehensive(api, signatories, threshold) {
  try {
    console.log('=== Comprehensive Multisig Enablement Check ===\n');
    
    // 1. 检查网络支持
    const networkSupport = await checkMultisigSupport(api);
    if (!networkSupport) {
      throw new Error('Network does not support multisig');
    }
    
    // 2. 检查网络类型
    const networkInfo = await checkNetworkType(api);
    console.log('Network check completed\n');
    
    // 3. 验证签名者
    const signatoryValidation = await validateSignatories(api, signatories);
    if (!signatoryValidation.allValid) {
      throw new Error('Some signatories are invalid');
    }
    console.log('Signatory validation completed\n');
    
    // 4. 计算费用
    const fees = await calculateMultisigFees(api, signatories.length);
    console.log('Fee calculation completed\n');
    
    // 5. 检查费用支付能力
    const paymentAbility = await checkFeePaymentAbility(api, signatories, fees);
    if (!paymentAbility.allCanPay) {
      throw new Error('Some signatories cannot pay required fees');
    }
    console.log('Payment ability check completed\n');
    
    // 6. 检查类型支持
    const typeSupport = await checkTypeSupport(api);
    console.log('Type support check completed\n');
    
    // 7. 创建多重签名账户
    const { createKeyMulti, encodeAddress, sortAddresses } = require('@polkadot/util-crypto');
    
    const sortedSignatories = sortAddresses(signatories);
    const multiAddress = createKeyMulti(sortedSignatories, threshold);
    const multisigAddress = encodeAddress(multiAddress, 42);
    
    console.log('=== Multisig Account Created ===');
    console.log('Address:', multisigAddress);
    console.log('Threshold:', threshold);
    console.log('Signatories:', sortedSignatories);
    console.log('Total deposit required:', fees.totalDeposit);
    
    return {
      address: multisigAddress,
      threshold,
      signatories: sortedSignatories,
      fees,
      networkInfo,
      typeSupport,
      enabled: true
    };
    
  } catch (error) {
    console.error('❌ Multisig enablement failed:', error.message);
    return {
      enabled: false,
      error: error.message
    };
  }
}
```

## 使用示例

```javascript
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');

async function multisigEnablementExample() {
  // 连接到网络
  const wsProvider = new WsProvider('wss://westend-rpc.polkadot.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  try {
    // 等待网络就绪
    await api.isReady;
    
    // 创建测试账户
    const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//Bob');
    const charlie = keyring.addFromUri('//Charlie');
    
    const signatories = [alice.address, bob.address, charlie.address];
    const threshold = 2;
    
    console.log('Test accounts created');
    console.log('Signatories:', signatories);
    console.log('Threshold:', threshold);
    console.log('');
    
    // 执行完整的启用检查
    const result = await enableMultisigComprehensive(api, signatories, threshold);
    
    if (result.enabled) {
      console.log('\n✅ Multisig successfully enabled!');
      console.log('You can now use the multisig account for transactions.');
    } else {
      console.log('\n❌ Multisig enablement failed');
      console.log('Error:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await api.disconnect();
  }
}

// 运行示例
multisigEnablementExample().catch(console.error);
```

## 最佳实践

1. **网络验证**: 始终验证目标网络支持多重签名
2. **权限检查**: 确保所有签名者都有正确的权限
3. **费用计算**: 准确计算所需的费用和押金
4. **类型支持**: 确保正确的类型定义支持
5. **错误处理**: 处理所有可能的启用失败情况

## 常见问题

### Q: 如何知道网络是否支持多重签名？
A: 使用 `checkMultisigSupport` 函数检查多重签名模块的可用性。

### Q: 多重签名需要多少费用？
A: 费用包括基础押金和每个签名者的因子费用，使用 `calculateMultisigFees` 计算。

### Q: 可以更改多重签名配置吗？
A: 不可以，需要创建新的多重签名账户来更改配置。

### Q: 多重签名支持哪些网络？
A: 支持 Polkadot、Kusama、Westend、Clover 等主要网络。
