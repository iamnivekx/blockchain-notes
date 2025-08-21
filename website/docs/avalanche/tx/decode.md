# Avalanche 交易解码

本指南将介绍如何解码和分析 Avalanche 交易，包括交易结构、输入输出解析和签名验证。

## 基本概念

### 1. 交易结构

Avalanche 交易包含以下主要部分：
- **UnsignedTx**: 未签名的交易内容
- **Credentials**: 签名凭证
- **Transaction**: 具体的交易数据

### 2. 编码格式

- **CB58**: Avalanche 使用的自定义 Base58 编码
- **Hex**: 十六进制格式
- **Bech32**: 地址编码格式

## 环境设置

```javascript
const { Avalanche, BinTools, Buffer, utils, avm } = require('avalanche');
const createHash = require('create-hash');

// 网络配置
const networkID = 5;
const avalanche = new Avalanche('api.avax-test.network', 443, 'https', networkID);
const xchain = avalanche.XChain();
const keychain = xchain.keyChain();

// 工具实例
const bintools = BinTools.getInstance();
const { Serialization } = utils;
const serialization = Serialization.getInstance();
```

## 解码交易 ID

### 1. 从 CB58 转换为 Hex

```javascript
function decodeTxID(cb58TxID) {
  try {
    // 从 CB58 解码为 Buffer
    const txBuffer = serialization.typeToBuffer(cb58TxID, 'cb58');
    
    // 转换为十六进制
    const hexTxID = txBuffer.toString('hex');
    
    console.log('CB58 TXID:', cb58TxID);
    console.log('Hex TXID:', hexTxID);
    
    return {
      cb58: cb58TxID,
      hex: hexTxID,
      buffer: txBuffer
    };
  } catch (error) {
    console.error('解码交易 ID 失败:', error);
    throw error;
  }
}

// 使用示例
const txid = '3d819360725cee7f8d72c8c7cd01f1c661e9f266daa1b8c6401a66405de8c67e';
const decoded = decodeTxID(txid);
```

### 2. 从 Hex 转换为 CB58

```javascript
function encodeTxID(hexTxID) {
  try {
    // 从十六进制创建 Buffer
    const txBuffer = Buffer.from(hexTxID, 'hex');
    
    // 转换为 CB58
    const cb58TxID = serialization.bufferToType(txBuffer, 'cb58');
    
    console.log('Hex TXID:', hexTxID);
    console.log('CB58 TXID:', cb58TxID);
    
    return {
      hex: hexTxID,
      cb58: cb58TxID,
      buffer: txBuffer
    };
  } catch (error) {
    console.error('编码交易 ID 失败:', error);
    throw error;
  }
}
```

## 解码完整交易

### 1. 从 CB58 解码交易

```javascript
async function decodeTransaction(cb58Transaction) {
  try {
    // 从 CB58 解码为 Buffer
    const txBuffer = serialization.typeToBuffer(cb58Transaction, 'cb58');
    
    // 创建交易对象
    const transaction = new avm.Tx();
    transaction.fromBuffer(txBuffer);
    
    // 获取未签名交易
    const unsignedTx = transaction.getUnsignedTx();
    
    // 获取交易详情
    const txDetails = {
      unsignedTx: unsignedTx,
      credentials: transaction.getCredentials(),
      transaction: unsignedTx.getTransaction()
    };
    
    console.log('交易解码成功');
    return txDetails;
    
  } catch (error) {
    console.error('解码交易失败:', error);
    throw error;
  }
}
```

### 2. 解析交易内容

```javascript
function parseTransactionDetails(txDetails) {
  try {
    const { unsignedTx, credentials, transaction } = txDetails;
    
    // 解析交易基本信息
    const txInfo = {
      networkID: transaction.getNetworkID(),
      blockchainID: transaction.getBlockchainID(),
      memo: transaction.getMemo(),
      inputs: [],
      outputs: []
    };
    
    // 解析输入
    const inputs = transaction.getIns();
    inputs.forEach((input, index) => {
      const inputInfo = {
        index: index,
        txID: input.getTxID(),
        outputIdx: input.getOutputIdx(),
        assetID: input.getAssetID(),
        amount: input.getInput().getAmount(),
        addresses: input.getInput().getAddresses()
      };
      txInfo.inputs.push(inputInfo);
    });
    
    // 解析输出
    const outputs = transaction.getOuts();
    outputs.forEach((output, index) => {
      const outputInfo = {
        index: index,
        assetID: output.getAssetID(),
        amount: output.getOutput().getAmount(),
        addresses: output.getOutput().getAddresses(),
        locktime: output.getOutput().getLocktime(),
        threshold: output.getOutput().getThreshold()
      };
      txInfo.outputs.push(outputInfo);
    });
    
    console.log('交易解析完成');
    return txInfo;
    
  } catch (error) {
    console.error('解析交易详情失败:', error);
    throw error;
  }
}
```

## 分析交易输入输出

### 1. 输入分析

```javascript
function analyzeInputs(inputs) {
  console.log('=== 交易输入分析 ===');
  
  inputs.forEach((input, index) => {
    console.log(`输入 ${index}:`);
    console.log(`  交易 ID: ${input.txID}`);
    console.log(`  输出索引: ${input.outputIdx}`);
    console.log(`  资产 ID: ${input.assetID}`);
    console.log(`  金额: ${input.amount.toString()}`);
    console.log(`  地址数量: ${input.addresses.length}`);
    
    // 解析地址
    input.addresses.forEach((addr, addrIndex) => {
      const addressString = serialization.bufferToType(
        addr, 
        'bech32', 
        xchain.getHRP(), 
        xchain.getChainID()
      );
      console.log(`    地址 ${addrIndex}: ${addressString}`);
    });
  });
}
```

### 2. 输出分析

```javascript
function analyzeOutputs(outputs) {
  console.log('=== 交易输出分析 ===');
  
  outputs.forEach((output, index) => {
    console.log(`输出 ${index}:`);
    console.log(`  资产 ID: ${output.assetID}`);
    console.log(`  金额: ${output.amount.toString()}`);
    console.log(`  锁定时间: ${output.locktime.toString()}`);
    console.log(`  阈值: ${output.threshold}`);
    console.log(`  地址数量: ${output.addresses.length}`);
    
    // 解析地址
    output.addresses.forEach((addr, addrIndex) => {
      const addressString = serialization.bufferToType(
        addr, 
        'bech32', 
        xchain.getHRP(), 
        xchain.getChainID()
      );
      console.log(`    地址 ${addrIndex}: ${addressString}`);
    });
  });
}
```

## 签名验证

### 1. 验证交易签名

```javascript
function verifyTransactionSignatures(txDetails) {
  try {
    const { unsignedTx, credentials } = txDetails;
    
    console.log('=== 签名验证 ===');
    
    // 计算交易哈希
    const txBuffer = unsignedTx.toBuffer();
    const txHash = createHash('sha256').update(txBuffer).digest();
    
    console.log('交易哈希:', txHash.toString('hex'));
    
    // 验证每个凭证
    credentials.forEach((credential, index) => {
      console.log(`凭证 ${index}:`);
      
      const sigArray = credential.getSigArray();
      sigArray.forEach((sig, sigIndex) => {
        const signature = sig.getSignature();
        const publicKey = sig.getPublicKey();
        
        console.log(`  签名 ${sigIndex}:`);
        console.log(`    签名: ${signature.toString('hex')}`);
        console.log(`    公钥: ${publicKey.toString('hex')}`);
        
        // 验证签名
        try {
          const keyPair = new avm.KeyPair(xchain.getHRP(), xchain.getChainID());
          const isValid = keyPair.verify(txHash, signature, publicKey);
          console.log(`    验证结果: ${isValid ? '有效' : '无效'}`);
        } catch (error) {
          console.log(`    验证失败: ${error.message}`);
        }
      });
    });
    
    return true;
    
  } catch (error) {
    console.error('签名验证失败:', error);
    throw error;
  }
}
```

### 2. 从签名恢复公钥

```javascript
function recoverPublicKey(message, signature) {
  try {
    const keyPair = new avm.KeyPair(xchain.getHRP(), xchain.getChainID());
    
    // 从签名恢复公钥
    const recoveredPublicKey = keyPair.recover(message, signature);
    
    console.log('原始消息:', message.toString('hex'));
    console.log('签名:', signature.toString('hex'));
    console.log('恢复的公钥:', recoveredPublicKey.toString('hex'));
    
    return recoveredPublicKey;
    
  } catch (error) {
    console.error('公钥恢复失败:', error);
    throw error;
  }
}

// 使用示例
const message = Buffer.from('c74f28c8abbe0a4f656eab6a70980d7bd8849ed53972cfb75dd461b7e8d15f18', 'hex');
const signature = Buffer.from('09aadf7d86b8c61b2473c940d43731f2155d5670acd08559720ff0dc720c6a5e6410cb68bd683d4a7cc31099439122695b265b9879726b66bf78178689bbe55101', 'hex');

const recoveredPubKey = recoverPublicKey(message, signature);
```

## 交易序列化

### 1. 序列化为不同格式

```javascript
function serializeTransaction(transaction, format = 'hex') {
  try {
    let serialized;
    
    switch (format) {
      case 'hex':
        serialized = transaction.toBuffer().toString('hex');
        break;
      case 'cb58':
        serialized = serialization.bufferToType(
          transaction.toBuffer(), 
          'cb58'
        );
        break;
      case 'display':
        serialized = transaction.serialize('display');
        break;
      default:
        throw new Error('不支持的序列化格式');
    }
    
    console.log(`序列化格式 (${format}):`, serialized);
    return serialized;
    
  } catch (error) {
    console.error('序列化失败:', error);
    throw error;
  }
}
```

### 2. 反序列化交易

```javascript
function deserializeTransaction(serializedData, format = 'hex') {
  try {
    let txBuffer;
    
    switch (format) {
      case 'hex':
        txBuffer = Buffer.from(serializedData, 'hex');
        break;
      case 'cb58':
        txBuffer = serialization.typeToBuffer(serializedData, 'cb58');
        break;
      default:
        throw new Error('不支持的反序列化格式');
    }
    
    // 创建交易对象
    const transaction = new avm.Tx();
    transaction.fromBuffer(txBuffer);
    
    console.log('反序列化成功');
    return transaction;
    
  } catch (error) {
    console.error('反序列化失败:', error);
    throw error;
  }
}
```

## 高级分析功能

### 1. 交易费用计算

```javascript
function calculateTransactionFee(inputs, outputs) {
  try {
    // 计算输入总金额
    const totalInput = inputs.reduce((sum, input) => {
      return sum.add(input.amount);
    }, new BN(0));
    
    // 计算输出总金额
    const totalOutput = outputs.reduce((sum, output) => {
      return sum.add(output.amount);
    }, new BN(0));
    
    // 计算费用
    const fee = totalInput.sub(totalOutput);
    
    console.log('输入总金额:', totalInput.toString());
    console.log('输出总金额:', totalOutput.toString());
    console.log('交易费用:', fee.toString());
    
    return fee;
    
  } catch (error) {
    console.error('费用计算失败:', error);
    throw error;
  }
}
```

### 2. 交易类型识别

```javascript
function identifyTransactionType(transaction) {
  try {
    const txClass = transaction.constructor.name;
    
    let txType;
    switch (txClass) {
      case 'BaseTx':
        txType = '基础转移交易';
        break;
      case 'CreateAssetTx':
        txType = '创建资产交易';
        break;
      case 'OperationTx':
        txType = '操作交易';
        break;
      case 'ImportTx':
        txType = '跨链导入交易';
        break;
      case 'ExportTx':
        txType = '跨链导出交易';
        break;
      default:
        txType = '未知交易类型';
    }
    
    console.log('交易类型:', txType);
    return txType;
    
  } catch (error) {
    console.error('交易类型识别失败:', error);
    throw error;
  }
}
```

## 完整示例

```javascript
async function analyzeTransaction(txid) {
  try {
    console.log('开始分析交易:', txid);
    
    // 1. 获取交易
    const tx = await xchain.getTx(txid);
    
    // 2. 解码交易
    const txDetails = await decodeTransaction(tx);
    
    // 3. 解析交易详情
    const parsedTx = parseTransactionDetails(txDetails);
    
    // 4. 分析输入输出
    analyzeInputs(parsedTx.inputs);
    analyzeOutputs(parsedTx.outputs);
    
    // 5. 验证签名
    verifyTransactionSignatures(txDetails);
    
    // 6. 计算费用
    const fee = calculateTransactionFee(parsedTx.inputs, parsedTx.outputs);
    
    // 7. 识别交易类型
    const txType = identifyTransactionType(txDetails.transaction);
    
    console.log('交易分析完成');
    
    return {
      txid: txid,
      type: txType,
      fee: fee.toString(),
      inputs: parsedTx.inputs,
      outputs: parsedTx.outputs
    };
    
  } catch (error) {
    console.error('交易分析失败:', error);
    throw error;
  }
}

// 使用示例
const txid = '3d819360725cee7f8d72c8c7cd01f1c661e9f266daa1b8c6401a66405de8c67e';
analyzeTransaction(txid)
  .then(result => {
    console.log('分析结果:', result);
  })
  .catch(error => {
    console.error('分析失败:', error);
  });
```

## 调试工具

### 1. 详细日志输出

```javascript
function enableDebugMode(transaction) {
  console.log('=== 调试模式 ===');
  
  // 输出原始交易数据
  console.log('原始交易 Buffer:', transaction.toBuffer());
  console.log('原始交易 Hex:', transaction.toBuffer().toString('hex'));
  
  // 输出序列化数据
  const displayData = transaction.serialize('display');
  console.log('Display 格式:', JSON.stringify(displayData, null, 2));
  
  // 输出交易结构
  console.log('交易类名:', transaction.constructor.name);
  console.log('交易方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(transaction)));
}
```

### 2. 错误诊断

```javascript
function diagnoseTransactionError(error) {
  console.log('=== 错误诊断 ===');
  console.log('错误类型:', error.constructor.name);
  console.log('错误消息:', error.message);
  console.log('错误堆栈:', error.stack);
  
  // 根据错误类型提供建议
  if (error.message.includes('Invalid transaction')) {
    console.log('建议: 检查交易格式是否正确');
  } else if (error.message.includes('Invalid signature')) {
    console.log('建议: 检查签名是否有效');
  } else if (error.message.includes('Invalid UTXO')) {
    console.log('建议: 检查 UTXO 是否存在');
  }
}
```

## 下一步

- [批量操作](./batch.md) - 学习批量交易处理
- [跨链操作](./cross-chain.md) - 了解跨链资产转移
- [交易监控](./monitoring.md) - 学习交易状态监控
