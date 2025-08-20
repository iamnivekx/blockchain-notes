# 提名验证人多重签名

基于你的实际代码实现，本指南介绍如何使用多重签名账户进行提名验证人操作。提名验证人是 Polkadot 质押系统的重要组成部分，允许多重签名账户选择并支持验证人。

## 功能概述

提名验证人多重签名允许多重签名账户：
- 提名一个或多个验证人
- 通过多重签名机制确保安全性
- 支持动态验证人选择
- 参与网络共识和获得质押奖励
- 灵活调整提名策略

## 代码实现

### 1. 发起提名验证人多重签名 (approveAsMulti)

```javascript
const cloverTypes = require('@clover-network/node-types');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { formatBalance, u8aToHex, hexToU8a } = require('@polkadot/util');
const { sortAddresses, encodeMultiAddress } = require('@polkadot/util-crypto');

async function initiateNominateMultisig(api, signer, addresses, threshold, targets) {
  try {
    console.log('=== Initiating Nominate Validators Multisig ===');
    
    // 设置常量
    const SS58PREFIX = 42;
    const MAX_WEIGHT = 640000000;
    
    // 设置余额格式
    formatBalance.setDefaults({
      unit: 'CLV',
      decimals: 18,
    });
    
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
    console.log('Targets:', targets);
    
    // 检查账户余额
    const { data } = await api.query.system.account(signer.address);
    const { free: balance, miscFrozen: frozen } = data;
    console.log('Balance:', balance.toHuman());
    console.log('Frozen:', frozen.toHuman());
    
    // 创建提名验证人调用
    const call = api.tx.staking.nominate(targets);
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
      targets
    };
    
  } catch (error) {
    console.error('Failed to initiate nominate multisig:', error);
    throw error;
  }
}
```

### 2. 执行提名验证人多重签名 (asMulti)

```javascript
async function executeNominateMultisig(api, signer, addresses, threshold, targets, callHash) {
  try {
    console.log('=== Executing Nominate Validators Multisig ===');
    
    // 设置常量
    const ss58Format = 42;
    const MAX_WEIGHT = 640000000;
    const STORE_CALL = false;
    
    // 设置余额格式
    formatBalance.setDefaults({
      unit: 'CLV',
      decimals: 18,
    });
    
    // 创建多重签名账户
    const MULTISIG = encodeMultiAddress(addresses, threshold, ss58Format);
    const otherSignatories = sortAddresses(
      addresses.filter((who) => who !== signer.address),
      ss58Format
    );
    
    console.log('MULTISIG:', MULTISIG);
    
    // 重新创建提名验证人调用（用于执行）
    const call = api.tx.staking.nominate(targets);
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
    console.log('Time point height:', TIME_POINT.height.toNumber());
    
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
    console.error('Failed to execute nominate multisig:', error);
    throw error;
  }
}
```

### 3. 取消提名验证人多重签名 (cancelAsMulti)

```javascript
async function cancelNominateMultisig(api, signer, addresses, threshold, callHash) {
  try {
    console.log('=== Cancelling Nominate Validators Multisig ===');
    
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
    console.error('Failed to cancel nominate multisig:', error);
    throw error;
  }
}
```

## 完整使用示例

```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');
const cloverTypes = require('@clover-network/node-types');

async function nominateMultisigExample() {
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
    
    // 设置验证人目标
    const targets = [
      "5CqWfdrRGdZe6bwxZMiHfdcNAVePjkUJpSh2rpKgcNWciTFP"
    ];
    
    console.log('=== Nominate Validators Multisig Example ===');
    
    // 步骤 1: Alice 发起提名验证人多重签名
    console.log('\n--- Step 1: Initiating Nominate Validators Multisig ---');
    const alice = keyring.addFromUri('//Alice');
    const result = await initiateNominateMultisig(api, alice, addresses, threshold, targets);
    
    console.log('Initiation completed');
    console.log('Multisig address:', result.multisig);
    console.log('Call hash:', result.callHash);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 2: Aaron 批准交易
    console.log('\n--- Step 2: Approving Transaction ---');
    const aaron = keyring.addFromUri('//Aaron');
    await approveNominateMultisig(api, aaron, addresses, threshold, result.callHash);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 3: 执行交易
    console.log('\n--- Step 3: Executing Transaction ---');
    const phcc = keyring.addFromUri('//Phcc');
    const executionHash = await executeNominateMultisig(api, phcc, addresses, threshold, targets, result.callHash);
    
    console.log('✅ Nominate validators multisig completed successfully!');
    console.log('Execution hash:', executionHash);
    
    return {
      multisig: result.multisig,
      callHash: result.callHash,
      executionHash
    };
    
  } catch (error) {
    console.error('Nominate validators multisig example failed:', error);
  } finally {
    await api.disconnect();
  }
}

// 运行示例
nominateMultisigExample().catch(console.error);
```

## 关键要点

基于你的代码实现，以下是重要的注意事项：

### 1. 提名验证人调用
- 使用 `api.tx.staking.nominate(targets)` 创建提名调用
- `targets` 是验证人地址数组
- 支持提名单个或多个验证人

### 2. 验证人地址格式
- 使用 SS58 编码的地址格式
- 确保验证人地址有效且活跃
- 建议选择可靠的验证人

### 3. 调用格式
- `approveAsMulti` 使用 `call.method.hash`
- `asMulti` 使用 `call.method.toHex()`
- 确保调用格式匹配

### 4. 网络特定配置
- 使用 Clover 网络类型 (`@clover-network/node-types`)
- SS58 前缀为 42
- 代币单位为 CLV

### 5. 权重设置
- 提名操作的权重相对较低
- 使用标准权重：`MAX_WEIGHT = 640000000`

## 最佳实践

1. **验证人选择**: 选择活跃、可靠的验证人
2. **提名策略**: 考虑验证人的表现和佣金率
3. **风险分散**: 可以提名多个验证人以分散风险
4. **监控状态**: 定期检查提名状态和验证人表现
5. **及时调整**: 根据网络变化调整提名策略

## 常见问题

### Q: 提名验证人需要质押吗？
A: 是的，需要先进行质押操作，然后才能提名验证人。

### Q: 可以提名多少个验证人？
A: 可以提名多个验证人，但建议选择活跃且可靠的验证人。

### Q: 提名后多久生效？
A: 提名通常在下一个 era 生效，具体时间取决于网络配置。

### Q: 如何更换提名的验证人？
A: 可以发起新的提名交易来更换验证人。

### Q: 提名验证人有什么风险？
A: 如果验证人行为不当，可能会影响质押奖励，建议选择可靠的验证人。
