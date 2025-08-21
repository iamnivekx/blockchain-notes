# Avalanche 开发文档

欢迎来到Avalanche开发文档！这里包含了完整的Avalanche区块链开发指南，从基础概念到高级应用。

## 📚 文档结构

### 1. 账户管理
- **[地址管理](./account/address.md)** - 地址生成、密钥管理和HD钱包
- **[密钥管理](./account/key-management.md)** - 助记词、私钥和公钥管理

### 2. 交易操作
- **[资产转移](./tx/transfer.md)** - AVAX代币转账操作
- **[SDK交易](./tx/sign-sdk.md)** - 使用SDK交易创建、签名和提交
- **[离线交易](./tx/sign-external.md)** - 使用离线交易处理和签名
- **[高级交易构建](./tx/advanced.md)** - 手动构建交易结构
- **[交易解码](./tx/decode.md)** - 交易序列化

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
npm install avalanche dotenv create-hash lodash

# 或者使用yarn
yarn add avalanche dotenv create-hash lodash
```

### 创建账户
```javascript
const { Mnemonic, HDNode } = require('avalanche');

// 生成助记词
const mnemonic = Mnemonic.getInstance();
const words = mnemonic.generateMnemonic(256);
console.log('助记词:', words);

// 从助记词生成种子
const seed = mnemonic.mnemonicToSeedSync(words);

// 创建HD钱包
const hdnode = new HDNode(seed);

// 派生地址
const child = hdnode.derive("m/44'/9000'/0'/0/0");
console.log('私钥:', child.privateKeyCB58);
console.log('公钥:', child.publicKey.toString('hex'));
```

### 连接网络
```javascript
const { Avalanche } = require('avalanche');

// 连接到测试网
const avalanche = new Avalanche(
  'api.avax-test.network',
  443,
  'https',
  5
);

// 获取不同链的引用
const xchain = avalanche.XChain();  // X-Chain
const pchain = avalanche.PChain();  // P-Chain
const cchain = avalanche.CChain();  // C-Chain
```

### 发送AVAX
```javascript
const { BN } = require('avalanche');

// 导入私钥
const keyPair = keychain.importKey(privateKeyCB58);
const address = keyPair.getAddressString();

// 获取UTXO
const utxoResponse = await xchain.getUTXOs(address);
const utxos = utxoResponse.utxos;

// 构建交易
const unsignedTx = await xchain.buildBaseTx(
  utxos,
  new BN('1000000000'),  // 1 AVAX
  avaxAssetID,
  [toAddress],
  [address],
  [address]
);

// 签名和发送
const signedTx = unsignedTx.sign(keychain);
const txid = await xchain.issueTx(signedTx);
console.log('交易ID:', txid);
```

## 🔧 开发工具

- **avalanche** - 官方JavaScript SDK
- **AvalancheGo** - Go语言实现的节点
- **Avalanche CLI** - 命令行工具
- **Avalanche Wallet** - 官方钱包
- **MetaMask** - 兼容C-Chain的以太坊钱包

## 🌐 网络环境

| 网络   | RPC URL                       | 状态     |
| ------ | ----------------------------- | -------- |
| 主网   | https://api.avax.network      | ✅ 活跃   |
| 测试网 | https://api.avax-test.network | ✅ 活跃   |
| 本地网 | http://localhost:9650         | 🔧 可配置 |

## 📖 核心概念

### 三链架构
Avalanche由三个主要区块链组成：
- **X-Chain (Exchange Chain)**: 用于创建和交易数字资产
- **P-Chain (Platform Chain)**: 用于管理子网和验证者
- **C-Chain (Contract Chain)**: 兼容EVM的智能合约平台

### UTXO模型
Avalanche的X-Chain使用UTXO模型：
- 每个交易消耗一些UTXO作为输入
- 创建新的UTXO作为输出
- 交易费用从输入中扣除

### 共识机制
Avalanche使用创新的共识协议：
- 支持高吞吐量（4,500+ TPS）
- 快速确认（1-3秒）
- 高安全性

### 子网系统
Avalanche支持子网：
- 自定义验证者集合
- 独立的区块链规则
- 可扩展的网络架构

## 🎯 最佳实践

1. **密钥安全**: 使用环境变量存储私钥，避免硬编码
2. **错误处理**: 实现适当的错误处理和重试机制
3. **交易确认**: 等待交易被网络确认
4. **费用管理**: 合理设置交易费用
5. **测试**: 在测试网充分测试后再部署主网
6. **离线签名**: 在安全环境中进行签名操作

## 📚 学习资源

- [Avalanche官方文档](https://docs.avax.network/)
- [AvalancheJS API参考](https://docs.avax.network/build/tools/avalanchejs)
- [GitHub仓库](https://github.com/ava-labs/avalanchejs)
- [开发者社区](https://chat.avax.network/)

## 🔍 示例代码

所有文档都基于实际的示例代码：
- `account.js` - 账户创建和密钥管理
- `transfer.js` - 基本的AVAX转移
- `sign.js` - 消息签名和验证
- `decode.js` - 交易解码和分析
- `offline-signing.js` - 离线交易签名
- `tx.js` - 高级交易构建

开始构建你的Avalanche应用吧！
