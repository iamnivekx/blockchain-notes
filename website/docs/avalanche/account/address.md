# Avalanche 地址管理

Avalanche 使用分层确定性（HD）钱包来管理地址和密钥。本指南将介绍如何创建、管理和使用 Avalanche 地址。

## 地址格式

Avalanche 使用 Bech32 编码的地址格式：

- **X-Chain 地址**: `X-` 前缀，例如：`X-fuji1cfvdpdqyzpp8pq0g6trmjsrn9pt8nutsfm7a40`
- **P-Chain 地址**: `P-` 前缀，例如：`P-fuji1cfvdpdqyzpp8pq0g6trmjsrn9pt8nutsfm7a40`
- **C-Chain 地址**: `0x` 前缀（兼容以太坊），例如：`0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`

## 生成助记词

### 1. 创建新的助记词

```javascript
const { Mnemonic } = require('avalanche');

// 获取助记词实例
const mnemonic = Mnemonic.getInstance();

// 生成 24 个单词的助记词 (256 位强度)
const words = mnemonic.generateMnemonic(256);
console.log('助记词:', words);

// 生成 12 个单词的助记词 (128 位强度)
const words12 = mnemonic.generateMnemonic(128);
console.log('12 词助记词:', words12);
```

### 2. 验证助记词

```javascript
// 检查助记词是否有效
const isValid = mnemonic.validateMnemonic(words);
console.log('助记词有效:', isValid);

// 获取助记词强度
const strength = mnemonic.getMnemonicStrength(words);
console.log('助记词强度:', strength);
```

## 从助记词生成密钥

### 1. 生成种子

```javascript
// 从助记词生成种子
const seed = mnemonic.mnemonicToSeedSync(words);
console.log('种子长度:', seed.length);

// 可选：添加密码短语
const seedWithPassphrase = mnemonic.mnemonicToSeedSync(words, 'my_password');
```

### 2. 创建 HD 钱包

```javascript
const { HDNode } = require('avalanche');

// 从种子创建 HD 钱包
const hdnode = new HDNode(seed);

// 获取主私钥
const masterPrivateKey = hdnode.privateKeyCB58;
console.log('主私钥:', masterPrivateKey);
```

## 派生地址

### 1. BIP44 路径

Avalanche 使用 BIP44 标准，路径为：`m/44'/9000'/0'/0/{index}`

- `44'`: BIP44 标准
- `9000'`: Avalanche 的币种标识符
- `0'`: 账户索引
- `0`: 链类型（0=外部链，1=内部链）
- `{index}`: 地址索引

```javascript
// 派生第一个外部地址
const child0 = hdnode.derive("m/44'/9000'/0'/0/0");
console.log('地址 0 私钥:', child0.privateKeyCB58);
console.log('地址 0 公钥:', child0.publicKey.toString('hex'));

// 派生第二个外部地址
const child1 = hdnode.derive("m/44'/9000'/0'/0/1");
console.log('地址 1 私钥:', child1.privateKeyCB58);

// 派生内部地址（用于找零）
const internal0 = hdnode.derive("m/44'/9000'/0'/1/0");
console.log('内部地址 0 私钥:', internal0.privateKeyCB58);
```

### 2. 批量派生地址

```javascript
function deriveAddresses(hdnode, startIndex, count) {
  const addresses = [];
  
  for (let i = startIndex; i < startIndex + count; i++) {
    const child = hdnode.derive(`m/44'/9000'/0'/0/${i}`);
    addresses.push({
      index: i,
      privateKey: child.privateKeyCB58,
      publicKey: child.publicKey.toString('hex'),
      path: `m/44'/9000'/0'/0/${i}`
    });
  }
  
  return addresses;
}

// 派生前 5 个地址
const addressList = deriveAddresses(hdnode, 0, 5);
addressList.forEach(addr => {
  console.log(`地址 ${addr.index}:`, addr.privateKey);
});
```

## 导入私钥

### 1. 导入到密钥链

```javascript
const { Avalanche } = require('avalanche');

// 连接到网络
const avalanche = new Avalanche('api.avax-test.network', 443, 'https', 5);
const xchain = avalanche.XChain();
const keychain = xchain.keyChain();

// 导入私钥
const keyPair = keychain.importKey(privateKeyCB58);
console.log('导入的地址:', keyPair.getAddressString());

// 获取所有导入的地址
const addresses = keychain.getAddressStrings();
console.log('所有地址:', addresses);
```

### 2. 从不同格式导入

```javascript
// 从十六进制私钥导入
const hexPrivateKey = Buffer.from('your_hex_private_key', 'hex');
const keyPairFromHex = keychain.importKey(hexPrivateKey);

// 从 WIF 格式导入（如果支持）
// const keyPairFromWIF = keychain.importKey(wifPrivateKey);
```

## 地址验证

### 1. 验证地址格式

```javascript
function validateAvalancheAddress(address) {
  // X-Chain 地址验证
  if (address.startsWith('X-')) {
    const regex = /^X-[a-zA-Z0-9]{39}$/;
    return regex.test(address);
  }
  
  // P-Chain 地址验证
  if (address.startsWith('P-')) {
    const regex = /^P-[a-zA-Z0-9]{39}$/;
    return regex.test(address);
  }
  
  // C-Chain 地址验证（以太坊格式）
  if (address.startsWith('0x')) {
    const regex = /^0x[a-fA-F0-9]{40}$/;
    return regex.test(address);
  }
  
  return false;
}

// 测试地址
const testAddresses = [
  'X-fuji1cfvdpdqyzpp8pq0g6trmjsrn9pt8nutsfm7a40',
  'P-fuji1cfvdpdqyzpp8pq0g6trmjsrn9pt8nutsfm7a40',
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  'invalid-address'
];

testAddresses.forEach(addr => {
  console.log(`${addr}: ${validateAvalancheAddress(addr) ? '有效' : '无效'}`);
});
```

### 2. 地址类型检测

```javascript
function getAddressType(address) {
  if (address.startsWith('X-')) return 'X-Chain';
  if (address.startsWith('P-')) return 'P-Chain';
  if (address.startsWith('0x')) return 'C-Chain';
  return 'Unknown';
}

// 检测地址类型
const address = 'X-fuji1cfvdpdqyzpp8pq0g6trmjsrn9pt8nutsfm7a40';
console.log('地址类型:', getAddressType(address));
```

## 地址转换

### 1. 在不同链之间转换

```javascript
const { utils } = require('avalanche');
const { Serialization } = utils;

async function convertAddress(address, targetChain) {
  const serialization = Serialization.getInstance();
  
  try {
    // 解析地址
    const addressBuffer = xchain.parseAddress(address);
    
    // 转换为目标链格式
    let convertedAddress;
    switch (targetChain) {
      case 'X':
        convertedAddress = serialization.bufferToType(
          addressBuffer, 
          'bech32', 
          'X', 
          xchain.getChainID()
        );
        break;
      case 'P':
        convertedAddress = serialization.bufferToType(
          addressBuffer, 
          'bech32', 
          'P', 
          pchain.getChainID()
        );
        break;
      default:
        throw new Error('不支持的链类型');
    }
    
    return convertedAddress;
  } catch (error) {
    console.error('地址转换失败:', error);
    throw error;
  }
}
```

## 安全最佳实践

### 1. 私钥管理

```javascript
// 安全存储私钥
class SecureKeyManager {
  constructor() {
    this.encryptedKeys = new Map();
  }
  
  // 加密私钥
  encryptPrivateKey(privateKey, password) {
    // 使用强加密算法加密私钥
    const encrypted = this.encrypt(privateKey, password);
    return encrypted;
  }
  
  // 解密私钥
  decryptPrivateKey(encryptedKey, password) {
    try {
      const decrypted = this.decrypt(encryptedKey, password);
      return decrypted;
    } catch (error) {
      throw new Error('密码错误或私钥损坏');
    }
  }
  
  // 存储加密的私钥
  storeKey(keyId, encryptedKey) {
    this.encryptedKeys.set(keyId, encryptedKey);
  }
  
  // 获取私钥
  getKey(keyId, password) {
    const encryptedKey = this.encryptedKeys.get(keyId);
    if (!encryptedKey) {
      throw new Error('私钥不存在');
    }
    return this.decryptPrivateKey(encryptedKey, password);
  }
}
```

### 2. 地址轮换

```javascript
// 实现地址轮换策略
class AddressRotation {
  constructor(hdnode, maxAddresses = 10) {
    this.hdnode = hdnode;
    this.maxAddresses = maxAddresses;
    this.currentIndex = 0;
  }
  
  // 获取下一个地址
  getNextAddress() {
    if (this.currentIndex >= this.maxAddresses) {
      this.currentIndex = 0; // 重新开始
    }
    
    const child = this.hdnode.derive(`m/44'/9000'/0'/0/${this.currentIndex}`);
    this.currentIndex++;
    
    return {
      index: this.currentIndex - 1,
      address: child.getAddressString(),
      privateKey: child.privateKeyCB58
    };
  }
  
  // 获取当前使用的地址
  getCurrentAddress() {
    return this.getNextAddress();
  }
}
```

## 完整示例

```javascript
const { Mnemonic, HDNode, Avalanche } = require('avalanche');

async function createAvalancheWallet() {
  try {
    // 1. 生成助记词
    const mnemonic = Mnemonic.getInstance();
    const words = mnemonic.generateMnemonic(256);
    console.log('生成的助记词:', words);
    
    // 2. 生成种子
    const seed = mnemonic.mnemonicToSeedSync(words);
    
    // 3. 创建 HD 钱包
    const hdnode = new HDNode(seed);
    
    // 4. 派生地址
    const addresses = [];
    for (let i = 0; i < 5; i++) {
      const child = hdnode.derive(`m/44'/9000'/0'/0/${i}`);
      addresses.push({
        index: i,
        privateKey: child.privateKeyCB58,
        publicKey: child.publicKey.toString('hex'),
        address: child.getAddressString()
      });
    }
    
    // 5. 连接到网络并导入密钥
    const avalanche = new Avalanche('api.avax-test.network', 443, 'https', 5);
    const xchain = avalanche.XChain();
    const keychain = xchain.keyChain();
    
    // 导入第一个地址
    const keyPair = keychain.importKey(addresses[0].privateKey);
    console.log('导入的地址:', keyPair.getAddressString());
    
    return {
      mnemonic: words,
      addresses: addresses,
      keychain: keychain
    };
    
  } catch (error) {
    console.error('创建钱包失败:', error);
    throw error;
  }
}

// 使用示例
createAvalancheWallet()
  .then(wallet => {
    console.log('钱包创建成功');
    console.log('地址数量:', wallet.addresses.length);
  })
  .catch(error => {
    console.error('钱包创建失败:', error);
  });
```
