# TON Jetton 代币操作

TON 区块链中的 Jetton 代币操作包括代币转账、授权、铸造和销毁等核心功能。

## 🪙 Jetton 基础

### 什么是 Jetton

Jetton 是 TON 区块链上的代币标准，类似于以太坊的 ERC-20 标准。它支持：

- 代币转账
- 代币铸造和销毁
- 自定义代币逻辑
- 元数据管理

### Jetton 合约类型

```typescript
import { JettonMaster, JettonWallet } from '@ton/ton';

// Jetton 主合约 - 管理代币总量和元数据
const jettonMaster = client.open(JettonMaster.create(masterAddress));

// Jetton 钱包合约 - 管理用户代币余额
const jettonWallet = client.open(JettonWallet.create(walletAddress));
```

## 🔄 代币转账

### 创建转账消息体

```typescript
import { beginCell, toNano } from '@ton/core';

export interface ITransferBody {
  queryId: number;
  jettonAmount: number | bigint;
  toAddress: Address;
  responseAddress: Address;
  forwardAmount?: number | bigint;
  forwardPayload?: Cell;
}

function createTransferBody({
  queryId,
  jettonAmount,
  toAddress,
  responseAddress,
  forwardAmount = 0,
  forwardPayload,
}: ITransferBody): Cell {
  const builder = beginCell()
    .storeUint(0x0f8a7ea5, 32)        // 操作码：jetton transfer
    .storeUint(queryId, 64)            // 查询ID
    .storeCoins(jettonAmount)          // 代币数量
    .storeAddress(toAddress)           // 接收地址
    .storeAddress(responseAddress)     // 响应地址
    .storeBit(0)                      // 无自定义载荷
    .storeCoins(forwardAmount);       // 转发金额

  if (forwardPayload) {
    builder.storeBit(1);              // 存储转发载荷
    builder.storeRef(forwardPayload);
  } else {
    builder.storeBit(0);
  }

  return builder.endCell();
}
```

### 执行代币转账

```typescript
async function transferJetton({
  seqno,
  toAddress,
  jettonAmount,
  responseAddress,
  forwardAmount = 0,
  forwardPayload,
  jettonWalletAddress,
  value,
}: {
  seqno: number;
  toAddress: Address;
  jettonAmount: number | bigint;
  responseAddress: Address;
  forwardAmount?: number | bigint;
  forwardPayload?: Cell;
  jettonWalletAddress: Address;
  value: bigint | string;
}) {
  // 创建转账消息体
  const body = createTransferBody({
    queryId: seqno,
    toAddress,
    jettonAmount,
    responseAddress,
    forwardAmount,
    forwardPayload,
  });

  // 创建内部消息
  const internalMessage = internal({
    to: jettonWalletAddress,
    value: toNano('0.01'), // 0.01 TON 作为 Gas
    bounce: true,
    body,
  });

  // 创建转账交易
  const transfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [internalMessage],
    sendMode: SendMode.NONE,
  });

  // 发送交易
  await contract.send(transfer);
  console.log('Jetton transfer sent successfully!');
}
```

## 🏭 代币铸造

### 创建铸造消息体

```typescript
function createMintBody({
  queryId,
  jettonAmount,
  toAddress,
  responseAddress,
  forwardAmount = 0,
  forwardPayload,
}: {
  queryId: number;
  jettonAmount: number | bigint;
  toAddress: Address;
  responseAddress: Address;
  forwardAmount?: number | bigint;
  forwardPayload?: Cell;
}): Cell {
  return beginCell()
    .storeUint(0x1674b0a0, 32)       // 操作码：jetton mint
    .storeUint(queryId, 64)           // 查询ID
    .storeCoins(jettonAmount)         // 代币数量
    .storeAddress(toAddress)          // 接收地址
    .storeCoins(forwardAmount)        // 转发金额
    .storeBit(forwardPayload ? 1 : 0) // 是否有转发载荷
    .storeMaybeRef(forwardPayload)    // 转发载荷（可选）
    .endCell();
}
```

### 执行代币铸造

```typescript
async function mintJetton({
  seqno,
  jettonAmount,
  toAddress,
  responseAddress,
  forwardAmount = 0,
  forwardPayload,
}: {
  seqno: number;
  jettonAmount: number | bigint;
  toAddress: Address;
  responseAddress: Address;
  forwardAmount?: number | bigint;
  forwardPayload?: Cell;
}) {
  // 创建铸造消息体
  const body = createMintBody({
    queryId: seqno,
    jettonAmount,
    toAddress,
    responseAddress,
    forwardAmount,
    forwardPayload,
  });

  // 创建内部消息
  const internalMessage = internal({
    to: jettonMasterAddress,
    value: toNano('0.05'), // 0.05 TON 作为 Gas
    bounce: true,
    body,
  });

  // 创建转账交易
  const transfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [internalMessage],
    sendMode: SendMode.NONE,
  });

  // 发送交易
  await contract.send(transfer);
  console.log('Jetton mint transaction sent!');
}
```

## 🔥 代币销毁

### 创建销毁消息体

```typescript
function createBurnBody({
  queryId,
  jettonAmount,
  responseAddress,
}: {
  queryId: number;
  jettonAmount: number | bigint;
  responseAddress: Address;
}): Cell {
  return beginCell()
    .storeUint(0x595f07bc, 32)       // 操作码：jetton burn
    .storeUint(queryId, 64)           // 查询ID
    .storeCoins(jettonAmount)         // 代币数量
    .storeAddress(responseAddress)     // 响应地址
    .endCell();
}
```

### 执行代币销毁

```typescript
async function burnJetton({
  seqno,
  jettonAmount,
  responseAddress,
}: {
  seqno: number;
  jettonAmount: number | bigint;
  responseAddress: Address;
}) {
  // 创建销毁消息体
  const body = createBurnBody({
    queryId: seqno,
    jettonAmount,
    responseAddress,
  });

  // 创建内部消息
  const internalMessage = internal({
    to: jettonWalletAddress,
    value: toNano('0.01'), // 0.01 TON 作为 Gas
    bounce: true,
    body,
  });

  // 创建转账交易
  const transfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [internalMessage],
    sendMode: SendMode.NONE,
  });

  // 发送交易
  await contract.send(transfer);
  console.log('Jetton burn transaction sent!');
}
```

## 📊 代币信息查询

### 获取代币主合约信息

```typescript
async function getJettonData(masterAddress: Address) {
  const jettonMaster = client.open(JettonMaster.create(masterAddress));
  
  try {
    const jettonData = await jettonMaster.getJettonData();
    
    console.log('Jetton Data:', {
      totalSupply: jettonData.totalSupply.toString(),
      mintable: jettonData.mintable,
      adminAddress: jettonData.adminAddress?.toString(),
      content: jettonData.content,
      jettonWalletCode: jettonData.jettonWalletCode,
    });
    
    return jettonData;
  } catch (error) {
    console.error('Error getting jetton data:', error);
    throw error;
  }
}
```

### 获取代币钱包信息

```typescript
async function getJettonWalletInfo(walletAddress: Address) {
  const jettonWallet = client.open(JettonWallet.create(walletAddress));
  
  try {
    const balance = await jettonWallet.getBalance();
    const owner = await jettonWallet.getOwner();
    const jettonMaster = await jettonWallet.getJettonMaster();
    
    console.log('Jetton Wallet Info:', {
      balance: balance.toString(),
      owner: owner?.toString(),
      jettonMaster: jettonMaster?.toString(),
    });
    
    return { balance, owner, jettonMaster };
  } catch (error) {
    console.error('Error getting jetton wallet info:', error);
    throw error;
  }
}
```

### 获取用户代币余额

```typescript
async function getUserJettonBalance(
  userAddress: Address, 
  jettonMasterAddress: Address
) {
  const jettonMaster = client.open(JettonMaster.create(jettonMasterAddress));
  
  try {
    // 获取用户的代币钱包地址
    const jettonWalletAddress = await jettonMaster.getWalletAddress(userAddress);
    console.log('User jetton wallet address:', jettonWalletAddress.toString());
    
    // 获取代币余额
    const jettonWallet = client.open(JettonWallet.create(jettonWalletAddress));
    const balance = await jettonWallet.getBalance();
    
    console.log('User jetton balance:', balance.toString());
    return { jettonWalletAddress, balance };
  } catch (error) {
    console.error('Error getting user jetton balance:', error);
    throw error;
  }
}
```

## 💰 代币转账示例

### 完整转账流程

```typescript
async function completeJettonTransfer() {
  // 1. 创建客户端
  const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: 'YOUR_API_KEY'
  });

  // 2. 从助记词生成密钥对
  const mnemonics = process.env.TON_MNEMONIC;
  const keyPair = await mnemonicToPrivateKey(mnemonics.split(' '));

  // 3. 创建钱包合约
  const wallet = WalletContractV5R1.create({ publicKey: keyPair.publicKey });
  const contract = client.open(wallet);
  const walletAddress = wallet.address;

  // 4. 获取余额和序列号
  const balance = await contract.getBalance();
  const seqno = await contract.getSeqno();
  
  console.log('Wallet address:', walletAddress.toString({ bounceable: false }));
  console.log('Wallet balance:', balance.toString());
  console.log('Sequence number:', seqno);

  // 5. 设置代币和接收地址
  const usdtMasterAddress = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
  const toAddress = Address.parse('UQCK8IqcjCaiKtWR4Jl0r3HmTNb2WFTMIAO7yh5cIgb8aKes');
  
  // 6. 获取代币主合约和用户代币钱包
  const jettonMaster = client.open(JettonMaster.create(Address.parse(usdtMasterAddress)));
  const jettonWalletAddress = await jettonMaster.getWalletAddress(walletAddress);
  const jettonWallet = client.open(JettonWallet.create(jettonWalletAddress));

  // 7. 获取代币余额
  const jettonBalance = await jettonWallet.getBalance();
  console.log('Jetton balance:', jettonBalance.toString());

  // 8. 创建转账消息体
  const usdtAmount = 0.1 * 10 ** 6; // 0.1 USDT (6位小数)
  const forwardPayload = beginCell()
    .storeUint(0, 32)              // 0 操作码表示注释
    .storeStringTail('Hello, TON!') // 转账注释
    .endCell();

  const messageBody = createTransferBody({
    queryId: seqno,
    toAddress,
    jettonAmount: usdtAmount,
    responseAddress: walletAddress,
    forwardAmount: 0,
    forwardPayload,
  });

  // 9. 创建内部消息
  const internalMessage = internal({
    to: jettonWalletAddress,
    value: toNano('0.01'), // 0.01 TON 作为 Gas
    bounce: true,
    body: messageBody,
  });

  // 10. 创建并发送交易
  const transfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [internalMessage],
    sendMode: SendMode.NONE,
  });

  await contract.send(transfer);
  console.log('Jetton transfer completed successfully!');
  
  return { 
    hash: transfer.hash().toString('hex'),
    seqno,
    amount: usdtAmount,
    toAddress: toAddress.toString()
  };
}

// 使用示例
completeJettonTransfer().catch(console.error);
```

## 🔧 高级功能

### 批量代币转账

```typescript
async function batchTransferJetton({
  seqno,
  transfers,
  jettonWalletAddress,
}: {
  seqno: number;
  transfers: Array<{
    toAddress: Address;
    jettonAmount: number | bigint;
    forwardPayload?: Cell;
  }>;
  jettonWalletAddress: Address;
}) {
  const messages = transfers.map((transfer, index) => {
    const body = createTransferBody({
      queryId: seqno + index,
      toAddress: transfer.toAddress,
      jettonAmount: transfer.jettonAmount,
      responseAddress: walletAddress,
      forwardAmount: 0,
      forwardPayload: transfer.forwardPayload,
    });

    return internal({
      to: jettonWalletAddress,
      value: toNano('0.01'),
      bounce: true,
      body,
    });
  });

  const batchTransfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages,
    sendMode: SendMode.NONE,
  });

  await contract.send(batchTransfer);
  console.log(`Batch transfer of ${transfers.length} transactions completed!`);
}
```

### 代币授权

```typescript
async function approveJetton({
  seqno,
  spenderAddress,
  jettonAmount,
  jettonWalletAddress,
}: {
  seqno: number;
  spenderAddress: Address;
  jettonAmount: number | bigint;
  jettonWalletAddress: Address;
}) {
  // 创建授权消息体
  const approveBody = beginCell()
    .storeUint(0x178d4519, 32)      // 操作码：approve
    .storeUint(seqno, 64)            // 查询ID
    .storeCoins(jettonAmount)        // 授权金额
    .storeAddress(spenderAddress)     // 被授权地址
    .endCell();

  const internalMessage = internal({
    to: jettonWalletAddress,
    value: toNano('0.01'),
    bounce: true,
    body: approveBody,
  });

  const transfer = contract.createTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [internalMessage],
    sendMode: SendMode.NONE,
  });

  await contract.send(transfer);
  console.log('Jetton approval completed!');
}
```