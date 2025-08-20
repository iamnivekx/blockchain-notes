# 示例代码

本文档提供了 Cardano 开发的完整示例代码，涵盖了从账户管理到交易处理的所有核心功能。

## 📁 代码结构

```
examples/cardano/
├── account/
│   ├── account.ts      # 完整的账户管理示例
│   └── byron.ts        # Byron 地址处理示例
└── tx/
    ├── shelley.ts      # Shelley 交易构建示例
    ├── byron.ts        # Byron 交易处理示例
    └── submit.ts       # 交易提交示例
```

## 🔑 账户管理示例

### 基本账户管理 (`account/account.ts`)

这个示例展示了完整的 Cardano 账户管理流程：

- 从助记词派生根密钥
- 创建账户密钥
- 生成多种类型的地址
- 密钥格式转换

**关键功能：**
```typescript
// 密钥派生
var account_key = rootKey
  .derive(harden(1852))  // 目的
  .derive(harden(1815))  // 币种
  .derive(harden(0));    // 账户索引

// 地址生成
var baseAddr = BaseAddress.new(
  NetworkInfo.mainnet().network_id(),
  StakeCredential.from_keyhash(utxo_pub_key.to_raw_key().hash()),
  StakeCredential.from_keyhash(stake_key.to_raw_key().hash())
);
```

### Byron 地址处理 (`account/byron.ts`)

专门处理 Byron 时代地址的示例：

- 从助记词生成 Byron 地址
- 从私钥创建 Byron 地址
- 支持主网和测试网

**关键功能：**
```typescript
// 生成 Icarus 风格的 Byron 地址
var byronAddr = ByronAddress.icarus_from_key(
  bip32_public_key,
  NetworkInfo.mainnet().protocol_magic()
);
```

## 💰 交易处理示例

### Shelley 交易 (`tx/shelley.ts`)

现代 Cardano 交易构建示例：

- 交易构建器初始化
- 添加输入和输出
- 设置 TTL 和费用
- 交易签名和序列化

**关键功能：**
```typescript
// 交易构建
var txBuilder = CardanoWasm.TransactionBuilder.new(
  CardanoWasm.LinearFee.new(
    CardanoWasm.BigNum.from_str('44'), 
    CardanoWasm.BigNum.from_str('155381')
  ),
  CardanoWasm.BigNum.from_str('1000000'),
  CardanoWasm.BigNum.from_str('1000000'),
  CardanoWasm.BigNum.from_str('1000000')
);

// 添加输入
txBuilder.add_key_input(
  pub_key_hash,
  transaction_input,
  input_value
);

// 添加输出
txBuilder.add_output(
  CardanoWasm.TransactionOutput.new(
    output_address, 
    output_value
  )
);
```

### Byron 交易 (`tx/byron.ts`)

处理 Byron 时代交易的示例：

- Bootstrap 输入处理
- Byron 地址支持
- 交易解析功能

**关键功能：**
```typescript
// Bootstrap 输入
txBuilder.add_bootstrap_input(
  byronAddress,
  CardanoWasm.TransactionInput.new(
    CardanoWasm.TransactionHash.from_bytes(Buffer.from(tx_hash, 'hex')),
    tx_hash_index
  ),
  input_value
);

// Bootstrap 见证
var bootstrapWitness = CardanoWasm.BootstrapWitness.new(
  vkey,
  signature,
  chain_code,
  byronAddress.attributes()
);
```

### 交易提交 (`tx/submit.ts`)

交易广播和网络提交示例：

- 使用 cardano-wallet-js
- HTTP 提交到网络
- 错误处理和状态检查

**关键功能：**
```typescript
// 提交交易
const response = await axios({
  headers: {
    'Content-Type': 'application/cbor',
  },
  method: 'post',
  url: 'https://submit-api.testnet.dandelion.link/api/submit/tx',
  data: buffer,
});
```

## 🚀 运行示例

### 环境准备

1. 安装依赖：
```bash
cd examples/cardano
npm install
```

2. 设置环境变量：
```bash
# 创建 .env 文件
CARDANO_MNEMONIC="your 12 or 24 word mnemonic phrase"
CARDANO_PRIVATE_KEY="your private key in hex format"
```

### 运行特定示例

```bash
# 运行账户管理示例
node account/account.ts

# 运行 Byron 地址示例
node account/byron.ts

# 运行 Shelley 交易示例
node tx/shelley.ts

# 运行 Byron 交易示例
node tx/byron.ts

# 运行交易提交示例
node tx/submit.ts
```

## 📝 代码说明

### 依赖库

- **@emurgo/cardano-serialization-lib-nodejs**: Cardano 官方序列化库
- **bip39**: 助记词处理
- **elliptic**: 椭圆曲线加密
- **@polkadot/util**: 工具函数
- **axios**: HTTP 请求（交易提交）

### 关键概念

1. **密钥派生**: 使用 BIP44 和 CIP1852 标准
2. **地址类型**: 支持多种 Cardano 地址格式
3. **交易构建**: 分步骤构建和签名交易
4. **网络提交**: 将签名后的交易广播到网络

### 安全注意事项

- 示例代码仅用于学习和测试
- 生产环境中请使用硬件钱包
- 不要将私钥硬编码在代码中
- 使用环境变量存储敏感信息

## 🔧 自定义和扩展

这些示例代码可以作为基础，根据具体需求进行扩展：

- 添加更多地址类型支持
- 实现批量交易处理
- 集成钱包连接功能
- 添加交易监控和状态检查
- 实现多签名交易支持

## 📚 学习资源

- [Cardano 官方文档](https://docs.cardano.org/)
- [Emurgo 序列化库文档](https://github.com/Emurgo/cardano-serialization-lib)
- [CIP 提案](https://github.com/cardano-foundation/CIPs)
- [Cardano 开发者社区](https://forum.cardano.org/)
