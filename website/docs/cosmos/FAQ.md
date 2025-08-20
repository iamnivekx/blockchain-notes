# 常见问题 (FAQ)

## 账户和钱包

### Q: 如何生成 Cosmos 助记词？

A: 可以使用 BIP39 标准生成助记词：

```typescript
import { generateMnemonic } from 'bip39';

// 生成 12 个单词的助记词
const mnemonic = generateMnemonic(128); // 128 bits = 12 words

// 生成 24 个单词的助记词
const mnemonic24 = generateMnemonic(256); // 256 bits = 24 words
```

### Q: 如何从助记词恢复钱包？

A: 使用 DirectSecp256k1HdWallet：

```typescript
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
const [firstAccount] = await wallet.getAccounts();
console.log('Account address:', firstAccount.address);
```

### Q: 派生路径是什么？

A: Cosmos Hub 使用标准的 BIP44 派生路径：

```
m/44'/118'/0'/0/0  // 第一个账户
m/44'/118'/0'/0/1  // 第二个账户
m/44'/118'/0'/0/2  // 第三个账户
```

其中 `118` 是 ATOM 的币种类型。

## 交易

### Q: Amino 和 Direct 格式有什么区别？

A: 
- **Amino**: 传统的 JSON 格式，向后兼容，但消耗更多 Gas
- **Direct**: 新的 Protocol Buffers 格式，更高效，消耗更少 Gas

### Q: 如何设置正确的 Gas 限制？

A: 根据交易类型设置：

```typescript
const GAS_LIMITS = {
  SEND: 200000,      // 转账交易
  DELEGATE: 180000,  // 委托交易
  UNDELEGATE: 180000, // 取消委托
  REDELEGATE: 180000, // 重新委托
};
```

### Q: 如何处理交易失败？

A: 检查常见原因：

1. **余额不足**: 确保有足够的 ATOM 支付费用
2. **序列号错误**: 检查账户序列号
3. **Gas 不足**: 增加 Gas 限制
4. **网络问题**: 检查 RPC 端点连接

## 质押和委托

### Q: 如何选择验证者？

A: 考虑以下因素：

- **佣金率**: 验证者收取的佣金比例
- **投票权重**: 验证者的总质押量
- **正常运行时间**: 验证者的可用性
- **声誉**: 验证者的历史表现

### Q: 委托后多久能获得奖励？

A: 奖励通常在每个区块后累积，可以随时提取。建议定期提取奖励以最大化收益。

### Q: 取消委托需要多长时间？

A: 取消委托后需要等待解绑期（通常为 21 天）才能取回资金。

## 多重签名

### Q: 如何创建多重签名账户？

A: 使用 createMultisigThresholdPubkey：

```typescript
const { createMultisigThresholdPubkey } = require('@cosmjs/amino');

const multisig = createMultisigThresholdPubkey(pubkeys, threshold, true);
const multisigAddress = pubkeyToAddress(multisig, 'cosmos');
```

### Q: 阈值如何设置？

A: 阈值应该根据安全需求设置：

- **2-of-3**: 需要 2 个签名，适合大多数场景
- **3-of-5**: 需要 3 个签名，安全性更高
- **1-of-2**: 需要 1 个签名，类似"或"逻辑

## 网络和连接

### Q: 如何连接到不同的网络？

A: 使用不同的 RPC 端点：

```typescript
// 主网
const MAINNET_RPC = 'https://rpc.cosmos.network:26657';

// 测试网
const TESTNET_RPC = 'https://rpc.testnet.cosmos.network:443';
```

### Q: 如何处理网络连接问题？

A: 
1. 检查网络连接
2. 验证 RPC 端点
3. 检查防火墙设置
4. 尝试备用端点

## 开发工具

### Q: 推荐使用哪些库？

A: 
- **@cosmjs/stargate**: 主要的客户端库
- **@cosmjs/amino**: Amino 编码支持
- **@cosmjs/proto-signing**: Protocol Buffers 签名
- **@cosmjs/encoding**: 编码工具函数

### Q: 如何调试交易问题？

A: 
1. 启用详细日志
2. 验证交易参数
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
const publicKey = privateKey.toPublicKey();
const isValid = publicKey.verify(message, signature);
```

## 性能

### Q: 如何优化交易构建？

A: 
- 使用 Direct 格式而不是 Amino
- 批量处理多个消息
- 合理设置 Gas 限制
- 使用高效的 RPC 端点

### Q: 如何处理大量交易？

A: 
- 使用队列系统
- 实现重试机制
- 监控网络状态
- 分批提交交易

## 错误处理

### Q: 常见的错误类型有哪些？

A: 
- **insufficient funds**: 余额不足
- **sequence number**: 序列号错误
- **gas**: Gas 不足
- **invalid signature**: 签名无效
- **network error**: 网络连接错误

### Q: 如何实现错误重试？

A: 实现指数退避重试机制：

```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 指数退避
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```
