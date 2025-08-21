# Ripple开发文档

欢迎来到Ripple开发文档！这里包含了完整的Ripple区块链开发指南，从基础概念到高级应用，基于你的实际代码实现。

## 📚 文档结构

### 1. 账户管理
- **[地址生成](./account/address.md)** - 地址生成、密钥对派生和地址验证
- **[账户检查](./account/check.md)** - 地址验证和账户信息查询
- **[账户启用](./account/enable.md)** - 账户激活和配置
- **[账户标志](./account/flag.md)** - 设置账户标志

### 2. 交易处理
- **[SDK交易](./tx/sign-sdk.md)** - 使用SDK交易创建、签名和提交
- **[离线交易](./tx/sign-external.md)** - 使用离线交易处理和签名
- **[HTTP交易](./tx/http.md)** - 通过HTTP接口处理交易
- **[交易编码](./tx/codec.md)** - 交易序列化和反序列化

### 3. 多重签名
- **[多重签名账户](./multisig/account.md)** - 多重签名账户创建和配置
- **[多重签名交易](./multisig/tx.md)** - 多重签名交易处理
- **[多重签名启用](./multisig/enable.md)** - 启用多重签名功能

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
npm install ripple-lib ripple-address-codec ripple-binary-codec

# 安装工具库
npm install lodash base-x
```

### 创建API实例
```javascript
const RippleAPI = require('ripple-lib').RippleAPI;

// 创建API实例
const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net/', // 测试网
  // server: 'wss://s1.ripple.com/', // 主网
});

// 连接到网络
await api.connect();
```

### 生成地址
```javascript
const { classicAddressToXAddress } = require('ripple-address-codec');

// 从密钥派生密钥对
const secret = 'sapyGYwE3bh3JiYU59hFdecU2PovC';
const keypair = api.deriveKeypair(secret);
const { publicKey, privateKey } = keypair;

// 派生地址
const address = api.deriveAddress(publicKey);
console.log('Classic Address:', address);

// 转换为X地址格式
const xAddress = classicAddressToXAddress(address, false, true);
console.log('X Address:', xAddress);
```

### 发送交易
```javascript
// 准备交易
const preparedTx = await api.prepareTransaction(
  {
    TransactionType: 'Payment',
    Account: from_address,
    Amount: api.xrpToDrops('1'),
    Destination: dest_address,
  },
  {
    maxLedgerVersionOffset: 75,
  }
);

// 签名交易
const signed = api.sign(preparedTx.txJSON, secret);

// 提交交易
const result = await api.submit(signed.signedTransaction);
console.log('Result:', result.resultCode);
```

## 🔧 开发工具

- **ripple-lib** - 官方JavaScript/TypeScript SDK
- **ripple-address-codec** - 地址编码和解码库
- **ripple-binary-codec** - 交易序列化库
- **base-x** - Base58编码库
- **lodash** - 实用工具库

## 🌐 网络环境

| 网络   | RPC URL                        | 状态     | 用途     |
| ------ | ------------------------------ | -------- | -------- |
| 主网   | wss://s1.ripple.com/           | ✅ 活跃   | 生产环境 |
| 测试网 | wss://s.altnet.rippletest.net/ | ✅ 活跃   | 开发测试 |
| 开发网 | wss://s.devnet.rippletest.net/ | 🔧 可配置 | 开发测试 |

## 📖 核心概念

### 账户模型
Ripple使用基于公钥的账户模型：
- 每个账户有唯一的地址
- 支持经典地址和X地址格式
- 需要20 XRP作为储备金
- 支持多种交易类型

### 交易类型
Ripple支持多种交易类型：
- **Payment** - 支付交易
- **SignerListSet** - 设置多重签名
- **AccountSet** - 账户配置
- **TrustSet** - 信任线设置
- **OfferCreate** - 创建订单

### 多重签名
Ripple多重签名系统：
- 支持最多8个签名者
- 可配置权重和阈值
- 支持主密钥和常规密钥
- 灵活的安全策略

### XRP代币
XRP是Ripple的原生代币：
- 总供应量1000亿
- 6位小数精度
- 用于支付交易费用
- 支持快速跨境转账

## 🎯 最佳实践

1. **网络选择**: 开发时使用测试网，生产时使用主网
2. **错误处理**: 实现完整的错误处理和重试机制
3. **交易确认**: 等待交易最终确认
4. **安全考虑**: 安全存储私钥和种子
5. **费用优化**: 合理设置交易费用
6. **地址验证**: 验证所有地址格式

## 🔐 安全注意事项

1. **私钥安全**: 安全存储私钥，不要暴露给第三方
2. **多重签名**: 合理设置签名者权重和阈值
3. **网络验证**: 验证网络连接和服务器地址
4. **交易验证**: 仔细检查交易参数和接收地址
5. **密钥轮换**: 定期更新密钥和种子

## 📚 学习资源

- [Ripple官方文档](https://xrpl.org/docs/)
- [Ripple开发者中心](https://developers.ripple.com/)
- [XRP Ledger文档](https://xrpl.org/)
- [Ripple GitHub](https://github.com/ripple)

## 🚀 下一步

- 查看 [快速入门指南](./intro.md)
- 了解 [账户管理](./account/address.md)
- 学习 [SDK交易](./tx/sign-sdk.md)
- 探索 [多重签名](./multisig/account.md)

开始构建你的Ripple应用吧！
