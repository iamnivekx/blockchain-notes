# Cardano 开发指南

欢迎来到 Cardano 开发指南！本指南将帮助你掌握 Cardano 区块链开发的核心概念和实践技能。

## 什么是 Cardano？

Cardano 是一个基于权益证明（PoS）的第三代区块链平台，采用分层架构设计，支持智能合约和去中心化应用开发。Cardano 使用 Ouroboros 共识协议，通过形式化验证确保安全性和可靠性。

## 核心特性

- **分层架构**: 结算层（CSL）和计算层（CCL）分离
- **权益证明共识**: Ouroboros 协议
- **形式化验证**: 数学证明确保安全性
- **可扩展性**: 支持侧链和状态通道
- **互操作性**: 跨链通信能力
- **UTXO模型**: 类似比特币的未花费交易输出模型

## 学习路径

### 1. 账户管理
- [账户管理](./account/account.md) - 密钥派生和账户创建
- [Byron 地址](./account/byron.md) - 旧版本地址格式处理
- [地址类型](./account/account.md#地址生成) - 多种地址格式支持

### 2. 交易处理
- [Shelley 交易](./tx/shelley.md) - 现代交易格式构建
- [Byron 交易](./tx/byron.md) - 旧版本交易处理
- [交易提交](./tx/submit.md) - 交易广播和网络提交

### 3. 密钥管理
- [BIP39 助记词](./account/account.md#账户密钥派生) - 助记词生成和恢复
- [BIP32 密钥派生](./account/account.md#密钥派生路径) - 分层确定性钱包
- [Ed25519 椭圆曲线](./account/byron.md#从私钥派生) - 数字签名算法

### 4. 网络集成
- [主网配置](./intro.md#网络配置) - 生产环境设置
- [测试网配置](./intro.md#网络配置) - 开发测试环境
- [API 端点](./tx/submit.md#提交端点) - 网络交互接口

## 开发工具

- **@emurgo/cardano-serialization-lib-nodejs**: Cardano 官方序列化库
- **bip39**: 助记词处理库
- **elliptic**: 椭圆曲线加密库
- **@polkadot/util**: 工具函数库
- **cardano-wallet-js**: 钱包功能库

## 网络环境

| 网络   | 网络ID | 协议魔法值 | 地址前缀 | 用途     |
| ------ | ------ | ---------- | -------- | -------- |
| 主网   | 1      | 764824073  | addr1    | 生产环境 |
| 测试网 | 0      | 1097911063 | addr1    | 测试环境 |
| 预览网 | 0      | 2          | addr1    | 开发测试 |

## 地址格式

- **Base Address**: `addr1...` - 支持质押的完整功能地址
- **Enterprise Address**: `addr1...` - 不支持质押的地址（适合交易所）
- **Pointer Address**: `addr1...` - 指针地址，可以更短
- **Reward Address**: `stake1...` - 质押奖励地址
- **Byron Address**: `Ae2...` - 旧版本地址格式（Base58编码）

## 密钥派生路径

Cardano 使用标准化的密钥派生路径：

```
m/1852'/1815'/0'/0/0  // 外部链，第一个地址
m/1852'/1815'/0'/1/0  // 内部链，第一个地址
m/1852'/1815'/0'/2/0  // 嵌合链，质押密钥
```

其中：
- `1852'` 是 CIP1852 目的值
- `1815'` 是 Cardano 的币种类型
- `0'` 是账户索引
- `0/1/2` 是链类型（0=外部，1=内部，2=嵌合）
- `0` 是地址索引

## 交易类型

### Shelley 交易
- 支持现代地址格式
- 自动费用计算
- 支持质押和委托
- 使用 vkey 见证

### Byron 交易
- 支持旧版本地址
- 使用 bootstrap 见证
- 需要链码信息
- 兼容性更好

## 开发最佳实践

### 1. 安全性
- 使用环境变量存储敏感信息
- 在生产环境中使用硬件钱包
- 定期备份助记词
- 验证所有交易参数

### 2. 性能优化
- 批量处理多个输出
- 使用适当的 UTXO 选择策略
- 优化地址重用
- 合理设置 TTL

### 3. 错误处理
- 实现重试机制
- 监控网络状态
- 处理交易失败
- 验证交易确认

## 示例代码

查看 [示例代码](./examples.md) 页面获取完整的代码示例：

- 账户创建和管理
- 地址生成和验证
- 交易构建和签名
- 网络交互和提交

## 常见问题

查看 [FAQ](./FAQ.md) 页面获取常见问题的解答：

- 密钥派生问题
- 地址格式验证
- 交易构建错误
- 网络连接问题

## 学习资源

- [Cardano 官方文档](https://docs.cardano.org/)
- [Emurgo 序列化库](https://github.com/Emurgo/cardano-serialization-lib)
- [CIP 提案](https://github.com/cardano-foundation/CIPs)
- [Cardano 社区](https://forum.cardano.org/)

开始你的 Cardano 开发之旅吧！
