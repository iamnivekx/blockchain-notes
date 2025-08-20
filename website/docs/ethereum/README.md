# 以太坊开发文档

欢迎来到以太坊开发文档！这里包含了完整的以太坊开发指南，从基础概念到高级应用。

## 📚 文档结构

### 1. 账户管理
- **[账户创建与管理](./account/account.md)** - 私钥、公钥、地址生成
- **[钱包集成](./account/wallet.md)** - 钱包创建、管理和操作

### 2. 交易处理
- **[交易构建与签名](./tx/transaction.md)** - 交易创建、签名和验证
- **[EIP-1559交易](./tx/eip1559.md)** - 新的交易格式和Gas优化
- **[ABI编码解码](./tx/abi-decode.md)** - 智能合约交互数据格式
- **[ERC20代币操作](./tx/erc20.md)** - 代币转账和授权
- **[ERC721 NFT操作](./tx/abi-decode-erc721.md)** - NFT相关操作

### 3. 多重签名
- **[Gnosis Safe集成](./multisig/safe/gnosis.md)** - Safe钱包核心功能
- **[Safe部署](./multisig/safe/deploy.md)** - 部署Safe合约
- **[Safe操作](./multisig/safe/helper.md)** - 日常操作和工具函数

### 4. 区块链交互
- **[节点连接](./blockchain/README.md)** - 连接以太坊网络
- **[区块数据](./blockchain/README.md)** - 区块和交易数据获取

## 🚀 快速开始

### 环境准备
```bash
# 安装依赖
npm install ethers @ethereumjs/tx @ethereumjs/common

# 或者使用yarn
yarn add ethers @ethereumjs/tx @ethereumjs/common
```

### 创建账户
```typescript
import { ethers } from 'ethers';

// 创建随机钱包
const wallet = ethers.Wallet.createRandom();
console.log('Address:', await wallet.getAddress());
console.log('Private Key:', wallet.privateKey);
```

### 发送交易
```typescript
// 连接到网络
const provider = new ethers.providers.JsonRpcProvider('YOUR_RPC_URL');
const connectedWallet = wallet.connect(provider);

// 发送交易
const tx = await connectedWallet.sendTransaction({
  to: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
  value: ethers.utils.parseEther('0.1')
});

await tx.wait();
console.log('Transaction confirmed:', tx.hash);
```

## 🔧 开发工具

- **Hardhat** - 以太坊开发环境
- **ethers.js** - 以太坊JavaScript库
- **ethereumjs-tx** - 交易处理库
- **Web3.js** - 以太坊JavaScript API

## 🌐 网络环境

| 网络     | 链ID     | 用途     | 状态     |
| -------- | -------- | -------- | -------- |
| 主网     | 1        | 生产环境 | ✅ 活跃   |
| Goerli   | 5        | 测试网络 | ✅ 活跃   |
| Sepolia  | 11155111 | 测试网络 | ✅ 活跃   |
| 本地网络 | 1337     | 开发测试 | 🔧 可配置 |

## 📖 学习路径

### 初学者
1. 了解以太坊基础概念
2. 学习账户和钱包管理
3. 掌握基本交易操作

### 进阶开发者
1. 深入理解EIP-1559
2. 学习智能合约交互
3. 掌握多重签名技术

### 高级开发者
1. 构建DeFi应用
2. 优化Gas费用
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
- 加入 [Discord](https://discord.gg/ethereum)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](https://github.com/iamnivekx/blockchain-notes/blob/main/LICENSE) 文件了解详情。

---

**开始你的以太坊开发之旅吧！** 🚀
