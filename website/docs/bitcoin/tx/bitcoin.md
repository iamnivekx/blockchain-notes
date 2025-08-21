# 比特币交易构建

比特币交易是UTXO（未花费交易输出）的转移，本文档将详细介绍如何使用bitcoinjs-lib构建、签名和广播比特币交易。

## 交易概述

比特币交易具有以下特点：

1. **UTXO模型**: 消费未花费的交易输出
2. **数字签名**: 使用私钥证明所有权
3. **脚本验证**: 通过脚本系统验证交易
4. **网络广播**: 向网络广播已签名交易

## 核心依赖

```javascript
const { ECPair, Psbt, networks, payments } = require('bitcoinjs-lib');
```

## 环境配置

### 网络选择

```javascript
// 测试网络
const network = networks.testnet;

// 主网络
// const network = networks.bitcoin;

// 回归测试网络
// const network = networks.regtest;
```

### 密钥配置

```javascript
require('dotenv').config();

// 从环境变量读取私钥
const secret = process.env.ECDSA_SECRET;

// 创建密钥对
const signer = ECPair.fromPrivateKey(Buffer.from(secret, 'hex'), network);
const pubkey = signer.publicKey;

console.log('Public Key:', pubkey.toString('hex'));
```

## 地址生成

### P2PKH地址

```javascript
// 生成P2PKH地址
const { address } = payments.p2pkh({ pubkey, network });
console.log('P2PKH Address:', address);
```

### 其他地址类型

```javascript
// P2WPKH地址 (SegWit)
const { address: segwitAddress } = payments.p2wpkh({ pubkey, network });
console.log('SegWit Address:', segwitAddress);

// P2SH-P2WPKH地址 (嵌套SegWit)
const { address: nestedSegwitAddress } = payments.p2sh({
  redeem: payments.p2wpkh({ pubkey, network }),
  network
});
console.log('Nested SegWit Address:', nestedSegwitAddress);
```

## PSBT交易构建

### 基本交易结构

```javascript
function createPsbtTx() {
  // 创建PSBT实例
  const psbt = new Psbt({ network });
  
  // 设置交易版本
  psbt.setVersion(2);
  
  // 设置锁定时间
  psbt.setLocktime(0);
  
  return psbt;
}
```

### 添加输入

```javascript
// 添加交易输入
psbt.addInput({
  hash: '3b948165cfb707320ccdc9582b5acc7cdad213bc81b7edb37546e1334d802b38',
  index: 0,
  sequence: 0xffffffff,
  // 非见证UTXO数据
  nonWitnessUtxo: Buffer.from('0100000001b2533a7e2329b92b576309969ef39e987f1ce62d76d1a3e714e1f73b830f7404010000006b483045022100e950df33415553a6cdd9665d4d6d3f03568ad0e2feb429efe19f4fc78da66714022059e3ffdf36d300a9352b971f8c48180ec0cef2325f61948488480430bc24d1ed012102ff26c5980685ae12d25312a8df8224c951a68272013425ffa60327d7d4b54231ffffffff0210270000000000001976a914dc6c3c43e5d2c934602095103d3cbf84ddc797f288ace71a0100000000001976a914dc6c3c43e5d2c934602095103d3cbf84ddc797f288ac00000000', 'hex')
});
```

### 添加输出

```javascript
// 添加交易输出
psbt.addOutput({
  address: 'n1cScasu6XVoDki38WYAJH4ZJGRAfG8XRN',
  value: 9800  // 单位：聪
});

// 添加找零输出
psbt.addOutput({
  address: address, // 发送回自己的地址
  value: 40000     // 找零金额
});
```

## 交易签名

### 基本签名

```javascript
// 签名指定输入
psbt.signInput(0, signer);

// 验证签名
const isValid = psbt.validateSignaturesOfInput(0);
console.log('Signature valid:', isValid);
```

### 批量签名

```javascript
// 签名所有输入
function signAllInputs(psbt, signer) {
  for (let i = 0; i < psbt.inputCount; i++) {
    try {
      psbt.signInput(i, signer);
    } catch (error) {
      console.error(`Failed to sign input ${i}:`, error.message);
    }
  }
}
```

## 交易完成

### 最终化交易

```javascript
// 最终化所有输入
psbt.finalizeAllInputs();

// 提取交易
const transaction = psbt.extractTransaction();

// 获取序列化数据
const serialized = transaction.toHex();
console.log('Serialized transaction:', serialized);

// 获取交易ID
const txid = transaction.getId();
console.log('Transaction ID:', txid);
```

### 验证交易

```javascript
function validateTransaction(psbt) {
  try {
    // 验证所有签名
    for (let i = 0; i < psbt.inputCount; i++) {
      const isValid = psbt.validateSignaturesOfInput(i);
      if (!isValid) {
        throw new Error(`Invalid signature for input ${i}`);
      }
    }
    
    // 检查费用合理性
    const fee = psbt.getFee();
    console.log('Transaction fee:', fee, 'satoshis');
    
    return true;
  } catch (error) {
    console.error('Transaction validation failed:', error.message);
    return false;
  }
}
```

## 高级功能

### 多重签名交易

```javascript
function createMultisigTx(m, pubkeys, network) {
  // 创建多重签名脚本
  const multisigScript = payments.p2ms({
    m: m,
    pubkeys: pubkeys,
    network: network
  });
  
  // 创建P2SH地址
  const { address } = payments.p2sh({
    redeem: multisigScript,
    network: network
  });
  
  return address;
}
```

### 时间锁交易

```javascript
function createTimelockTx(locktime) {
  const psbt = new Psbt({ network });
  
  // 设置绝对时间锁
  psbt.setLocktime(locktime);
  
  // 设置相对时间锁
  psbt.addInput({
    hash: 'previous_tx_hash',
    index: 0,
    sequence: 0x80000001 // 相对时间锁1个区块
  });
  
  return psbt;
}
```

### RBF (Replace-by-Fee)

```javascript
function createRBFTx() {
  const psbt = new Psbt({ network });
  
  // 启用RBF（sequence < 0xfffffffe）
  psbt.addInput({
    hash: 'previous_tx_hash',
    index: 0,
    sequence: 0xfffffffd // 启用RBF
  });
  
  return psbt;
}
```

## 费用计算

### 动态费用估算

```javascript
function calculateFee(psbt, feeRate) {
  // 估算交易大小
  const tempTx = psbt.clone();
  tempTx.finalizeAllInputs();
  const txSize = tempTx.extractTransaction().toBuffer().length;
  
  // 计算费用 (sat/byte)
  const fee = txSize * feeRate;
  
  return {
    size: txSize,
    fee: fee,
    feeRate: feeRate
  };
}
```

### 费用优化

```javascript
function optimizeFee(psbt, targetFeeRate) {
  const feeInfo = calculateFee(psbt, targetFeeRate);
  
  // 如果有找零输出，调整找零金额
  if (psbt.outputCount > 1) {
    const changeOutput = psbt.data.outputs[psbt.outputCount - 1];
    const newChangeValue = changeOutput.value - feeInfo.fee;
    
    if (newChangeValue > 546) { // 粉尘限制
      // 更新找零输出
      psbt.updateOutput(psbt.outputCount - 1, {
        address: changeOutput.address,
        value: newChangeValue
      });
    }
  }
  
  return feeInfo;
}
```

## 错误处理

### 常见错误类型

```javascript
function handleTransactionErrors(error) {
  if (error.message.includes('insufficient funds')) {
    console.error('余额不足');
  } else if (error.message.includes('dust')) {
    console.error('输出金额过小（粉尘）');
  } else if (error.message.includes('sequence')) {
    console.error('序列号设置错误');
  } else if (error.message.includes('locktime')) {
    console.error('时间锁设置错误');
  } else {
    console.error('未知错误:', error.message);
  }
}
```

## 完整示例

```javascript
require('dotenv').config();
const { ECPair, Psbt, networks, payments } = require('bitcoinjs-lib');

async function createCompleteTransaction() {
  try {
    const network = networks.testnet;
    const secret = process.env.ECDSA_SECRET;
    const signer = ECPair.fromPrivateKey(Buffer.from(secret, 'hex'), network);
    const pubkey = signer.publicKey;
    
    // 生成地址
    const { address } = payments.p2pkh({ pubkey, network });
    console.log('Address:', address);
    
    // 创建PSBT
    const psbt = new Psbt({ network });
    psbt.setVersion(2);
    psbt.setLocktime(0);
    
    // 添加输入
    psbt.addInput({
      hash: '3b948165cfb707320ccdc9582b5acc7cdad213bc81b7edb37546e1334d802b38',
      index: 0,
      sequence: 0xffffffff,
      nonWitnessUtxo: Buffer.from('...', 'hex') // 完整的前置交易数据
    });
    
    // 添加输出
    psbt.addOutput({
      address: 'n1cScasu6XVoDki38WYAJH4ZJGRAfG8XRN',
      value: 9800
    });
    
    // 签名
    psbt.signInput(0, signer);
    
    // 验证
    const isValid = psbt.validateSignaturesOfInput(0);
    if (!isValid) throw new Error('Invalid signature');
    
    // 最终化
    psbt.finalizeAllInputs();
    
    // 提取交易
    const transaction = psbt.extractTransaction();
    const serialized = transaction.toHex();
    
    console.log('Transaction created successfully');
    console.log('TXID:', transaction.getId());
    console.log('Serialized:', serialized);
    
    return serialized;
    
  } catch (error) {
    handleTransactionErrors(error);
    throw error;
  }
}

// 执行
createCompleteTransaction()
  .then(txHex => console.log('Success:', txHex))
  .catch(error => console.error('Failed:', error));
```

## 最佳实践

1. **费用设置**: 根据网络拥堵情况设置合理费用
2. **UTXO管理**: 合理选择和管理UTXO
3. **安全性**: 保护私钥，验证所有输入输出
4. **测试**: 在测试网络充分测试
5. **错误处理**: 实现完善的错误处理机制

## 常见问题

### Q: 如何选择合适的费用？
A: 监控网络状况，使用费用估算API，设置合理的费率。

### Q: 交易卡住了怎么办？
A: 可以使用RBF功能提高费用，或者使用CPFP加速。

### Q: 如何处理找零？
A: 计算总输入减去总输出和费用，剩余部分作为找零。
