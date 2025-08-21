# TON 钱包集成

TON 钱包集成提供了完整的钱包管理功能，包括多种钱包合约版本和操作接口。

## 🏦 钱包合约版本

### WalletContractV3R2

最基础的 TON 钱包合约，支持基本的转账功能：

```typescript
import { WalletContractV3R2 } from '@ton/ton';

async function createV3R2Wallet(keyPair: KeyPair) {
  const workchain = 0; // 通常使用 workchain 0
  const wallet = WalletContractV3R2.create({ 
    workchain, 
    publicKey: keyPair.publicKey 
  });
  
  const contract = client.open(wallet);
  const address = contract.address.toString({ bounceable: false, urlSafe: true });
  
  console.log('v3r2 address:', address);
  
  // 获取余额
  const balance: bigint = await contract.getBalance();
  console.log('balance:', balance);
  
  return contract;
}
```

### WalletContractV4

增强版钱包合约，支持更多功能：

```typescript
import { WalletContractV4 } from '@ton/ton';

async function createV4R2Wallet(keyPair: KeyPair) {
  const workchain = 0;
  const wallet = WalletContractV4.create({ 
    workchain, 
    publicKey: keyPair.publicKey 
  });
  
  const contract = client.open(wallet);
  const address = contract.address.toString({ bounceable: false, urlSafe: true });
  
  console.log('v4r2 address:', address);
  
  // 获取余额
  const balance: bigint = await contract.getBalance();
  console.log('balance:', balance);
  
  return contract;
}
```

### WalletContractV5R1

最新版本的钱包合约，提供最佳性能和功能：

```typescript
import { WalletContractV5R1 } from '@ton/ton';

async function createV5R1Wallet(keyPair: KeyPair) {
  const wallet = WalletContractV5R1.create({ 
    publicKey: keyPair.publicKey 
  });
  
  const contract = client.open(wallet);
  const address = contract.address.toString({ bounceable: false, urlSafe: true });
  
  console.log('v5 address:', address);
  
  // 获取余额
  const balance: bigint = await contract.getBalance();
  console.log('balance:', balance);
  
  return contract;
}
```

## 🔄 钱包操作

### 获取序列号

```typescript
const seqno = await contract.getSeqno();
console.log('Current sequence number:', seqno);
```

### 检查合约状态

```typescript
const isDeployed = await client.isContractDeployed(walletAddress);
console.log('Wallet deployed:', isDeployed);

if (isDeployed) {
  const state = await client.getContractState(walletAddress);
  console.log('Contract state:', state);
}
```

### 获取合约数据

```typescript
const contractData = await contract.getData();
console.log('Contract data:', contractData);
```

## 💸 转账操作

### 创建转账交易

```typescript
import { internal, SendMode, toNano } from '@ton/ton';

const transfer = contract.createTransfer({
  seqno,
  secretKey: keyPair.secretKey,
  messages: [
    internal({
      value: toNano('0.01'), // 转账金额
      to: recipientAddress,   // 接收地址
      body: 'Hello TON!',     // 消息内容
      bounce: false,          // 是否允许退回
    }),
  ],
  sendMode: SendMode.NONE,
});
```

### 发送交易

```typescript
// 发送交易
await contract.send(transfer);

// 或者使用 sendBoc
const boc = transfer.toBoc();
await contract.sendBoc(boc);
```





## 🔧 配置选项

### 客户端配置

```typescript
const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: 'YOUR_API_KEY',
  timeout: 30000, // 30 秒超时
});
```

## 📝 完整示例

```typescript
import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient, WalletContractV4, internal, SendMode, toNano } from '@ton/ton';

async function walletOperations() {
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

  // 获取钱包信息
  const address = contract.address;
  const balance = await contract.getBalance();
  const seqno = await contract.getSeqno();
  const isDeployed = await client.isContractDeployed(address);

  console.log('Wallet Address:', address.toString({ bounceable: false }));
  console.log('Balance:', balance.toString());
  console.log('Sequence Number:', seqno);
  console.log('Deployed:', isDeployed);

  // 创建转账交易
  const recipientAddress = 'UQCK8IqcjCaiKtWR4Jl0r3HmTNb2WFTMIAO7yh5cIgb8aKes';
  
  const transfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        value: toNano('0.01'),
        to: recipientAddress,
        body: 'Hello from TON wallet!',
        bounce: false,
      }),
    ],
    sendMode: SendMode.NONE,
  });

  // 发送交易
  await contract.send(transfer);
  console.log('Transaction sent successfully!');

  return { contract, address, balance, seqno };
}

// 使用示例
walletOperations().catch(console.error);
```