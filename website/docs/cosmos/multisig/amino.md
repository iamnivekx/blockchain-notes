# Amino 多重签名交易

Amino 多重签名交易使用传统的 JSON 编码格式，支持多个签名者共同签署交易。本文档介绍如何使用 Amino 格式构建和签名多重签名交易。

## 基本概念

### Amino 编码特点

- **JSON 格式**: 人类可读的交易结构
- **向后兼容**: 支持旧版本的 Cosmos SDK
- **多重签名支持**: 内置多重签名功能
- **离线签名**: 支持离线环境签名

## 环境配置

### 设置多个助记词

```bash
# .env 文件
AARON="first signer mnemonic phrase"
PHCC="second signer mnemonic phrase"
PENG="third signer mnemonic phrase"
```

### 初始化环境

```typescript
require('dotenv').config();

const { AARON, PHCC, PENG } = process.env;
const rpcEndpoint = 'https://rpc.testnet.cosmos.network:443';
const client = await StargateClient.connect(rpcEndpoint);
```

## 多重签名账户创建

### 生成公钥和地址

```typescript
async function getMnemonicPubKeyAndAddress(mnemonic, prefix) {
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [makeCosmoshubPath(0)],
  });
  const [account] = await wallet.getAccounts();
  const secp256k1PubKey = encodeSecp256k1Pubkey(account.pubkey);
  const address = pubkeyToAddress(secp256k1PubKey, prefix);
  
  return { 
    wallet, 
    secp256k1PubKey, 
    pubkey: toHex(account.pubkey), 
    address 
  };
}

// 并行生成所有密钥
const keys = await Promise.all([
  AARON, PHCC, PENG
].map((mnemonic) => getMnemonicPubKeyAndAddress(mnemonic, prefix)));

const secp256k1PubKeys = keys.map((item) => item.secp256k1PubKey);
const pubKeys = keys.map((item) => item.pubkey);
```

### 创建多重签名公钥

```typescript
const threshold = 2;
const prefix = 'cosmos';

var multisigPubkey = createMultisigThresholdPubkey(secp256k1PubKeys, threshold, true);
const multisigAddress = pubkeyToAddress(multisigPubkey, prefix);
console.log('Multisig address:', multisigAddress);
```

## 交易构建

### 查询账户信息

```typescript
// 查询多重签名账户
const accountOnChain = await client.getAccount(multisigAddress);
assert(accountOnChain, 'Account does not exist on chain');
console.log('Account on chain:', accountOnChain);

// 查询余额
const balance = await client.getBalance(multisigAddress, 'uphoton');
console.log('Balance:', balance);
```

### 构建发送消息

```typescript
const msgSend = {
  fromAddress: multisigAddress,
  toAddress: receipt,
  amount: coins(2000, 'uphoton'),
};

const msg = {
  typeUrl: '/cosmos.bank.v1beta1.MsgSend',
  value: msgSend,
};

console.log('Message:', JSON.stringify(msg, null, 4));
```

### 设置费用和参数

```typescript
const gasLimit = 200000;
const fee = {
  amount: coins(2000, 'uphoton'),
  gas: gasLimit.toString(),
};

const chainId = await client.getChainId();
const memo = 'happy';
```

## 签名指令创建

### 创建签名指令

```typescript
const signingInstruction = {
  accountNumber: accountOnChain.accountNumber,
  sequence: accountOnChain.sequence,
  chainId,
  msgs: [msg],
  fee,
  memo,
};
```

## 离线签名

### 创建签名文档

```typescript
async function makeAminoSignDoc(messages, fee, memo, signerData) {
  const { accountNumber, sequence, chainId } = signerData;
  const msgs = messages.map((msg) => aminoTypes.toAmino(msg));
  return makeSignDoc(msgs, fee, chainId, memo, accountNumber, sequence);
}
```

### 执行签名

```typescript
async function signInstruction(mnemonic, instruction, rpcEndpoint) {
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [makeCosmoshubPath(0)],
  });

  const [account] = await wallet.getAccounts();
  const pubkey = encodeSecp256k1Pubkey(account.pubkey);

  const signerData = {
    accountNumber: instruction.accountNumber,
    sequence: instruction.sequence,
    chainId: instruction.chainId,
  };

  // 创建签名文档
  const signDoc = await makeAminoSignDoc(
    instruction.msgs, 
    instruction.fee, 
    instruction.memo, 
    signerData
  );
  
  const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON;

  // 获取私钥
  const [acc] = await wallet.getAccountsWithPrivkeys();
  const { privkey } = acc;
  
  // 计算消息哈希
  const message = crypto.sha256(serializeSignDoc(signDoc));

  // 创建签名
  const signature = await crypto.Secp256k1.createSignature(message, privkey);
  const signatureBytes = new Uint8Array([
    ...signature.r(32), 
    ...signature.s(32)
  ]);

  console.log('Public key:', toHex(account.pubkey));
  console.log('Message hash:', toHex(message));
  console.log('Signature:', toHex(signatureBytes));

  const signed = signDoc;

  // 编码交易体
  const signedTxBody = {
    messages: signed.msgs.map((msg) => aminoTypes.fromAmino(msg)),
    memo: signed.memo,
  };

  const signedTxBodyEncodeObject = {
    typeUrl: '/cosmos.tx.v1beta1.TxBody',
    value: signedTxBody,
  };

  const signedTxBodyBytes = registry.encode(signedTxBodyEncodeObject);
  
  // 创建认证信息
  const signedGasLimit = Int53.fromString(signed.fee.gas).toNumber();
  const signedSequence = Int53.fromString(signed.sequence).toNumber();
  const signedAuthInfoBytes = makeAuthInfoBytes(
    [{ pubkey, sequence: signedSequence }], 
    signed.fee.amount, 
    signedGasLimit, 
    signMode
  );
  
  const signatures = [signatureBytes];
  const authInfo = AuthInfo.decode(signedAuthInfoBytes);

  // 构建交易
  const tx = TxRaw.fromPartial({
    bodyBytes: signedTxBodyBytes,
    authInfoBytes: signedAuthInfoBytes,
    signatures,
  });

  return [pubkey, signatures[0], signedTxBodyBytes, tx];
}
```

## 并行签名收集

### 收集所有签名

```typescript
const [
  [pubkey0, signature0, bodyBytes],
  [pubkey1, signature1],
  [pubkey2, signature2]
] = await Promise.all(
  [AARON, PHCC, PENG].map(async (mnemonic) => 
    signInstruction(mnemonic, signingInstruction, rpcEndpoint)
  )
);

console.log('Public key 0:', pubkey0);
console.log('Public key 1:', pubkey1);
console.log('Public key 2:', pubkey2);
```

## 交易组装

### 创建多重签名交易

```typescript
const address0 = pubkeyToAddress(pubkey0, prefix);
const address1 = pubkeyToAddress(pubkey1, prefix);
const address2 = pubkeyToAddress(pubkey2, prefix);

// 重新创建多重签名公钥
var multisigPubkey = createMultisigThresholdPubkey(
  [pubkey0, pubkey1, pubkey2], 
  threshold, 
  true
);

// 验证地址一致性
assert.equal(
  multisigAccountAddress, 
  pubkeyToAddress(multisigPubkey, prefix), 
  'should be equal'
);

// 创建多重签名交易
const signedTx = makeMultisignedTx(
  multisigPubkey,
  signingInstruction.sequence,
  signingInstruction.fee,
  bodyBytes,
  new Map([
    [address0, signature0],
    [address1, signature1],
    // [address2, signature2],  // 可选签名
  ])
);
```

## 交易广播

### 编码和广播

```typescript
const tx = TxRaw.encode(signedTx).finish();
console.log('Transaction bytes:', toHex(tx));

const result = await client.broadcastTx(tx);
console.log('Broadcast result:', result);
assertIsDeliverTxSuccess(result);

const { transactionHash } = result;
console.log('Transaction URL:', `https://api.testnet.cosmos.network/cosmos/tx/v1beta1/txs/${transactionHash}`);
```

## 完整示例

查看 `examples/cosmos/multisig/amino.js` 文件获取完整的 Amino 多重签名交易示例代码。

## 注意事项

- 确保所有签名者使用相同的签名指令
- 验证多重签名地址的一致性
- 合理设置阈值和签名者数量
- 在生产环境中使用硬件钱包
- 定期验证多重签名配置
- 备份所有参与者的助记词
