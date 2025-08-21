# 交易构建与签名

Polkadot 交易（Transaction）是网络操作的基本单位，包括转账、智能合约调用、治理投票等。本指南将介绍如何构建、签名和提交交易。

## 交易概述

Polkadot 交易也称为外部交易（Extrinsic），具有以下特点：

- 需要账户签名
- 包含 nonce 和费用信息
- 支持多种操作类型
- 具有权重限制

## 连接网络

### 创建 API 实例

```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');

async function connectToNetwork() {
  // 连接到 clover 网络
  const wsProvider = new WsProvider('wss://api.clover.finance');
  
  // 创建 API 实例
  const api = await ApiPromise.create({ provider: wsProvider });
  
  console.log('Connected to network');
  return api;
}
```

### 等待网络就绪

```javascript
const api = await connectToNetwork();

// 等待网络就绪
await api.isReady;

// 获取网络信息
const [chain, nodeName, nodeVersion] = await Promise.all([
  api.rpc.system.chain(),
  api.rpc.system.name(),
  api.rpc.system.version()
]);

console.log(`Connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
```

## 基本转账交易

### 构建转账交易

```javascript
const { Keyring } = require('@polkadot/keyring');
const { formatBalance } = require('@polkadot/util');

async function createTransfer(api, from, to, amount) {
  // 设置余额显示格式
  formatBalance.setDefaults({
    unit: 'CLV',  // Westend 测试网代币
    decimals: 12
  });

  // 构建转账调用
  const transfer = api.tx.balances.transfer(to, amount);
  
  console.log(`Transfer ${formatBalance(amount)} from ${from} to ${to}`);
  
  return transfer;
}
```

### 签名并发送交易

```javascript
async function signAndSend(api, transfer, signer) {
  try {
    // 签名并发送交易
    const txHash = await transfer.signAndSend(signer, ({ status, events }) => {
      if (status.isInBlock) {
        console.log(`Transaction included in block ${status.asInBlock}`);
      } else if (status.isFinalized) {
        console.log(`Transaction finalized in block ${status.asFinalized}`);
        
        // 处理事件
        events.forEach(({ event: { data, method, section } }) => {
          console.log(`${section}.${method}:`, data.toString());
        });
      }
    });
    
    console.log(`Transaction hash: ${txHash}`);
    return txHash;
    
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}
```

## 交易参数

### 获取账户信息

```javascript
async function getAccountInfo(api, address) {
  // 获取账户信息
  const { nonce, data: balance } = await api.query.system.account(address);
  
  console.log(`Account: ${address}`);
  console.log(`Nonce: ${nonce}`);
  console.log(`Free balance: ${formatBalance(balance.free)}`);
  console.log(`Reserved balance: ${formatBalance(balance.reserved)}`);
  console.log(`Frozen balance: ${formatBalance(balance.frozen)}`);
  
  return { nonce, balance };
}
```

### 设置交易参数

```javascript
async function setTransactionParams(api, transfer, signer) {
  // 获取当前 nonce
  const { nonce } = await api.query.system.account(signer.address);
  
  // 设置交易参数
  const tx = transfer.sign(signer, {
    nonce: nonce,
    tip: 0,  // 小费
    era: 0   // 交易有效期
  });
  
  return tx;
}
```

## 高级交易功能

### 批量交易

```javascript
async function createBatchTransfer(api, from, recipients, amounts) {
  // 创建批量转账调用
  const calls = recipients.map((recipient, index) => 
    api.tx.balances.transfer(recipient, amounts[index])
  );
  
  // 构建批量交易
  const batch = api.tx.utility.batch(calls);
  
  console.log(`Batch transfer to ${recipients.length} recipients`);
  return batch;
}
```

### 条件交易

```javascript
async function createConditionalTransfer(api, from, to, amount, condition) {
  // 创建条件转账
  const transfer = api.tx.balances.transfer(to, amount);
  
  // 添加条件
  const conditional = api.tx.utility.if(condition, transfer);
  
  return conditional;
}
```

## 交易状态监控

### 监听交易状态

```javascript
async function monitorTransaction(api, txHash) {
  console.log(`Monitoring transaction: ${txHash}`);
  
  // 获取交易状态
  const status = await api.rpc.author.pendingExtrinsics();
  console.log('Pending extrinsics:', status.length);
  
  // 监听区块事件
  await api.rpc.chain.subscribeNewHeads((header) => {
    console.log(`New block: ${header.number}`);
  });
}
```

### 获取交易详情

```javascript
async function getTransactionDetails(api, txHash) {
  try {
    // 获取交易信息
    const tx = await api.rpc.author.pendingExtrinsics();
    
    // 查找特定交易
    const targetTx = tx.find(t => t.hash.eq(txHash));
    
    if (targetTx) {
      console.log('Transaction found in pending extrinsics');
      console.log('Method:', targetTx.method.toHuman());
      console.log('Signer:', targetTx.signer.toString());
    } else {
      console.log('Transaction not found in pending extrinsics');
    }
    
  } catch (error) {
    console.error('Error getting transaction details:', error);
  }
}
```

## 完整示例

```javascript
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { formatBalance } = require('@polkadot/util');

async function transferExample() {
  // 连接到网络
  const wsProvider = new WsProvider('wss://api.clover.finance');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  // 等待网络就绪
  await api.isReady;
  
  // 设置余额格式
  formatBalance.setDefaults({
    unit: 'CLV',
    decimals: 12
  });
  
  // 创建密钥环
  const keyring = new Keyring({ ss58Format: 42, type: 'sr25519' });
  const alice = keyring.addFromUri('//Alice');
  const bob = keyring.addFromUri('//Bob');
  
  console.log('Alice address:', alice.address);
  console.log('Bob address:', bob.address);
  
  // 获取账户信息
  const aliceInfo = await api.query.system.account(alice.address);
  console.log('Alice balance:', formatBalance(aliceInfo.data.free));
  
  // 创建转账交易
  const amount = 1000000000000; // 1 WND
  const transfer = api.tx.balances.transfer(bob.address, amount);
  
  console.log(`Transferring ${formatBalance(amount)} from Alice to Bob`);
  
  // 签名并发送交易
  const txHash = await transfer.signAndSend(alice, ({ status, events }) => {
    if (status.isInBlock) {
      console.log(`Transaction included in block ${status.asInBlock}`);
    } else if (status.isFinalized) {
      console.log(`Transaction finalized in block ${status.asFinalized}`);
      
      events.forEach(({ event: { data, method, section } }) => {
        if (section === 'balances' && method === 'Transfer') {
          console.log(`Transfer event: ${data.toString()}`);
        }
      });
    }
  });
  
  console.log(`Transaction hash: ${txHash}`);
  
  // 等待交易确认
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 检查新余额
  const newAliceInfo = await api.query.system.account(alice.address);
  const bobInfo = await api.query.system.account(bob.address);
  
  console.log('New Alice balance:', formatBalance(newAliceInfo.data.free));
  console.log('New Bob balance:', formatBalance(bobInfo.data.free));
  
  // 断开连接
  await api.disconnect();
}

transferExample().catch(console.error);
```

## 最佳实践

1. **错误处理**: 始终处理交易失败的情况
2. **状态监控**: 监控交易状态直到最终确认
3. **费用估算**: 考虑网络费用和权重限制
4. **nonce 管理**: 正确管理账户 nonce
5. **网络选择**: 在测试网上测试后再在主网使用

## 常见问题

### Q: 如何估算交易费用？
A: 使用 `api.tx.balances.transfer().paymentInfo()` 获取费用信息。

### Q: 交易失败怎么办？
A: 检查余额、nonce、网络状态和交易参数。

### Q: 如何提高交易成功率？
A: 设置合理的小费，在网络拥堵时避免发送交易。

### Q: 支持哪些交易类型？
A: 支持转账、智能合约调用、治理投票、质押等操作。
