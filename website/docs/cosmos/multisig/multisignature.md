# 多重签名基础

多重签名是 Cosmos 生态系统中重要的安全功能，允许多个公钥共同控制一个账户，需要达到指定的阈值才能执行交易。

## 基本概念

### 多重签名结构

```typescript
const { createMultisigThresholdPubkey, pubkeyToAddress } = require('@cosmjs/amino');

// 多重签名配置
const threshold = 2;        // 需要 2 个签名
const prefix = 'cosmos';    // 地址前缀
```

### 公钥管理

```typescript
// 从助记词生成多个公钥
const [pubkey0, pubkey1, pubkey2, pubkey3, pubkey4] = await Promise.all(
  [0, 1, 2, 3, 4].map(async (i) => {
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [makeCosmoshubPath(i)],
    });
    const [account] = await wallet.getAccounts();
    const pubkey = encodeSecp256k1Pubkey(account.pubkey);
    return pubkey;
  })
);
```

## 创建多重签名账户

### 生成多重签名公钥

```typescript
const multisigPubkey = createMultisigThresholdPubkey(
  [pubkey0, pubkey1, pubkey2, pubkey3, pubkey4],
  threshold
);

// 生成多重签名地址
const multisigAddress = pubkeyToAddress(multisigPubkey, prefix);
console.log('Multisig address:', multisigAddress);
```

### 验证地址一致性

```typescript
// 验证生成的多重签名地址
assert.equal(
  multisigAccountAddress, 
  pubkeyToAddress(multisigPubkey, prefix), 
  'should be equal'
);
```

## 交易构建

### 创建签名指令

```typescript
const signingInstruction = {
  accountNumber: accountOnChain.accountNumber,
  sequence: accountOnChain.sequence,
  chainId: await client.getChainId(),
  msgs: [msg],
  fee: fee,
  memo: 'Happy new year',
};
```

### 构建发送消息

```typescript
const msgSend = {
  fromAddress: multisigAccountAddress,
  toAddress: "cosmos19rvl6ja9h0erq9dc2xxfdzypc739ej8k5esnhg",
  amount: coins(1234, "uphoton"),
};

const msg = {
  typeUrl: "/cosmos.bank.v1beta1.MsgSend",
  value: msgSend,
};
```

## 签名收集

### 并行签名

```typescript
const [
  [pubkey0, signature0, bodyBytes],
  [pubkey1, signature1],
  [pubkey2, signature2],
  [pubkey3, signature3],
  [pubkey4, signature4],
] = await Promise.all(
  [0, 1, 2, 3, 4].map(async (i) => {
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      hdPaths: [makeCosmoshubPath(i)],
    });
    const [account] = await wallet.getAccounts();
    const pubkey = encodeSecp256k1Pubkey(account.pubkey);
    const address = account.address;
    
    const signingClient = await SigningStargateClient.offline(wallet);
    const signerData = {
      accountNumber: signingInstruction.accountNumber,
      sequence: signingInstruction.sequence,
      chainId: signingInstruction.chainId,
    };
    
    const { bodyBytes: bb, signatures } = await signingClient.sign(
      address,
      signingInstruction.msgs,
      signingInstruction.fee,
      signingInstruction.memo,
      signerData,
    );
    
    return [pubkey, signatures[0], bb];
  })
);
```

## 交易组装

### 创建多重签名交易

```typescript
const { makeMultisignedTx } = require('@cosmjs/stargate');

const address0 = pubkeyToAddress(pubkey0, prefix);
const address1 = pubkeyToAddress(pubkey1, prefix);
const address2 = pubkeyToAddress(pubkey2, prefix);
const address3 = pubkeyToAddress(pubkey3, prefix);
const address4 = pubkeyToAddress(pubkey4, prefix);

const signedTx = makeMultisignedTx(
  multisigPubkey,
  signingInstruction.sequence,
  signingInstruction.fee,
  bodyBytes,
  new Map([
    [address0, signature0],
    [address1, signature1],
    // [address2, signature2],  // 可选签名
    // [address3, signature3],  // 可选签名
    // [address4, signature4],  // 可选签名
  ])
);
```

## 交易广播

### 广播多重签名交易

```typescript
const { TxRaw } = require('cosmjs-types/cosmos/tx/v1beta1/tx');

// 确保签名有效
const broadcaster = await StargateClient.connect(rpcEndpoint);
const result = await broadcaster.broadcastTx(
  Uint8Array.from(TxRaw.encode(signedTx).finish())
);

console.log('Broadcast result:', result);
assertIsBroadcastTxSuccess(result);
```

## 环境变量配置

### 设置助记词

```bash
# .env 文件
MULTISIG_MNEMONIC="your 12 or 24 word mnemonic phrase"
```

### 在代码中使用

```typescript
require('dotenv').config();

const mnemonic = process.env.MULTISIG_MNEMONIC;
if (!mnemonic) {
  throw new Error('MULTISIG_MNEMONIC environment variable is required');
}
```

## 完整示例

查看 `examples/cosmos/multisig/multisignature.js` 文件获取完整的多重签名基础示例代码。

## 注意事项

- 阈值设置要合理，避免过于严格或宽松
- 所有签名者必须使用相同的签名指令
- 确保公钥和地址的一致性
- 在生产环境中使用硬件钱包
- 定期验证多重签名配置
- 备份所有参与者的助记词
