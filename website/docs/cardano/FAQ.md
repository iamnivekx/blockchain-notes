# 常见问题 (FAQ)

## 账户和密钥

### Q: 如何生成 Cardano 助记词？

A: 可以使用 BIP39 标准生成助记词：

```typescript
import { generateMnemonic } from 'bip39';

// 生成 12 个单词的助记词
const mnemonic = generateMnemonic(128); // 128 bits = 12 words

// 生成 24 个单词的助记词
const mnemonic24 = generateMnemonic(256); // 256 bits = 24 words
```

### Q: 密钥派生路径是什么？

A: Cardano 使用以下派生路径：

```
m/1852'/1815'/0'/0/0  // 外部链，第一个地址
m/1852'/1815'/0'/2/0  // 嵌合链，质押密钥
```

其中：
- `1852'` 是 CIP1852 目的值
- `1815'` 是 Cardano 的币种类型
- `0'` 是账户索引
- `0` 是链类型（0=外部，1=内部，2=嵌合）
- `0` 是地址索引

### Q: 如何从私钥恢复公钥？

A: 使用 `to_public()` 方法：

```typescript
var private_key = PrivateKey.from_normal_bytes(prv_key_buf);
var public_key = private_key.to_public();
var public_key_bytes = public_key.as_bytes();
```

## 地址

### Q: 不同地址类型有什么区别？

A: 
- **Base Address**: 支持质押的完整功能地址，格式为 `addr1...`
- **Enterprise Address**: 不支持质押，适合交易所，格式为 `addr1...`
- **Pointer Address**: 可以更短的地址格式
- **Reward Address**: 用于接收质押奖励，格式为 `stake1...`
- **Byron Address**: 旧版本格式，以 `Ae2...` 开头

### Q: 如何验证地址格式？

A: 使用相应的解析方法：

```typescript
// Shelley 地址
try {
  var address = Address.from_bech32('addr1...');
  console.log('Valid Shelley address');
} catch (error) {
  console.log('Invalid Shelley address');
}

// Byron 地址
try {
  var byronAddress = ByronAddress.from_base58('Ae2...');
  console.log('Valid Byron address');
} catch (error) {
  console.log('Invalid Byron address');
}
```

## 交易

### Q: 如何设置正确的 TTL？

A: TTL 应该基于当前槽位设置，通常设置为当前槽位 + 7200（约1小时）：

```typescript
// 获取当前槽位（需要查询节点）
const currentSlot = 40435179;
const ttl = currentSlot + 7200; // 1小时后过期

txBuilder.set_ttl(ttl);
```

### Q: 交易费用如何计算？

A: Cardano 使用线性费用模型：`fee = a * size + b`

```typescript
// 主网参数
var txBuilder = CardanoWasm.TransactionBuilder.new(
  CardanoWasm.LinearFee.new(
    CardanoWasm.BigNum.from_str('44'),     // a 参数
    CardanoWasm.BigNum.from_str('155381')  // b 参数
  ),
  // ... 其他参数
);
```

### Q: 如何处理交易失败？

A: 检查常见原因：

1. **余额不足**: 确保有足够的 ADA 支付费用
2. **TTL 过期**: 检查交易是否在有效期内
3. **签名无效**: 验证私钥和公钥匹配
4. **UTXO 不存在**: 确认输入 UTXO 仍然可用

## 网络

### Q: 如何选择正确的网络？

A: 根据用途选择：

```typescript
// 主网
var networkInfo = NetworkInfo.mainnet();
var protocolMagic = 764824073;

// 测试网
var networkInfo = NetworkInfo.testnet();
var protocolMagic = 1097911063;

// 预览网
var networkInfo = NetworkInfo.preview();
var protocolMagic = 2;
```

### Q: 如何连接到 Cardano 节点？

A: 使用官方端点或运行自己的节点：

```typescript
// 主网端点
const MAINNET_ENDPOINTS = [
  'https://cardano-mainnet.blockfrost.io/api/v0',
  'https://api.koios.rest'
];

// 测试网端点
const TESTNET_ENDPOINTS = [
  'https://cardano-testnet.blockfrost.io/api/v0',
  'https://testnet.koios.rest'
];
```

## 开发工具

### Q: 推荐使用哪些库？

A: 
- **@emurgo/cardano-serialization-lib-nodejs**: 官方序列化库
- **cardano-wallet-js**: 钱包功能库
- **@cardano-foundation/cardano-connect-with-wallet**: 钱包连接
- **@meshsdk/meshjs**: 完整的开发框架

### Q: 如何调试交易问题？

A: 
1. 启用详细日志
2. 验证交易体结构
3. 检查签名过程
4. 使用测试网进行测试
5. 查看交易哈希和状态

## 安全

### Q: 如何安全存储私钥？

A: 
- 使用硬件钱包
- 加密存储助记词
- 避免在代码中硬编码
- 使用环境变量
- 定期备份

### Q: 如何验证交易签名？

A: 使用公钥验证签名：

```typescript
var public_key = private_key.to_public();
var isValid = public_key.verify(txHash.to_bytes(), signature);
```

## 性能

### Q: 如何优化交易构建？

A: 
- 批量处理多个输出
- 使用适当的 UTXO 选择策略
- 优化地址重用
- 合理设置 TTL

### Q: 如何处理大量交易？

A: 
- 使用队列系统
- 实现重试机制
- 监控网络状态
- 分批提交交易
