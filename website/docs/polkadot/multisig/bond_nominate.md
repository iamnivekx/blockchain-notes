# 质押和提名验证人多重签名

基于你的实际代码实现，本指南介绍如何使用多重签名账户同时进行质押和提名验证人操作。这是一个组合操作，通过 `utility.batch` 将质押和提名操作打包在一个交易中。

## 功能概述

质押和提名验证人多重签名允许多重签名账户：
- 同时进行质押和提名操作
- 使用批量交易提高效率
- 需要多个签名者共同授权
- 支持自定义验证人列表
- 提供更高的安全性

## 代码实现

### 1. 发起质押和提名多重签名 (approveAsMulti)

```javascript
const cloverTypes = require('@clover-network/node-types');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { formatBalance, u8aToHex, hexToU8a } = require('@polkadot/util');
const { sortAddresses, encodeMultiAddress } = require('@polkadot/util-crypto');

async function initiateBondNominateMultisig(api, signer, addresses, threshold, amount, targets) {
  try {
    console.log('=== Initiating Bond and Nominate Multisig ===');
    
    // 设置常量
    const SS58PREFIX = 42;
    const MAX_WEIGHT = 640000000;
    const AMOUNT_TO_SEND = new BigNumber(amount).shiftedBy(18).toString();
    
    // 设置余额格式
    formatBalance.setDefaults({
      unit: 'CLV',
      decimals: 18,
    });
    
    const displayAmount = formatBalance(AMOUNT_TO_SEND, { forceUnit: 'clv', withSi: true });
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
    console.log('Amount:', AMOUNT_TO_SEND);
    console.log('Targets:', targets);
    
    // 检查账户余额
    const { data } = await api.query.system.account(signer.address);
    const { free: balance, miscFrozen: frozen } = data;
    console.log('Balance:', balance.toHuman());
    console.log('Frozen:', frozen.toHuman());
    
    // 创建质押和提名调用
    const transactions = [
      api.tx.staking.bond(MULTISIG, AMOUNT_TO_SEND, 'Staked'),
      api.tx.staking.nominate(targets),
    ];
    
    // 使用 utility.batch 打包交易
    const call = api.tx.utility.batch(transactions);
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
      amount: AMOUNT_TO_SEND,
      targets
    };
    
  } catch (error) {
    console.error('Failed to initiate bond and nominate multisig:', error);
    throw error;
  }
}
```

### 2. 执行质押和提名多重签名 (asMulti)

```javascript
async function executeBondNominateMultisig(api, signer, addresses, threshold, amount, targets, callHash) {
  try {
    console.log('=== Executing Bond and Nominate Multisig ===');
    
    // 设置常量
    const ss58Format = 42;
    const MAX_WEIGHT = 640000000;
    const STORE_CALL = false;
    const AMOUNT_TO_SEND = new BigNumber(amount).shiftedBy(18).toString();
    
    // 设置余额格式
    formatBalance.setDefaults({
      unit: 'CLV',
      decimals: 18,
    });
    
    const displayAmount = formatBalance(AMOUNT_TO_SEND);
    
    // 创建多重签名账户
    const MULTISIG = encodeMultiAddress(addresses, threshold, ss58Format);
    const otherSignatories = sortAddresses(
      addresses.filter((who) => who !== signer.address),
      ss58Format
    );
    
    console.log('MULTISIG:', MULTISIG);
    
    // 重新创建质押和提名调用（用于执行）
    const transactions = [
      api.tx.staking.bond(MULTISIG, AMOUNT_TO_SEND, 'Staked'),
      api.tx.staking.nominate(targets),
    ];
    
    const call = api.tx.utility.batch(transactions);
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
    // 注意：权重需要乘以2，因为包含两个操作
    const txHash = await api.tx.multisig
      .asMulti(
        threshold,
        otherSignatories,
        TIME_POINT,
        call_method_hex,
        STORE_CALL,
        MAX_WEIGHT * 2
      )
      .signAndSend(signer);
    
    console.log('Transaction executed successfully');
    console.log('Transaction hash:', txHash);
    
    return txHash;
    
  } catch (error) {
    console.error('Failed to execute bond and nominate multisig:', error);
    throw error;
  }
}
```

### 3. 取消质押和提名多重签名 (cancelAsMulti)

```javascript
async function cancelBondNominateMultisig(api, signer, addresses, threshold, callHash) {
  try {
    console.log('=== Cancelling Bond and Nominate Multisig ===');
    
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
    console.error('Failed to cancel bond and nominate multisig:', error);
    throw error;
  }
}
```

## 完整使用示例

```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');
const cloverTypes = require('@clover-network/node-types');

async function bondNominateMultisigExample() {
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
    
    // 设置验证人目标
    const targets = [
      "5FNQoCoibJMAyqC77og9tSbhGUtaVt51SD7GdCxmMeWxPBvX",
      "5CqWfdrRGdZe6bwxZMiHfdcNAVePjkUJpSh2rpKgcNWciTFP"
    ];
    
    console.log('=== Bond and Nominate Multisig Example ===');
    
    // 步骤 1: Alice 发起质押和提名多重签名
    console.log('\n--- Step 1: Initiating Bond and Nominate Multisig ---');
    const alice = keyring.addFromUri('//Alice');
    const result = await initiateBondNominateMultisig(api, alice, addresses, threshold, amount, targets);
    
    console.log('Initiation completed');
    console.log('Multisig address:', result.multisig);
    console.log('Call hash:', result.callHash);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 2: Aaron 批准交易
    console.log('\n--- Step 2: Approving Transaction ---');
    const aaron = keyring.addFromUri('//Aaron');
    await approveBondNominateMultisig(api, aaron, addresses, threshold, result.callHash);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 步骤 3: 执行交易
    console.log('\n--- Step 3: Executing Transaction ---');
    const phcc = keyring.addFromUri('//Phcc');
    const executionHash = await executeBondNominateMultisig(api, phcc, addresses, threshold, amount, targets, result.callHash);
    
    console.log('✅ Bond and nominate multisig completed successfully!');
    console.log('Execution hash:', executionHash);
    
    return {
      multisig: result.multisig,
      callHash: result.callHash,
      executionHash
    };
    
  } catch (error) {
    console.error('Bond and nominate multisig example failed:', error);
  } finally {
    await api.disconnect();
  }
}

// 运行示例
bondNominateMultisigExample().catch(console.error);
```

## 关键要点

基于你的代码实现，以下是重要的注意事项：

### 1. 批量交易处理
- 使用 `api.tx.utility.batch()` 将质押和提名操作打包
- 质押操作：`api.tx.staking.bond(MULTISIG, amount, 'Staked')`
- 提名操作：`api.tx.staking.nominate(targets)`

### 2. 权重计算
- 执行时权重需要乘以2：`MAX_WEIGHT * 2`
- 因为包含两个操作（质押和提名）

### 3. 调用格式
- `approveAsMulti` 使用 `call.method.hash`
- `asMulti` 使用 `call.method.toHex()`
- 确保调用格式匹配

### 4. 验证人选择
- 支持多个验证人目标
- 验证人地址格式：SS58 编码的地址
- 建议选择活跃的验证人

### 5. 网络特定配置
- 使用 Clover 网络类型 (`@clover-network/node-types`)
- SS58 前缀为 42
- 代币单位为 CLV

## 最佳实践

1. **验证人选择**: 选择活跃、可靠的验证人
2. **质押金额**: 确保满足最小质押要求
3. **权重设置**: 正确计算批量交易的权重
4. **错误处理**: 处理所有可能的错误情况
5. **状态监控**: 监控交易状态直到最终确认

## 常见问题

### Q: 为什么需要批量交易？
A: 批量交易可以在一个交易中完成质押和提名，节省费用和时间。

### Q: 权重为什么要乘以2？
A: 因为包含两个操作（质押和提名），每个操作都需要相应的权重。

### Q: 可以只质押不提名吗？
A: 可以，但建议同时进行提名以获得质押奖励。

### Q: 验证人地址从哪里获取？
A: 可以从网络浏览器、验证人列表或社区资源中获取。
