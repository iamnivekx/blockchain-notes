# 质押额外代币多重签名

基于你的实际代码实现，本指南介绍如何使用多重签名账户进行质押额外代币操作。这包括发起、批准和执行质押额外代币的多重签名交易。

## 功能概述

质押额外代币多重签名允许多重签名账户：
- 增加质押数量
- 需要多个签名者共同授权
- 支持分批质押操作
- 提供更高的安全性

## 代码实现

### 1. 发起质押额外代币多重签名 (approveAsMulti)

```javascript
const assert = require('assert');
const BigNumber = require('bignumber.js');
const cloverTypes = require('@clover-network/node-types');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { formatBalance, u8aToHex, hexToU8a } = require('@polkadot/util');
const { sortAddresses, encodeMultiAddress } = require('@polkadot/util-crypto');

async function initiateBondExtraMultisig(api, signer, addresses, threshold, amount) {
  try {
    console.log('=== Initiating Bond Extra Multisig ===');
    
    // 设置常量
    const SS58PREFIX = 42;
    const MAX_WEIGHT = 640000000;
    const MAX_ADDITIONAL = new BigNumber(amount).shiftedBy(18).toString();
    
    // 设置余额格式
    formatBalance.setDefaults({
      unit: 'CLV',
      decimals: 18,
    });
    
    const displayAmount = formatBalance(MAX_ADDITIONAL, { forceUnit: 'clv', withSi: true });
    const depositBase = api.consts.multisig.depositBase;
    const depositFactor = api.consts.multisig.depositFactor;
    
    // 创建多重签名账户
    const MULTISIG = encodeMultiAddress(addresses, threshold, SS58PREFIX);
    const otherSignatories = sortAddresses(
      addresses.filter((who) => who !== signer.address),
      SS58PREFIX
    );
    
    console.log('MULTISIG:', MULTISIG);
    console.log('Addresses:', addresses);
    console.log('Amount:', MAX_ADDITIONAL);
    
    // 检查账户余额
    const { data } = await api.query.system.account(signer.address);
    const { free: balance, miscFrozen: frozen } = data;
    console.log('Balance:', balance.toHuman());
    console.log('Frozen:', frozen.toHuman());
    
    // 创建质押额外代币调用
    const call = api.tx.staking.bondExtra(MAX_ADDITIONAL);
    const call_method_hash = call.method.hash;
    const call_method_hex = call.method.toHex();
    
    console.log('Call method hash:', u8aToHex(call_method_hash));
    console.log('Call method hex:', call_method_hex);
    
    // 检查是否已有待处理的多重签名交易
    const info = await api.query.multisig.multisigs(MULTISIG, call_method_hash);
    if (info.isSome) {
      throw new Error('Should be the first approval.');
    }
    
    const TIME_POINT = null;
    
    // 创建多重签名交易
    const tx = api.tx.multisig.approveAsMulti(
      threshold,
      otherSignatories,
      TIME_POINT,
      call_method_hash,
      MAX_WEIGHT
    );
    
    // 获取 nonce
    const { nonce } = await api.query.system.account(signer.address);
    console.log('Nonce:', nonce.toNumber());
    
    // 创建签名载荷
    const payload = api.createType('SignerPayload', {
      method: tx.method,
      nonce: nonce.toNumber(),
      genesisHash: api.genesisHash,
      blockHash: api.genesisHash,
      runtimeVersion: api.runtimeVersion,
      version: api.extrinsicVersion,
      address: signer.address,
    });
    
    // 添加占位符签名
    const placeholder = '0x020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001';
    tx.addSignature(signer.address, placeholder, payload.toPayload());
    
    // 序列化交易
    const serialized = tx.toHex();
    console.log('Serialized:', serialized);
    
    // 创建实际签名
    const signatureHash = payload.toRaw().data;
    const signature = u8aToHex(signer.sign(hexToU8a(signatureHash), { withType: true }));
    console.log('Signature:', signature);
    
    // 替换占位符签名
    const hex = serialized.replace(placeholder.slice(2), signature.slice(2));
    const extrinsic = api.createType('Extrinsic', hex);
    
    // 提交交易
    const txHash = await api.rpc.author.submitExtrinsic(extrinsic.toHex());
    console.log('Transaction hash:', txHash);
    
    return {
      txHash,
      multisig: MULTISIG,
      callHash: call_method_hash,
      amount: MAX_ADDITIONAL
    };
    
  } catch (error) {
    console.error('Failed to initiate bond extra multisig:', error);
    throw error;
  }
}
```

### 2. 执行质押额外代币多重签名 (asMulti)

```javascript
async function executeBondExtraMultisig(api, signer, addresses, threshold, amount, callHash) {
  try {
    console.log('=== Executing Bond Extra Multisig ===');
    
    // 设置常量
    const ss58Format = 42;
    const MAX_WEIGHT = 640000000;
    const STORE_CALL = false;
    const MAX_ADDITIONAL = new BigNumber(amount).shiftedBy(18).toString();
    
    // 设置余额格式
    formatBalance.setDefaults({
      unit: 'CLV',
      decimals: 18,
    });
    
    const displayAmount = formatBalance(MAX_ADDITIONAL);
    
    // 创建多重签名账户
    const MULTISIG = encodeMultiAddress(addresses, threshold, ss58Format);
    const otherSignatories = sortAddresses(
      addresses.filter((who) => who !== signer.address),
      ss58Format
    );
    
    console.log('MULTISIG:', MULTISIG);
    
    // 创建质押额外代币调用
    const call = api.tx.staking.bondExtra(MAX_ADDITIONAL);
    const call_method_hash = call.method.hash;
    const call_method_hex = call.method.toHex();
    
    console.log('Call method hash:', u8aToHex(call_method_hash));
    console.log('Call method hex:', call_method_hex);
    
    // 获取时间点信息
    const info = await api.query.multisig.multisigs(MULTISIG, callHash);
    if (!info.isSome) {
      throw new Error('This is NOT the first approval, should it must be Some.');
    }
    
    const TIME_POINT = info.unwrap().when;
    console.log('Time point:', TIME_POINT.toHuman());
    
    // 执行多重签名交易
    const txHash = await api.tx.multisig
      .asMulti(
        threshold,
        otherSignatories,
        TIME_POINT,
        call_method_hex,
        STORE_CALL,
        MAX_WEIGHT
      )
      .signAndSend(signer);
    
    console.log('Transaction executed successfully');
    console.log('Transaction hash:', txHash);
    
    return txHash;
    
  } catch (error) {
    console.error('Failed to execute bond extra multisig:', error);
    throw error;
  }
}
```

### 3. 取消质押额外代币多重签名 (cancelAsMulti)

```javascript
async function cancelBondExtraMultisig(api, signer, addresses, threshold, callHash) {
  try {
    console.log('=== Cancelling Bond Extra Multisig ===');
    
    // 设置常量
    const ss58Format = 42;
    
    // 创建多重签名账户
    const MULTISIG = encodeMultiAddress(addresses, threshold, ss58Format);
    const otherSignatories = sortAddresses(
      addresses.filter((who) => who !== signer.address),
      ss58Format
    );
    
    // 获取时间点信息
    const info = await api.query.multisig.multisigs(MULTISIG, callHash);
    if (!info.isSome) {
      throw new Error('No pending multisig transaction found');
    }
    
    const TIME_POINT = info.unwrap().when;
    
    // 取消多重签名交易
    const txHash = await api.tx.multisig
      .cancelAsMulti(
        threshold,
        otherSignatories,
        TIME_POINT,
        callHash
      )
      .signAndSend(signer);
    
    console.log('Transaction cancelled successfully');
    console.log('Transaction hash:', txHash);
    
    return txHash;
    
  } catch (error) {
    console.error('Failed to cancel bond extra multisig:', error);
    throw error;
  }
}
```

## 完整使用示例

```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');
const cloverTypes = require('@clover-network/node-types');

async function bondExtraMultisigExample() {
  // 连接到 Clover 网络
  const wsProvider = new WsProvider('wss://api.clover.finance');
  const api = await ApiPromise.create({ provider: wsProvider, types: cloverTypes });
  
  try {
    // 等待网络就绪
    await api.isReady;
    
    // 设置账户信息（从你的 private.js 文件）
    const addresses = [
      'alice_address',  // 替换为实际地址
      'aaron_address',  // 替换为实际地址
      'phcc_address'    // 替换为实际地址
    ];
    
    const threshold = 2;
    const amount = 0.1; // 0.1 CLV
    
    console.log('=== Bond Extra Multisig Example ===');
    
    // 步骤 1: Alice 发起质押额外代币多重签名
    console.log('\n--- Step 1: Initiating Bond Extra Multisig ---');
    const alice = keyring.addFromUri('//Alice');
    const result = await initiateBondExtraMultisig(api, alice, addresses, threshold, amount);
    
    console.log('Initiation completed');
    console.log('Multisig address:', result.multisig);
    console.log('Call hash:', result.callHash);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 2: Aaron 批准交易
    console.log('\n--- Step 2: Approving Transaction ---');
    const aaron = keyring.addFromUri('//Aaron');
    await approveBondExtraMultisig(api, aaron, addresses, threshold, result.callHash);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 3: 执行交易
    console.log('\n--- Step 3: Executing Transaction ---');
    const phcc = keyring.addFromUri('//Phcc');
    const executionHash = await executeBondExtraMultisig(api, phcc, addresses, threshold, amount, result.callHash);
    
    console.log('✅ Bond extra multisig completed successfully!');
    console.log('Execution hash:', executionHash);
    
    return {
      multisig: result.multisig,
      callHash: result.callHash,
      executionHash
    };
    
  } catch (error) {
    console.error('Bond extra multisig example failed:', error);
  } finally {
    await api.disconnect();
  }
}

// 运行示例
bondExtraMultisigExample().catch(console.error);
```

## 关键要点

基于你的代码实现，以下是重要的注意事项：

### 1. 签名处理
- 使用占位符签名进行初始构建
- 创建实际的签名并替换占位符
- 确保签名格式正确

### 2. 时间点管理
- 首次批准时 `TIME_POINT = null`
- 后续批准需要从 `info.unwrap().when` 获取时间点
- 执行时需要正确的时间点信息

### 3. 调用格式
- `approveAsMulti` 使用 `call.method.hash`
- `asMulti` 使用 `call.method.toHex()`
- 确保调用格式匹配

### 4. 网络特定配置
- 使用 Clover 网络类型 (`@clover-network/node-types`)
- SS58 前缀为 42
- 代币单位为 CLV

## 最佳实践

1. **余额检查**: 确保签名者有足够的余额支付交易费用
2. **错误处理**: 处理所有可能的错误情况
3. **状态监控**: 监控交易状态直到最终确认
4. **签名验证**: 验证签名的正确性
5. **网络兼容性**: 确保使用正确的网络配置

## 常见问题

### Q: 为什么需要使用占位符签名？
A: 占位符签名用于构建交易结构，然后替换为实际签名，这是离线签名的标准做法。

### Q: 时间点错误怎么办？
A: 时间点错误会导致交易失败，确保从正确的多重签名信息中获取时间点。

### Q: 可以取消已批准的交易吗？
A: 可以，使用 `cancelAsMulti` 函数，但需要满足阈值要求。
