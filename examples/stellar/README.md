# Stellar 区块链开发示例

本目录包含 Stellar 区块链开发的完整示例代码，涵盖账户管理、交易处理、代币发行和资产管理等核心功能。

## 目录结构

```
stellar/
├── account/          # 账户管理示例
│   └── index.js      # 账户创建和密钥管理
├── tx/               # 交易处理示例
│   ├── single.js     # XLM 转账交易
│   └── issue.js      # 代币发行和转账
└── README.md         # 本说明文档
```

## 快速开始

### 1. 安装依赖

```bash
npm install stellar-sdk elliptic
```

### 2. 配置网络

在运行示例前，请确保配置了正确的网络端点：

```javascript
// 测试网
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;

// 主网
const server = new StellarSdk.Server('https://horizon.stellar.org');
const networkPassphrase = StellarSdk.Networks.PUBLIC;
```

### 3. 设置私钥

**重要**: 请将示例中的 `secretKey` 和 `privateKey` 替换为您自己的私钥，或者使用测试网账户。

## 示例说明

### 账户管理 (account/index.js)

演示如何：
- 生成 Ed25519 密钥对
- 从公钥创建密钥对
- 获取不同格式的公钥表示
- 验证公钥格式
- 加载账户信息

```bash
node account/index.js
```

### XLM 转账 (tx/single.js)

演示如何：
- 构建 XLM 转账交易
- 设置时间边界和备注
- 手动签名交易
- 序列化和反序列化交易
- 提交交易到网络

```bash
node tx/single.js
```

### 代币发行 (tx/issue.js)

演示如何：
- 创建自定义代币资产
- 建立信任线
- 发行代币给接收方
- 代币转账操作
- 完整的代币生命周期管理

```bash
node tx/issue.js
```

## 注意事项

1. **私钥安全**: 示例中的私钥仅用于演示，请勿在生产环境中使用
2. **测试网优先**: 建议先在测试网进行测试，确认无误后再在主网使用
3. **错误处理**: 示例包含基本的错误处理，生产环境中需要更完善的错误处理机制
4. **网络选择**: 根据开发需求选择合适的网络（主网/测试网）

## 常见问题

### Q: 如何获取测试网 XLM？
A: 可以使用测试网水龙头：
- Friendbot: https://friendbot.stellar.org/
- Stellar Laboratory: https://laboratory.stellar.org/

### Q: 交易失败怎么办？
A: 检查以下几点：
1. 账户余额是否充足
2. 地址格式是否正确
3. 序列号是否正确
4. 时间边界是否合理
5. 网络连接是否正常

### Q: 如何调试代币发行？
A: 使用以下方法：
1. 检查信任线是否正确建立
2. 验证代币资产对象是否正确创建
3. 查看交易返回的错误信息
4. 使用 Stellar Expert 查看交易详情

## 扩展开发

基于这些示例，您可以：

1. **构建 DApp**: 集成到前端应用中
2. **开发钱包**: 实现完整的钱包功能
3. **创建 DeFi 应用**: 构建去中心化金融应用
4. **实现锚点系统**: 连接传统金融系统
5. **开发智能合约**: 使用 Stellar Smart Contracts

## 相关资源

- [Stellar 官方文档](https://developers.stellar.org/)
- [Stellar SDK API 参考](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Expert](https://stellar.expert/)
- [Horizon API](https://developers.stellar.org/api/)

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这些示例。请确保：

1. 代码符合项目规范
2. 包含必要的注释和文档
3. 测试通过且功能正常
4. 遵循安全最佳实践

## 许可证

本示例代码采用 MIT 许可证，详见项目根目录的 LICENSE 文件。
