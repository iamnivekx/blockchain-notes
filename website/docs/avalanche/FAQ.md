# Avalanche 常见问题

## 基础概念

### 什么是 Avalanche？

Avalanche 是一个开源平台，用于启动去中心化金融应用程序和企业区块链部署。它使用创新的共识机制，提供高吞吐量、低延迟和可扩展性。

### Avalanche 的三个链有什么区别？

- **X-Chain**: 用于创建和交易数字资产，支持自定义代币
- **P-Chain**: 管理子网和验证者，处理质押和治理
- **C-Chain**: 兼容 EVM，支持智能合约和 DApp

### 什么是子网（Subnet）？

子网是 Avalanche 网络中的一组验证者，它们共同验证一组区块链。子网可以有自己的规则、代币经济和验证者集合。

## 开发相关

### 如何连接到 Avalanche 网络？

```javascript
const { Avalanche } = require('avalanche');

// 连接到测试网
const avalanche = new Avalanche(
  'api.avax-test.network',  // 主机
  443,                       // 端口
  'https',                   // 协议
  5                          // 网络 ID (5 = 测试网)
);

// 连接到主网
const avalanche = new Avalanche(
  'api.avax.network',        // 主机
  443,                       // 端口
  'https',                   // 协议
  1                          // 网络 ID (1 = 主网)
);
```

### 如何生成助记词和密钥对？

```javascript
const { Mnemonic, HDNode } = require('avalanche');

// 生成助记词
const mnemonic = Mnemonic.getInstance();
const words = mnemonic.generateMnemonic(256); // 24 个单词

// 从助记词生成种子
const seed = mnemonic.mnemonicToSeedSync(words);

// 生成 HD 钱包
const hdnode = new HDNode(seed);

// 派生子密钥
const child = hdnode.derive("m/44'/9000'/0'/0/0");
```

### 交易费用是多少？

Avalanche 的交易费用相对较低：
- **X-Chain**: 约 0.001 AVAX
- **P-Chain**: 约 0.001 AVAX
- **C-Chain**: 约 0.001 AVAX

### 如何获取测试网 AVAX？

可以通过以下方式获取测试网 AVAX：
1. 访问 [Avalanche Faucet](https://faucet.avax.network/)
2. 输入你的测试网地址
3. 等待几分钟即可收到测试代币

## 网络问题

### 交易确认需要多长时间？

- **X-Chain**: 1-3 秒
- **P-Chain**: 1-3 秒
- **C-Chain**: 1-3 秒

### 如何检查交易状态？

```javascript
// 获取交易详情
const tx = await xchain.getTx(txid);

// 检查交易状态
if (tx.status === 'Accepted') {
  console.log('交易已确认');
} else if (tx.status === 'Processing') {
  console.log('交易处理中');
} else {
  console.log('交易失败');
}
```

### 网络拥堵时如何处理？

当网络拥堵时，可以：
1. 增加交易费用
2. 等待网络负载降低
3. 使用批量交易减少网络压力

## 安全相关

### 如何安全存储私钥？

- 使用硬件钱包（推荐）
- 离线存储助记词
- 避免在代码中硬编码私钥
- 使用环境变量存储敏感信息

### 多签名钱包如何工作？

多签名钱包需要多个私钥的签名才能执行交易，提供额外的安全层。在 Avalanche 中，可以通过 P-Chain 创建多签名账户。

### 如何验证交易签名？

```javascript
const { avm } = require('avalanche');
const { KeyPair } = avm;

// 验证签名
const keyPair = new KeyPair(hrp, chainid);
const isValid = keyPair.verify(message, signature, publicKey);
```

## 性能优化

### 如何提高交易处理速度？

1. 使用批量交易
2. 优化 UTXO 选择
3. 合理设置交易费用
4. 使用连接池管理网络连接

### 如何处理大量 UTXO？

```javascript
// 获取所有 UTXO
const utxoResponse = await xchain.getUTXOs(address);
const utxos = utxoResponse.utxos;

// 批量处理
const utxoArray = utxos.getAllUTXOs();
// 进行批量操作...
```

## 更多资源

- [Avalanche 官方文档](https://docs.avax.network/)
- [AvalancheJS API 参考](https://docs.avax.network/build/tools/avalanchejs)
- [GitHub 仓库](https://github.com/ava-labs/avalanchejs)
- [开发者社区](https://chat.avax.network/)
