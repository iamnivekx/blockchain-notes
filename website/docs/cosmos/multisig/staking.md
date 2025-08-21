# 多重签名质押交易

多重签名质押交易允许多个签名者共同管理质押操作，包括委托、取消委托、重新委托和提取奖励。本文档介绍如何使用多重签名账户执行质押相关的操作。

## 基本概念

### 质押操作类型

- **委托 (Delegate)**: 将 ATOM 委托给验证者
- **取消委托 (Undelegate)**: 取消对验证者的委托
- **重新委托 (Redelegate)**: 将委托从一个验证者转移到另一个
- **提取奖励 (Withdraw Rewards)**: 提取质押奖励

## 环境配置

### 设置助记词

```bash
# .env 文件
STAKING_MNEMONIC="your 12 or 24 word mnemonic phrase"
```

### 初始化环境

```typescript
require('dotenv').config();

const mnemonic = process.env.STAKING_MNEMONIC;
const validatorAddress = 'cosmosvaloper17qukqafj25wn8gdjwzlmlcm9xl00rxxe2lxujd';
const threshold = 2;
const prefix = 'cosmos';
const rpcEndpoint = 'https://rpc.testnet.cosmos.network:443';
const client = await StargateClient.connect(rpcEndpoint);
```

## 多重签名账户查询

### 查询账户信息

```typescript
const multisigAccountAddress = 'cosmos14txtjx9yx8zjxhu6s2jpa8xsx6auz3rhq7zhus';

// 查询多重签名账户
const accountOnChain = await client.getAccount(multisigAccountAddress);
assert(accountOnChain, 'Account does not exist on chain');

console.log('Account address:', accountOnChain.address);
console.log('Account pubkey:', accountOnChain.pubkey);
console.log('Account number:', accountOnChain.accountNumber);
console.log('Account sequence:', accountOnChain.sequence);

// 解码公钥信息
console.log('Decoded pubkeys:', accountOnChain.pubkey.value.pubkeys.map((key) => 
  toHex(encodeAminoPubkey(key))
));
```

## 质押消息构建

### 委托消息

```typescript
const { MsgDelegate } = require('cosmjs-types/cosmos/staking/v1beta1/tx');

const amount = {
  denom: 'uphoton',
  amount: '1234567',
};

const delegateMsg = {
  typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
  value: MsgDelegate.fromPartial({
    delegatorAddress: multisigAccountAddress,
    validatorAddress: validatorAddress,
    amount: amount,
  }),
};
```

### 取消委托消息

```typescript
const { MsgUndelegate } = require('cosmjs-types/cosmos/staking/v1beta1/tx');

const unDelegateMsg = {
  typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
  value: MsgUndelegate.fromPartial({
    delegatorAddress: multisigAccountAddress,
    validatorAddress: validatorAddress,
    amount: amount,
  }),
};
```

### 重新委托消息

```typescript
const { MsgBeginRedelegate } = require('cosmjs-types/cosmos/staking/v1beta1/tx');

const redelegateMsg = {
  typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
  value: MsgBeginRedelegate.fromPartial({
    validatorSrcAddress: validatorAddress,
    validatorDstAddress: validatorAddress, // 可以是不同的验证者
    delegatorAddress: multisigAccountAddress,
    amount: amount,
  }),
};
```

### 提取奖励消息

```typescript
const { MsgWithdrawDelegatorReward } = require('cosmjs-types/cosmos/distribution/v1beta1/tx');

const withdrawMsg = {
  typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
  value: MsgWithdrawDelegatorReward.fromPartial({
    validatorAddress: validatorAddress,
    delegatorAddress: multisigAccountAddress,
  }),
};
```

## 费用和参数设置

### 设置费用

```typescript
const gasLimit = 200000;
const fee = {
  amount: coins(2000, 'uphoton'),
  gas: gasLimit.toString(),
};

const memo = 'Use your power wisely';
```

## 签名指令创建

### 创建签名指令

```typescript
const signingInstruction = {
  accountNumber: accountOnChain.accountNumber,
  sequence: accountOnChain.sequence,
  chainId: await client.getChainId(),
  msgs: [msg], // 选择上述消息类型之一
  fee: fee,
  memo: memo,
};
```

## 并行签名收集

### 收集多个签名

```typescript
const [
  [pubkey0, signature0, bodyBytes],
  [pubkey1, signature1],
  [pubkey2, signature2],
  [pubkey3, signature3],
  [pubkey4, signature4]
] = await Promise.all(
  [0, 1, 2, 3, 4].map(async (i) => {
    // 签名环境
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [makeCosmoshubPath(i)],
    });
    const [account] = await wallet.getAccounts();
    const pubkey = encodeSecp256k1Pubkey(account.pubkey);
    const address = account.address;
    
    const signingClient = await SigningStargateClient.offline(wallet);
    const signerData = {
      accountNumber: signingInstruction.accountNumber,
      sequence: signingInstruction.sequence,
      chainId: signingInstruction.chainId,
    };
    
    const { bodyBytes: bb, signatures } = await signingClient.sign(
      address,
      signingInstruction.msgs,
      signingInstruction.fee,
      signingInstruction.memo,
      signerData,
    );
    
    return [pubkey, signatures[0], bb];
  })
);

console.log('Public key 0:', pubkey0);
console.log('Public key 1:', pubkey1);
console.log('Public key 2:', pubkey2);
```

## 多重签名交易组装

### 创建多重签名公钥

```typescript
const multisigPubkey = createMultisigThresholdPubkey(
  [pubkey0, pubkey1, pubkey2, pubkey3, pubkey4], 
  threshold
);

// 验证地址一致性
assert.strictEqual(
  multisigAccountAddress, 
  pubkeyToAddress(multisigPubkey, prefix), 
  'should be equal'
);
```

### 生成地址映射

```typescript
const address0 = pubkeyToAddress(pubkey0, prefix);
const address1 = pubkeyToAddress(pubkey1, prefix);
const address2 = pubkeyToAddress(pubkey2, prefix);
const address3 = pubkeyToAddress(pubkey3, prefix);
const address4 = pubkeyToAddress(pubkey4, prefix);
```

### 创建多重签名交易

```typescript
const signedTx = makeMultisignedTx(
  multisigPubkey,
  signingInstruction.sequence,
  signingInstruction.fee,
  bodyBytes,
  new Map([
    [address0, signature0],
    [address1, signature1],
    // [address2, signature2],  // 可选签名
    // [address3, signature3],  // 可选签名
    // [address4, signature4],  // 可选签名
  ])
);
```

## 交易广播

### 广播质押交易

```typescript
// 确保签名有效
const broadcaster = await StargateClient.connect(rpcEndpoint);
const result = await broadcaster.broadcastTx(
  Uint8Array.from(TxRaw.encode(signedTx).finish())
);

console.log('Broadcast result:', result);
assertIsBroadcastTxSuccess(result);
```

## 质押操作示例

### 执行委托操作

```typescript
async function executeDelegate() {
  // 使用委托消息
  const msg = delegateMsg;
  
  // 创建签名指令
  const signingInstruction = {
    accountNumber: accountOnChain.accountNumber,
    sequence: accountOnChain.sequence,
    chainId: await client.getChainId(),
    msgs: [msg],
    fee: fee,
    memo: memo,
  };
  
  // 执行签名和广播流程
  // ... (上述签名和广播代码)
}
```

### 执行取消委托操作

```typescript
async function executeUndelegate() {
  // 使用取消委托消息
  const msg = unDelegateMsg;
  
  // 创建签名指令
  const signingInstruction = {
    accountNumber: accountOnChain.accountNumber,
    sequence: accountOnChain.sequence,
    chainId: await client.getChainId(),
    msgs: [msg],
    fee: fee,
    memo: memo,
  };
  
  // 执行签名和广播流程
  // ... (上述签名和广播代码)
}
```

## 完整示例

查看 `examples/cosmos/multisig/staking.js` 文件获取完整的多重签名质押交易示例代码。

## 注意事项

- 质押操作需要足够的余额支付费用
- 取消委托后需要等待解绑期
- 重新委托可以避免解绑期
- 定期提取质押奖励
- 选择可靠的验证者
- 在生产环境中使用硬件钱包
- 定期验证多重签名配置
- 备份所有参与者的助记词
