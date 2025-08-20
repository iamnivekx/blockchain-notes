# Shelley 交易

Shelley 是 Cardano 的第二个时代，引入了权益证明和现代地址格式。Shelley 交易支持更丰富的功能和更好的安全性。

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
  CardanoWasm.BigNum.from_str('1000000'),
  // 密钥存款
  CardanoWasm.BigNum.from_str('1000000')
);
```

## 交易输入

### 密钥输入

```typescript
txBuilder.add_key_input(
  // 公钥哈希
  CardanoWasm.PublicKey.from_bytes(
    Buffer.from('a0ac3029969fea162b505da02d4f806e4edc3a5d5d9d4df187b94675b879bc82', 'hex')
  ).hash(),
  // 交易输入
  CardanoWasm.TransactionInput.new(
    CardanoWasm.TransactionHash.from_bytes(Buffer.from(tx_hash, 'hex')), // 交易哈希
    0 // 输出索引
  ),
  // 输入金额
  CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('1500000'))
);
```

### Bootstrap 输入 (Byron 地址)

```typescript
var byronAddress = CardanoWasm.ByronAddress.from_base58(
  'Ae2tdPwUPEZ71Am6fuqG4hsnr9MmZYDiVJqqdtZEZRdvEHcnjc4sBkqfbq9'
);

txBuilder.add_bootstrap_input(
  byronAddress,
  CardanoWasm.TransactionInput.new(
    CardanoWasm.TransactionHash.from_bytes(Buffer.from(tx_hash, 'hex')),
    0
  ),
  CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('3000000'))
);
```

## 交易输出

### 添加输出

```typescript
// 从 Bech32 地址创建
var shelleyOutputAddress = CardanoWasm.Address.from_bech32(
  'addr1qx48krx8uepxr9e5jja9aedzcat6xsuy8eqs69lfnvu4tca20vxv0ejzvxtnf996tmj6936h5dpcg0jpp5t7nxee2h3sywjyfa'
);

const output_value = '1330000';
txBuilder.add_output(
  CardanoWasm.TransactionOutput.new(
    shelleyOutputAddress, 
    CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(output_value))
  )
);
```

## 交易配置

### 设置 TTL

```typescript
// 设置交易的绝对槽位值，超过此值交易将失效
txBuilder.set_ttl(40442379);
```

### 添加找零

```typescript
// 自动计算费用并将剩余金额作为找零发送到指定地址
txBuilder.add_change_if_needed(shelleyOutputAddress);
```

## 交易构建

### 构建交易体

```typescript
// 构建交易体（不包含见证）
var txBody = txBuilder.build();
var txHash = CardanoWasm.hash_transaction(txBody);

console.log('TTL: ', txBody.ttl().toString());
console.log('Serialized: ', u8aToHex(txBody.to_bytes()));
console.log('Transaction Hash: ', u8aToHex(txHash.to_bytes()));
```

## 交易签名

### 创建见证集

```typescript
var witnesses = CardanoWasm.TransactionWitnessSet.new();
var vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
```

### 密钥见证

```typescript
// 使用私钥签名交易哈希
var signature = prvKey.sign(txHash.to_bytes());
var vkey = CardanoWasm.Vkey.new(prvKey.to_public());
var vkeyWitness = CardanoWasm.Vkeywitness.new(vkey, signature);

vkeyWitnesses.add(vkeyWitness);
witnesses.set_vkeys(vkeyWitnesses);
```

### 使用 make_vkey_witness 辅助函数

```typescript
var vkeyWitness = CardanoWasm.make_vkey_witness(txHash, prvKey);
vkeyWitnesses.add(vkeyWitness);
witnesses.set_vkeys(vkeyWitnesses);
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

## 完整示例

查看 `examples/cardano/tx/shelley.ts` 文件获取完整的 Shelley 交易示例代码。

## 注意事项

- 确保设置正确的网络参数
- TTL 值应该基于当前槽位设置
- 费用计算是自动的，但可以手动设置
- 支持多种输入和输出类型
- 见证必须与交易体匹配
