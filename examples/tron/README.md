# Tron 区块链开发示例

本目录包含 Tron 区块链开发的完整示例代码，涵盖账户管理、交易处理、代币转账和智能合约交互等核心功能。

## 目录结构

```
tron/
├── account/          # 账户管理示例
│   └── address.js    # 地址生成和密钥管理
├── tx/               # 交易处理示例
│   ├── tron.js       # TRX 转账交易
│   ├── trc10.js      # TRC10 代币转账
│   ├── trc20.js      # TRC20 智能合约调用
│   └── decode.js     # 交易数据解码
└── README.md         # 本说明文档
```

## 快速开始

### 1. 安装依赖

```bash
npm install tronweb elliptic
```

### 2. 配置网络

在运行示例前，请确保配置了正确的网络端点：

```javascript
// 主网
const fullNode = 'https://api.trongrid.io';
const solidityNode = 'https://api.trongrid.io';
const eventServer = 'https://api.trongrid.io';

// 测试网
const fullNode = 'https://api.shasta.trongrid.io';
const solidityNode = 'https://api.shasta.trongrid.io';
const eventServer = 'https://api.shasta.trongrid.io';
```

### 3. 设置私钥

**重要**: 请将示例中的 `privateKey` 替换为您自己的私钥，或者使用测试网账户。

## 示例说明

### 账户管理 (account/address.js)

演示如何：
- 生成椭圆曲线密钥对
- 从私钥派生公钥和地址
- 验证地址格式
- 使用 TronWeb 工具函数

```bash
node account/address.js
```

### TRX 转账 (tx/tron.js)

演示如何：
- 构建 TRX 转账交易
- 添加交易备注
- 签名和广播交易
- 手动签名实现

```bash
node tx/tron.js
```

### TRC10 代币转账 (tx/trc10.js)

演示如何：
- 构建 TRC10 代币转账交易
- 处理代币 ID 和数量
- 添加备注信息
- 完整的交易流程

```bash
node tx/trc10.js
```

### TRC20 智能合约 (tx/trc20.js)

演示如何：
- 调用智能合约函数
- 构建合约调用交易
- 设置手续费和参数
- 处理合约返回值

```bash
node tx/trc20.js
```

### 交易解码 (tx/decode.js)

演示如何：
- 解码交易输入数据
- 识别函数调用类型
- 解析函数参数
- 处理地址格式转换

```bash
node tx/decode.js
```

## 注意事项

1. **私钥安全**: 示例中的私钥仅用于演示，请勿在生产环境中使用
2. **测试网优先**: 建议先在测试网进行测试，确认无误后再在主网使用
3. **错误处理**: 示例包含基本的错误处理，生产环境中需要更完善的错误处理机制
4. **网络选择**: 根据开发需求选择合适的网络（主网/测试网）

## 常见问题

### Q: 如何获取测试网 TRX？
A: 可以使用测试网水龙头：
- Shasta: https://www.trongrid.io/faucet
- Nile: https://nileex.io/join/getJoinPage

### Q: 交易失败怎么办？
A: 检查以下几点：
1. 账户余额是否充足
2. 地址格式是否正确
3. 手续费设置是否合理
4. 网络连接是否正常

### Q: 如何调试智能合约调用？
A: 使用以下方法：
1. 检查函数参数类型和值
2. 验证合约地址是否正确
3. 查看交易返回的错误信息
4. 使用 TronScan 查看交易详情

## 扩展开发

基于这些示例，您可以：

1. **构建 DApp**: 集成到前端应用中
2. **开发钱包**: 实现完整的钱包功能
3. **创建 DeFi 应用**: 构建去中心化金融应用
4. **实现跨链功能**: 与其他区块链网络交互

## 相关资源

- [Tron 官方文档](https://developers.tron.network/)
- [TronWeb API 参考](https://developers.tron.network/reference)
- [TronBox 开发框架](https://developers.tron.network/docs/tronbox-user-guide)
- [TronScan 区块链浏览器](https://tronscan.org/)

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这些示例。请确保：

1. 代码符合项目规范
2. 包含必要的注释和文档
3. 测试通过且功能正常
4. 遵循安全最佳实践

## 许可证

本示例代码采用 MIT 许可证，详见项目根目录的 LICENSE 文件。
