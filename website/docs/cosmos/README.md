# Cosmos 开发文档

欢迎使用 Cosmos 区块链开发文档！本文档提供了完整的 Cosmos 开发指南，包括账户管理、交易处理、质押委托等核心功能。

## 📚 文档结构

### 基础概念
- **[简介](intro.md)** - Cosmos 平台概述和核心特性
- **[开发指南](guide.md)** - 完整的开发学习路径和最佳实践
- **[FAQ](FAQ.md)** - 常见问题和解答

### 账户管理
- **[地址生成](account/address.md)** - 钱包创建和地址生成
- **[多重签名](account/multisig.md)** - 多重签名账户管理

### 交易处理
- **[Amino 交易](tx/amino.md)** - 传统交易格式构建和签名
- **[Direct 交易](tx/direct.md)** - 高效交易格式处理
- **[交易解码](tx/decode.md)** - 交易数据解析和验证

### 质押委托
- **[质押委托](delegate/delegate.md)** - 质押、委托和奖励管理

### 多重签名交易
- **[多重签名基础](multisig/multisignature.md)** - 基础多重签名功能
- **[Amino 多签](multisig/amino.md)** - Amino 格式多重签名交易
- **[Direct 多签](multisig/direct.md)** - Direct 格式多重签名交易
- **[质押多签](multisig/staking.md)** - 多重签名质押操作

## 🚀 快速开始

### 环境设置

1. 安装依赖：
```bash
npm install @cosmjs/stargate @cosmjs/amino @cosmjs/proto-signing @cosmjs/encoding @cosmjs/crypto
```

2. 设置环境变量：
```bash
# 基础配置
MNEMONIC="your 12 or 24 word mnemonic phrase"
PRIV_KEY="your private key in hex format"

# 多重签名配置（可选）
AARON="first signer mnemonic phrase"
PHCC="second signer mnemonic phrase"
PENG="third signer mnemonic phrase"
```

### 基本用法

#### 创建钱包
```typescript
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
const [firstAccount] = await wallet.getAccounts();
console.log('Account address:', firstAccount.address);
```

#### 连接客户端
```typescript
import { SigningStargateClient } from '@cosmjs/stargate';

const rpcEndpoint = 'https://rpc.testnet.cosmos.network:443';
const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);
```

#### 发送交易
```typescript
const sendMsg = {
  typeUrl: "/cosmos.bank.v1beta1.MsgSend",
  value: {
    fromAddress: senderAddress,
    toAddress: recipientAddress,
    amount: [{ denom: "uphoton", amount: "1000000" }],
  },
};

const result = await client.signAndBroadcast(
  senderAddress,
  [sendMsg],
  fee,
  memo
);
```

## 🔧 核心功能

### 账户管理
- **HD 钱包支持**: BIP44 标准派生路径
- **多种密钥类型**: Secp256k1 椭圆曲线
- **地址生成和验证**: Bech32 编码格式
- **多重签名账户**: 阈值签名和公钥管理

### 交易处理
- **Amino 格式**: 传统 JSON 编码，向后兼容
- **Direct 格式**: 高效 Protocol Buffers 编码
- **自动签名和广播**: 完整的交易生命周期管理
- **费用计算和 Gas 管理**: 智能费用估算

### 质押功能
- **委托 ATOM**: 参与网络验证
- **取消委托**: 收回质押资金
- **重新委托**: 优化验证者选择
- **奖励提取**: 获取质押收益

### 多重签名
- **阈值签名**: 灵活的签名要求设置
- **多签交易构建**: 支持多种交易类型
- **签名验证**: 确保交易安全性
- **离线签名**: 支持冷钱包环境

## 📖 示例代码

所有示例代码都位于 `examples/cosmos/` 目录中：

### 账户管理
- `account/address.js` - 地址生成和钱包管理示例
- `account/multisig.js` - 多重签名账户创建示例

### 交易处理
- `tx/amino.js` - Amino 格式交易构建和签名示例
- `tx/direct.js` - Direct 格式交易处理示例
- `tx/decode.js` - 交易数据解析和验证示例

### 质押委托
- `delegate/delegate.js` - 质押、委托和奖励管理示例

### 多重签名交易
- `multisig/multisignature.js` - 基础多重签名功能示例
- `multisig/amino.js` - Amino 格式多重签名交易示例
- `multisig/direct.js` - Direct 格式多重签名交易示例
- `multisig/staking.js` - 多重签名质押操作示例

## 🌐 网络配置

### 主网
- **RPC 端点**: `https://rpc.cosmos.network:26657`
- **地址前缀**: `cosmos`
- **代币单位**: `uatom` (1 ATOM = 1,000,000 uatom)
- **链 ID**: `cosmoshub-4`
- **区块时间**: ~6 秒

### 测试网
- **RPC 端点**: `https://rpc.testnet.cosmos.network:443`
- **地址前缀**: `cosmos`
- **代币单位**: `uphoton`
- **链 ID**: `theta-testnet-001`
- **区块时间**: ~6 秒

### 本地开发网
- **RPC 端点**: `http://localhost:26657`
- **地址前缀**: `cosmos`
- **代币单位**: `stake`
- **链 ID**: `test`
- **区块时间**: 可配置

## 🔒 安全注意事项

- 永远不要在代码中硬编码私钥
- 使用环境变量存储敏感信息
- 在生产环境中使用硬件钱包
- 定期备份助记词
- 验证所有交易参数

## 📚 相关资源

- [Cosmos 官方文档](https://docs.cosmos.network/)
- [CosmJS 库](https://github.com/cosmos/cosmjs)
- [Cosmos SDK](https://github.com/cosmos/cosmos-sdk)
- [Cosmos 社区](https://forum.cosmos.network/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进文档！

## 📄 许可证

本文档采用 MIT 许可证。
