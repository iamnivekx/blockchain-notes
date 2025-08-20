# Cardano 开发文档

欢迎使用 Cardano 区块链开发文档！本文档提供了完整的 Cardano 开发指南，包括账户管理、交易处理、地址生成等核心功能。

## 📚 文档结构

### 基础概念
- **[介绍](intro.md)** - Cardano 平台概述和核心特性
- **[开发指南](intro.md)** - 完整的开发学习路径和最佳实践
- **[FAQ](FAQ.md)** - 常见问题和解答

### 账户管理
- **[账户管理](account/account.md)** - 密钥派生、地址生成和账户管理
- **[Byron 地址](account/byron.md)** - 旧版本地址格式的处理

### 交易处理
- **[Shelley 交易](tx/shelley.md)** - 现代交易格式的构建和签名
- **[Byron 交易](tx/byron.ts)** - 旧版本交易格式的处理
- **[交易提交](tx/submit.md)** - 交易广播和网络提交

## 🚀 快速开始

### 环境设置

1. 安装依赖：
```bash
npm install @emurgo/cardano-serialization-lib-nodejs bip39 @polkadot/util elliptic
```

2. 设置环境变量：
```bash
CARDANO_MNEMONIC="your 12 or 24 word mnemonic phrase"
CARDANO_PRIVATE_KEY="your private key in hex format"
```

### 基本用法

#### 创建账户
```typescript
import { Bip32PrivateKey } from '@emurgo/cardano-serialization-lib-nodejs';

function harden(num) {
  return 0x80000000 + num;
}

const rootKey = Bip32PrivateKey.from_bip39_entropy(entropy, Buffer.from(''));
const accountKey = rootKey
  .derive(harden(1852))
  .derive(harden(1815))
  .derive(harden(0));
```

#### 生成地址
```typescript
import { BaseAddress, NetworkInfo, StakeCredential } from '@emurgo/cardano-serialization-lib-nodejs';

const utxoPubKey = accountKey.derive(0).derive(0).to_public();
const stakeKey = accountKey.derive(2).derive(0).to_public();

const baseAddr = BaseAddress.new(
  NetworkInfo.mainnet().network_id(),
  StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
  StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
);
```

## 🔧 核心功能

### 地址类型支持
- **Base Address**: 支持质押的完整功能地址
- **Enterprise Address**: 不支持质押，适合交易所
- **Pointer Address**: 可缩短的地址格式
- **Reward Address**: 质押奖励地址
- **Byron Address**: 旧版本地址格式

### 交易功能
- 交易构建和签名
- 多种输入类型支持
- 自动费用计算
- TTL 设置
- 找零处理

### 密钥管理
- BIP39 助记词支持
- BIP32 密钥派生
- Ed25519 椭圆曲线
- 多种编码格式

## 📖 示例代码

所有示例代码都位于 `examples/cardano/` 目录中：

- `account/account.ts` - 完整的账户管理示例
- `account/byron.ts` - Byron 地址处理示例
- `tx/shelley.ts` - Shelley 交易构建示例
- `tx/byron.ts` - Byron 交易处理示例
- `tx/submit.ts` - 交易提交示例

## 🌐 网络配置

### 主网
- 网络 ID: 1
- 协议魔法值: 764824073
- 最小 UTXO: 1,000,000 lovelace

### 测试网
- 网络 ID: 0
- 协议魔法值: 1097911063
- 最小 UTXO: 1,000,000 lovelace

## 🔒 安全注意事项

- 永远不要在代码中硬编码私钥
- 使用环境变量存储敏感信息
- 在生产环境中使用硬件钱包
- 定期备份助记词
- 验证所有交易参数

## 📚 相关资源

- [Cardano 官方文档](https://docs.cardano.org/)
- [Emurgo 序列化库](https://github.com/Emurgo/cardano-serialization-lib)
- [CIP 提案](https://github.com/cardano-foundation/CIPs)
- [Cardano 社区](https://forum.cardano.org/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进文档！

## 📄 许可证

本文档采用 MIT 许可证。
