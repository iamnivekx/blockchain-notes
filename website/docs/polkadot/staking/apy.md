# 质押操作

Polkadot 质押（Staking）是网络共识和安全的核心机制。通过质押 DOT 代币，用户可以参与网络验证、提名验证者，并获得质押奖励。本指南将介绍如何进行质押操作。

## 质押概述

Polkadot 质押系统具有以下特点：

- **NPoS 机制**: 提名权益证明共识
- **验证者**: 负责生产区块和验证交易
- **提名者**: 提名验证者并获得奖励
- **奖励分配**: 基于质押数量和验证者表现

## 基本质押操作

### 绑定代币

```javascript
async function bondTokens(api, controller, amount, payee) {
  try {
    console.log('=== Bonding Tokens ===');
    
    // 创建绑定调用
    const bondCall = api.tx.staking.bond(controller, amount, payee);
    
    console.log('Bond amount:', formatBalance(amount));
    console.log('Controller:', controller);
    console.log('Payee:', payee);
    
    return bondCall;
    
  } catch (error) {
    console.error('Failed to create bond call:', error);
    throw error;
  }
}

// 使用示例
const bondCall = await bondTokens(api, alice.address, 10000000000000, 'Staked'); // 10 DOT
```

### 解绑代币

```javascript
async function unbondTokens(api, amount) {
  try {
    console.log('=== Unbonding Tokens ===');
    
    // 创建解绑调用
    const unbondCall = api.tx.staking.unbond(amount);
    
    console.log('Unbond amount:', formatBalance(amount));
    
    return unbondCall;
    
  } catch (error) {
    console.error('Failed to create unbond call:', error);
    throw error;
  }
}
```

### 提名验证者

```javascript
async function nominateValidators(api, validators) {
  try {
    console.log('=== Nominating Validators ===');
    
    // 验证输入
    if (!Array.isArray(validators) || validators.length === 0) {
      throw new Error('Validators array must not be empty');
    }
    
    // 创建提名调用
    const nominateCall = api.tx.staking.nominate(validators);
    
    console.log('Nominating validators:', validators.length);
    validators.forEach((validator, index) => {
      console.log(`${index + 1}. ${validator}`);
    });
    
    return nominateCall;
    
  } catch (error) {
    console.error('Failed to create nominate call:', error);
    throw error;
  }
}
```

## 质押状态查询

### 获取质押信息

```javascript
async function getStakingInfo(api, address) {
  try {
    console.log(`=== Staking Info for ${address} ===`);
    
    // 获取质押信息
    const stakingInfo = await api.query.staking.ledger(address);
    
    if (stakingInfo.isSome) {
      const ledger = stakingInfo.unwrap();
      
      const info = {
        total: ledger.total.toHuman(),
        active: ledger.active.toHuman(),
        unlocking: ledger.unlocking.map(chunk => ({
          era: chunk.era.toNumber(),
          amount: chunk.amount.toHuman()
        })),
        claimedRewards: ledger.claimedRewards.map(era => era.toNumber())
      };
      
      console.log('Total bonded:', info.total);
      console.log('Active bonded:', info.active);
      console.log('Unlocking chunks:', info.unlocking.length);
      console.log('Claimed rewards eras:', info.claimedRewards.length);
      
      return info;
      
    } else {
      console.log('No staking information found');
      return null;
    }
    
  } catch (error) {
    console.error('Failed to get staking info:', error);
    throw error;
  }
}
```

### 获取验证者信息

```javascript
async function getValidatorInfo(api, validatorAddress) {
  try {
    console.log(`=== Validator Info for ${validatorAddress} ===`);
    
    // 获取验证者信息
    const validatorInfo = await api.query.staking.validators(validatorAddress);
    
    if (validatorInfo.isSome) {
      const validator = validatorInfo.unwrap();
      
      const info = {
        commission: validator.commission.toHuman(),
        blocked: validator.blocked.toHuman(),
        totalStake: validator.totalStake.toHuman()
      };
      
      console.log('Commission:', info.commission);
      console.log('Blocked:', info.blocked);
      console.log('Total stake:', info.totalStake);
      
      return info;
      
    } else {
      console.log('No validator information found');
      return null;
    }
    
  } catch (error) {
    console.error('Failed to get validator info:', error);
    throw error;
  }
}
```

### 获取质押奖励

```javascript
async function getStakingRewards(api, address) {
  try {
    console.log(`=== Staking Rewards for ${address} ===`);
    
    // 获取质押奖励信息
    const rewards = await api.query.staking.claimedRewards(address);
    
    if (rewards.isSome) {
      const claimedRewards = rewards.unwrap();
      
      console.log('Claimed rewards eras:', claimedRewards.length);
      claimedRewards.forEach((era, index) => {
        console.log(`Era ${index + 1}: ${era.toNumber()}`);
      });
      
      return claimedRewards.map(era => era.toNumber());
      
    } else {
      console.log('No claimed rewards found');
      return [];
    }
    
  } catch (error) {
    console.error('Failed to get staking rewards:', error);
    throw error;
  }
}
```

## 高级质押操作

### 重新绑定代币

```javascript
async function rebondTokens(api, amount) {
  try {
    console.log('=== Rebonding Tokens ===');
    
    // 创建重新绑定调用
    const rebondCall = api.tx.staking.rebond(amount);
    
    console.log('Rebond amount:', formatBalance(amount));
    
    return rebondCall;
    
  } catch (error) {
    console.error('Failed to create rebond call:', error);
    throw error;
  }
}
```

### 设置支付目标

```javascript
async function setPayee(api, payee) {
  try {
    console.log('=== Setting Payee ===');
    
    // 创建设置支付目标调用
    const setPayeeCall = api.tx.staking.setPayee(payee);
    
    console.log('Payee:', payee);
    
    return setPayeeCall;
    
  } catch (error) {
    console.error('Failed to create setPayee call:', error);
    throw error;
  }
}
```

### 设置控制器

```javascript
async function setController(api, controller) {
  try {
    console.log('=== Setting Controller ===');
    
    // 创建设置控制器调用
    const setControllerCall = api.tx.staking.setController(controller);
    
    console.log('Controller:', controller);
    
    return setControllerCall;
    
  } catch (error) {
    console.error('Failed to create setController call:', error);
    throw error;
  }
}
```

## 质押奖励管理

### 领取质押奖励

```javascript
async function claimStakingRewards(api, era) {
  try {
    console.log('=== Claiming Staking Rewards ===');
    
    // 创建领取奖励调用
    const claimCall = api.tx.staking.claimRewards(era);
    
    console.log('Claiming rewards for era:', era);
    
    return claimCall;
    
  } catch (error) {
    console.error('Failed to create claimRewards call:', error);
    throw error;
  }
}
```

### 质押奖励计算

```javascript
async function calculateStakingRewards(api, address, era) {
  try {
    console.log(`=== Calculating Staking Rewards for Era ${era} ===`);
    
    // 获取质押信息
    const stakingInfo = await api.query.staking.ledger(address);
    
    if (stakingInfo.isSome) {
      const ledger = stakingInfo.unwrap();
      const activeStake = ledger.active;
      
      // 获取验证者信息
      const validators = await api.query.staking.nominators(address);
      
      if (validators.isSome) {
        const nominations = validators.unwrap();
        
        // 计算奖励（简化计算）
        const estimatedReward = activeStake.muln(5).divn(100); // 假设 5% 年化
        
        console.log('Active stake:', activeStake.toHuman());
        console.log('Estimated reward:', estimatedReward.toHuman());
        
        return {
          activeStake: activeStake.toHuman(),
          estimatedReward: estimatedReward.toHuman(),
          nominations: nominations.targets.length
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Failed to calculate staking rewards:', error);
    throw error;
  }
}
```

## 质押策略优化

### 选择验证者

```javascript
async function selectOptimalValidators(api, count = 16) {
  try {
    console.log('=== Selecting Optimal Validators ===');
    
    // 获取所有验证者
    const validators = await api.query.staking.validators.entries();
    
    // 分析验证者表现
    const validatorAnalysis = validators.map(([address, validator]) => {
      const info = validator.unwrap();
      return {
        address: address.args[0].toString(),
        commission: info.commission.toNumber(),
        totalStake: info.totalStake.toNumber()
      };
    });
    
    // 按佣金排序（选择佣金较低的验证者）
    const sortedValidators = validatorAnalysis
      .sort((a, b) => a.commission - b.commission)
      .slice(0, count);
    
    console.log(`Selected ${sortedValidators.length} validators with lowest commission:`);
    sortedValidators.forEach((validator, index) => {
      console.log(`${index + 1}. ${validator.address} (Commission: ${validator.commission}%)`);
    });
    
    return sortedValidators.map(v => v.address);
    
  } catch (error) {
    console.error('Failed to select optimal validators:', error);
    throw error;
  }
}
```

### 质押金额优化

```javascript
async function optimizeStakingAmount(api, totalBalance) {
  try {
    console.log('=== Optimizing Staking Amount ===');
    
    // 获取网络参数
    const minNominatorBond = api.consts.staking.minNominatorBond;
    const maxNominators = api.consts.staking.maxNominators;
    
    console.log('Minimum nominator bond:', minNominatorBond.toHuman());
    console.log('Maximum nominators:', maxNominators.toNumber());
    
    // 计算最优质押金额
    const optimalAmount = minNominatorBond.muln(2); // 2倍最小质押量
    const maxAmount = totalBalance.muln(80).divn(100); // 80% 总余额
    
    const recommendedAmount = optimalAmount.gt(maxAmount) ? maxAmount : optimalAmount;
    
    console.log('Total balance:', totalBalance.toHuman());
    console.log('Optimal staking amount:', recommendedAmount.toHuman());
    console.log('Remaining balance:', totalBalance.sub(recommendedAmount).toHuman());
    
    return {
      minBond: minNominatorBond.toHuman(),
      optimalAmount: recommendedAmount.toHuman(),
      remainingBalance: totalBalance.sub(recommendedAmount).toHuman()
    };
    
  } catch (error) {
    console.error('Failed to optimize staking amount:', error);
    throw error;
  }
}
```

## 完整示例

```javascript
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { formatBalance } = require('@polkadot/util');

async function comprehensiveStakingExample() {
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
    const alice = keyring.addFromUri('//Alice');
    
    console.log('Alice address:', alice.address);
    
    // 获取账户信息
    const accountInfo = await api.query.system.account(alice.address);
    console.log('Alice balance:', formatBalance(accountInfo.data.free));
    
    // 获取质押信息
    console.log('\n=== Current Staking Status ===');
    const stakingInfo = await getStakingInfo(api, alice.address);
    
    if (stakingInfo) {
      console.log('Already staking:', stakingInfo.total);
    } else {
      console.log('Not currently staking');
    }
    
    // 选择最优验证者
    console.log('\n=== Selecting Validators ===');
    const optimalValidators = await selectOptimalValidators(api, 8);
    
    // 优化质押金额
    console.log('\n=== Optimizing Staking Amount ===');
    const optimization = await optimizeStakingAmount(api, accountInfo.data.free);
    
    // 创建质押操作
    console.log('\n=== Creating Staking Operations ===');
    
    // 绑定代币
    const bondAmount = api.createType('Balance', optimization.optimalAmount);
    const bondCall = await bondTokens(api, alice.address, bondAmount, 'Staked');
    
    // 提名验证者
    const nominateCall = await nominateValidators(api, optimalValidators);
    
    // 创建批量调用
    const batchCall = api.tx.utility.batch([bondCall, nominateCall]);
    
    // 执行质押操作
    console.log('\n=== Executing Staking Operations ===');
    const txHash = await batchCall.signAndSend(alice, ({ status, events }) => {
      if (status.isInBlock) {
        console.log(`Staking operations included in block ${status.asInBlock}`);
      } else if (status.isFinalized) {
        console.log(`Staking operations finalized in block ${status.asFinalized}`);
        
        events.forEach(({ event: { data, method, section } }) => {
          if (section === 'staking') {
            console.log(`Staking event: ${method}`, data.toString());
          }
        });
      }
    });
    
    console.log('✅ Staking operations completed successfully');
    console.log('Transaction hash:', txHash);
    
    // 等待操作确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 检查新的质押状态
    console.log('\n=== Updated Staking Status ===');
    const newStakingInfo = await getStakingInfo(api, alice.address);
    
    if (newStakingInfo) {
      console.log('New total bonded:', newStakingInfo.total);
      console.log('New active bonded:', newStakingInfo.active);
    }
    
    return {
      txHash,
      validators: optimalValidators,
      optimization
    };
    
  } catch (error) {
    console.error('Staking example failed:', error);
  } finally {
    await api.disconnect();
  }
}

// 运行示例
comprehensiveStakingExample().catch(console.error);
```

## 最佳实践

1. **验证者选择**: 选择佣金低、表现稳定的验证者
2. **质押金额**: 保持足够的流动性，不要质押全部余额
3. **定期监控**: 监控质押状态和验证者表现
4. **风险分散**: 提名多个验证者以分散风险
5. **费用考虑**: 考虑质押操作的交易费用

## 常见问题

### Q: 质押需要多少代币？
A: 需要满足网络的最小质押要求，具体金额因网络而异。

### Q: 质押奖励如何计算？
A: 奖励基于质押数量、验证者表现和网络通胀率。

### Q: 可以随时解绑代币吗？
A: 可以，但需要等待解绑期结束才能提取。

### Q: 质押有风险吗？
A: 有风险，包括验证者被惩罚、网络攻击等。
