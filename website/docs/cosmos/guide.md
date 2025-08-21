# Cosmos 开发指南

欢迎来到 Cosmos 开发指南！本指南将帮助你掌握 Cosmos 区块链开发的核心概念和实践技能。

## 什么是 Cosmos？

Cosmos 是一个去中心化的区块链网络，旨在解决区块链的可扩展性、可用性和互操作性挑战。它使用 Tendermint 共识机制和 IBC（Inter-Blockchain Communication）协议来实现区块链间的通信，支持多个独立的区块链网络协同工作。

## 核心特性

- **高性能**: 支持 10,000+ TPS
- **低费用**: 交易费用极低
- **快速确认**: 1-6 秒区块确认时间
- **智能合约**: 支持多种编程语言
- **跨链兼容**: 支持 IBC 协议和多种代币标准
- **权益证明**: 基于 PoS 的共识机制

## 学习路径

### 1. 账户管理
- [地址生成](./account/address.md) - 钱包创建和地址生成
- [多重签名](./account/multisig.md) - 多重签名账户管理

### 2. 交易处理
- [Amino 交易](./tx/amino.md) - 传统交易格式构建和签名
- [Direct 交易](./tx/direct.md) - 高效交易格式处理
- [交易解码](./tx/decode.md) - 交易数据解析和验证

### 3. 质押委托
- [质押委托](./delegate/delegate.md) - 质押、委托和奖励管理

### 4. 多重签名交易
- [多重签名基础](./multisig/multisignature.md) - 基础多重签名功能
- [Amino 多签](./multisig/amino.md) - Amino 格式多重签名交易
- [Direct 多签](./multisig/direct.md) - Direct 格式多重签名交易
- [质押多签](./multisig/staking.md) - 多重签名质押操作

## 开发工具

- **CosmJS**: JavaScript/TypeScript SDK
- **Cosmos SDK**: 区块链开发框架
- **Tendermint Core**: 共识引擎
- **Keplr**: 钱包扩展
- **CosmWasm**: 智能合约平台

## 网络环境

| 网络   | RPC URL                                | 用途     |
| ------ | -------------------------------------- | -------- |
| 主网   | https://rpc.cosmos.network:26657       | 生产环境 |
| 测试网 | https://rpc.testnet.cosmos.network:443 | 测试环境 |
| 本地网 | http://localhost:26657                 | 开发测试 |

## 地址格式

- **账户地址**: `cosmos1...` - 用户账户地址
- **验证者地址**: `cosmosvaloper1...` - 验证者节点地址
- **多重签名地址**: `cosmos1...` - 支持阈值签名的地址

## 密钥派生路径

Cosmos Hub 使用标准的 BIP44 派生路径：

```
m/44'/118'/0'/0/0  // 第一个账户
m/44'/118'/0'/0/1  // 第二个账户
m/44'/118'/0'/0/2  // 第三个账户
```

其中：
- `44'` 是 BIP44 标准
- `118'` 是 ATOM 的币种类型
- `0'` 是账户索引
- `0` 是链类型（0=外部，1=内部）
- `0` 是地址索引

## 交易类型

### Amino 交易
- 支持传统 JSON 格式
- 向后兼容
- 消耗更多 Gas

### Direct 交易
- 使用 Protocol Buffers 编码
- 更高效
- 消耗更少 Gas

## 多重签名配置

### 阈值设置
- **2-of-3**: 需要 2 个签名，适合大多数场景
- **3-of-5**: 需要 3 个签名，安全性更高
- **1-of-2**: 需要 1 个签名，类似"或"逻辑

### 公钥管理
- 支持动态添加和移除公钥
- 阈值可调整
- 支持离线签名

## 质押机制

### 委托操作
- **委托**: 将 ATOM 委托给验证者
- **取消委托**: 收回质押资金（需要解绑期）
- **重新委托**: 优化验证者选择
- **提取奖励**: 获取质押收益

### 验证者选择
- **佣金率**: 验证者收取的佣金比例
- **投票权重**: 验证者的总质押量
- **正常运行时间**: 验证者的可用性
- **声誉**: 验证者的历史表现

## 开发最佳实践

### 1. 安全性
- 使用环境变量存储敏感信息
- 在生产环境中使用硬件钱包
- 定期备份助记词
- 验证所有交易参数

### 2. 性能优化
- 使用 Direct 格式而不是 Amino 格式
- 批量处理多个消息
- 合理设置 Gas 限制
- 使用高效的 RPC 端点

### 3. 错误处理
- 实现重试机制
- 监控网络状态
- 处理交易失败
- 验证交易确认

## 环境配置

### 安装依赖
```bash
npm install @cosmjs/stargate @cosmjs/amino @cosmjs/proto-signing @cosmjs/encoding @cosmjs/crypto
```

### 环境变量
```bash
# 基础配置
MNEMONIC="your 12 or 24 word mnemonic phrase"
PRIV_KEY="your private key in hex format"

# 多重签名配置（可选）
AARON="first signer mnemonic phrase"
PHCC="second signer mnemonic phrase"
PENG="third signer mnemonic phrase"
```

### 网络配置
```javascript
const rpcEndpoint = "https://rpc.cosmos.network:26657";
const addressPrefix = "cosmos";
const gasPrice = "0.025uatom";
```

## 代码示例

### 创建钱包
```javascript
import { Secp256k1HdWallet } from "@cosmjs/amino";

const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
  hdPaths: [makeCosmoshubPath(0)],
});
const [firstAccount] = await wallet.getAccounts();
```

### 发送交易
```javascript
import { SigningStargateClient } from "@cosmjs/stargate";

const client = await SigningStargateClient.connectWithSigner(
  rpcEndpoint,
  wallet
);

const result = await client.sendTokens(
  senderAddress,
  recipientAddress,
  [{ denom: "uatom", amount: "1000000" }],
  { gas: "200000", amount: [{ denom: "uatom", amount: "5000" }] }
);
```

## 常见问题

查看 [FAQ](./FAQ.md) 页面获取常见问题的解答：

- 密钥派生问题
- 地址格式验证
- 交易构建错误
- 网络连接问题

## 学习资源

- [Cosmos 官方文档](https://docs.cosmos.network/)
- [CosmJS 库](https://github.com/cosmos/cosmjs)
- [Cosmos SDK](https://github.com/cosmos/cosmjs)
- [IBC 协议](https://ibc.cosmos.network/)
- [Cosmos 社区](https://forum.cosmos.network/)

开始你的 Cosmos 开发之旅吧！
