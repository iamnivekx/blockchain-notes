# TON 常见问题

这里收集了 TON 区块链开发中的常见问题和解答。

## 🔑 账户和钱包

### Q: 如何创建 TON 钱包？

A: 可以使用以下方式创建 TON 钱包：

```typescript
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

// 从助记词生成密钥对
const mnemonics = 'your twelve word mnemonic phrase here';
const keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));

// 创建钱包合约
const wallet = WalletContractV4.create({ 
  workchain: 0, 
  publicKey: keyPair.publicKey 
});
```

### Q: TON 支持哪些钱包版本？

A: TON 支持三种主要的钱包合约版本：

- **WalletContractV3R2**: 基础版本，支持基本转账
- **WalletContractV4**: 增强版本，支持更多功能
- **WalletContractV5R1**: 最新版本，最佳性能和功能

### Q: 如何获取钱包地址？

A: 使用以下代码获取钱包地址：

```typescript
const contract = client.open(wallet);
const address = contract.address;

// 不同格式的地址
console.log('Raw:', address.toString());
console.log('User-friendly:', address.toString({ bounceable: false }));
console.log('URL Safe:', address.toString({ urlSafe: true }));
```

## 💰 交易和转账

### Q: 如何发送 TON 转账？

A: 使用以下代码发送转账：

```typescript
const transfer = contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [
    internal({
      value: toNano('0.01'),
      to: recipientAddress,
      body: 'Hello TON!',
      bounce: false,
    }),
  ],
  sendMode: SendMode.NONE,
});

await contract.send(transfer);
```

### Q: 什么是序列号 (Seqno)？

A: 序列号是防止重放攻击的计数器，每次交易都会递增。获取方式：

```typescript
const seqno = await contract.getSeqno();
```

### Q: 如何设置转账费用？

A: TON 的转账费用是自动计算的，但可以通过 SendMode 控制：

```typescript
import { SendMode } from '@ton/ton';

// 不同发送模式
SendMode.NONE                    // 默认模式
SendMode.PAY_GAS_SEPARATELY      // 单独支付 Gas
SendMode.IGNORE_ERRORS           // 忽略错误
```

## 🪙 Jetton 代币

### Q: 什么是 Jetton？

A: Jetton 是 TON 区块链上的代币标准，类似于以太坊的 ERC-20，支持代币转账、铸造、销毁等操作。

### Q: 如何转账 Jetton 代币？

A: 需要创建特殊的转账消息体：

```typescript
function createTransferBody({
  queryId,
  jettonAmount,
  toAddress,
  responseAddress,
  forwardAmount = 0,
  forwardPayload,
}: ITransferBody): Cell {
  return beginCell()
    .storeUint(0x0f8a7ea5, 32)        // 操作码：jetton transfer
    .storeUint(queryId, 64)            // 查询ID
    .storeCoins(jettonAmount)          // 代币数量
    .storeAddress(toAddress)           // 接收地址
    .storeAddress(responseAddress)     // 响应地址
    .storeBit(0)                      // 无自定义载荷
    .storeCoins(forwardAmount)        // 转发金额
    .endCell();
}
```

### Q: 如何获取 Jetton 余额？

A: 使用以下代码获取代币余额：

```typescript
const jettonMaster = client.open(JettonMaster.create(masterAddress));
const jettonWalletAddress = await jettonMaster.getWalletAddress(userAddress);
const jettonWallet = client.open(JettonWallet.create(jettonWalletAddress));
const balance = await jettonWallet.getBalance();
```

## 📍 地址处理

### Q: TON 地址有哪些格式？

A: TON 支持三种地址格式：

- **Raw 格式**: `0:14b6a6afbdcb4fcb254f0e7d78f05888b3d222d05656fe6490563aaff3263a89`
- **User-friendly 格式**: `UQAUtqavvctPyyVPDn148FiIs9Ii0FZW_mSQVjqv8yY6ibFJ`
- **Base64 格式**: `EQAUtqavvctPyyVPDn148FiIs9Ii0FZW_mSQVjqv8yY6ieyM`

### Q: 地址开头的字母代表什么？

A: 地址开头的字母表示不同的标志组合：

| 开头字母 | 可退回 | 仅测试网 | 说明               |
| -------- | ------ | -------- | ------------------ |
| E...     | 是     | 否       | 主网可退回地址     |
| U...     | 否     | 否       | 主网不可退回地址   |
| k...     | 是     | 是       | 测试网可退回地址   |
| 0...     | 否     | 是       | 测试网不可退回地址 |

### Q: 如何验证地址格式？

A: 使用以下代码验证地址：

```typescript
import { Address } from '@ton/core';

function validateAddress(addressString: string): boolean {
  try {
    const address = Address.parse(addressString);
    return address !== null;
  } catch (error) {
    return false;
  }
}
```

## 🌐 网络和客户端

### Q: 如何连接到 TON 网络？

A: 使用 TonClient 连接到网络：

```typescript
import { TonClient } from '@ton/ton';

// 主网
const mainnetClient = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: 'YOUR_API_KEY'
});

// 测试网
const testnetClient = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  apiKey: 'YOUR_API_KEY'
});
```

### Q: 需要 API Key 吗？

A: 是的，建议使用 API Key 以获得更好的服务质量和更高的请求限制。可以在 [TonCenter](https://toncenter.com/) 申请。

### Q: 如何选择网络？

A: 根据用途选择网络：

- **主网**: 生产环境，真实资产
- **测试网**: 开发测试，免费测试币

## 🔧 开发工具

### Q: 需要安装哪些依赖？

A: 安装以下核心依赖：

```bash
npm install @ton/ton @ton/core @ton/crypto
```

### Q: 如何调试交易？

A: 使用以下方法调试：

```typescript
// 获取交易哈希
const hash = transfer.hash().toString('hex');
console.log('Transaction hash:', hash);

// 检查交易状态
const transaction = await client.getTransaction(address, hash);
console.log('Transaction:', transaction);
```

### Q: 如何处理错误？

A: 使用 try-catch 处理错误：

```typescript
try {
  const balance = await contract.getBalance();
  console.log('Balance:', balance);
} catch (error) {
  console.error('Error getting balance:', error);
  
  if (error.message.includes('insufficient balance')) {
    console.log('Please add more TON to your wallet');
  }
}
```

## 📱 移动端开发

### Q: 如何在 React Native 中使用 TON？

A: 使用 TonConnect 库：

```typescript
import { TonConnect } from '@tonconnect/ui-react-native';

const connector = new TonConnect({
  manifestUrl: 'https://your-app.com/tonconnect-manifest.json'
});

// 连接钱包
await connector.connect();

// 发送交易
const transaction = {
  validUntil: Date.now() + 5 * 60 * 1000,
  messages: [/* ... */]
};

await connector.sendTransaction(transaction);
```

### Q: 如何创建 TonConnect 清单文件？

A: 创建 `tonconnect-manifest.json` 文件：

```json
{
  "url": "https://your-app.com",
  "name": "Your App Name",
  "iconUrl": "https://your-app.com/icon.png",
  "termsOfUseUrl": "https://your-app.com/terms",
  "privacyPolicyUrl": "https://your-app.com/privacy"
}
```

## 🚀 性能优化

### Q: 如何优化交易费用？

A: 使用合适的 SendMode 和优化消息体大小：

```typescript
// 使用组合发送模式
const sendMode = SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS;

// 优化消息体
const optimizedBody = beginCell()
  .storeUint(0x12345678, 32)
  .storeString('Short message')
  .endCell();
```

### Q: 如何批量处理交易？

A: 在一个交易中发送多个消息：

```typescript
const transfer = contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [
    internal({ to: address1, value: amount1, body: 'First' }),
    internal({ to: address2, value: amount2, body: 'Second' }),
    internal({ to: address3, value: amount3, body: 'Third' })
  ],
  sendMode: SendMode.NONE,
});
```

## 🆘 故障排除

### Q: 交易失败怎么办？

A: 检查以下常见问题：

1. **余额不足**: 确保有足够的 TON 支付 Gas 费用
2. **序列号错误**: 使用正确的序列号
3. **地址格式**: 验证地址格式是否正确
4. **网络选择**: 确保使用正确的网络（主网/测试网）

### Q: 如何恢复失败的交易？

A: 失败的交易通常会自动退回，但可以：

1. 检查交易状态
2. 重新发送交易（使用新的序列号）
3. 联系技术支持

### Q: 私钥丢失怎么办？

A: 私钥丢失无法恢复，建议：

1. 使用助记词备份
2. 安全存储私钥
3. 考虑使用硬件钱包
4. 定期备份重要信息

## 📚 学习资源

### Q: 在哪里学习更多 TON 知识？

A: 推荐以下资源：

- [TON 官方文档](https://docs.ton.org/)
- [TonCenter API 文档](https://toncenter.com/api/v2/)
- [TON 开发者社区](https://t.me/tondev)
- [GitHub 示例代码](https://github.com/ton-org/ton)

### Q: 如何获取测试币？

A: 在测试网获取免费测试币：

1. 访问 [测试网水龙头](https://t.me/testgiver_ton_bot)
2. 发送你的测试网地址
3. 等待测试币到账

---

如果这里没有找到你需要的答案，请：

- 查看 [TON 官方文档](https://docs.ton.org/)
- 加入 [TON 开发者社区](https://t.me/tondev)
- 提交 [GitHub Issue](https://github.com/iamnivekx/blockchain-notes/issues)
