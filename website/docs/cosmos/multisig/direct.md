# Direct 多重签名交易

Direct 多重签名交易使用 Protocol Buffers 编码格式，比 Amino 格式更高效，消耗更少的 Gas。本文档介绍如何使用 Direct 格式构建和签名多重签名交易。

## 基本概念

### Direct 格式优势

- **更高效**: 二进制编码，体积更小
- **更低 Gas**: 减少交易费用
- **类型安全**: 强类型定义
- **性能更好**: 序列化/反序列化更快

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
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [makeCosmoshubPath(0)],
  });
  const [account] = await wallet.getAccounts();
  const secp256k1PubKey = encodeSecp256k1Pubkey(account.pubkey);
  const address = pubkeyToAddress(secp256k1PubKey, prefix);
  
  return { 
    wallet, 
    pubkey: secp256k1PubKey, 
    address 
  };
}

// 并行生成所有密钥
const keys = await Promise.all([
  AARON, PHCC, PENG
].map((mnemonic) => getMnemonicPubKeyAndAddress(mnemonic, prefix)));

const pubKeys = keys.map((item) => item.pubkey);
```

### 创建多重签名公钥

```typescript
const threshold = 2;
const prefix = 'cosmos';

var multisigPubkey = createMultisigThresholdPubkey(pubKeys, threshold, true);
const multisigAddress = pubkeyToAddress(multisigPubkey, prefix);
console.log('Multisig address:', multisigAddress);
```

## 交易构建

### 查询账户信息

```typescript
// 查询多重签名账户
const accountOnChain = await client.getAccount(multisigAddress);
assert(accountOnChain, 'Account does not exist on chain');

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

### 执行签名

```typescript
async function signInstruction(mnemonic, instruction, prefix, rpcEndpoint) {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    hdPaths: [makeCosmoshubPath(0)],
  });

  const [account] = await wallet.getAccounts();
  const pubkey = encodeSecp256k1Pubkey(account.pubkey);
  const address = pubkeyToAddress(pubkey, prefix);

  const signerData = {
    accountNumber: instruction.accountNumber,
    sequence: instruction.sequence,
    chainId: instruction.chainId,
  };

  // 使用客户端签名
  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, wallet);
  const { bodyBytes, signatures } = await client.sign(
    address, 
    instruction.msgs, 
    instruction.fee, 
    instruction.memo, 
    signerData
  );
  
  return [pubkey, signatures[0], bodyBytes];
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
    signInstruction(mnemonic, signingInstruction, prefix, rpcEndpoint)
  )
);

console.log('Public key 0:', pubkey0);
console.log('Public key 1:', pubkey1);
console.log('Public key 2:', pubkey2);
```

## 交易组装

### 创建 Direct 多重签名交易

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

// 创建 Direct 多重签名交易
const signedTx = makeDirectMultisignedTx(
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

## Direct 多重签名交易构建

### 实现 makeDirectMultisignedTx 函数

```typescript
function makeDirectMultisignedTx(multisigPubkey, sequence, fee, bodyBytes, signatures) {
  const addresses = Array.from(signatures.keys());
  const prefix = Bech32.decode(addresses[0]).prefix;
  
  // 创建签名者位数组
  const signers = Array(multisigPubkey.value.pubkeys.length).fill(false);
  const signaturesList = new Array();
  
  for (let i = 0; i < multisigPubkey.value.pubkeys.length; i++) {
    const signerAddress = pubkeyToAddress(multisigPubkey.value.pubkeys[i], prefix);
    const signature = signatures.get(signerAddress);
    if (signature) {
      signers[i] = true;
      signaturesList.push(signature);
    }
  }
  
  // 创建签名者信息
  const signerInfo = {
    publicKey: encodePubkey(multisigPubkey),
    modeInfo: {
      multi: {
        bitarray: makeCompactBitArray(signers),
        // modeInfos: signaturesList.map((_) => ({ 
        //   single: { mode: SignMode.SIGN_MODE_DIRECT } 
        // })),
      },
    },
    sequence: Long.fromNumber(sequence),
  };
  
  // 创建认证信息
  const authInfo = AuthInfo.fromPartial({
    signerInfos: [signerInfo],
    fee: {
      amount: [...fee.amount],
      gasLimit: Long.fromString(fee.gas),
    },
  });
  
  const authInfoBytes = AuthInfo.encode(authInfo).finish();
  
  // 构建最终交易
  const signedTx = TxRaw.fromPartial({
    bodyBytes: bodyBytes,
    authInfoBytes: authInfoBytes,
    signatures: [
      multisig.MultiSignature.encode(
        multisig.MultiSignature.fromPartial({ 
          signatures: signaturesList 
        })
      ).finish()
    ],
  });
  
  return signedTx;
}
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

## 依赖库

### 必要的导入

```typescript
const { makeCompactBitArray, makeMultisignedTx } = require('@cosmjs/stargate/build/multisignature');
const { DirectSecp256k1HdWallet, Registry, makeAuthInfoBytes, encodePubkey, makeSignDoc } = require('@cosmjs/proto-signing');
const { TxRaw, AuthInfo, Fee } = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const { SignMode } = require('cosmjs-types/cosmos/tx/signing/v1beta1/signing');
const multisig = require("cosmjs-types/cosmos/crypto/multisig/v1beta1/multisig");
const Long = require("long");
```

## 完整示例

查看 `examples/cosmos/multisig/direct.js` 文件获取完整的 Direct 多重签名交易示例代码。

## 注意事项

- Direct 格式比 Amino 格式更高效
- 确保所有签名者使用相同的签名指令
- 验证多重签名地址的一致性
- 合理设置阈值和签名者数量
- 在生产环境中使用硬件钱包
- 定期验证多重签名配置
- 备份所有参与者的助记词
- 注意 Direct 格式的兼容性要求
