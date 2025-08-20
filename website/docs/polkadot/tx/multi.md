# 多重签名交易

Polkadot 多重签名（Multisig）允许多个账户共同控制一个账户，需要达到指定数量的签名才能执行交易。这提供了更高的安全性和去中心化控制。

## 多重签名概述

多重签名账户具有以下特点：

- 需要多个签名者共同授权
- 可以设置不同的阈值（threshold）
- 支持动态添加和移除签名者
- 提供更高的安全性

## 创建多重签名账户

### 基本创建

```javascript
const { createKeyMulti, encodeAddress, sortAddresses } = require('@polkadot/util-crypto');

function createMultisigAccount(signatories, threshold, ss58Format = 42) {
  // 对签名者地址进行排序
  const sortedSignatories = sortAddresses(signatories);
  
  // 创建多重签名账户
  const multiAddress = createKeyMulti(sortedSignatories, threshold);
  
  // 编码为 SS58 地址
  const ss58Address = encodeAddress(multiAddress, ss58Format);
  
  console.log('Multisig address:', ss58Address);
  console.log('Threshold:', threshold);
  console.log('Signatories:', sortedSignatories);
  
  return {
    address: ss58Address,
    threshold,
    signatories: sortedSignatories
  };
}
```

### 使用示例

```javascript
const { Keyring } = require('@polkadot/keyring');

async function createMultisigExample() {
  const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });
  
  // 创建测试账户
  const alice = keyring.addFromUri('//Alice');
  const bob = keyring.addFromUri('//Bob');
  const charlie = keyring.addFromUri('//Charlie');
  
  const signatories = [alice.address, bob.address, charlie.address];
  const threshold = 2;
  
  const multisig = createMultisigAccount(signatories, threshold);
  
  return multisig;
}
```

## 多重签名交易流程

### 1. 发起交易

```javascript
async function initiateMultisigTransaction(api, multisig, call, proposer) {
  try {
    // 获取多重签名信息
    const info = await api.query.multisig.multisigs(multisig.address, call.method.hash);
    
    // 设置时间点（首次批准为 null）
    const timepoint = info.isSome ? info.unwrap().when : null;
    
    // 其他签名者（不包括发起者）
    const otherSignatories = multisig.signatories
      .filter(addr => addr !== proposer.address)
      .sort();
    
    // 发起多重签名交易
    const txHash = await api.tx.multisig
      .approveAsMulti(
        multisig.threshold,
        otherSignatories,
        timepoint,
        call.method.hash,
        api.consts.system.maximumBlockWeight
      )
      .signAndSend(proposer);
    
    console.log('Multisig transaction initiated:', txHash);
    return txHash;
    
  } catch (error) {
    console.error('Failed to initiate multisig transaction:', error);
    throw error;
  }
}
```

### 2. 批准交易

```javascript
async function approveMultisigTransaction(api, multisig, call, approver) {
  try {
    // 获取多重签名信息
    const info = await api.query.multisig.multisigs(multisig.address, call.method.hash);
    
    if (info.isNone) {
      throw new Error('No pending multisig transaction found');
    }
    
    const multisigInfo = info.unwrap();
    const timepoint = multisigInfo.when;
    
    // 其他签名者（不包括当前批准者）
    const otherSignatories = multisig.signatories
      .filter(addr => addr !== approver.address)
      .sort();
    
    // 批准交易
    const txHash = await api.tx.multisig
      .approveAsMulti(
        multisig.threshold,
        otherSignatories,
        timepoint,
        call.method.hash,
        api.consts.system.maximumBlockWeight
      )
      .signAndSend(approver);
    
    console.log('Multisig transaction approved:', txHash);
    return txHash;
    
  } catch (error) {
    console.error('Failed to approve multisig transaction:', error);
    throw error;
  }
}
```

### 3. 执行交易

```javascript
async function executeMultisigTransaction(api, multisig, call, executor) {
  try {
    // 获取多重签名信息
    const info = await api.query.multisig.multisigs(multisig.address, call.method.hash);
    
    if (info.isNone) {
      throw new Error('No pending multisig transaction found');
    }
    
    const multisigInfo = info.unwrap();
    const timepoint = multisigInfo.when;
    
    // 其他签名者（不包括执行者）
    const otherSignatories = multisig.signatories
      .filter(addr => addr !== executor.address)
      .sort();
    
    // 执行交易
    const txHash = await api.tx.multisig
      .asMulti(
        multisig.threshold,
        otherSignatories,
        timepoint,
        call.method.toHex(),
        false, // 不存储调用
        api.consts.system.maximumBlockWeight
      )
      .signAndSend(executor);
    
    console.log('Multisig transaction executed:', txHash);
    return txHash;
    
  } catch (error) {
    console.error('Failed to execute multisig transaction:', error);
    throw error;
  }
}
```

## 多重签名管理

### 查询多重签名状态

```javascript
async function getMultisigStatus(api, multisigAddress, callHash) {
  try {
    const info = await api.query.multisig.multisigs(multisigAddress, callHash);
    
    if (info.isSome) {
      const multisigInfo = info.unwrap();
      console.log('Multisig status:', {
        when: multisigInfo.when.toHuman(),
        deposit: multisigInfo.deposit.toHuman(),
        depositor: multisigInfo.depositor.toString(),
        approvals: multisigInfo.approvals.map(addr => addr.toString())
      });
      
      return multisigInfo;
    } else {
      console.log('No pending multisig transaction');
      return null;
    }
    
  } catch (error) {
    console.error('Failed to get multisig status:', error);
    throw error;
  }
}
```

### 取消多重签名交易

```javascript
async function cancelMultisigTransaction(api, multisig, call, canceller) {
  try {
    // 获取多重签名信息
    const info = await api.query.multisig.multisigs(multisig.address, call.method.hash);
    
    if (info.isNone) {
      throw new Error('No pending multisig transaction found');
    }
    
    const multisigInfo = info.unwrap();
    const timepoint = multisigInfo.when;
    
    // 其他签名者（不包括取消者）
    const otherSignatories = multisig.signatories
      .filter(addr => addr !== canceller.address)
      .sort();
    
    // 取消交易
    const txHash = await api.tx.multisig
      .cancelAsMulti(
        multisig.threshold,
        otherSignatories,
        timepoint,
        call.method.hash
      )
      .signAndSend(canceller);
    
    console.log('Multisig transaction cancelled:', txHash);
    return txHash;
    
  } catch (error) {
    console.error('Failed to cancel multisig transaction:', error);
    throw error;
  }
}
```

## 完整示例

```javascript
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { createKeyMulti, encodeAddress, sortAddresses } = require('@polkadot/util-crypto');
const { formatBalance } = require('@polkadot/util');

async function multisigTransferExample() {
  // 连接到网络
  const wsProvider = new WsProvider('wss://westend-rpc.polkadot.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  // 设置余额格式
  formatBalance.setDefaults({
    unit: 'WND',
    decimals: 12
  });
  
  try {
    // 创建密钥环
    const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });
    
    // 创建测试账户
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//Bob');
    const charlie = keyring.addFromUri('//Charlie');
    
    console.log('Alice address:', alice.address);
    console.log('Bob address:', bob.address);
    console.log('Charlie address:', charlie.address);
    
    // 创建多重签名账户
    const signatories = [alice.address, bob.address, charlie.address];
    const threshold = 2;
    
    const sortedSignatories = sortAddresses(signatories);
    const multiAddress = createKeyMulti(sortedSignatories, threshold);
    const multisigAddress = encodeAddress(multiAddress, 42);
    
    console.log('\nMultisig account created:');
    console.log('Address:', multisigAddress);
    console.log('Threshold:', threshold);
    console.log('Signatories:', sortedSignatories);
    
    // 创建转账调用
    const recipient = '5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtSjDnVK9Fn9dZ';
    const amount = 1000000000000; // 1 WND
    
    const call = api.tx.balances.transfer(recipient, amount);
    console.log('\nTransfer call created:', call.method.toHex());
    
    // 步骤 1: Alice 发起多重签名交易
    console.log('\n=== Step 1: Alice initiates the transaction ===');
    const initiateTx = await api.tx.multisig
      .approveAsMulti(
        threshold,
        [bob.address, charlie.address].sort(),
        null, // 首次批准
        call.method.hash,
        api.consts.system.maximumBlockWeight
      )
      .signAndSend(alice);
    
    console.log('Initiation transaction hash:', initiateTx);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 2: Bob 批准交易
    console.log('\n=== Step 2: Bob approves the transaction ===');
    const info = await api.query.multisig.multisigs(multisigAddress, call.method.hash);
    
    if (info.isSome) {
      const multisigInfo = info.unwrap();
      const timepoint = multisigInfo.when;
      
      const approveTx = await api.tx.multisig
        .approveAsMulti(
          threshold,
          [alice.address, charlie.address].sort(),
          timepoint,
          call.method.hash,
          api.consts.system.maximumBlockWeight
        )
        .signAndSend(bob);
      
      console.log('Approval transaction hash:', approveTx);
      
      // 等待交易确认
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 步骤 3: 执行交易（任何签名者都可以执行）
      console.log('\n=== Step 3: Executing the transaction ===');
      const executeTx = await api.tx.multisig
        .asMulti(
          threshold,
          [alice.address, bob.address].sort(),
          timepoint,
          call.method.toHex(),
          false,
          api.consts.system.maximumBlockWeight
        )
        .signAndSend(charlie);
      
      console.log('Execution transaction hash:', executeTx);
      
      // 等待执行确认
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 检查最终状态
      const finalInfo = await api.query.multisig.multisigs(multisigAddress, call.method.hash);
      console.log('\nFinal multisig status:', finalInfo.isNone ? 'Completed' : 'Pending');
      
    } else {
      console.log('No pending multisig transaction found');
    }
    
  } catch (error) {
    console.error('Multisig example failed:', error);
  } finally {
    await api.disconnect();
  }
}

// 运行示例
multisigTransferExample().catch(console.error);
```

## 最佳实践

1. **阈值设置**: 设置合理的阈值，平衡安全性和便利性
2. **签名者管理**: 定期审查和更新签名者列表
3. **交易监控**: 监控所有待处理的多重签名交易
4. **错误处理**: 处理交易失败和取消的情况
5. **费用考虑**: 考虑多重签名操作的额外费用

## 常见问题

### Q: 多重签名账户可以有多少个签名者？
A: 理论上没有限制，但建议控制在合理范围内（如 3-10 个）。

### Q: 如何更改多重签名配置？
A: 需要创建新的多重签名账户，无法直接修改现有配置。

### Q: 多重签名交易有有效期吗？
A: 没有固定的有效期，但建议及时处理待确认的交易。

### Q: 可以部分执行多重签名交易吗？
A: 不可以，必须达到阈值才能执行。
