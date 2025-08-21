---
id: FAQ
title: 常见问题
sidebar_label: FAQ
---

# Stellar 开发常见问题

本文档收集了 Stellar 开发中的常见问题和解决方案，帮助开发者快速解决遇到的问题。

## 账户和地址

### Q: 如何生成 Stellar 账户？
**A:** 可以使用以下方法生成 Stellar 账户：

```javascript
const StellarSdk = require('stellar-sdk');

// 方法1: 使用 Stellar SDK
const pair = StellarSdk.Keypair.random();

// 方法2: 从私钥恢复
const secretKey = 'your-secret-key';
const pair = StellarSdk.Keypair.fromSecret(secretKey);
```

### Q: Stellar 地址格式是什么？
**A:** Stellar 使用 StrKey 编码格式的公钥，长度为 56 个字符，以 "G" 开头。例如：`GBH343PGYNGDQ4IQM3VU3TYREQ6KKI3IVOKF3F4YKGRHBNJXLIVIMLAH`

### Q: 如何验证 Stellar 地址的有效性？
**A:** 使用 Stellar SDK 的地址验证方法：

```javascript
const isValid = StellarSdk.StrKey.isValidEd25519PublicKey(publicKey);
```

## 网络配置

### Q: 如何连接到不同的 Stellar 网络？
**A:** 配置不同的网络端点：

```javascript
// 测试网
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;

// 主网
const server = new StellarSdk.Server('https://horizon.stellar.org');
const networkPassphrase = StellarSdk.Networks.PUBLIC;

// Futurenet
const server = new StellarSdk.Server('https://horizon-futurenet.stellar.org');
const networkPassphrase = StellarSdk.Networks.FUTURENET;
```

### Q: 如何获取测试网的 XLM？
**A:** 可以使用测试网水龙头获取测试 XLM：
- **Friendbot**: https://friendbot.stellar.org/
- **Stellar Laboratory**: https://laboratory.stellar.org/

## 交易相关

### Q: 交易失败的原因有哪些？
**A:** 常见原因包括：
1. **余额不足**: 账户 XLM 余额不足以支付转账金额和手续费
2. **地址无效**: 目标地址格式不正确
3. **序列号错误**: 使用了错误的序列号
4. **信任线缺失**: 接收方没有信任自定义资产
5. **交易过期**: 超过了时间边界

### Q: 如何设置合适的交易手续费？
**A:** 手续费设置建议：

```javascript
const options = {
  fee: StellarSdk.BASE_FEE, // 基础费用
  // 或者自定义费用
  fee: '100'
};
```

### Q: 如何添加交易备注？
**A:** 使用 `addMemo` 方法：

```javascript
.addMemo(StellarSdk.Memo.text('Hello Stellar!'))
.addMemo(StellarSdk.Memo.id('12345'))
.addMemo(StellarSdk.Memo.hash('hash-value'))
```

## 代币相关

### Q: 如何发行自定义代币？
**A:** 需要两个步骤：
1. 接收方建立信任线
2. 发行方发送代币

```javascript
// 1. 建立信任线
const transaction = new StellarSdk.TransactionBuilder(receiver, {
  fee: 100,
  networkPassphrase: StellarSdk.Networks.TESTNET,
})
.addOperation(StellarSdk.Operation.changeTrust({
  asset: customAsset,
  limit: '100000000',
}))
.build();

// 2. 发行代币
const transaction = new StellarSdk.TransactionBuilder(issuer, {
  fee: 100,
  networkPassphrase: StellarSdk.Networks.TESTNET,
})
.addOperation(StellarSdk.Operation.payment({
  destination: receiver.publicKey(),
  asset: customAsset,
  amount: '1000',
}))
.build();
```

### Q: 如何查询代币余额？
**A:** 

```javascript
// 查询账户所有余额
const account = await server.loadAccount(publicKey);
account.balances.forEach(balance => {
  if (balance.asset_type === 'native') {
    console.log('XLM:', balance.balance);
  } else {
    console.log(`${balance.asset_code}:`, balance.balance);
  }
});
```

### Q: 如何删除信任线？
**A:** 将信任额度设置为 0：

```javascript
StellarSdk.Operation.changeTrust({
  asset: customAsset,
  limit: '0', // 设置为0删除信任线
})
```

## 智能合约

### Q: Stellar 支持智能合约吗？
**A:** Stellar 支持 Stellar Smart Contracts (SSC)，这是一种基于操作序列的智能合约系统，比传统的图灵完备智能合约更安全、更高效。

### Q: 如何创建 Stellar 智能合约？
**A:** 使用操作序列和条件来构建：

```javascript
const transaction = new StellarSdk.TransactionBuilder(account, {
  fee: 100,
  networkPassphrase: StellarSdk.Networks.TESTNET,
})
.addOperation(StellarSdk.Operation.payment({
  destination: destination,
  asset: StellarSdk.Asset.native(),
  amount: '100',
}))
.addOperation(StellarSdk.Operation.manageData({
  name: 'contract_state',
  value: 'completed'
}))
.build();
```

## 错误处理

### Q: 如何处理 "insufficient_fee" 错误？
**A:** 增加交易手续费：

```javascript
const options = {
  fee: '200', // 增加手续费
  networkPassphrase: StellarSdk.Networks.TESTNET
};
```

### Q: 如何处理 "bad_seq" 错误？
**A:** 重新加载账户获取正确的序列号：

```javascript
const account = await server.loadAccount(publicKey);
const sequenceNumber = account.sequenceNumber();
```

### Q: 如何处理 "op_no_trust" 错误？
**A:** 接收方需要先建立信任线：

```javascript
StellarSdk.Operation.changeTrust({
  asset: customAsset,
  limit: '100000000',
})
```

### Q: 如何处理网络连接错误？
**A:** 实现重试机制和错误处理：

```javascript
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## 性能优化

### Q: 如何提高交易处理速度？
**A:** 
1. 设置合适的手续费
2. 使用批量交易
3. 优化操作序列
4. 选择合适的网络节点

### Q: 如何处理大量交易？
**A:** 使用批量处理和队列机制：

```javascript
async function batchProcessTransactions(transactions, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(tx => processTransaction(tx))
    );
    results.push(...batchResults);
    
    // 添加延迟避免网络拥堵
    if (i + batchSize < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

## 安全相关

### Q: 如何安全存储私钥？
**A:** 
1. 使用环境变量存储私钥
2. 使用硬件钱包
3. 实现多重签名
4. 定期轮换私钥

```javascript
// 使用环境变量
const secretKey = process.env.STELLAR_SECRET_KEY;

// 使用配置文件（不要提交到版本控制）
const config = require('./config.json');
const secretKey = config.secretKey;
```

### Q: 如何验证交易签名？
**A:** 使用椭圆曲线库验证签名：

```javascript
const { eddsa: EdDSA } = require('elliptic');
const ec = new EdDSA('ed25519');

function verifySignature(message, signature, publicKey) {
  const key = ec.keyFromPublic(publicKey, 'hex');
  return key.verify(message, signature);
}
```

## 开发工具

### Q: 推荐使用哪些开发工具？
**A:** 
1. **Stellar SDK**: 官方 JavaScript/TypeScript SDK
2. **Stellar Laboratory**: 在线测试工具
3. **Horizon API**: 区块链数据查询 API
4. **Stellar Expert**: 区块链浏览器
5. **Remix**: 在线编辑器

### Q: 如何调试智能合约？
**A:** 
1. 使用 Stellar Laboratory 测试
2. 添加事件日志
3. 使用 Stellar Expert 查看交易详情
4. 在测试网进行充分测试

### Q: 如何监控交易状态？
**A:** 

```javascript
async function monitorTransaction(txid) {
  while (true) {
    try {
      const tx = await server.transactions().transaction(txid).call();
      
      if (tx.successful) {
        console.log('Transaction successful');
        break;
      } else {
        console.log('Transaction failed');
        break;
      }
    } catch (error) {
      console.log('Transaction pending...');
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}
```

## 其他问题

### Q: Stellar 和以太坊有什么区别？
**A:** 
1. **共识机制**: Stellar 使用 FBA，以太坊使用 PoS
2. **交易速度**: Stellar 更快，3-5秒确认
3. **手续费**: Stellar 手续费更低且固定
4. **智能合约**: Stellar 使用 SSC，以太坊使用 Solidity

### Q: 如何将传统金融系统连接到 Stellar？
**A:** 通过锚点（Anchor）系统：
1. 锚点负责资产发行和赎回
2. 处理法定货币转换
3. 管理合规性要求
4. 提供流动性支持

### Q: 如何获取最新的 Stellar 开发信息？
**A:** 
1. 官方文档：https://developers.stellar.org/
2. GitHub 仓库：https://github.com/stellar
3. 开发者论坛：https://stellar.stackexchange.com/
4. 技术博客：https://medium.com/stellar-community

## 获取帮助

如果本文档没有解决您的问题，可以通过以下方式获取帮助：

1. **官方文档**: https://developers.stellar.org/
2. **GitHub Issues**: https://github.com/stellar/js-stellar-sdk/issues
3. **开发者论坛**: https://stellar.stackexchange.com/
4. **Stack Overflow**: 使用 `stellar` 标签搜索相关问题

## 下一步

- [介绍](./intro.md) - 了解 Stellar 区块链基础知识
- [账户管理](./account/index.md) - 学习账户管理
- [交易处理](./tx/transaction.md) - 了解交易处理流程

