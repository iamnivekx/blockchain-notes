---
id: enable
title: 多重签名启用
sidebar_label: 多重签名启用
description: Ripple 多重签名功能启用的完整指南
---

# Ripple 多重签名启用

多重签名功能启用是配置账户支持多重签名的关键步骤，需要谨慎操作以确保安全性。

## 🚀 快速开始

### 环境准备

```bash
npm install ripple-lib
```

### 基本设置

```javascript
const RippleAPI = require('ripple-lib').RippleAPI;

// 创建 API 实例
const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net/', // 测试网
  // server: 'wss://s1.ripple.com/', // 主网
});
```

## 📝 多重签名启用流程

### 1. 连接网络

```javascript
async function connectToNetwork() {
  try {
    await api.connect();
    console.log('Connected to Ripple network');
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
```

### 2. 验证账户状态

```javascript
async function verifyAccountStatus(address) {
  try {
    const account = await api.getAccountInfo(address);
    
    // 检查账户是否已激活
    if (!account.xrpBalance || parseFloat(account.xrpBalance) < 20) {
      throw new Error('Account must have at least 20 XRP to enable multisig');
    }
    
    // 检查是否已启用多重签名
    if (account.signers) {
      console.log('Multisig already enabled for this account');
      return { enabled: true, signers: account.signers };
    }
    
    console.log('Account ready for multisig setup');
    return { enabled: false, balance: account.xrpBalance };
  } catch (error) {
    console.error('Failed to verify account status:', error);
  }
}
```

### 3. 准备启用交易

```javascript
async function prepareEnableMultisig(accountAddress, signerEntries, quorum) {
  try {
    const preparedTx = await api.prepareTransaction(
      {
        Flags: 0,
        TransactionType: 'SignerListSet',
        Account: accountAddress,
        Fee: '10000',
        SignerQuorum: quorum,
        SignerEntries: signerEntries,
      }
    );
    
    console.log('Enable multisig transaction prepared:', preparedTx);
    return preparedTx;
  } catch (error) {
    console.error('Failed to prepare enable multisig transaction:', error);
  }
}
```

### 4. 签名和提交启用交易

```javascript
async function signAndSubmitEnable(preparedTx, secret) {
  try {
    // 签名交易
    const signed = api.sign(preparedTx.txJSON, secret);
    console.log('Enable multisig transaction signed');
    console.log('Transaction ID:', signed.id);
    
    // 提交交易
    const result = await api.submit(signed.signedTransaction);
    console.log('Enable multisig transaction submitted');
    console.log('Result code:', result.resultCode);
    console.log('Result message:', result.resultMessage);
    
    return result;
  } catch (error) {
    console.error('Failed to sign and submit enable transaction:', error);
  }
}
```

## 🔄 完整启用示例

### 基本多重签名启用

```javascript
const account_address = 'rfXgErjK96k59evDnC22zX7vRo2hYaSiqc';
const secret = 'ssHAaRfvdDsF62da3dpDHgxHSnw4d';

async function enableMultisig() {
  try {
    // 1. 连接网络
    await api.connect();
    
    // 2. 验证账户状态
    const accountStatus = await verifyAccountStatus(account_address);
    if (accountStatus.enabled) {
      console.log('Multisig already enabled');
      await api.disconnect();
      return accountStatus;
    }
    
    // 3. 定义签名者列表
    const signerEntries = [
      {
        SignerEntry: {
          Account: 'r3Q3D8nsyu2nJKFsagHfYdMp8H1VEHd3ps',
          SignerWeight: 2, // 权重为 2
        },
      },
      {
        SignerEntry: {
          Account: 'rhiWpgj8ai3QxegWAe3ZpHk6iionnbtAz1',
          SignerWeight: 1, // 权重为 1
        },
      },
      {
        SignerEntry: {
          Account: 'r3DtjVnBbAf63zryETCjx8NG2j3ewNcJ9g',
          SignerWeight: 1, // 权重为 1
        },
      },
    ];
    
    // 4. 准备启用交易
    const preparedTx = await prepareEnableMultisig(
      account_address,
      signerEntries,
      3 // 需要总权重 3 才能执行交易
    );
    
    // 5. 签名和提交
    const result = await signAndSubmitEnable(preparedTx, secret);
    
    // 6. 验证启用结果
    if (result.resultCode === 'tesSUCCESS') {
      console.log('Multisig successfully enabled!');
      
      // 等待几个账本确认
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 验证启用状态
      const finalStatus = await verifyAccountStatus(account_address);
      console.log('Final multisig status:', finalStatus);
    }
    
    // 7. 断开连接
    await api.disconnect();
    
    return result;
  } catch (error) {
    console.error('Enable multisig failed:', error);
    await api.disconnect();
  }
}
```

## ⚙️ 高级启用配置

### 动态配置管理

```javascript
class MultisigEnableManager {
  constructor(accountAddress, api) {
    this.accountAddress = accountAddress;
    this.api = api;
    this.configurations = new Map();
  }
  
  // 添加启用配置
  addConfiguration(name, config) {
    this.configurations.set(name, {
      ...config,
      createdAt: new Date(),
      status: 'pending',
    });
  }
  
  // 验证配置
  validateConfiguration(config) {
    const errors = [];
    
    // 验证签名者数量
    if (!config.signerEntries || config.signerEntries.length < 1) {
      errors.push('At least one signer is required');
    }
    
    if (config.signerEntries && config.signerEntries.length > 8) {
      errors.push('Maximum 8 signers allowed');
    }
    
    // 验证权重
    let totalWeight = 0;
    for (const entry of config.signerEntries || []) {
      const weight = entry.SignerEntry.SignerWeight;
      if (weight < 1 || weight > 65535) {
        errors.push(`Invalid weight: ${weight}`);
      }
      totalWeight += weight;
    }
    
    // 验证阈值
    if (config.quorum < 1 || config.quorum > totalWeight) {
      errors.push(`Invalid quorum: ${config.quorum}`);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      totalWeight: totalWeight,
    };
  }
  
  // 生成启用交易
  async generateEnableTransaction(configName) {
    const config = this.configurations.get(configName);
    if (!config) {
      throw new Error(`Configuration ${configName} not found`);
    }
    
    const validation = this.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }
    
    try {
      const preparedTx = await this.api.prepareTransaction(
        {
          Flags: 0,
          TransactionType: 'SignerListSet',
          Account: this.accountAddress,
          Fee: config.fee || '10000',
          SignerQuorum: config.quorum,
          SignerEntries: config.signerEntries,
        }
      );
      
      config.preparedTx = preparedTx;
      config.status = 'prepared';
      
      return preparedTx;
    } catch (error) {
      config.status = 'failed';
      config.error = error.message;
      throw error;
    }
  }
  
  // 执行启用
  async executeEnable(configName, secret) {
    const config = this.configurations.get(configName);
    if (!config || config.status !== 'prepared') {
      throw new Error(`Configuration ${configName} not ready for execution`);
    }
    
    try {
      const signed = this.api.sign(config.preparedTx.txJSON, secret);
      const result = await this.api.submit(signed.signedTransaction);
      
      if (result.resultCode === 'tesSUCCESS') {
        config.status = 'enabled';
        config.result = result;
        config.enabledAt = new Date();
      } else {
        config.status = 'failed';
        config.error = result.resultMessage;
      }
      
      return result;
    } catch (error) {
      config.status = 'failed';
      config.error = error.message;
      throw error;
    }
  }
}
```

### 预设配置模板

```javascript
function getPresetConfigurations() {
  return {
    // 2-of-3 配置
    '2-of-3': {
      name: '2-of-3 Multisig',
      description: '需要任意2个签名者签名',
      signerEntries: [
        { SignerEntry: { Account: 'signer1', SignerWeight: 1 } },
        { SignerEntry: { Account: 'signer2', SignerWeight: 1 } },
        { SignerEntry: { Account: 'signer3', SignerWeight: 1 } },
      ],
      quorum: 2,
      fee: '10000',
    },
    
    // 3-of-5 配置
    '3-of-5': {
      name: '3-of-5 Multisig',
      description: '需要任意3个签名者签名',
      signerEntries: [
        { SignerEntry: { Account: 'signer1', SignerWeight: 1 } },
        { SignerEntry: { Account: 'signer2', SignerWeight: 1 } },
        { SignerEntry: { Account: 'signer3', SignerWeight: 1 } },
        { SignerEntry: { Account: 'signer4', SignerWeight: 1 } },
        { SignerEntry: { Account: 'signer5', SignerWeight: 1 } },
      ],
      quorum: 3,
      fee: '12000',
    },
    
    // 加权配置
    'weighted': {
      name: 'Weighted Multisig',
      description: '基于权重的多重签名',
      signerEntries: [
        { SignerEntry: { Account: 'admin', SignerWeight: 3 } },
        { SignerEntry: { Account: 'manager', SignerWeight: 2 } },
        { SignerEntry: { Account: 'user', SignerWeight: 1 } },
      ],
      quorum: 4,
      fee: '15000',
    },
    
    // 企业配置
    'enterprise': {
      name: 'Enterprise Multisig',
      description: '企业级多重签名配置',
      signerEntries: [
        { SignerEntry: { Account: 'ceo', SignerWeight: 5 } },
        { SignerEntry: { Account: 'cfo', SignerWeight: 4 } },
        { SignerEntry: { Account: 'cto', SignerWeight: 3 } },
        { SignerEntry: { Account: 'manager1', SignerWeight: 2 } },
        { SignerEntry: { Account: 'manager2', SignerWeight: 2 } },
        { SignerEntry: { Account: 'auditor', SignerWeight: 1 } },
      ],
      quorum: 8,
      fee: '20000',
    },
  };
}
```

## 📚 最佳实践

1. **充分测试**: 在测试网上充分测试多重签名配置
2. **安全配置**: 使用合理的权重分配和阈值设置
3. **备份策略**: 备份所有签名者的私钥和配置信息
4. **渐进启用**: 从小额交易开始测试多重签名功能
5. **监控审计**: 实现完整的启用过程监控和审计
6. **定期审查**: 定期审查和更新多重签名配置

## 📚 相关资源

- [Ripple 多重签名启用指南](https://xrpl.org/docs/tutorials/manage-account-settings/multi-signing/)
- [SignerListSet 交易](https://xrpl.org/docs/references/protocol/transactions/signerlistset/)
- [多重签名安全](https://xrpl.org/docs/tutorials/manage-account-security/)
- [账户配置](https://xrpl.org/docs/tutorials/manage-account-settings/)
