# 质押和委托

Cosmos 网络使用权益证明（PoS）共识机制，用户可以通过质押 ATOM 代币来参与网络验证，获得质押奖励。

## 基本概念

### 质押机制

- **委托者 (Delegator)**: 质押 ATOM 的用户
- **验证者 (Validator)**: 运行验证节点的实体
- **质押奖励**: 根据质押量和验证者表现分配
- **解绑期**: 取消质押需要等待的时间

## 委托操作

### 初始化客户端

```typescript
const { DirectSecp256k1HdWallet, SigningStargateClient } = require('@cosmjs/proto-signing');

async function initializeStakingClient(mnemonic) {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
  const [account] = await wallet.getAccounts();
  
  const rpcEndpoint = 'https://rpc.testnet.cosmos.network:443';
  const client = await SigningStargateClient.connectWithSigner(
    rpcEndpoint, 
    wallet, 
    { gasPrice: '1000uphoton' }
  );
  
  return { client, account };
}
```

### 委托 ATOM

```typescript
const { MsgDelegate } = require('cosmjs-types/cosmos/staking/v1beta1/tx');

async function delegate(client, delegatorAddress, validatorAddress, amount) {
  const { accountNumber, sequence } = await client.getAccount(delegatorAddress);
  
  const delegateMsg = {
    typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
    value: MsgDelegate.fromPartial({
      delegatorAddress: delegatorAddress,
      validatorAddress: validatorAddress,
      amount: {
        denom: "uphoton",
        amount: amount.toString(),
      },
    }),
  };
  
  const fee = {
    amount: [{ denom: "uphoton", amount: "2000" }],
    gas: "180000",
  };
  
  const memo = "Use your power wisely";
  
  const result = await client.signAndBroadcast(
    delegatorAddress,
    [delegateMsg],
    fee,
    memo
  );
  
  console.log('Delegation result:', result);
  return result;
}
```

### 取消委托

```typescript
const { MsgUndelegate } = require('cosmjs-types/cosmos/staking/v1beta1/tx');

async function undelegate(client, delegatorAddress, validatorAddress, amount) {
  const unDelegateMsg = {
    typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
    value: MsgUndelegate.fromPartial({
      delegatorAddress: delegatorAddress,
      validatorAddress: validatorAddress,
      amount: {
        denom: "uphoton",
        amount: amount.toString(),
      },
    }),
  };
  
  const fee = {
    amount: [{ denom: "uphoton", amount: "2000" }],
    gas: "180000",
  };
  
  const result = await client.signAndBroadcast(
    delegatorAddress,
    [unDelegateMsg],
    fee,
    "Use your power wisely"
  );
  
  console.log('Undelegation result:', result);
  return result;
}
```

### 重新委托

```typescript
const { MsgBeginRedelegate } = require('cosmjs-types/cosmos/staking/v1beta1/tx');

async function redelegate(
  client, 
  delegatorAddress, 
  srcValidatorAddress, 
  dstValidatorAddress, 
  amount
) {
  const redelegateMsg = {
    typeUrl: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
    value: MsgBeginRedelegate.fromPartial({
      validatorSrcAddress: srcValidatorAddress,
      validatorDstAddress: dstValidatorAddress,
      delegatorAddress: delegatorAddress,
      amount: {
        denom: "uphoton",
        amount: amount.toString(),
      },
    }),
  };
  
  const fee = {
    amount: [{ denom: "uphoton", amount: "2000" }],
    gas: "180000",
  };
  
  const result = await client.signAndBroadcast(
    delegatorAddress,
    [redelegateMsg],
    fee,
    "Use your power wisely"
  );
  
  console.log('Redelegation result:', result);
  return result;
}
```

## 奖励管理

### 提取质押奖励

```typescript
const { MsgWithdrawDelegatorReward } = require('cosmjs-types/cosmos/distribution/v1beta1/tx');

async function withdrawRewards(client, delegatorAddress, validatorAddress) {
  const withdrawMsg = {
    typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
    value: MsgWithdrawDelegatorReward.fromPartial({
      delegatorAddress: delegatorAddress,
      validatorAddress: validatorAddress,
    }),
  };
  
  const fee = {
    amount: [{ denom: "uphoton", amount: "2000" }],
    gas: "180000",
  };
  
  const result = await client.signAndBroadcast(
    delegatorAddress,
    [withdrawMsg],
    fee,
    "Use your power wisely"
  );
  
  console.log('Withdraw rewards result:', result);
  return result;
}
```

## 查询功能

### 查询委托信息

```typescript
async function queryDelegations(client, delegatorAddress) {
  const delegations = await client.getStakingDelegations(delegatorAddress);
  console.log('Delegations:', delegations);
  return delegations;
}

async function queryValidatorInfo(client, validatorAddress) {
  const validator = await client.getStakingValidator(validatorAddress);
  console.log('Validator info:', validator);
  return validator;
}

async function queryRewards(client, delegatorAddress) {
  const rewards = await client.getDistributionRewards(delegatorAddress);
  console.log('Rewards:', rewards);
  return rewards;
}
```

## 费用和 Gas 设置

### 推荐 Gas 限制

```typescript
const GAS_LIMITS = {
  DELEGATE: 180000,      // 委托操作
  UNDELEGATE: 180000,    // 取消委托
  REDELEGATE: 180000,    // 重新委托
  WITHDRAW_REWARDS: 180000, // 提取奖励
};

const FEE_AMOUNTS = {
  DELEGATE: "2000",      // 委托费用
  UNDELEGATE: "2000",    // 取消委托费用
  REDELEGATE: "2000",    // 重新委托费用
  WITHDRAW_REWARDS: "2000", // 提取奖励费用
};
```

## 完整示例

查看 `examples/cosmos/delegate/delegate.js` 文件获取完整的质押委托示例代码。

## 注意事项

- 委托后需要等待解绑期才能取回资金
- 验证者表现会影响质押奖励
- 合理选择验证者，考虑佣金率和表现
- 定期提取质押奖励
- 监控验证者状态和网络参数
- 在生产环境中使用硬件钱包
