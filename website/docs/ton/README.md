# TON 开发文档

欢迎来到 TON 开发文档！这里包含了完整的 TON 区块链开发指南，从基础概念到高级应用。

## 📚 文档结构

### 1. 账户管理
- **[账户创建与管理](./account/account.md)** - 私钥、公钥、地址生成
- **[钱包集成](./account/wallet.md)** - 钱包创建、管理和操作

### 2. 交易处理
- **[交易构建与签名](./tx/send-ton.md)** - 交易创建、签名和验证

### 3. 代币操作
- **[Jetton代币操作](./token/jetton.md)** - Jetton代币转账和授权

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
npm install @ton/ton @ton/core @ton/crypto

# 或者使用yarn
yarn add @ton/ton @ton/core @ton/crypto
```

### 创建客户端
```typescript
import { TonClient } from '@ton/ton';

const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: 'YOUR_API_KEY'
});
```

### 创建钱包
```typescript
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

const mnemonics = 'your mnemonic phrase here';
const keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));

const wallet = WalletContractV4.create({ 
  workchain: 0, 
  publicKey: keyPair.publicKey 
});
const contract = client.open(wallet);
```

## 🔧 开发工具

- **@ton/ton** - TON 区块链官方 JavaScript 库
- **@ton/core** - TON 核心功能库
- **@ton/crypto** - 加密和密钥管理库
- **TonCenter API** - TON 区块链数据访问

## 🌐 网络环境

| 网络   | 用途     | 状态   |
| ------ | -------- | ------ |
| 主网   | 生产环境 | ✅ 活跃 |
| 测试网 | 开发测试 | ✅ 活跃 |

## 📖 学习路径

### 初学者
1. 了解 TON 基础概念
2. 学习账户和钱包管理
3. 掌握基本交易操作

### 进阶开发者
1. 深入理解 Jetton 代币
2. 学习智能合约交互
3. 掌握地址格式转换

### 高级开发者
1. 构建 DeFi 应用
2. 优化交易费用
3. 实现复杂业务逻辑

## 🤝 贡献指南

欢迎贡献代码和文档！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📞 支持

如果你遇到问题或需要帮助：

- 查看 [常见问题](./FAQ.md)
- 提交 [Issue](https://github.com/iamnivekx/blockchain-notes/issues)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](https://github.com/iamnivekx/blockchain-notes/blob/main/LICENSE) 文件了解详情。

---

**开始你的 TON 开发之旅吧！** 🚀
