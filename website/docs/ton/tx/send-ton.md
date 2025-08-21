# TON 交易构建与签名

TON 区块链中的交易处理包括交易构建、签名和发送等核心操作。

## 🔄 交易基础

### 交易类型

TON 支持两种主要的交易类型：

- **内部交易 (Internal)**: 合约之间的消息传递
- **外部交易 (External)**: 从外部发起的交易

### 交易组件

每个交易包含以下组件：

- **消息体 (Body)**: 交易的具体内容
- **金额 (Value)**: 转账的 TON 数量
- **目标地址 (To)**: 接收方地址
- **序列号 (Seqno)**: 防止重放攻击的计数器

## 📝 创建交易

### 基本转账交易

```typescript
import { internal, SendMode, toNano } from '@ton/ton';

const transfer = contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [
    internal({
      value: toNano('0.01'),        // 转账金额
      to: recipientAddress,          // 接收地址
      body: 'Hello TON!',            // 消息内容
      bounce: false,                 // 是否允许退回
    }),
  ],
  sendMode: SendMode.NONE,
});
```

### 批量转账

```typescript
const transfer = contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [
    internal({
      value: toNano('0.01'),
      to: address1,
      body: 'First transfer',
      bounce: false,
    }),
    internal({
      value: toNano('0.02'),
      to: address2,
      body: 'Second transfer',
      bounce: false,
    }),
  ],
  sendMode: SendMode.NONE,
});
```

## 🎯 发送模式

### SendMode 选项

```typescript
import { SendMode } from '@ton/ton';

// 基本发送模式
SendMode.NONE                    // 默认模式
SendMode.PAY_GAS_SEPARATELY      // 单独支付 Gas
SendMode.IGNORE_ERRORS           // 忽略错误
SendMode.DESTROY                 // 销毁合约
SendMode.REMAINING_GAS           // 剩余 Gas 返还
SendMode.REMAINING_VALUE         // 剩余价值返还
SendMode.REMAINING_GAS_VALUE     // 剩余 Gas 和价值返还
```

### 组合发送模式

```typescript
const sendMode = SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS;

const transfer = contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [/* ... */],
  sendMode,
});
```

## 📤 发送交易

### 直接发送

```typescript
// 发送交易
await contract.send(transfer);
console.log('Transaction sent successfully!');
```

### 使用 BOC 发送

```typescript
// 转换为 BOC 格式
const boc = transfer.toBoc();
await contract.sendBoc(boc);
```

### 获取交易哈希

```typescript
const hash = transfer.hash().toString('hex');
console.log('Transaction hash:', hash);
```

## 🔐 交易签名

### 自动签名

使用 `createTransfer` 方法时，签名会自动处理：

```typescript
const transfer = contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,  // 私钥用于签名
  messages: [/* ... */],
  sendMode: SendMode.NONE,
});
```

### 手动签名

```typescript
import { sign } from '@ton/crypto';

// 创建未签名的交易
const unsignedTransfer = contract.createTransfer({
  seqno,
  secretKey: Buffer.alloc(64), // 空私钥
  messages: [/* ... */],
  sendMode: SendMode.NONE,
});

// 手动签名
const signature = sign(unsignedTransfer.hash(), keyPair.secretKey);
```

## 💰 金额处理

### 使用 toNano 转换

```typescript
import { toNano } from '@ton/ton';

// 转换不同单位的金额
const amount1 = toNano('1');           // 1 TON
const amount2 = toNano('0.5');         // 0.5 TON
const amount3 = toNano('0.001');       // 0.001 TON
const amount4 = toNano('1000000');     // 1,000,000 TON
```

### 手动计算

```typescript
// 1 TON = 10^9 nano TON
const oneTon = BigInt(10 ** 9);
const halfTon = oneTon / BigInt(2);
const smallAmount = BigInt(10 ** 6); // 0.001 TON
```

## 📱 移动端交易

### React Native 集成

```typescript
import { TonConnect } from '@tonconnect/ui-react-native';

const connector = new TonConnect({
  manifestUrl: 'https://your-app.com/tonconnect-manifest.json'
});

// 连接钱包
await connector.connect();

// 发送交易
const transaction = {
  validUntil: Date.now() + 5 * 60 * 1000, // 5 分钟有效期
  messages: [
    {
      address: recipientAddress,
      amount: toNano('0.01'),
      payload: 'Hello from mobile!'
    }
  ]
};

await connector.sendTransaction(transaction);
```

## 🌐 Web 钱包集成

### 浏览器钱包

```typescript
import { TonConnect } from '@tonconnect/ui';

const connector = new TonConnect({
  manifestUrl: 'https://your-app.com/tonconnect-manifest.json'
});

// 连接钱包
await connector.connect();

// 发送交易
const transaction = {
  validUntil: Date.now() + 5 * 60 * 1000,
  messages: [
    {
      address: recipientAddress,
      amount: toNano('0.01'),
      payload: 'Hello from web!'
    }
  ]
};

await connector.sendTransaction(transaction);
```

## 🔧 高级功能

### 自定义消息体

```typescript
import { beginCell } from '@ton/core';

// 创建自定义消息体
const customBody = beginCell()
  .storeUint(0x12345678, 32)  // 操作码
  .storeString('Custom message')
  .endCell();

const transfer = contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [
    internal({
      value: toNano('0.01'),
      to: recipientAddress,
      body: customBody,
      bounce: true,
    }),
  ],
  sendMode: SendMode.NONE,
});
```

### 条件交易

```typescript
// 检查余额后再发送
const balance = await contract.getBalance();
const transferAmount = toNano('0.01');

if (balance >= transferAmount) {
  const transfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        value: transferAmount,
        to: recipientAddress,
        body: 'Conditional transfer',
        bounce: false,
      }),
    ],
    sendMode: SendMode.NONE,
  });
  
  await contract.send(transfer);
} else {
  console.log('Insufficient balance');
}
```

## 📝 完整示例

```typescript
import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient, WalletContractV4, internal, SendMode, toNano } from '@ton/ton';

async function sendTransaction() {
  // 创建客户端
  const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: 'YOUR_API_KEY'
  });

  // 从助记词生成密钥对
  const mnemonics = process.env.TON_MNEMONIC;
  const keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));

  // 创建钱包合约
  const wallet = WalletContractV4.create({ 
    workchain: 0, 
    publicKey: keyPair.publicKey 
  });
  const contract = client.open(wallet);

  // 获取当前序列号
  const seqno = await contract.getSeqno();
  console.log('Current sequence number:', seqno);

  // 检查余额
  const balance = await contract.getBalance();
  console.log('Current balance:', balance.toString());

  // 创建转账交易
  const recipientAddress = 'UQCK8IqcjCaiKtWR4Jl0r3HmTNb2WFTMIAO7yh5cIgb8aKes';
  const transferAmount = toNano('0.01');

  if (balance >= transferAmount) {
    const transfer = contract.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      messages: [
        internal({
          value: transferAmount,
          to: recipientAddress,
          body: 'Hello from TON transaction!',
          bounce: false,
        }),
      ],
      sendMode: SendMode.NONE,
    });

    // 获取交易哈希
    const hash = transfer.hash().toString('hex');
    console.log('Transaction hash:', hash);

    // 发送交易
    await contract.send(transfer);
    console.log('Transaction sent successfully!');
    
    return { hash, seqno, amount: transferAmount };
  } else {
    throw new Error('Insufficient balance');
  }
}

// 使用示例
sendTransaction().catch(console.error);
```

## 🚀 下一步

- 学习 [地址处理](./address.md) 进行地址格式转换
- 了解 [Jetton 代币](../token/jetton.md) 操作
- 探索 [账户管理](../account/account.md) 功能
