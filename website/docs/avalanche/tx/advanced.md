# Avalanche 高级交易构建

本指南将介绍如何在 Avalanche 上进行高级交易构建，包括手动构建交易结构、自定义输入输出和复杂的交易类型。

## 基本概念

### 1. 高级交易构建的优势

- **精确控制**: 可以精确控制交易的每个部分
- **自定义逻辑**: 实现复杂的业务逻辑
- **性能优化**: 优化 UTXO 选择和费用计算
- **批量处理**: 支持复杂的批量操作

### 2. 交易组件

- **Inputs**: 交易输入（消耗的 UTXO）
- **Outputs**: 交易输出（创建的 UTXO）
- **Memo**: 交易备注
- **Credentials**: 签名凭证

## 环境设置

```javascript
const createHash = require('create-hash');
const { Avalanche, BinTools, Buffer, BN, utils, avm, common } = require('avalanche');
const { UTXOSet, UTXO, SECPTransferInput, TransferableInput, BaseTx, UnsignedTx, SECPTransferOutput, TransferableOutput } = avm;
const { Defaults, PrivateKeyPrefix, Serialization } = utils;
require('dotenv').config();

// 网络配置
const networkID = 5;
const avalanche = new Avalanche('api.avax-test.network', 443, 'https', networkID);
const xchain = avalanche.XChain();
const keychain = xchain.keyChain();

// 工具实例
const bintools = BinTools.getInstance();
const serialization = Serialization.getInstance();

// 获取网络配置
const blockchainID = Defaults.network[networkID].X.blockchainID;
const avaxAssetID = Defaults.network[networkID].X.avaxAssetID;
const avaxAssetIDBuf = bintools.cb58Decode(avaxAssetID);
```

## 手动构建交易输入

### 1. 创建 SECPTransferInput

```javascript
function createSECPTransferInput(amount, addressIndex = 0) {
  try {
    // 创建 SECP 转移输入
    const secpTransferInput = new SECPTransferInput(amount);
    
    // 设置签名索引
    secpTransferInput.addSignatureIdx(addressIndex, addressIndex);
    
    console.log('=== SECP 转移输入创建 ===');
    console.log('金额:', amount.toString());
    console.log('签名索引:', addressIndex);
    
    return secpTransferInput;
    
  } catch (error) {
    console.error('创建 SECP 转移输入失败:', error);
    throw error;
  }
}

// 使用示例
const amount = new BN('1000000000'); // 1 AVAX
const secpInput = createSECPTransferInput(amount, 0);
```

### 2. 创建 TransferableInput

```javascript
function createTransferableInput(txid, outputIdx, assetID, input) {
  try {
    // 创建可转移输入
    const transferableInput = new TransferableInput(
      txid,      // 交易 ID
      outputIdx, // 输出索引
      assetID,   // 资产 ID
      input      // 输入对象
    );
    
    console.log('=== 可转移输入创建 ===');
    console.log('交易 ID:', txid);
    console.log('输出索引:', outputIdx);
    console.log('资产 ID:', assetID);
    
    return transferableInput;
    
  } catch (error) {
    console.error('创建可转移输入失败:', error);
    throw error;
  }
}
```

### 3. 批量创建输入

```javascript
async function createBatchInputs(address) {
  try {
    // 获取地址的 UTXO
    const utxoResponse = await xchain.getUTXOs(address);
    const utxoSet = utxoResponse.utxos;
    const utxos = utxoSet.getAllUTXOs();
    
    const inputs = [];
    
    utxos.forEach((utxo, index) => {
      const amountOutput = utxo.getOutput();
      const amount = amountOutput.getAmount().clone();
      const txid = utxo.getTxID();
      const outputIdx = utxo.getOutputIdx();
      
      // 创建 SECP 转移输入
      const secpTransferInput = new SECPTransferInput(amount);
      secpTransferInput.addSignatureIdx(0, 0);
      
      // 创建可转移输入
      const input = new TransferableInput(
        txid, 
        outputIdx, 
        avaxAssetIDBuf, 
        secpTransferInput
      );
      
      inputs.push(input);
      
      console.log(`输入 ${index} 创建成功:`);
      console.log(`  金额: ${amount.toString()}`);
      console.log(`  交易 ID: ${txid}`);
      console.log(`  输出索引: ${outputIdx}`);
    });
    
    return inputs;
    
  } catch (error) {
    console.error('批量创建输入失败:', error);
    throw error;
  }
}

// 使用示例
const inputs = await createBatchInputs(address);
```

## 手动构建交易输出

### 1. 创建 SECPTransferOutput

```javascript
function createSECPTransferOutput(amount, addresses, locktime = 0, threshold = 1) {
  try {
    // 创建 SECP 转移输出
    const secpTransferOutput = new SECPTransferOutput(
      amount,     // 金额
      addresses,  // 地址列表
      locktime,   // 锁定时间
      threshold   // 阈值
    );
    
    console.log('=== SECP 转移输出创建 ===');
    console.log('金额:', amount.toString());
    console.log('地址数量:', addresses.length);
    console.log('锁定时间:', locktime);
    console.log('阈值:', threshold);
    
    return secpTransferOutput;
    
  } catch (error) {
    console.error('创建 SECP 转移输出失败:', error);
    throw error;
  }
}
```

### 2. 创建 TransferableOutput

```javascript
function createTransferableOutput(assetID, output) {
  try {
    // 创建可转移输出
    const transferableOutput = new TransferableOutput(assetID, output);
    
    console.log('=== 可转移输出创建 ===');
    console.log('资产 ID:', assetID);
    console.log('输出类型:', output.constructor.name);
    
    return transferableOutput;
    
  } catch (error) {
    console.error('创建可转移输出失败:', error);
    throw error;
  }
}
```

### 3. 批量创建输出

```javascript
function createBatchOutputs(recipients, assetID) {
  const outputs = [];
  
  recipients.forEach((recipient, index) => {
    // 解析地址
    const addressBuffer = xchain.parseAddress(recipient.address);
    
    // 创建 SECP 转移输出
    const secpTransferOutput = new SECPTransferOutput(
      new BN(recipient.amount),
      [addressBuffer],
      new BN(0),  // 锁定时间
      1           // 阈值
    );
    
    // 创建可转移输出
    const transferableOutput = new TransferableOutput(assetID, secpTransferOutput);
    outputs.push(transferableOutput);
    
    console.log(`输出 ${index} 创建成功:`);
    console.log(`  地址: ${recipient.address}`);
    console.log(`  金额: ${recipient.amount}`);
  });
  
  return outputs;
}

// 使用示例
const recipients = [
  { address: 'X-fuji1address1', amount: '1000000000' },  // 1 AVAX
  { address: 'X-fuji1address2', amount: '2000000000' },  // 2 AVAX
  { address: 'X-fuji1address3', amount: '500000000' }    // 0.5 AVAX
];

const outputs = createBatchOutputs(recipients, avaxAssetIDBuf);
```

## 构建完整交易

### 1. 创建 BaseTx

```javascript
function createBaseTransaction(networkID, blockchainID, outputs, inputs, memo = '') {
  try {
    // 创建基础交易
    const baseTx = new BaseTx(
      networkID,      // 网络 ID
      blockchainID,   // 区块链 ID
      outputs,        // 输出列表
      inputs,         // 输入列表
      memo            // 备注
    );
    
    console.log('=== 基础交易创建 ===');
    console.log('网络 ID:', networkID);
    console.log('区块链 ID:', blockchainID);
    console.log('输出数量:', outputs.length);
    console.log('输入数量:', inputs.length);
    console.log('备注:', memo);
    
    return baseTx;
    
  } catch (error) {
    console.error('创建基础交易失败:', error);
    throw error;
  }
}

// 使用示例
const memo = Buffer.from('AVM BaseTx to send AVAX');
const baseTx = createBaseTransaction(
  networkID,
  bintools.cb58Decode(blockchainID),
  outputs,
  inputs,
  memo
);
```

### 2. 创建未签名交易

```javascript
function createUnsignedTransaction(baseTx) {
  try {
    // 创建未签名交易
    const unsignedTx = new UnsignedTx(baseTx);
    
    console.log('=== 未签名交易创建 ===');
    console.log('交易类型:', unsignedTx.getTransaction().constructor.name);
    
    return unsignedTx;
    
  } catch (error) {
    console.error('创建未签名交易失败:', error);
    throw error;
  }
}

// 使用示例
const unsignedTx = createUnsignedTransaction(baseTx);
```

### 3. 签名和发送交易

```javascript
async function signAndSendTransaction(unsignedTx, keychain) {
  try {
    console.log('=== 交易签名和发送 ===');
    
    // 签名交易
    const signedTx = unsignedTx.sign(keychain);
    console.log('交易签名成功');
    
    // 序列化交易
    const hexData = signedTx.toBuffer().toString('hex');
    console.log('签名后交易 (hex):', hexData);
    
    // 计算交易 ID
    const buffer = Buffer.from(createHash('sha256').update(signedTx.toBuffer()).digest().buffer);
    const txid = serialization.bufferToType(buffer, 'cb58');
    console.log('计算的交易 ID:', txid);
    
    // 发送交易
    const networkTxid = await xchain.issueTx(signedTx);
    console.log('网络返回的交易 ID:', networkTxid);
    
    return {
      signedTx: signedTx,
      calculatedTxid: txid,
      networkTxid: networkTxid,
      hexData: hexData
    };
    
  } catch (error) {
    console.error('交易签名和发送失败:', error);
    throw error;
  }
}
```

## 高级功能

### 1. 自定义 UTXO 选择策略

```javascript
class UTXOSelector {
  constructor() {
    this.strategies = {
      'largest_first': this.largestFirst,
      'smallest_first': this.smallestFirst,
      'optimal': this.optimal
    };
  }
  
  // 最大优先策略
  largestFirst(utxos, targetAmount) {
    const sortedUtxos = utxos.sort((a, b) => {
      return b.getOutput().getAmount().sub(a.getOutput().getAmount());
    });
    
    return this.selectUTXOs(sortedUtxos, targetAmount);
  }
  
  // 最小优先策略
  smallestFirst(utxos, targetAmount) {
    const sortedUtxos = utxos.sort((a, b) => {
      return a.getOutput().getAmount().sub(b.getOutput().getAmount());
    });
    
    return this.selectUTXOs(sortedUtxos, targetAmount);
  }
  
  // 最优策略（最小化 UTXO 数量）
  optimal(utxos, targetAmount) {
    // 实现动态规划算法选择最优 UTXO 组合
    const utxoArray = utxos.map(utxo => ({
      utxo: utxo,
      amount: utxo.getOutput().getAmount()
    }));
    
    return this.dynamicProgrammingSelection(utxoArray, targetAmount);
  }
  
  // 选择 UTXO
  selectUTXOs(sortedUtxos, targetAmount) {
    const selected = [];
    let currentAmount = new BN(0);
    
    for (const utxo of sortedUtxos) {
      if (currentAmount.gte(targetAmount)) {
        break;
      }
      
      selected.push(utxo);
      currentAmount = currentAmount.add(utxo.getOutput().getAmount());
    }
    
    return {
      selected: selected,
      totalAmount: currentAmount,
      sufficient: currentAmount.gte(targetAmount)
    };
  }
  
  // 动态规划选择（简化版本）
  dynamicProgrammingSelection(utxoArray, targetAmount) {
    // 这里实现一个简化的动态规划算法
    // 实际应用中可以使用更复杂的算法
    
    const dp = new Array(targetAmount.toNumber() + 1).fill(Infinity);
    const selected = new Array(targetAmount.toNumber() + 1).fill([]);
    
    dp[0] = 0;
    selected[0] = [];
    
    for (let i = 1; i <= targetAmount.toNumber(); i++) {
      for (const { utxo, amount } of utxoArray) {
        if (amount.lte(i) && dp[i - amount.toNumber()] + 1 < dp[i]) {
          dp[i] = dp[i - amount.toNumber()] + 1;
          selected[i] = [...selected[i - amount.toNumber()], utxo];
        }
      }
    }
    
    return {
      selected: selected[targetAmount.toNumber()] || [],
      totalAmount: targetAmount,
      sufficient: dp[targetAmount.toNumber()] !== Infinity
    };
  }
}

// 使用示例
const selector = new UTXOSelector();
const utxos = await getUTXOs(address);

// 使用不同策略选择 UTXO
const largestFirstResult = selector.largestFirst(utxos, new BN('1000000000'));
const optimalResult = selector.optimal(utxos, new BN('1000000000'));

console.log('最大优先策略结果:', largestFirstResult);
console.log('最优策略结果:', optimalResult);
```

### 2. 交易费用优化

```javascript
class FeeOptimizer {
  constructor(xchain) {
    this.xchain = xchain;
    this.defaultFee = xchain.getDefaultTxFee();
  }
  
  // 计算最优费用
  calculateOptimalFee(priority = 'normal') {
    const feeMultipliers = {
      'low': 0.8,
      'normal': 1.0,
      'high': 1.2,
      'urgent': 1.5
    };
    
    const multiplier = feeMultipliers[priority] || 1.0;
    const optimalFee = this.defaultFee.mul(new BN(Math.floor(multiplier * 100))).div(new BN(100));
    
    console.log('=== 费用优化 ===');
    console.log('优先级:', priority);
    console.log('默认费用:', this.defaultFee.toString());
    console.log('最优费用:', optimalFee.toString());
    
    return optimalFee;
  }
  
  // 批量交易费用优化
  calculateBatchFee(transactionCount, priority = 'normal') {
    const baseFee = this.calculateOptimalFee(priority);
    
    // 批量交易可能有折扣
    let discount = 1.0;
    if (transactionCount >= 10) {
      discount = 0.9;
    } else if (transactionCount >= 5) {
      discount = 0.95;
    }
    
    const batchFee = baseFee.mul(new BN(Math.floor(discount * 100))).div(new BN(100));
    
    console.log('批量交易费用:', batchFee.toString());
    console.log('折扣:', discount);
    
    return batchFee;
  }
}

// 使用示例
const feeOptimizer = new FeeOptimizer(xchain);
const optimalFee = feeOptimizer.calculateOptimalFee('high');
const batchFee = feeOptimizer.calculateBatchFee(5, 'normal');
```

### 3. 交易验证器

```javascript
class TransactionValidator {
  constructor() {
    this.rules = [];
  }
  
  // 添加验证规则
  addRule(rule) {
    this.rules.push(rule);
  }
  
  // 验证交易
  validateTransaction(transaction) {
    const results = [];
    
    for (const rule of this.rules) {
      try {
        const result = rule(transaction);
        results.push({
          rule: rule.name || 'Unknown',
          passed: result.passed,
          message: result.message
        });
      } catch (error) {
        results.push({
          rule: rule.name || 'Unknown',
          passed: false,
          message: `验证失败: ${error.message}`
        });
      }
    }
    
    const allPassed = results.every(r => r.passed);
    
    console.log('=== 交易验证结果 ===');
    results.forEach(result => {
      console.log(`${result.rule}: ${result.passed ? '通过' : '失败'} - ${result.message}`);
    });
    console.log(`总体结果: ${allPassed ? '通过' : '失败'}`);
    
    return {
      passed: allPassed,
      results: results
    };
  }
}

// 定义验证规则
const balanceRule = (transaction) => {
  // 检查输入输出平衡
  const inputs = transaction.getIns();
  const outputs = transaction.getOuts();
  
  let totalInput = new BN(0);
  let totalOutput = new BN(0);
  
  inputs.forEach(input => {
    totalInput = totalInput.add(input.getInput().getAmount());
  });
  
  outputs.forEach(output => {
    totalOutput = totalOutput.add(output.getOutput().getAmount());
  });
  
  const fee = totalInput.sub(totalOutput);
  const isValid = fee.gte(new BN(0));
  
  return {
    passed: isValid,
    message: `费用: ${fee.toString()}`
  };
};

const addressRule = (transaction) => {
  // 检查地址格式
  const outputs = transaction.getOuts();
  let allValid = true;
  
  outputs.forEach(output => {
    const addresses = output.getOutput().getAddresses();
    addresses.forEach(address => {
      // 这里可以添加地址格式验证逻辑
      if (address.length !== 20) {
        allValid = false;
      }
    });
  });
  
  return {
    passed: allValid,
    message: '地址格式正确'
  };
};

// 使用验证器
const validator = new TransactionValidator();
validator.addRule(balanceRule);
validator.addRule(addressRule);

const validationResult = validator.validateTransaction(baseTx);
```

## 完整示例

```javascript
async function advancedTransactionExample() {
  try {
    console.log('=== 高级交易构建示例 ===');
    
    // 1. 准备账户
    const { SECRET_KEY_1 } = process.env;
    const keyPair = keychain.importKey(Buffer.from(SECRET_KEY_1, 'hex'));
    const address = keyPair.getAddressString();
    
    // 2. 获取 UTXO
    const utxos = await getUTXOs(address);
    
    // 3. 使用 UTXO 选择器
    const selector = new UTXOSelector();
    const selectionResult = selector.optimal(utxos.getAllUTXOs(), new BN('1000000000'));
    
    if (!selectionResult.sufficient) {
      throw new Error('UTXO 不足');
    }
    
    // 4. 创建输入
    const inputs = [];
    selectionResult.selected.forEach(utxo => {
      const amount = utxo.getOutput().getAmount();
      const secpInput = new SECPTransferInput(amount);
      secpInput.addSignatureIdx(0, 0);
      
      const input = new TransferableInput(
        utxo.getTxID(),
        utxo.getOutputIdx(),
        avaxAssetIDBuf,
        secpInput
      );
      
      inputs.push(input);
    });
    
    // 5. 创建输出
    const recipients = [
      { address: 'X-fuji1address1', amount: '1000000000' }
    ];
    
    const outputs = createBatchOutputs(recipients, avaxAssetIDBuf);
    
    // 6. 创建交易
    const memo = Buffer.from('Advanced transaction example');
    const baseTx = createBaseTransaction(
      networkID,
      bintools.cb58Decode(blockchainID),
      outputs,
      inputs,
      memo
    );
    
    // 7. 验证交易
    const validator = new TransactionValidator();
    validator.addRule(balanceRule);
    validator.addRule(addressRule);
    
    const validationResult = validator.validateTransaction(baseTx);
    if (!validationResult.passed) {
      throw new Error('交易验证失败');
    }
    
    // 8. 创建未签名交易
    const unsignedTx = createUnsignedTransaction(baseTx);
    
    // 9. 签名和发送
    const result = await signAndSendTransaction(unsignedTx, keychain);
    
    console.log('=== 示例完成 ===');
    console.log('交易 ID:', result.networkTxid);
    
    return result;
    
  } catch (error) {
    console.error('高级交易示例失败:', error);
    throw error;
  }
}

// 运行示例
advancedTransactionExample()
  .then(result => {
    console.log('示例执行成功:', result);
  })
  .catch(error => {
    console.error('示例执行失败:', error);
  });
```

## 下一步

- [离线签名](./offline-signing.md) - 学习离线交易签名
- [交易解码](./decode.md) - 了解如何解码和分析交易
- [批量操作](./batch.md) - 学习批量交易处理
