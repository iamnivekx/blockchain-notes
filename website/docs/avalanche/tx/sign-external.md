# Avalanche 离线签名

本指南将介绍如何在 Avalanche 上进行离线交易签名，包括手动构建交易、离线签名和在线广播的完整流程。

## 基本概念

### 1. 离线签名的优势

- **安全性**: 私钥可以在离线环境中使用，避免网络攻击
- **灵活性**: 可以在不同设备上完成签名和广播
- **批量处理**: 可以预先准备多个交易，批量广播

### 2. 工作流程

1. 在线环境：获取 UTXO 和网络信息
2. 离线环境：构建和签名交易
3. 在线环境：广播已签名的交易

## 环境设置

```javascript
const createHash = require('create-hash');
const { Avalanche, BinTools, Buffer, BN, utils, avm, common } = require('avalanche');
const { StandardAmountOutput } = common;
const { UTXOSet, UTXO } = require('avalanche/dist/apis/avm');
const { Defaults, Serialization } = utils;
require('dotenv').config();

// 网络配置
const networkID = 5;
const avalanche = new Avalanche('api.avax-test.network', 443, 'https', networkID);
const xchain = avalanche.XChain();
const keychain = xchain.keyChain();

// 获取默认配置
const avaxAssetID = Defaults.network[networkID].X['avaxAssetID'];
```

## 第一步：准备账户信息

### 1. 导入私钥和获取地址

```javascript
async function prepareAccount() {
  try {
    // 从环境变量获取私钥
    const { SECRET_KEY_1 } = process.env;
    
    // 导入私钥到密钥链
    const keyPair = keychain.importKey(Buffer.from(SECRET_KEY_1, 'hex'));
    
    // 获取地址信息
    const addressBuf = keyPair.getAddress();
    const publicKey = keyPair.getPublicKey();
    const address = keyPair.getAddressString();
    
    console.log('=== 账户信息 ===');
    console.log('地址:', address);
    console.log('公钥 (hex):', publicKey.toString('hex'));
    console.log('地址 Buffer:', addressBuf.toString('hex'));
    
    return {
      keyPair,
      address,
      publicKey,
      addressBuf
    };
    
  } catch (error) {
    console.error('账户准备失败:', error);
    throw error;
  }
}
```

### 2. 查询账户余额

```javascript
async function getAccountBalance(address) {
  try {
    // 获取 AVAX 余额
    const balanceResponse = await xchain.getBalance(address, avaxAssetID);
    const balance = new BN(balanceResponse.balance);
    
    console.log('=== 余额信息 ===');
    console.log('AVAX 余额:', balance.toString());
    console.log('余额 (AVAX):', balance.div(new BN(1000000000)).toString());
    
    return balance;
    
  } catch (error) {
    console.error('获取余额失败:', error);
    throw error;
  }
}

// 使用示例
const accountInfo = await prepareAccount();
const balance = await getAccountBalance(accountInfo.address);
```

## 第二步：准备 UTXO

### 1. 获取 UTXO 集合

```javascript
async function getUTXOs(address) {
  try {
    // 获取地址的 UTXO
    const utxoResponse = await xchain.getUTXOs(address);
    const utxos = utxoResponse.utxos;
    
    console.log('=== UTXO 信息 ===');
    console.log('UTXO 数量:', utxos.getAllUTXOs().length);
    
    // 显示每个 UTXO 的详细信息
    utxos.getAllUTXOs().forEach((utxo, index) => {
      const output = utxo.getOutput();
      const amount = output.getAmount();
      
      console.log(`UTXO ${index}:`);
      console.log(`  金额: ${amount.toString()}`);
      console.log(`  交易 ID: ${utxo.getTxID()}`);
      console.log(`  输出索引: ${utxo.getOutputIdx()}`);
    });
    
    return utxos;
    
  } catch (error) {
    console.error('获取 UTXO 失败:', error);
    throw error;
  }
}
```

### 2. 手动创建 UTXO 集合（用于测试）

```javascript
function createTestUTXOs() {
  // 创建空的 UTXO 集合
  const utxos = new UTXOSet();
  
  // 添加测试 UTXO（实际使用时应该从网络获取）
  const testUTXO = '119ddmfJNCFrXuKmjs6teNgMeoFuNkzN2ZGBfYWhHUHnmbat8ZxzehjPjNV4P931cxj3iXtNhU4bmMECBaVT32waJVMVCkBMQbkyBuDBQaQZyceXNwWdovNfVTznZJWGQeDXqSuVhHnwxU6cxBn4mXLi4ST1Jvb5bn';
  
  utxos.addArray([testUTXO], false);
  
  console.log('=== 测试 UTXO 创建 ===');
  console.log('UTXO 数量:', utxos.getAllUTXOs().length);
  
  return utxos;
}

// 选择使用真实 UTXO 还是测试 UTXO
const utxos = await getUTXOs(accountInfo.address);
// const utxos = createTestUTXOs(); // 测试环境使用
```

## 第三步：计算交易参数

### 1. 计算交易费用

```javascript
function calculateTransactionFee() {
  // 获取默认交易费用
  const fee = xchain.getDefaultTxFee();
  
  console.log('=== 交易费用 ===');
  console.log('默认费用:', fee.toString());
  console.log('费用 (AVAX):', fee.div(new BN(1000000000)).toString());
  
  return fee;
}
```

### 2. 计算转移金额

```javascript
function calculateTransferAmount(balance, fee) {
  // 计算实际转移金额（减去费用）
  const amount = balance.sub(fee);
  
  console.log('=== 转移金额计算 ===');
  console.log('总余额:', balance.toString());
  console.log('交易费用:', fee.toString());
  console.log('转移金额:', amount.toString());
  console.log('转移金额 (AVAX):', amount.div(new BN(1000000000)).toString());
  
  return amount;
}

// 计算交易参数
const fee = calculateTransactionFee();
const transferAmount = calculateTransferAmount(balance, fee);
```

## 第四步：构建交易

### 1. 准备交易参数

```javascript
function prepareTransactionParams(fromAddress, toAddress, changeAddress) {
  console.log('=== 交易参数 ===');
  console.log('发送地址:', fromAddress);
  console.log('接收地址:', toAddress);
  console.log('找零地址:', changeAddress);
  
  return {
    toAddress: [toAddress],
    fromAddress: [fromAddress],
    changeAddresses: [changeAddress]
  };
}

// 准备交易参数
const toAddress = 'X-fuji1rz6uxnat4e9l6ygdu9enx3a79xnjzg2z4763w2';
const changeAddress = 'X-fuji1wngxrrwn665t8xmq93z4dk0y8nne9u44adyhac';

const txParams = prepareTransactionParams(
  accountInfo.address,
  toAddress,
  changeAddress
);
```

### 2. 构建未签名交易

```javascript
async function buildUnsignedTransaction(utxos, amount, assetID, txParams) {
  try {
    console.log('=== 构建交易 ===');
    
    // 构建基础交易
    const unsignedTx = await xchain.buildBaseTx(
      utxos,                    // UTXO 集合
      amount,                    // 转移金额
      assetID,                   // 资产 ID
      txParams.toAddress,        // 接收地址
      txParams.fromAddress,      // 发送地址
      txParams.changeAddresses   // 找零地址
    );
    
    console.log('交易构建成功');
    
    // 序列化交易用于查看
    const displayData = unsignedTx.serialize('display');
    console.log('交易详情:', JSON.stringify(displayData, null, 2));
    
    return unsignedTx;
    
  } catch (error) {
    console.error('构建交易失败:', error);
    throw error;
  }
}

// 构建未签名交易
const unsignedTx = await buildUnsignedTransaction(
  utxos,
  transferAmount,
  avaxAssetID,
  txParams
);
```

## 第五步：离线签名

### 1. 签名交易

```javascript
function signTransaction(unsignedTx, keychain) {
  try {
    console.log('=== 交易签名 ===');
    
    // 使用密钥链签名交易
    const signedTx = unsignedTx.sign(keychain);
    
    console.log('交易签名成功');
    
    // 获取签名后的交易数据
    const hexData = signedTx.toBuffer().toString('hex');
    console.log('签名后交易 (hex):', hexData);
    
    return signedTx;
    
  } catch (error) {
    console.error('交易签名失败:', error);
    throw error;
  }
}

// 签名交易
const signedTx = signTransaction(unsignedTx, keychain);
```

### 2. 生成交易 ID

```javascript
function generateTransactionID(signedTx) {
  try {
    console.log('=== 生成交易 ID ===');
    
    // 计算交易哈希
    const txBuffer = signedTx.toBuffer();
    const txHash = createHash('sha256').update(txBuffer).digest();
    
    // 转换为 CB58 格式
    const serialization = Serialization.getInstance();
    const txid = serialization.bufferToType(txHash, 'cb58');
    
    console.log('交易哈希 (hex):', txHash.toString('hex'));
    console.log('交易 ID (CB58):', txid);
    
    return {
      hex: txHash.toString('hex'),
      cb58: txid,
      buffer: txHash
    };
    
  } catch (error) {
    console.error('生成交易 ID 失败:', error);
    throw error;
  }
}

// 生成交易 ID
const txID = generateTransactionID(signedTx);
```

## 第六步：广播交易

### 1. 广播已签名的交易

```javascript
async function broadcastTransaction(signedTx) {
  try {
    console.log('=== 广播交易 ===');
    
    // 将已签名的交易发送到网络
    const txid = await xchain.issueTx(signedTx);
    
    console.log('交易广播成功');
    console.log('网络返回的 TXID:', txid);
    
    return txid;
    
  } catch (error) {
    console.error('交易广播失败:', error);
    throw error;
  }
}

// 广播交易
const broadcastedTxID = await broadcastTransaction(signedTx);
```

### 2. 验证交易状态

```javascript
async function verifyTransactionStatus(txid) {
  try {
    console.log('=== 验证交易状态 ===');
    
    // 等待一段时间让交易被处理
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 查询交易状态
    const tx = await xchain.getTx(txid);
    
    console.log('交易状态:', tx.status);
    console.log('交易详情:', JSON.stringify(tx, null, 2));
    
    return tx;
    
  } catch (error) {
    console.error('验证交易状态失败:', error);
    throw error;
  }
}

// 验证交易状态
const txStatus = await verifyTransactionStatus(broadcastedTxID);
```

## 完整离线签名流程

```javascript
async function completeOfflineSigning() {
  try {
    console.log('=== 开始离线签名流程 ===');
    
    // 第一步：准备账户
    const accountInfo = await prepareAccount();
    
    // 第二步：获取余额
    const balance = await getAccountBalance(accountInfo.address);
    
    // 第三步：获取 UTXO
    const utxos = await getUTXOs(accountInfo.address);
    
    // 第四步：计算参数
    const fee = calculateTransactionFee();
    const transferAmount = calculateTransferAmount(balance, fee);
    
    // 第五步：准备交易参数
    const txParams = prepareTransactionParams(
      accountInfo.address,
      'X-fuji1rz6uxnat4e9l6ygdu9enx3a79xnjzg2z4763w2',
      'X-fuji1wngxrrwn665t8xmq93z4dk0y8nne9u44adyhac'
    );
    
    // 第六步：构建交易
    const unsignedTx = await buildUnsignedTransaction(
      utxos,
      transferAmount,
      avaxAssetID,
      txParams
    );
    
    // 第七步：离线签名（可以在另一台设备上完成）
    const signedTx = signTransaction(unsignedTx, keychain);
    
    // 第八步：生成交易 ID
    const txID = generateTransactionID(signedTx);
    
    // 第九步：广播交易
    const broadcastedTxID = await broadcastTransaction(signedTx);
    
    // 第十步：验证状态
    const txStatus = await verifyTransactionStatus(broadcastedTxID);
    
    console.log('=== 离线签名流程完成 ===');
    console.log('最终交易 ID:', broadcastedTxID);
    console.log('交易状态:', txStatus.status);
    
    return {
      txid: broadcastedTxID,
      status: txStatus.status,
      signedTx: signedTx,
      txID: txID
    };
    
  } catch (error) {
    console.error('离线签名流程失败:', error);
    throw error;
  }
}

// 运行完整流程
completeOfflineSigning()
  .then(result => {
    console.log('流程执行成功:', result);
  })
  .catch(error => {
    console.error('流程执行失败:', error);
  });
```

## 高级功能

### 1. 批量离线签名

```javascript
class BatchOfflineSigner {
  constructor(keychain) {
    this.keychain = keychain;
    this.transactions = [];
  }
  
  // 添加交易到批次
  addTransaction(unsignedTx) {
    this.transactions.push(unsignedTx);
    console.log(`添加交易到批次，当前数量: ${this.transactions.length}`);
  }
  
  // 批量签名
  signAllTransactions() {
    const signedTxs = [];
    
    this.transactions.forEach((unsignedTx, index) => {
      try {
        const signedTx = unsignedTx.sign(this.keychain);
        signedTxs.push(signedTx);
        console.log(`交易 ${index} 签名成功`);
      } catch (error) {
        console.error(`交易 ${index} 签名失败:`, error.message);
      }
    });
    
    return signedTxs;
  }
  
  // 批量广播
  async broadcastAllTransactions(signedTxs) {
    const results = [];
    
    for (let i = 0; i < signedTxs.length; i++) {
      try {
        const txid = await xchain.issueTx(signedTxs[i]);
        results.push({ index: i, success: true, txid });
        console.log(`交易 ${i} 广播成功: ${txid}`);
      } catch (error) {
        results.push({ index: i, success: false, error: error.message });
        console.error(`交易 ${i} 广播失败:`, error.message);
      }
      
      // 添加延迟避免网络拥堵
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }
}

// 使用批量签名器
const batchSigner = new BatchOfflineSigner(keychain);

// 添加多个交易
batchSigner.addTransaction(unsignedTx1);
batchSigner.addTransaction(unsignedTx2);
batchSigner.addTransaction(unsignedTx3);

// 批量签名
const signedTxs = batchSigner.signAllTransactions();

// 批量广播
const broadcastResults = await batchSigner.broadcastAllTransactions(signedTxs);
```

### 2. 交易模板

```javascript
class TransactionTemplate {
  constructor(fromAddress, toAddress, changeAddress) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.changeAddress = changeAddress;
  }
  
  // 创建转移模板
  createTransferTemplate(amount, assetID) {
    return {
      type: 'transfer',
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      changeAddress: this.changeAddress,
      amount: amount,
      assetID: assetID
    };
  }
  
  // 应用模板构建交易
  async buildFromTemplate(template, utxos) {
    if (template.type === 'transfer') {
      return await xchain.buildBaseTx(
        utxos,
        template.amount,
        template.assetID,
        [template.toAddress],
        [template.fromAddress],
        [template.changeAddress]
      );
    }
    
    throw new Error('不支持的交易类型');
  }
}

// 使用交易模板
const template = new TransactionTemplate(
  accountInfo.address,
  toAddress,
  changeAddress
);

const transferTemplate = template.createTransferTemplate(
  transferAmount,
  avaxAssetID
);

const unsignedTxFromTemplate = await template.buildFromTemplate(
  transferTemplate,
  utxos
);
```

## 错误处理和调试

### 1. 常见错误类型

```javascript
function handleOfflineSigningError(error) {
  if (error.message.includes('insufficient funds')) {
    console.log('余额不足，请检查账户余额');
  } else if (error.message.includes('Invalid UTXO')) {
    console.log('UTXO 无效，请重新获取');
  } else if (error.message.includes('Invalid signature')) {
    console.log('签名无效，请检查私钥');
  } else if (error.message.includes('Network Error')) {
    console.log('网络错误，请检查网络连接');
  } else {
    console.log('未知错误:', error.message);
  }
}
```

### 2. 调试模式

```javascript
function enableDebugMode(transaction) {
  console.log('=== 调试模式 ===');
  
  // 输出交易结构
  console.log('交易类型:', transaction.constructor.name);
  console.log('交易方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(transaction)));
  
  // 输出序列化数据
  const displayData = transaction.serialize('display');
  console.log('交易详情:', JSON.stringify(displayData, null, 2));
  
  // 输出 Buffer 数据
  const buffer = transaction.toBuffer();
  console.log('交易 Buffer 长度:', buffer.length);
  console.log('交易 Hex:', buffer.toString('hex'));
}
```