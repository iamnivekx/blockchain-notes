# 以太坊钱包集成

以太坊钱包是管理私钥和与区块链交互的重要工具。本文档将介绍如何使用ethers.js创建和管理钱包。

## 钱包类型

ethers.js支持多种钱包类型：

1. **随机钱包**: 自动生成私钥和地址
2. **私钥钱包**: 从现有私钥创建
3. **助记词钱包**: 从助记词恢复
4. **硬件钱包**: 集成硬件安全模块

## 创建随机钱包

### 基本创建

```typescript
import { ethers } from 'ethers';

async function createRandomWallet() {
  const wallet = ethers.Wallet.createRandom();
  
  console.log('address:', await wallet.getAddress());
  console.log('public key:', wallet.publicKey);
  console.log('compressed:', ethers.utils.computePublicKey(wallet.publicKey, true));
  console.log('private key:', wallet.privateKey);
}

createRandomWallet().catch(console.error);
```

### 获取钱包信息

```typescript
// 获取地址
const address = await wallet.getAddress();
console.log('Wallet address:', address);

// 获取公钥
const publicKey = wallet.publicKey;
console.log('Public key:', publicKey);

// 获取压缩公钥
const compressedKey = ethers.utils.computePublicKey(wallet.publicKey, true);
console.log('Compressed public key:', compressedKey);

// 获取私钥
const privateKey = wallet.privateKey;
console.log('Private key:', privateKey);
```

## 从私钥创建钱包

```typescript
// 从私钥字符串创建
const privateKeyString = '0x1234567890abcdef...';
const walletFromPrivateKey = new ethers.Wallet(privateKeyString);

// 从私钥Buffer创建
const privateKeyBuffer = Buffer.from('1234567890abcdef...', 'hex');
const walletFromBuffer = new ethers.Wallet(privateKeyBuffer);
```

## 从助记词恢复钱包

```typescript
// 从助记词恢复钱包
const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const walletFromMnemonic = ethers.Wallet.fromMnemonic(mnemonic);

// 指定派生路径
const walletWithPath = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
```

## 钱包连接

### 连接到Provider

```typescript
// 连接到以太坊网络
const provider = new ethers.providers.JsonRpcProvider('YOUR_RPC_URL');
const connectedWallet = wallet.connect(provider);

// 获取网络信息
const network = await provider.getNetwork();
console.log('Connected to network:', network.name);
```

### 获取账户信息

```typescript
// 获取余额
const balance = await connectedWallet.getBalance();
console.log('Balance:', ethers.utils.formatEther(balance), 'ETH');

// 获取交易计数
const nonce = await connectedWallet.getTransactionCount();
console.log('Nonce:', nonce);
```

## 钱包操作

### 签名消息

```typescript
// 签名消息
const message = 'Hello Ethereum!';
const signature = await wallet.signMessage(message);
console.log('Signature:', signature);

// 验证签名
const recoveredAddress = ethers.utils.verifyMessage(message, signature);
console.log('Recovered address:', recoveredAddress);
console.log('Original address:', await wallet.getAddress());
console.log('Signature valid:', recoveredAddress === await wallet.getAddress());
```

### 签名交易

```typescript
// 创建交易
const transaction = {
  to: '0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6',
  value: ethers.utils.parseEther('0.1'),
  nonce: 0,
  gasLimit: 21000,
  gasPrice: ethers.utils.parseUnits('20', 'gwei')
};

// 签名交易
const signedTx = await wallet.signTransaction(transaction);
console.log('Signed transaction:', signedTx);
```

## 高级功能

### 批量操作

```typescript
// 创建多个钱包
function createMultipleWallets(count: number) {
  const wallets = [];
  for (let i = 0; i < count; i++) {
    wallets.push(ethers.Wallet.createRandom());
  }
  return wallets;
}

// 批量获取地址
async function getWalletAddresses(wallets: ethers.Wallet[]) {
  const addresses = await Promise.all(
    wallets.map(wallet => wallet.getAddress())
  );
  return addresses;
}
```

### 钱包加密

```typescript
// 加密钱包
async function encryptWallet(wallet: ethers.Wallet, password: string) {
  const encrypted = await wallet.encrypt(password);
  return encrypted;
}

// 解密钱包
async function decryptWallet(encrypted: string, password: string) {
  const wallet = await ethers.Wallet.fromEncryptedJson(encrypted, password);
  return wallet;
}
```

## 安全最佳实践

1. **私钥保护**: 永远不要在代码中硬编码私钥
2. **环境变量**: 使用.env文件存储敏感信息
3. **助记词备份**: 安全备份助记词，离线存储
4. **网络验证**: 确保连接到正确的网络
5. **签名验证**: 始终验证签名的有效性

## 常见问题

### Q: 如何安全存储私钥？
A: 使用环境变量、硬件钱包或加密存储，避免明文存储。

### Q: 钱包丢失怎么办？
A: 如果有助记词备份，可以使用助记词恢复钱包。

### Q: 如何切换网络？
A: 使用`wallet.connect(newProvider)`连接到不同的网络。
