# Byron 交易

Byron 交易是 Cardano 旧版本时代的交易格式，主要用于处理 Byron 地址的 UTXO。

## 交易构建器

### 初始化

```typescript
var txBuilder = CardanoWasm.TransactionBuilder.new(
  // 线性费用参数 (a*size + b)
  CardanoWasm.LinearFee.new(
    CardanoWasm.BigNum.from_str('44'), 
    CardanoWasm.BigNum.from_str('155381')
  ),
  // 最小 UTXO 值
  CardanoWasm.BigNum.from_str('1000000'),
  // 质押池存款
  CardanoWasm.BigNum.from_str('500000000'),
  // 密钥存款
  CardanoWasm.BigNum.from_str('2000000')
);
```

## 密钥管理

### 从私钥创建

```typescript
const prv_key = process.env.CARDANO_PRIVATE_KEY;
var prv_key_buf = Buffer.from(prv_key, 'hex');

var private_key = CardanoWasm.PrivateKey.from_normal_bytes(prv_key_buf);
var pub_key_buf = private_key.to_public().as_bytes();
```

### 创建 BIP32 公钥

```typescript
// 创建链码（通常为零）
var chain_code = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
var bip32_pub_key_buf = u8aConcat(pub_key_buf, chain_code);
var bip32_public_key = CardanoWasm.Bip32PublicKey.from_bytes(bip32_pub_key_buf);
```

### 生成 Byron 地址

```typescript
var byronAddr = CardanoWasm.ByronAddress.icarus_from_key(
  bip32_public_key,
  CardanoWasm.NetworkInfo.mainnet().protocol_magic()
);

console.log('Byron Address: ', byronAddr.to_base58());
```

## 交易输入

### Bootstrap 输入

Byron 交易使用 bootstrap 输入来处理 Byron 地址的 UTXO：

```typescript
const tx_hash = '9382e520c7bcfe46b22422ce08b8f5eef3e683a82b7a8d69521ca318f15e5518';
const tx_hash_index = 0;

// 从 Base58 字符串创建 Byron 地址
var byronAddress = CardanoWasm.ByronAddress.from_base58(
  'Ae2tdPwUPEYyA78QaXm3MdgQn7VYRooZjo6f5MBCvwXbGHALLtFj72pjqor'
);

txBuilder.add_bootstrap_input(
  byronAddress,
  CardanoWasm.TransactionInput.new(
    CardanoWasm.TransactionHash.from_bytes(Buffer.from(tx_hash, 'hex')),
    tx_hash_index
  ),
  CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('1829150'))
);
```

## 交易输出

### 添加输出

```typescript
var output_value = '1500000';
txBuilder.add_output(
  CardanoWasm.TransactionOutput.new(
    byronAddress.to_address(), // 输出地址
    CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(output_value))
  )
);
```

## 交易配置

### 设置 TTL

```typescript
// 设置交易的绝对槽位值
txBuilder.set_ttl(41117585);
```

### 添加找零

```typescript
// 自动计算费用并将剩余金额作为找零
txBuilder.add_change_if_needed(byronAddress.to_address());
```

## 交易构建

### 构建交易体

```typescript
// 构建交易体（不包含见证）
var txBody = txBuilder.build();
var txHash = CardanoWasm.hash_transaction(txBody);
```

## 交易签名

### 创建见证集

```typescript
var witnesses = CardanoWasm.TransactionWitnessSet.new();
var bootstrapWitnesses = CardanoWasm.BootstrapWitnesses.new();
```

### Bootstrap 见证

```typescript
// 创建 Vkey
var vkey = CardanoWasm.Vkey.new(private_key.to_public());

// 使用私钥签名交易哈希
var signature = private_key.sign(txHash.to_bytes());

// 创建 Bootstrap 见证
var bootstrapWitness = CardanoWasm.BootstrapWitness.new(
  vkey,
  signature,
  chain_code,
  byronAddress.attributes()
);

bootstrapWitnesses.add(bootstrapWitness);
witnesses.set_bootstraps(bootstrapWitnesses);
```

## 交易完成

### 创建最终交易

```typescript
var transaction = CardanoWasm.Transaction.new(
  txBody,
  witnesses,
  undefined // 交易元数据
);
```

### 序列化

```typescript
var bytes = transaction.to_bytes();
var tx_base64 = Buffer.from(bytes, 'hex').toString('base64');

console.log('Transaction Base64: ', tx_base64);
console.log('Transaction Hex: ', u8aToHex(bytes));
```

## 交易解析

### 从原始数据解析

```typescript
function parse(rawData) {
  var buffer = Buffer.from(rawData, 'base64');
  var transaction = CardanoWasm.Transaction.from_bytes(buffer);
  var tx = transaction.body();
  var txHash = CardanoWasm.hash_transaction(tx);

  console.log('Transaction Hash: ', u8aToHex(txHash.to_bytes()));
  
  // 解析输入
  var inputs = tx.inputs();
  for (let i = 0; i < inputs.len(); i++) {
    var input = inputs.get(i);
    console.log('Input TXID: ', u8aToHex(input.transaction_id().to_bytes()));
    console.log('Input Index: ', input.index());
  }
  
  // 解析输出
  var outputs = tx.outputs();
  for (let i = 0; i < outputs.len(); i++) {
    var output = outputs.get(i);
    console.log('Output Address: ', CardanoWasm.ByronAddress.from_address(output.address()).to_base58());
    console.log('Output Amount: ', output.amount().coin().to_str());
  }
  
  // 解析其他字段
  var ttl = tx.ttl();
  var fee = tx.fee();
  console.log('TTL: ', ttl);
  console.log('Fee: ', fee.to_str());
}
```

## 完整示例

查看 `examples/cardano/tx/byron.ts` 文件获取完整的 Byron 交易示例代码。

## 注意事项

- Byron 交易使用 bootstrap 见证而不是 vkey 见证
- 需要提供链码用于地址派生
- 协议魔法值必须与网络匹配
- 支持从 Base58 地址解析
- 可以解析已签名的交易
