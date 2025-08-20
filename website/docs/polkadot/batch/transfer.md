# 批量转账

Polkadot 批量转账允许在一次交易中向多个地址发送代币，这可以显著降低交易费用并提高效率。本指南将介绍如何实现批量转账功能。

## 批量转账概述

批量转账具有以下优势：

- **成本效益**: 减少总交易费用
- **效率提升**: 一次交易完成多个转账
- **时间节省**: 避免多次等待交易确认
- **原子性**: 要么全部成功，要么全部失败

## 基本批量转账

### 创建批量转账调用

```javascript
async function createBatchTransfer(api, transfers) {
  try {
    console.log('=== Creating Batch Transfer ===');
    
    // 验证输入
    if (!Array.isArray(transfers) || transfers.length === 0) {
      throw new Error('Transfers array must not be empty');
    }
    
    // 创建转账调用数组
    const calls = transfers.map(({ to, amount }, index) => {
      console.log(`Transfer ${index + 1}: ${amount} to ${to}`);
      return api.tx.balances.transfer(to, amount);
    });
    
    // 创建批量调用
    const batchCall = api.tx.utility.batch(calls);
    
    console.log(`Created batch transfer with ${calls.length} transfers`);
    console.log('Batch call hash:', batchCall.method.hash);
    
    return batchCall;
    
  } catch (error) {
    console.error('Failed to create batch transfer:', error);
    throw error;
  }
}
```

### 执行批量转账

```javascript
async function executeBatchTransfer(api, batchCall, signer) {
  try {
    console.log('=== Executing Batch Transfer ===');
    
    // 获取费用信息
    const paymentInfo = await batchCall.paymentInfo(signer);
    console.log('Transaction fee:', paymentInfo.partialFee.toHuman());
    
    // 签名并发送交易
    const txHash = await batchCall.signAndSend(signer, ({ status, events }) => {
      if (status.isInBlock) {
        console.log(`Batch transfer included in block ${status.asInBlock}`);
      } else if (status.isFinalized) {
        console.log(`Batch transfer finalized in block ${status.asFinalized}`);
        
        // 处理转账事件
        let transferCount = 0;
        events.forEach(({ event: { data, method, section } }) => {
          if (section === 'balances' && method === 'Transfer') {
            transferCount++;
            const [from, to, amount] = data;
            console.log(`Transfer ${transferCount}: ${amount.toHuman()} from ${from} to ${to}`);
          }
        });
        
        console.log(`Total transfers executed: ${transferCount}`);
      }
    });
    
    console.log('✅ Batch transfer executed successfully');
    console.log('Transaction hash:', txHash);
    
    return txHash;
    
  } catch (error) {
    console.error('❌ Failed to execute batch transfer:', error);
    throw error;
  }
}
```

## 高级批量转账功能

### 条件批量转账

```javascript
async function createConditionalBatchTransfer(api, transfers, conditions) {
  try {
    console.log('=== Creating Conditional Batch Transfer ===');
    
    const calls = [];
    
    transfers.forEach((transfer, index) => {
      const condition = conditions[index];
      
      if (condition) {
        // 创建条件转账
        const conditionalCall = api.tx.utility.if(
          condition,
          api.tx.balances.transfer(transfer.to, transfer.amount)
        );
        calls.push(conditionalCall);
        console.log(`Conditional transfer ${index + 1}: ${transfer.amount} to ${transfer.to}`);
      } else {
        // 创建无条件转账
        calls.push(api.tx.balances.transfer(transfer.to, transfer.amount));
        console.log(`Unconditional transfer ${index + 1}: ${transfer.amount} to ${transfer.to}`);
      }
    });
    
    const batchCall = api.tx.utility.batch(calls);
    
    console.log(`Created conditional batch transfer with ${calls.length} transfers`);
    return batchCall;
    
  } catch (error) {
    console.error('Failed to create conditional batch transfer:', error);
    throw error;
  }
}
```

### 分批处理大量转账

```javascript
async function createChunkedBatchTransfer(api, transfers, chunkSize = 100) {
  try {
    console.log('=== Creating Chunked Batch Transfer ===');
    
    const chunks = [];
    
    // 将转账分成多个批次
    for (let i = 0; i < transfers.length; i += chunkSize) {
      const chunk = transfers.slice(i, i + chunkSize);
      const chunkCalls = chunk.map(({ to, amount }) => 
        api.tx.balances.transfer(to, amount)
      );
      
      const batchCall = api.tx.utility.batch(chunkCalls);
      chunks.push(batchCall);
      
      console.log(`Chunk ${chunks.length}: ${chunk.length} transfers`);
    }
    
    console.log(`Created ${chunks.length} chunks for ${transfers.length} total transfers`);
    return chunks;
    
  } catch (error) {
    console.error('Failed to create chunked batch transfer:', error);
    throw error;
  }
}
```

### 批量转账验证

```javascript
async function validateBatchTransfer(api, transfers, signer) {
  try {
    console.log('=== Validating Batch Transfer ===');
    
    const validationResults = [];
    
    for (const transfer of transfers) {
      // 验证地址格式
      const isValidAddress = api.createType('AccountId', transfer.to);
      
      // 验证金额
      const isValidAmount = transfer.amount > 0;
      
      // 检查发送者余额
      const accountInfo = await api.query.system.account(signer.address);
      const hasEnoughBalance = accountInfo.data.free.gte(transfer.amount);
      
      validationResults.push({
        to: transfer.to,
        amount: transfer.amount,
        isValidAddress: isValidAddress !== null,
        isValidAmount,
        hasEnoughBalance: hasEnoughBalance.toHuman()
      });
      
      console.log(`Validation for ${transfer.to}:`, {
        addressValid: isValidAddress !== null,
        amountValid: isValidAmount,
        sufficientBalance: hasEnoughBalance.toHuman()
      });
    }
    
    const allValid = validationResults.every(result => 
      result.isValidAddress && result.isValidAmount && result.hasEnoughBalance !== 'false'
    );
    
    console.log('All transfers valid:', allValid);
    
    return {
      results: validationResults,
      allValid
    };
    
  } catch (error) {
    console.error('Failed to validate batch transfer:', error);
    throw error;
  }
}
```

## 批量转账优化

### 费用优化

```javascript
async function optimizeBatchTransferFees(api, transfers) {
  try {
    console.log('=== Optimizing Batch Transfer Fees ===');
    
    // 计算单个转账的总费用
    const singleTransferFee = await api.tx.balances.transfer(
      '5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtChDnVK9Fn9dZ',
      1000000000000
    ).paymentInfo('5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtChDnVK9Fn9dZ');
    
    const singleFee = singleTransferFee.partialFee;
    const totalSingleFees = singleFee.muln(transfers.length);
    
    // 计算批量转账费用
    const batchCalls = transfers.map(({ to, amount }) => 
      api.tx.balances.transfer(to, amount)
    );
    
    const batchCall = api.tx.utility.batch(batchCalls);
    const batchFee = await batchCall.paymentInfo('5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtChDnVK9Fn9dZ');
    
    const savings = totalSingleFees.sub(batchFee.partialFee);
    const savingsPercentage = savings.muln(100).div(totalSingleFees);
    
    console.log('Fee comparison:');
    console.log('Single transfers total fee:', totalSingleFees.toHuman());
    console.log('Batch transfer fee:', batchFee.partialFee.toHuman());
    console.log('Fee savings:', savings.toHuman());
    console.log('Savings percentage:', savingsPercentage.toNumber(), '%');
    
    return {
      singleFees: totalSingleFees.toHuman(),
      batchFee: batchFee.partialFee.toHuman(),
      savings: savings.toHuman(),
      savingsPercentage: savingsPercentage.toNumber()
    };
    
  } catch (error) {
    console.error('Failed to optimize batch transfer fees:', error);
    throw error;
  }
}
```

### 权重优化

```javascript
async function optimizeBatchTransferWeight(api, transfers) {
  try {
    console.log('=== Optimizing Batch Transfer Weight ===');
    
    // 计算单个转账的权重
    const singleTransferWeight = await api.tx.balances.transfer(
      '5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtChDnVK9Fn9dZ',
      1000000000000
    ).paymentInfo('5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtChDnVK9Fn9dZ');
    
    const singleWeight = singleTransferWeight.weight;
    const totalSingleWeight = singleWeight.muln(transfers.length);
    
    // 计算批量转账的权重
    const batchCalls = transfers.map(({ to, amount }) => 
      api.tx.balances.transfer(to, amount)
    );
    
    const batchCall = api.tx.utility.batch(batchCalls);
    const batchWeight = await batchCall.paymentInfo('5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtChDnVK9Fn9dZ');
    
    const weightReduction = totalSingleWeight.sub(batchWeight.weight);
    const weightReductionPercentage = weightReduction.muln(100).div(totalSingleWeight);
    
    console.log('Weight comparison:');
    console.log('Single transfers total weight:', totalSingleWeight.toNumber());
    console.log('Batch transfer weight:', batchWeight.weight.toNumber());
    console.log('Weight reduction:', weightReduction.toNumber());
    console.log('Weight reduction percentage:', weightReductionPercentage.toNumber(), '%');
    
    return {
      singleWeight: totalSingleWeight.toNumber(),
      batchWeight: batchWeight.weight.toNumber(),
      weightReduction: weightReduction.toNumber(),
      weightReductionPercentage: weightReductionPercentage.toNumber()
    };
    
  } catch (error) {
    console.error('Failed to optimize batch transfer weight:', error);
    throw error;
  }
}
```

## 完整示例

```javascript
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { formatBalance } = require('@polkadot/util');

async function comprehensiveBatchTransferExample() {
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
    
    // 准备批量转账数据
    const transfers = [
      { to: '5F1GPrYp5Q32Hr3hczZXoJCTxNhuQxsBbABtSjDnVK9Fn9dZ', amount: 1000000000000 }, // 1 WND
      { to: '5CGGhuAeRYtC4f4Uxu6gc3yHPW3ZEwiCXLVS2nv8pFKkSJs8', amount: 2000000000000 }, // 2 WND
      { to: '5F4rLDtniR4Mod3WSxNgwH9NmCyFz57tsgWi7eRsBMH7cuYb', amount: 1500000000000 }, // 1.5 WND
      { to: '5CPWYjgP8FMqMFEuS98vit2M1dwKy7wicL9BdvD4RGed2DqC', amount: 500000000000 }   // 0.5 WND
    ];
    
    console.log('\nPrepared transfers:', transfers.length);
    transfers.forEach((transfer, index) => {
      console.log(`${index + 1}. ${formatBalance(transfer.amount)} to ${transfer.to}`);
    });
    
    // 验证批量转账
    console.log('\n=== Validating Transfers ===');
    const validation = await validateBatchTransfer(api, transfers, alice);
    
    if (!validation.allValid) {
      console.log('❌ Some transfers are invalid, cannot proceed');
      return;
    }
    
    // 优化费用和权重
    console.log('\n=== Optimizing Fees and Weight ===');
    const feeOptimization = await optimizeBatchTransferFees(api, transfers);
    const weightOptimization = await optimizeBatchTransferWeight(api, transfers);
    
    // 创建批量转账
    console.log('\n=== Creating Batch Transfer ===');
    const batchCall = await createBatchTransfer(api, transfers);
    
    // 执行批量转账
    console.log('\n=== Executing Batch Transfer ===');
    const txHash = await executeBatchTransfer(api, batchCall, alice);
    
    // 等待交易确认
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 检查结果
    console.log('\n=== Checking Results ===');
    const accountInfo = await api.query.system.account(alice.address);
    console.log('Alice remaining balance:', formatBalance(accountInfo.data.free));
    
    console.log('\n✅ Batch transfer completed successfully!');
    console.log('Transaction hash:', txHash);
    console.log('Fee savings:', feeOptimization.savings);
    console.log('Weight reduction:', weightOptimization.weightReductionPercentage, '%');
    
    return {
      txHash,
      feeOptimization,
      weightOptimization
    };
    
  } catch (error) {
    console.error('Batch transfer example failed:', error);
  } finally {
    await api.disconnect();
  }
}

// 运行示例
comprehensiveBatchTransferExample().catch(console.error);
```

## 最佳实践

1. **验证输入**: 始终验证转账地址和金额
2. **费用优化**: 使用批量转账减少总费用
3. **权重管理**: 监控交易的权重限制
4. **错误处理**: 处理批量转账失败的情况
5. **分批处理**: 对于大量转账，考虑分批处理

## 常见问题

### Q: 批量转账有数量限制吗？
A: 理论上没有限制，但建议控制在合理范围内以避免权重问题。

### Q: 批量转账失败会回滚吗？
A: 是的，批量转账是原子性的，失败时会回滚所有操作。

### Q: 如何估算批量转账费用？
A: 使用 `paymentInfo` 方法获取准确的费用信息。

### Q: 可以混合不同类型的调用吗？
A: 可以，`utility.batch` 支持任何类型的调用组合。
