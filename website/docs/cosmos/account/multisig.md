# 多重签名账户

多重签名账户允许多个公钥共同控制一个账户，需要达到指定的阈值才能执行交易。这在企业环境、团队协作和增强安全性方面非常有用。

## 基本概念

### 多重签名结构

```typescript
const { createMultisigThresholdPubkey, pubkeyToAddress } = require('@cosmjs/amino');

// 多重签名配置
const threshold = 2;        // 需要 2 个签名
const pubkeys = [           // 3 个公钥
  '02f4147da97162a214dbe25828ee4c4acc4dc721cd0c15b2761b43ed0292ed82b5',
  '0377155e520059d3b85c6afc5c617b7eb519afadd0360f1ef03aff3f7e3f5438dd',
  '02f44bce3eecd274e7aa24ec975388d12905dfc670a99b16e1d968e6ab5f69b266',
];
```

## 创建多重签名账户

### 从十六进制公钥创建

```typescript
function makeMultisigAccount(pubkeys, threshold, prefix) {
  // 转换十六进制公钥为 Base64 格式
  const formattedPubkeys = pubkeys
    .map((key) => Buffer.from(key, 'hex'))
    .map((key) => ({
      type: 'tendermint/PubKeySecp256k1',
      value: toBase64(key),
    }));

  // 创建多重签名公钥
  const multisig = createMultisigThresholdPubkey(formattedPubkeys, threshold, true);
  
  // 生成多重签名地址
  const multisigAddress = pubkeyToAddress(multisig, prefix);
  console.log('Multisig address:', multisigAddress);
  
  return { multisig, multisigAddress };
}
```

### 多重签名公钥结构

```typescript
// 多重签名公钥的完整结构
const group = {
  type: 'tendermint/PubKeyMultisigThreshold',
  value: {
    threshold: threshold,
    pubkeys: formattedPubkeys,
  },
};

// 验证地址一致性
const rawAddress = pubkeyToRawAddress(group);
const isEqual = Bech32.encode(prefix, rawAddress) === multisigAddress;
console.log('Addresses match:', isEqual);
```

## 多重签名配置

### 阈值设置

```typescript
// 2-of-3 多重签名（需要 2 个签名）
const threshold2of3 = 2;

// 3-of-5 多重签名（需要 3 个签名）
const threshold3of5 = 3;

// 1-of-2 多重签名（需要 1 个签名，类似 "或" 逻辑）
const threshold1of2 = 1;
```

### 公钥管理

```typescript
// 添加新的公钥
function addPublicKey(multisig, newPubkey) {
  const updatedPubkeys = [...multisig.value.pubkeys, newPubkey];
  const newThreshold = Math.ceil(updatedPubkeys.length / 2); // 动态调整阈值
  
  return createMultisigThresholdPubkey(updatedPubkeys, newThreshold, true);
}

// 移除公钥
function removePublicKey(multisig, pubkeyToRemove) {
  const updatedPubkeys = multisig.value.pubkeys.filter(
    pk => pk.value !== pubkeyToRemove.value
  );
  
  return createMultisigThresholdPubkey(updatedPubkeys, multisig.value.threshold, true);
}
```

## 地址验证

### 验证多重签名地址

```typescript
const { Bech32, fromHex, toBase64 } = require('@cosmjs/encoding');

function validateMultisigAddress(address, prefix = 'cosmos') {
  try {
    // 解码 Bech32 地址
    const decoded = Bech32.decode(address);
    
    // 验证前缀
    if (decoded.prefix !== prefix) {
      return false;
    }
    
    // 验证地址长度
    if (decoded.data.length !== 20) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// 验证地址
const multisigAddress = 'cosmos1...';
const isValid = validateMultisigAddress(multisigAddress);
console.log('Multisig address valid:', isValid);
```

## 完整示例

### 创建多重签名账户

```typescript
async function main() {
  const threshold = 2;
  const prefix = 'cosmos';
  
  // 公钥列表（十六进制格式）
  const pubkeys = [
    '02f4147da97162a214dbe25828ee4c4acc4dc721cd0c15b2761b43ed0292ed82b5',
    '0377155e520059d3b85c6afc5c617b7eb519afadd0360f1ef03aff3f7e3f5438dd',
    '02f44bce3eecd274e7aa24ec975388d12905dfc670a99b16e1d968e6ab5f69b266',
  ];

  // 创建多重签名账户
  const { multisig, multisigAddress } = makeMultisigAccount(pubkeys, threshold, prefix);
  
  console.log('Multisig configuration:');
  console.log('- Threshold:', threshold);
  console.log('- Total public keys:', pubkeys.length);
  console.log('- Multisig address:', multisigAddress);
  
  return { multisig, multisigAddress };
}
```

## 使用场景

### 1. 企业钱包
- 需要多个高管签名才能执行大额交易
- 防止单点故障和内部欺诈

### 2. 团队协作
- 项目资金需要团队成员共同管理
- 确保决策的透明性和安全性

### 3. 冷钱包管理
- 将热钱包和冷钱包结合使用
- 提高资金安全性

### 4. 治理投票
- 社区治理需要多个验证者签名
- 确保重要决策的共识

## 注意事项

- 阈值设置要合理，避免过于严格或宽松
- 公钥应该来自可信的来源
- 定期更新公钥列表和阈值
- 测试多重签名功能后再部署到主网
- 备份所有参与者的私钥和助记词
- 考虑使用硬件钱包增强安全性

## 完整示例

查看 `examples/cosmos/account/multisig.js` 文件获取完整的多重签名账户示例代码。
