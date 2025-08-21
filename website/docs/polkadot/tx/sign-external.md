# 离线交易

Polkadot 离线交易允许在不直接连接网络的情况下创建和签名交易，然后在有网络连接时提交。这对于安全环境、冷钱包和批量交易非常有用。

## 离线交易概述

离线交易具有以下优势：

- 提高安全性（私钥不暴露在网络环境中）
- 支持批量交易准备
- 可以在离线环境中进行
- 减少网络依赖

## 基本离线交易流程

### 1. 创建交易调用

```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');

async function createOfflineCall(api, from, to, amount) {
  try {
    // 创建转账调用
    const call = api.tx.balances.transfer(to, amount);
    
    console.log('Call created:', call.method.toHex());
    console.log('Call hash:', call.method.hash);
    
    return call;
    
  } catch (error) {
    console.error('Failed to create call:', error);
    throw error;
  }
}
```

### 2. 创建签名载荷

```javascript
async function createSignerPayload(api, call, address, nonce) {
  try {
    // 创建签名载荷
    const signerPayload = api.createType('SignerPayload', {
      genesisHash: api.genesisHash,
      blockHash: api.genesisHash, // 使用创世块哈希作为占位符
      runtimeVersion: api.runtimeVersion,
      version: api.extrinsicVersion,
      address: address,
      method: call.method.toHex(),
      nonce: nonce,
      tip: 0,
      era: 0
    });
    
    console.log('Signer payload created');
    console.log('Payload data:', signerPayload.toPayload());
    
    return signerPayload;
    
  } catch (error) {
    console.error('Failed to create signer payload:', error);
    throw error;
  }
}
```

### 3. 离线签名

```javascript
const { Keyring } = require('@polkadot/keyring');

function signOfflineTransaction(signerPayload, signer) {
  try {
    // 创建 ExtrinsicPayload 并签名
    const { signature } = api.createType('ExtrinsicPayload', signerPayload.toPayload(), {
      version: api.extrinsicVersion
    }).sign(signer);
    
    console.log('Transaction signed offline');
    console.log('Signature:', signature);
    
    return signature;
    
  } catch (error) {
    console.error('Failed to sign transaction:', error);
    throw error;
  }
}
```

### 4. 构建完整交易

```javascript
function buildSignedTransaction(call, signature, signerPayload) {
  try {
    // 创建交易实例
    const extrinsic = api.createType('Extrinsic', call);
    
    // 添加签名
    extrinsic.addSignature(
      signerPayload.address,
      signature,
      signerPayload.toPayload()
    );
    
    console.log('Signed transaction built');
    console.log('Transaction hex:', extrinsic.toHex());
    
    return extrinsic;
    
  } catch (error) {
    console.error('Failed to build signed transaction:', error);
    throw error;
  }
}
```

## 高级离线交易功能

### 批量离线交易

```javascript
async function createBatchOfflineCalls(api, transfers) {
  try {
    // 创建多个转账调用
    const calls = transfers.map(({ to, amount }) => 
      api.tx.balances.transfer(to, amount)
    );
    
    // 创建批量调用
    const batchCall = api.tx.utility.batch(calls);
    
    console.log(`Created batch call with ${calls.length} transfers`);
    console.log('Batch call hash:', batchCall.method.hash);
    
    return batchCall;
    
  } catch (error) {
    console.error('Failed to create batch calls:', error);
    throw error;
  }
}
```

### 条件离线交易

```javascript
async function createConditionalOfflineCall(api, condition, call) {
  try {
    // 创建条件调用
    const conditionalCall = api.tx.utility.if(condition, call);
    
    console.log('Conditional call created');
    console.log('Condition:', condition);
    
    return conditionalCall;
    
  } catch (error) {
    console.error('Failed to create conditional call:', error);
    throw error;
  }
}
```

## 离线交易验证

### 验证签名

```javascript
function verifyOfflineSignature(extrinsic, signerPayload) {
  try {
    // 验证签名
    const isValid = extrinsic.verify();
    
    console.log('Signature verification result:', isValid);
    
    if (isValid) {
      console.log('Transaction signature is valid');
    } else {
      console.log('Transaction signature is invalid');
    }
    
    return isValid;
    
  } catch (error) {
    console.error('Failed to verify signature:', error);
    return false;
  }
}
```

### 验证交易参数

```javascript
function validateOfflineTransaction(extrinsic, expectedParams) {
  try {
    const method = extrinsic.method;
    
    // 验证方法类型
    if (method.section !== expectedParams.section || 
        method.method !== expectedParams.method) {
      console.error('Method mismatch');
      return false;
    }
    
    // 验证参数
    const args = method.args.toHuman();
    if (JSON.stringify(args) !== JSON.stringify(expectedParams.args)) {
      console.error('Arguments mismatch');
      return false;
    }
    
    console.log('Transaction validation passed');
    return true;
    
  } catch (error) {
    console.error('Failed to validate transaction:', error);
    return false;
  }
}
```

## 提交离线交易

### 提交单个交易

```javascript
async function submitOfflineTransaction(api, extrinsic) {
  try {
    // 提交交易
    const txHash = await api.rpc.author.submitExtrinsic(extrinsic);
    
    console.log('Offline transaction submitted successfully');
    console.log('Transaction hash:', txHash);
    
    return txHash;
    
  } catch (error) {
    console.error('Failed to submit offline transaction:', error);
    throw error;
  }
}
```

### 批量提交交易

```javascript
async function submitBatchOfflineTransactions(api, extrinsics) {
  try {
    const results = [];
    
    for (let i = 0; i < extrinsics.length; i++) {
      try {
        const extrinsic = extrinsics[i];
        const txHash = await api.rpc.author.submitExtrinsic(extrinsic);
        
        console.log(`Transaction ${i + 1} submitted:`, txHash);
        results.push({ index: i, hash: txHash, status: 'success' });
        
        // 等待一段时间再提交下一个
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Failed to submit transaction ${i + 1}:`, error);
        results.push({ index: i, error: error.message, status: 'failed' });
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Batch submission failed:', error);
    throw error;
  }
}
```

## 完整示例

```javascript
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { formatBalance } = require('@polkadot/util');

async function offlineTransactionExample() {
  // 连接到网络（仅用于创建调用和获取网络信息）
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
    const alice = keyring.addFromUri('//Alice');
    
    console.log('Alice address:', alice.address);
    
    // 获取账户信息
    const { nonce } = await api.query.system.account(alice.address);
    console.log('Current nonce:', nonce.toNumber());
    
    // 步骤 1: 创建转账调用
    console.log('\n=== Step 1: Creating transfer call ===');
    const recipient = '5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtSjDnVK9Fn9dZ';
    const amount = 1000000000000; // 1 WND
    
    const call = api.tx.balances.transfer(recipient, amount);
    console.log('Transfer call created');
    console.log('Method:', call.method.toHuman());
    console.log('Call hash:', call.method.hash);
    
    // 步骤 2: 创建签名载荷
    console.log('\n=== Step 2: Creating signer payload ===');
    const signerPayload = api.createType('SignerPayload', {
      genesisHash: api.genesisHash,
      blockHash: api.genesisHash,
      runtimeVersion: api.runtimeVersion,
      version: api.extrinsicVersion,
      address: alice.address,
      method: call.method.toHex(),
      nonce: nonce,
      tip: 0,
      era: 0
    });
    
    console.log('Signer payload created');
    
    // 步骤 3: 离线签名（模拟离线环境）
    console.log('\n=== Step 3: Offline signing ===');
    const { signature } = api.createType('ExtrinsicPayload', signerPayload.toPayload(), {
      version: api.extrinsicVersion
    }).sign(alice);
    
    console.log('Transaction signed offline');
    console.log('Signature:', signature);
    
    // 步骤 4: 构建签名交易
    console.log('\n=== Step 4: Building signed transaction ===');
    const extrinsic = api.createType('Extrinsic', call);
    extrinsic.addSignature(
      signerPayload.address,
      signature,
      signerPayload.toPayload()
    );
    
    console.log('Signed transaction built');
    console.log('Transaction hex:', extrinsic.toHex());
    
    // 步骤 5: 验证签名
    console.log('\n=== Step 5: Verifying signature ===');
    const isValid = extrinsic.verify();
    console.log('Signature valid:', isValid);
    
    if (isValid) {
      // 步骤 6: 提交交易
      console.log('\n=== Step 6: Submitting transaction ===');
      const txHash = await api.rpc.author.submitExtrinsic(extrinsic);
      
      console.log('Offline transaction submitted successfully');
      console.log('Transaction hash:', txHash);
      
      // 等待交易确认
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 检查交易状态
      const pendingTxs = await api.rpc.author.pendingExtrinsics();
      console.log('Pending extrinsics:', pendingTxs.length);
      
    } else {
      console.log('Transaction signature invalid, cannot submit');
    }
    
  } catch (error) {
    console.error('Offline transaction example failed:', error);
  } finally {
    await api.disconnect();
  }
}

// 运行示例
offlineTransactionExample().catch(console.error);
```

## 最佳实践

1. **安全环境**: 在安全的离线环境中进行签名
2. **参数验证**: 仔细验证所有交易参数
3. **nonce 管理**: 正确管理账户 nonce
4. **批量处理**: 对于大量交易，考虑批量处理
5. **错误处理**: 处理签名和提交过程中的错误

## 常见问题

### Q: 离线交易需要网络连接吗？
A: 创建调用和提交交易需要网络，但签名过程可以完全离线。

### Q: 如何确保离线交易的安全性？
A: 在安全的离线环境中进行签名，使用硬件钱包等安全设备。

### Q: 离线交易有有效期吗？
A: 交易的有效期由 era 参数决定，建议及时提交。

### Q: 可以离线创建复杂的交易吗？
A: 可以，但需要预先了解网络状态和参数。
