# 以太坊开发指南

欢迎来到以太坊开发指南！本指南将帮助你掌握以太坊区块链开发的核心概念和实践技能。

## 什么是以太坊？

以太坊是一个去中心化的开源区块链平台，支持智能合约和去中心化应用（DApp）的开发。它使用自己的加密货币以太币（ETH）来支付交易费用和计算服务。

## 核心特性

- **智能合约**: 自动执行的程序代码
- **EVM**: 以太坊虚拟机，执行智能合约
- **Gas机制**: 计算资源定价系统
- **账户模型**: 支持EOA和智能合约账户
- **PoS共识**: 权益证明机制

## 学习路径

### 1. 账户管理
- [账户创建与管理](./account/account.md)
- [钱包集成](./account/wallet.md)

### 2. 交易处理
- [交易构建与签名](./tx/transaction.md)
- [EIP-1559交易](./tx/eip1559.md)
- [ABI编码解码](./tx/abi-decode.md)
- [ERC20代币操作](./tx/erc20.md)
- [ERC721 NFT操作](./tx/abi-decode-erc721.md)

### 3. 多重签名
- [Gnosis Safe集成](./multisig/safe/gnosis.md)
- [Safe部署](./multisig/safe/deploy.md)
- [Safe操作](./multisig/safe/helper.md)

### 4. 区块链交互
- [节点连接](./blockchain/README.md)
- [区块数据](./blockchain/README.md)

## 开发工具

- **Hardhat**: 以太坊开发环境
- **ethers.js**: 以太坊JavaScript库
- **ethereumjs-tx**: 交易处理库
- **Web3.js**: 以太坊JavaScript API

## 网络环境

- **主网**: 生产环境
- **Goerli**: 测试网络
- **Sepolia**: 测试网络
- **本地网络**: 开发测试

开始你的以太坊开发之旅吧！
