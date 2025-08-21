# Avalanche 转账

本指南将介绍如何在 Avalanche 上进行简单的 AVAX 转移操作，基于你的 transfer.js 示例。

## 基本概念

### 1. 转移流程

1. 获取账户余额和 UTXO
2. 构建转移交易
3. 签名交易
4. 发送交易到网络

### 2. 交易费用

每次转移都需要支付一定的交易费用，费用从转移金额中扣除。

## 环境设置

```javascript
const createHash = require('create-hash');
const { Avalanche, BinTools, Buffer, BN, utils, avm, common } = require('avalanche');
const { StandardAmountOutput } = common;
const { UTXOSet, UTXO, SECPTransferOutput } = avm;
const { Defaults, PrivateKeyPrefix, Serialization } = utils;
require('dotenv').config();

// 网络配置
const networkID = 5;
const avalanche = new Avalanche('api.avax-test.network', 443, 'https', networkID);
const xchain = avalanche.XChain();
const keychain = xchain.keyChain();

// 获取默认配置
const avaxAssetID = Defaults.network[networkID].X['avaxAssetID'];
```

## 准备账户

### 1. 导入私钥

```javascript
// 从环境变量获取私钥
const { SECRET_KEY_1 } = process.env;

// 导入私钥到密钥链
const keyPair = keychain.importKey(Buffer.from(SECRET_KEY_1, 'hex'));
const address = keyPair.getAddressString();

console.log('账户地址:', address);
```

### 2. 查询余额

```javascript
// 获取账户余额
const balance = await xchain.getBalance(address, 'AVAX');
console.log('AVAX 余额:', balance.balance.toString());
```

## 准备 UTXO

### 1. 获取真实 UTXO

```javascript
// 获取地址的 UTXO
const utxoResponse = await xchain.getUTXOs(address);
const utxos = utxoResponse.utxos;
console.log('UTXO 数量:', utxos.getAllUTXOs().length);
```

### 2. 使用测试 UTXO（仅用于测试）

```javascript
// 创建测试 UTXO 集合
const utxos = new UTXOSet();

// 添加测试 UTXO
utxos.addArray([
  '11GRBUV7SbtoFdQsBAWHVwdb7ssC8fu8ZKRTvC1ztwcspxQLoPrjAX2Dsy6HAjAzD45mjGTg1FSm7HvdXJFhFV5NbFLPJFZvBnYLkBqjhwYgXZpEAXBKV5tcNFPnPmRdDR9rQmfkbYZEvcbfACW3ed6NJjpmLa2cnSnuAr'
], false);

console.log('测试 UTXO 数量:', utxos.getAllUTXOs().length);
```

## 构建转移交易

### 1. 计算转移金额

```javascript
// 计算交易费用
const fee = xchain.getDefaultTxFee();
console.log('交易费用:', fee.toString());

// 计算实际转移金额（减去费用）
const amount = balance.sub(fee);
console.log('转移金额:', amount.toString());
```

### 2. 准备转移参数

```javascript
// 目标地址
const toAddress = ['X-fuji1rz6uxnat4e9l6ygdu9enx3a79xnjzg2z4763w2'];

// 找零地址
const changeAddresses = ['X-fuji1wngxrrwn665t8xmq93z4dk0y8nne9u44adyhac'];

console.log('目标地址:', toAddress);
console.log('找零地址:', changeAddresses);
```

### 3. 构建交易

```javascript
// 构建基础转移交易
const unsignedTx = await xchain.buildBaseTx(
  utxos,                    // UTXO 集合
  amount,                    // 转移金额
  avaxAssetID,             // 资产 ID
  toAddress,                // 接收地址
  [address],                // 发送地址
  changeAddresses           // 找零地址
);

console.log('交易构建成功');
```

## 交易详情查看

### 1. 查看未签名交易

```javascript
// 序列化交易用于查看
const display = unsignedTx.serialize('display');
console.log('未签名交易详情:', JSON.stringify(display, null, 2));
```

### 2. 查看交易输入输出

```javascript
// 查看交易输入
unsignedTx.transaction.getIns().forEach((ins, index) => {
  console.log(`---输入 ${index}---`);
  console.log('输入详情:', JSON.stringify(ins.serialize('display'), null, 2));
});

// 查看交易输出
unsignedTx.transaction.getOuts().forEach((out, index) => {
  console.log(`---输出 ${index}---`);
  console.log('输出详情:', JSON.stringify(out.serialize('display'), null, 2));
});
```

## 签名和发送交易

### 1. 签名交易

```javascript
// 使用密钥链签名交易
const tx = unsignedTx.sign(keychain);
console.log('交易签名成功');

// 获取签名后的交易数据
const hex = tx.toBuffer().toString('hex');
console.log('签名后交易 (hex):', hex);
```

### 2. 查看签名后交易

```javascript
// 查看签名后的交易详情
const signedDisplay = tx.serialize('display');
console.log('签名后交易详情:', JSON.stringify(signedDisplay, null, 2));
```

### 3. 计算交易 ID

```javascript
// 计算交易哈希
const buffer = Buffer.from(createHash('sha256').update(tx.toBuffer()).digest().buffer);

// 转换为 CB58 格式
const serialization = Serialization.getInstance();
const txid = serialization.bufferToType(buffer, 'cb58');

console.log('交易哈希 (hex):', buffer.toString('hex'));
console.log('计算的交易 ID:', txid);
```

### 4. 发送交易

```javascript
// 将已签名的交易发送到网络
const networkTxid = await xchain.issueTx(tx);
console.log('交易发送成功，网络 TXID:', networkTxid);
```

## 完整示例

```javascript
const createHash = require('create-hash');
const { Avalanche, BinTools, Buffer, BN, utils, avm, common } = require('avalanche');
const { StandardAmountOutput } = common;
const { UTXOSet, UTXO, SECPTransferOutput } = avm;
const { Defaults, PrivateKeyPrefix, Serialization } = utils;
require('dotenv').config();

async function main() {
  try {
    // 网络配置
    const networkID = 5;
    const avalanche = new Avalanche('api.avax-test.network', 443, 'https', networkID);
    const xchain = avalanche.XChain();
    const keychain = xchain.keyChain();
    
    // 获取默认配置
    const avaxAssetID = Defaults.network[networkID].X['avaxAssetID'];
    
    // 导入私钥
    const { SECRET_KEY_1 } = process.env;
    const keyPair = keychain.importKey(Buffer.from(SECRET_KEY_1, 'hex'));
    const address = keyPair.getAddressString();
    
    console.log('=== 账户信息 ===');
    console.log('地址:', address);
    
    // 获取余额
    const balance = await xchain.getBalance(address, 'AVAX');
    console.log('AVAX 余额:', balance.balance.toString());
    
    // 计算转移金额
    const fee = xchain.getDefaultTxFee();
    const amount = balance.sub(fee);
    console.log('转移金额:', amount.toString());
    
    // 准备 UTXO（使用测试数据）
    const utxos = new UTXOSet();
    utxos.addArray([
      '11GRBUV7SbtoFdQsBAWHVwdb7ssC8fu8ZKRTvC1ztwcspxQLoPrjAX2Dsy6HAjAzD45mjGTg1FSm7HvdXJFhFV5NbFLPJFZvBnYLkBqjhwYgXZpEAXBKV5tcNFPnPmRdDR9rQmfkbYZEvcbfACW3ed6NJjpmLa2cnSnuAr'
    ], false);
    
    // 转移参数
    const toAddress = ['X-fuji1rz6uxnat4e9l6ygdu9enx3a79xnjzg2z4763w2'];
    const changeAddresses = ['X-fuji1wngxrrwn665t8xmq93z4dk0y8nne9u44adyhac'];
    
    console.log('=== 转移参数 ===');
    console.log('目标地址:', toAddress);
    console.log('找零地址:', changeAddresses);
    
    // 构建交易
    const unsignedTx = await xchain.buildBaseTx(
      utxos,
      amount,
      avaxAssetID,
      toAddress,
      [address],
      changeAddresses
    );
    
    console.log('=== 交易构建 ===');
    console.log('交易构建成功');
    
    // 查看交易详情
    const display = unsignedTx.serialize('display');
    console.log('交易详情:', JSON.stringify(display, null, 2));
    
    // 签名交易
    const tx = unsignedTx.sign(keychain);
    console.log('=== 交易签名 ===');
    console.log('交易签名成功');
    
    // 获取签名后数据
    const hex = tx.toBuffer().toString('hex');
    console.log('签名后交易 (hex):', hex);
    
    // 计算交易 ID
    const buffer = Buffer.from(createHash('sha256').update(tx.toBuffer()).digest().buffer);
    const serialization = Serialization.getInstance();
    const txid = serialization.bufferToType(buffer, 'cb58');
    
    console.log('=== 交易 ID ===');
    console.log('交易哈希 (hex):', buffer.toString('hex'));
    console.log('计算的交易 ID:', txid);
    
    // 发送交易
    const networkTxid = await xchain.issueTx(tx);
    console.log('=== 交易发送 ===');
    console.log('交易发送成功，网络 TXID:', networkTxid);
    
    console.log('=== 转移完成 ===');
    
  } catch (error) {
    console.error('转移失败:', error);
  }
}

// 运行程序
main();
```

## 注意事项

1. **测试环境**: 本示例使用测试网，确保使用正确的网络配置
2. **私钥安全**: 私钥通过环境变量存储，不要硬编码
3. **UTXO 管理**: 实际使用时应该获取真实的 UTXO
4. **费用计算**: 确保账户有足够的余额支付交易费用

## 下一步

- [离线签名](./offline-signing.md) - 学习离线交易签名
- [高级交易构建](./advanced.md) - 了解手动构建交易
- [交易解码](./decode.md) - 学习如何解码和分析交易
