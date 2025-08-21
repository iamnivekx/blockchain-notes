# 多重签名交易

Polkadot 多重签名交易需要多个签名者共同授权才能执行。本指南将详细介绍多重签名交易的完整流程，包括发起、批准和执行。

## 多重签名交易概述

多重签名交易具有以下特点：

- **多步骤流程**: 发起 → 批准 → 执行
- **阈值控制**: 需要达到指定数量的批准
- **时间点管理**: 使用时间点跟踪交易状态
- **费用分摊**: 所有签名者分担交易费用
- **支持多种操作**: 转账、质押、质押额外代币、提名等

## 交易流程概览

```mermaid
graph TD
发起者 → 创建交易 → 等待批准
    ↓
其他签名者 → 批准交易 → 达到阈值
    ↓
任何签名者 → 执行交易 → 完成
```

## 发起多重签名交易

### 基本发起流程

```javascript
async function initiateMultisigTransaction(api, multisig, call, proposer) {
  try {
    console.log('=== Initiating Multisig Transaction ===');
    
    // 1. 获取多重签名信息
    const info = await api.query.multisig.multisigs(multisig.address, call.method.hash);
    
    // 2. 设置时间点（首次批准为 null）
    const timepoint = info.isSome ? info.unwrap().when : null;
    
    // 3. 准备其他签名者列表（不包括发起者）
    const otherSignatories = multisig.signatories
      .filter(addr => addr !== proposer.address)
      .sort();
    
    console.log('Transaction call hash:', call.method.hash);
    console.log('Timepoint:', timepoint);
    console.log('Other signatories:', otherSignatories);
    
    // 4. 发起多重签名交易
    const txHash = await api.tx.multisig
      .approveAsMulti(
        multisig.threshold,
        otherSignatories,
        timepoint,
        call.method.hash,
        api.consts.system.maximumBlockWeight
      )
      .signAndSend(proposer, ({ status, events }) => {
        if (status.isInBlock) {
          console.log(`Transaction included in block ${status.asInBlock}`);
        } else if (status.isFinalized) {
          console.log(`Transaction finalized in block ${status.asFinalized}`);
          
          // 处理事件
          events.forEach(({ event: { data, method, section } }) => {
            if (section === 'multisig') {
              console.log(`Multisig event: ${method}`, data.toString());
            }
          });
        }
      });
    
    console.log('✅ Multisig transaction initiated successfully');
    console.log('Transaction hash:', txHash);
    
    return txHash;
    
  } catch (error) {
    console.error('❌ Failed to initiate multisig transaction:', error);
    throw error;
  }
}
```

### 创建交易调用

```javascript
async function createTransactionCall(api, type, params) {
  let call;
  
  switch (type) {
    case 'transfer':
      call = api.tx.balances.transfer(params.to, params.amount);
      break;
      
    case 'stake':
      call = api.tx.staking.bond(params.controller, params.amount, params.payee);
      break;
      
    case 'bondExtra':
      call = api.tx.staking.bondExtra(params.amount);
      break;
      
    case 'unstake':
      call = api.tx.staking.unbond(params.amount);
      break;
      
    case 'vote':
      call = api.tx.democracy.vote(params.refIndex, params.vote);
      break;
      
    default:
      throw new Error(`Unsupported transaction type: ${type}`);
  }
  
  console.log(`Created ${type} call:`, call.method.toHuman());
  console.log('Call hash:', call.method.hash);
  
  return call;
}

### 质押额外代币多重签名

对于质押额外代币操作，需要特别注意调用格式：

```javascript
// 创建质押额外代币调用
const call = api.tx.staking.bondExtra(amount);

// approveAsMulti 使用 call.method.hash
const callHash = call.method.hash;

// asMulti 使用 call.method.toHex()
const callHex = call.method.toHex();
```

详细实现请参考 [质押额外代币多重签名](./bond_extra.md)。

### 质押和提名验证人多重签名

对于质押和提名验证人的组合操作，使用批量交易：

```javascript
// 创建质押和提名调用
const transactions = [
  api.tx.staking.bond(MULTISIG, amount, 'Staked'),
  api.tx.staking.nominate(targets),
];

// 使用 utility.batch 打包
const call = api.tx.utility.batch(transactions);

// 注意：执行时权重需要乘以2
const weight = MAX_WEIGHT * 2;
```

详细实现请参考 [质押和提名验证人多重签名](./bond_nominate.md)。

### 提名验证人多重签名

对于单独的提名验证人操作：

```javascript
// 创建提名验证人调用
const call = api.tx.staking.nominate(targets);

// approveAsMulti 使用 call.method.hash
const callHash = call.method.hash;

// asMulti 使用 call.method.toHex()
const callHex = call.method.toHex();
```

详细实现请参考 [提名验证人多重签名](./nominate.md)。

```javascript
// 使用示例
const transferCall = await createTransactionCall(api, 'transfer', {
  to: '5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtSjDnVK9Fn9dZ',
  amount: 1000000000000 // 1 WND
});
```

## 批准多重签名交易

### 批准流程

```javascript
async function approveMultisigTransaction(api, multisig, call, approver) {
  try {
    console.log('=== Approving Multisig Transaction ===');
    
    // 1. 获取多重签名信息
    const info = await api.query.multisig.multisigs(multisig.address, call.method.hash);
    
    if (info.isNone) {
      throw new Error('No pending multisig transaction found');
    }
    
    const multisigInfo = info.unwrap();
    const timepoint = multisigInfo.when;
    
    console.log('Found pending transaction');
    console.log('Timepoint:', timepoint.toHuman());
    console.log('Current approvals:', multisigInfo.approvals.map(addr => addr.toString()));
    
    // 2. 检查是否已经批准
    if (multisigInfo.approvals.some(addr => addr.eq(approver.address))) {
      console.log('⚠️  Transaction already approved by this signatory');
      return null;
    }
    
    // 3. 准备其他签名者列表
    const otherSignatories = multisig.signatories
      .filter(addr => addr !== approver.address)
      .sort();
    
    // 4. 批准交易
    const txHash = await api.tx.multisig
      .approveAsMulti(
        multisig.threshold,
        otherSignatories,
        timepoint,
        call.method.hash,
        api.consts.system.maximumBlockWeight
      )
      .signAndSend(approver, ({ status, events }) => {
        if (status.isInBlock) {
          console.log(`Approval included in block ${status.asInBlock}`);
        } else if (status.isFinalized) {
          console.log(`Approval finalized in block ${status.asFinalized}`);
        }
      });
    
    console.log('✅ Multisig transaction approved successfully');
    console.log('Approval hash:', txHash);
    
    return txHash;
    
  } catch (error) {
    console.error('❌ Failed to approve multisig transaction:', error);
    throw error;
  }
}
```

### 检查批准状态

```javascript
async function checkApprovalStatus(api, multisigAddress, callHash) {
  try {
    const info = await api.query.multisig.multisigs(multisigAddress, callHash);
    
    if (info.isSome) {
      const multisigInfo = info.unwrap();
      
      const status = {
        timepoint: multisigInfo.when.toHuman(),
        deposit: multisigInfo.deposit.toHuman(),
        depositor: multisigInfo.depositor.toString(),
        approvals: multisigInfo.approvals.map(addr => addr.toString()),
        approvalCount: multisigInfo.approvals.length
      };
      
      console.log('=== Multisig Transaction Status ===');
      console.log('Timepoint:', status.timepoint);
      console.log('Deposit:', status.deposit);
      console.log('Depositor:', status.depositor);
      console.log('Approvals:', status.approvals);
      console.log('Approval count:', status.approvalCount);
      
      return status;
      
    } else {
      console.log('No pending multisig transaction found');
      return null;
    }
    
  } catch (error) {
    console.error('Failed to check approval status:', error);
    throw error;
  }
}
```

## 执行多重签名交易

### 执行流程

```javascript
async function executeMultisigTransaction(api, multisig, call, executor) {
  try {
    console.log('=== Executing Multisig Transaction ===');
    
    // 1. 获取多重签名信息
    const info = await api.query.multisig.multisigs(multisig.address, call.method.hash);
    
    if (info.isNone) {
      throw new Error('No pending multisig transaction found');
    }
    
    const multisigInfo = info.unwrap();
    const timepoint = multisigInfo.when;
    
    // 2. 检查是否达到阈值
    if (multisigInfo.approvals.length < multisig.threshold) {
      throw new Error(`Insufficient approvals: ${multisigInfo.approvals.length}/${multisig.threshold}`);
    }
    
    console.log('Threshold reached, executing transaction');
    console.log('Timepoint:', timepoint.toHuman());
    
    // 3. 准备其他签名者列表
    const otherSignatories = multisig.signatories
      .filter(addr => addr !== executor.address)
      .sort();
    
    // 4. 执行交易
    const txHash = await api.tx.multisig
      .asMulti(
        multisig.threshold,
        otherSignatories,
        timepoint,
        call.method.toHex(),
        false, // 不存储调用
        api.consts.system.maximumBlockWeight
      )
      .signAndSend(executor, ({ status, events }) => {
        if (status.isInBlock) {
          console.log(`Execution included in block ${status.asInBlock}`);
        } else if (status.isFinalized) {
          console.log(`Execution finalized in block ${status.asFinalized}`);
          
          // 处理执行事件
          events.forEach(({ event: { data, method, section } }) => {
            console.log(`Event: ${section}.${method}`, data.toString());
          });
        }
      });
    
    console.log('✅ Multisig transaction executed successfully');
    console.log('Execution hash:', txHash);
    
    return txHash;
    
  } catch (error) {
    console.error('❌ Failed to execute multisig transaction:', error);
    throw error;
  }
}
```

## 取消多重签名交易

### 取消流程

```javascript
async function cancelMultisigTransaction(api, multisig, call, canceller) {
  try {
    console.log('=== Cancelling Multisig Transaction ===');
    
    // 1. 获取多重签名信息
    const info = await api.query.multisig.multisigs(multisig.address, call.method.hash);
    
    if (info.isNone) {
      throw new Error('No pending multisig transaction found');
    }
    
    const multisigInfo = info.unwrap();
    const timepoint = multisigInfo.when;
    
    // 2. 准备其他签名者列表
    const otherSignatories = multisig.signatories
      .filter(addr => addr !== canceller.address)
      .sort();
    
    // 3. 取消交易
    const txHash = await api.tx.multisig
      .cancelAsMulti(
        multisig.threshold,
        otherSignatories,
        timepoint,
        call.method.hash
      )
      .signAndSend(canceller, ({ status }) => {
        if (status.isInBlock) {
          console.log(`Cancellation included in block ${status.asInBlock}`);
        } else if (status.isFinalized) {
          console.log(`Cancellation finalized in block ${status.asFinalized}`);
        }
      });
    
    console.log('✅ Multisig transaction cancelled successfully');
    console.log('Cancellation hash:', txHash);
    
    return txHash;
    
  } catch (error) {
    console.error('❌ Failed to cancel multisig transaction:', error);
    throw error;
  }
}
```

## 完整示例

```javascript
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { createKeyMulti, encodeAddress, sortAddresses } = require('@polkadot/util-crypto');
const { formatBalance } = require('@polkadot/util');

async function completeMultisigExample() {
  // 连接到网络
  const wsProvider = new WsProvider('wss://westend-rpc.polkadot.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  // 设置余额格式
  formatBalance.setDefaults({
    unit: 'WND',
    decimals: 12
  });
  
  try {
    // 等待网络就绪
    await api.isReady;
    
    // 创建密钥环
    const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });
    
    // 创建测试账户
    const alice = keyring.addFromUri('//Alice');
    const bob = keyring.addFromUri('//Bob');
    const charlie = keyring.addFromUri('//Charlie');
    
    console.log('Test accounts created:');
    console.log('Alice:', alice.address);
    console.log('Bob:', bob.address);
    console.log('Charlie:', charlie.address);
    
    // 创建多重签名账户
    const signatories = [alice.address, bob.address, charlie.address];
    const threshold = 2;
    
    const sortedSignatories = sortAddresses(signatories);
    const multiAddress = createKeyMulti(sortedSignatories, threshold);
    const multisigAddress = encodeAddress(multiAddress, 42);
    
    const multisig = {
      address: multisigAddress,
      threshold,
      signatories: sortedSignatories
    };
    
    console.log('\nMultisig account created:');
    console.log('Address:', multisig.address);
    console.log('Threshold:', multisig.threshold);
    console.log('Signatories:', multisig.signatories);
    
    // 创建转账调用
    const recipient = '5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtSjDnVK9Fn9dZ';
    const amount = 1000000000000; // 1 WND
    
    const call = api.tx.balances.transfer(recipient, amount);
    console.log('\nTransfer call created:', call.method.toHex());
    
    // 步骤 1: Alice 发起多重签名交易
    console.log('\n=== Step 1: Alice initiates the transaction ===');
    await initiateMultisigTransaction(api, multisig, call, alice);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 检查状态
    await checkApprovalStatus(api, multisig.address, call.method.hash);
    
    // 步骤 2: Bob 批准交易
    console.log('\n=== Step 2: Bob approves the transaction ===');
    await approveMultisigTransaction(api, multisig, call, bob);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 检查状态
    await checkApprovalStatus(api, multisig.address, call.method.hash);
    
    // 步骤 3: Charlie 执行交易
    console.log('\n=== Step 3: Charlie executes the transaction ===');
    await executeMultisigTransaction(api, multisig, call, charlie);
    
    // 等待执行确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 检查最终状态
    const finalStatus = await checkApprovalStatus(api, multisig.address, call.method.hash);
    console.log('\nFinal status:', finalStatus ? 'Completed' : 'No pending transaction');
    
  } catch (error) {
    console.error('Multisig example failed:', error);
  } finally {
    await api.disconnect();
  }
}

// 运行示例
completeMultisigExample().catch(console.error);
```

## 最佳实践

1. **状态监控**: 始终监控交易状态和批准进度
2. **错误处理**: 处理所有可能的错误情况
3. **时间管理**: 及时处理待确认的交易
4. **费用考虑**: 考虑多重签名操作的额外费用
5. **安全验证**: 验证所有签名者的身份

## 相关功能

除了基本的转账多重签名，Polkadot 还支持其他类型的多重签名操作：

- **[质押额外代币多重签名](./bond_extra.md)**: 使用多重签名账户增加质押数量
- **[质押和提名验证人多重签名](./bond_nominate.md)**: 同时进行质押和提名验证人的组合操作
- **[提名验证人多重签名](./nominate.md)**: 使用多重签名账户提名验证人
- **[多重签名账户创建](./account.md)**: 创建和管理多重签名账户
- **[多重签名启用](./enable.md)**: 启用和配置多重签名功能

## 常见问题

### Q: 多重签名交易有有效期吗？
A: 没有固定的有效期，但建议及时处理待确认的交易。

### Q: 可以部分执行多重签名交易吗？
A: 不可以，必须达到阈值才能执行。

### Q: 如何知道交易是否已经批准？
A: 使用 `checkApprovalStatus` 函数查询当前状态。

### Q: 多重签名交易失败怎么办？
A: 可以取消交易或重新发起，押金会退还给发起者。
