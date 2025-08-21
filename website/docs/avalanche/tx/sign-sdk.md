# Avalanche 交易签名

本指南将介绍如何在 Avalanche 上进行交易签名，包括消息签名、签名验证和公钥恢复。

## 基本概念

### 1. 签名类型

- **消息签名**: 对任意消息进行签名
- **交易签名**: 对交易数据进行签名
- **多重签名**: 多个私钥对同一数据进行签名

### 2. 签名算法

Avalanche 使用 ECDSA 签名算法，基于 secp256k1 椭圆曲线。

## 环境设置

```javascript
const { Avalanche, BinTools, Buffer, avm, utils } = require('avalanche');
const { Serialization } = utils;
require('dotenv').config();

// 网络配置
const networkID = 5;
const avalanche = new Avalanche('api.avax-test.network', 443, 'https', networkID);
const xchain = avalanche.XChain();
const keychain = xchain.keyChain();

// 工具实例
const bintools = BinTools.getInstance();
const serialization = Serialization.getInstance();
```

## 消息签名

### 1. 基本消息签名

```javascript
async function signMessage(message, privateKey) {
  try {
    // 导入私钥
    const keyPair = keychain.importKey(Buffer.from(privateKey, 'hex'));
    
    // 获取公钥和地址信息
    const publicKey = keyPair.getPublicKey();
    const address = keyPair.getAddressString();
    
    console.log('签名地址:', address);
    console.log('公钥 (hex):', publicKey.toString('hex'));
    
    // 对消息进行签名
    const signature = keyPair.sign(message);
    console.log('签名 (hex):', signature.toString('hex'));
    
    return {
      message: message,
      signature: signature,
      publicKey: publicKey,
      address: address
    };
    
  } catch (error) {
    console.error('消息签名失败:', error);
    throw error;
  }
}

// 使用示例
const message = Buffer.from('c74f28c8abbe0a4f656eab6a70980d7bd8849ed53972cfb75dd461b7e8d15f18', 'hex');
const { SECRET_KEY_1 } = process.env;

signMessage(message, SECRET_KEY_1)
  .then(result => {
    console.log('签名完成:', result);
  })
  .catch(error => {
    console.error('签名失败:', error);
  });
```

### 2. 自定义消息签名

```javascript
async function signCustomMessage(textMessage, privateKey) {
  try {
    // 将文本消息转换为 Buffer
    const messageBuffer = Buffer.from(textMessage, 'utf8');
    
    // 计算消息哈希
    const messageHash = createHash('sha256').update(messageBuffer).digest();
    
    // 签名哈希
    const result = await signMessage(messageHash, privateKey);
    
    return {
      ...result,
      originalMessage: textMessage,
      messageHash: messageHash
    };
    
  } catch (error) {
    console.error('自定义消息签名失败:', error);
    throw error;
  }
}

// 使用示例
const textMessage = 'Hello Avalanche!';
signCustomMessage(textMessage, SECRET_KEY_1)
  .then(result => {
    console.log('文本消息签名完成');
    console.log('原始消息:', result.originalMessage);
    console.log('消息哈希:', result.messageHash.toString('hex'));
    console.log('签名:', result.signature.toString('hex'));
  });
```

## 签名验证

### 1. 验证消息签名

```javascript
function verifyMessageSignature(message, signature, publicKey) {
  try {
    // 创建 KeyPair 实例用于验证
    const keyPair = new avm.KeyPair(keychain.hrp, keychain.chainid);
    
    // 验证签名
    const isValid = keyPair.verify(message, signature, publicKey);
    
    console.log('签名验证结果:', isValid ? '有效' : '无效');
    
    return isValid;
    
  } catch (error) {
    console.error('签名验证失败:', error);
    throw error;
  }
}

// 使用示例
const { message, signature, publicKey } = await signMessage(message, SECRET_KEY_1);
const isValid = verifyMessageSignature(message, signature, publicKey);
```

### 2. 批量签名验证

```javascript
function verifyMultipleSignatures(messages, signatures, publicKeys) {
  const results = [];
  
  for (let i = 0; i < messages.length; i++) {
    try {
      const isValid = verifyMessageSignature(messages[i], signatures[i], publicKeys[i]);
      results.push({
        index: i,
        valid: isValid,
        message: messages[i].toString('hex'),
        signature: signatures[i].toString('hex')
      });
    } catch (error) {
      results.push({
        index: i,
        valid: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// 使用示例
const messages = [message1, message2, message3];
const signatures = [sig1, sig2, sig3];
const publicKeys = [pub1, pub2, pub3];

const verificationResults = verifyMultipleSignatures(messages, signatures, publicKeys);
verificationResults.forEach(result => {
  console.log(`签名 ${result.index}: ${result.valid ? '有效' : '无效'}`);
});
```

## 公钥恢复

### 1. 从签名恢复公钥

```javascript
function recoverPublicKey(message, signature) {
  try {
    // 创建 KeyPair 实例
    const keyPair = new avm.KeyPair(keychain.hrp, keychain.chainid);
    
    // 从签名恢复公钥
    const recoveredPublicKey = keyPair.recover(message, signature);
    
    console.log('原始消息:', message.toString('hex'));
    console.log('签名:', signature.toString('hex'));
    console.log('恢复的公钥:', recoveredPublicKey.toString('hex'));
    
    return recoveredPublicKey;
    
  } catch (error) {
    console.error('公钥恢复失败:', error);
    throw error;
  }
}

// 使用示例
const recoveredPubKey = recoverPublicKey(message, signature);
console.log('恢复的公钥是否匹配:', recoveredPubKey.equals(publicKey));
```

### 2. 地址验证

```javascript
function verifyAddressFromPublicKey(publicKey, expectedAddress) {
  try {
    // 从公钥生成地址
    const generatedAddress = avm.KeyPair.addressFromPublicKey(publicKey);
    
    // 转换为可读格式
    const addressString = serialization.bufferToType(
      generatedAddress, 
      'bech32', 
      keychain.hrp, 
      keychain.chainid
    );
    
    console.log('生成的地址:', addressString);
    console.log('期望的地址:', expectedAddress);
    console.log('地址匹配:', addressString === expectedAddress);
    
    return addressString === expectedAddress;
    
  } catch (error) {
    console.error('地址验证失败:', error);
    throw error;
  }
}

// 使用示例
const keyPair = keychain.importKey(Buffer.from(SECRET_KEY_1, 'hex'));
const publicKey = keyPair.getPublicKey();
const address = keyPair.getAddressString();

const addressValid = verifyAddressFromPublicKey(publicKey, address);
```

## 高级签名功能

### 1. 多重签名

```javascript
class MultiSignature {
  constructor(threshold, publicKeys) {
    this.threshold = threshold;
    this.publicKeys = publicKeys;
    this.signatures = [];
  }
  
  // 添加签名
  addSignature(signature, publicKey) {
    // 验证公钥是否在允许列表中
    const isValidPublicKey = this.publicKeys.some(pk => 
      pk.equals(publicKey)
    );
    
    if (!isValidPublicKey) {
      throw new Error('无效的公钥');
    }
    
    // 检查是否已经存在该公钥的签名
    const existingIndex = this.signatures.findIndex(sig => 
      sig.publicKey.equals(publicKey)
    );
    
    if (existingIndex !== -1) {
      this.signatures[existingIndex] = { signature, publicKey };
    } else {
      this.signatures.push({ signature, publicKey });
    }
    
    console.log(`添加签名，当前签名数量: ${this.signatures.length}`);
  }
  
  // 验证多重签名
  verify(message) {
    if (this.signatures.length < this.threshold) {
      console.log(`签名数量不足，需要 ${this.threshold} 个，当前 ${this.signatures.length} 个`);
      return false;
    }
    
    // 验证每个签名
    let validSignatures = 0;
    for (const sigData of this.signatures) {
      try {
        const isValid = verifyMessageSignature(
          message, 
          sigData.signature, 
          sigData.publicKey
        );
        if (isValid) validSignatures++;
      } catch (error) {
        console.log('签名验证失败:', error.message);
      }
    }
    
    const result = validSignatures >= this.threshold;
    console.log(`多重签名验证结果: ${result} (${validSignatures}/${this.threshold})`);
    
    return result;
  }
}

// 使用示例
const multiSig = new MultiSignature(2, [pubKey1, pubKey2, pubKey3]);

// 添加签名
multiSig.addSignature(signature1, pubKey1);
multiSig.addSignature(signature2, pubKey2);

// 验证多重签名
const isValid = multiSig.verify(message);
```

### 2. 时间锁定签名

```javascript
class TimeLockedSignature {
  constructor(privateKey, unlockTime) {
    this.privateKey = privateKey;
    this.unlockTime = unlockTime;
    this.keyPair = keychain.importKey(Buffer.from(privateKey, 'hex'));
  }
  
  // 检查是否可以签名
  canSign() {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= this.unlockTime;
  }
  
  // 时间锁定签名
  signWithTimeLock(message) {
    if (!this.canSign()) {
      const remainingTime = this.unlockTime - Math.floor(Date.now() / 1000);
      throw new Error(`签名仍被锁定，剩余时间: ${remainingTime} 秒`);
    }
    
    return this.keyPair.sign(message);
  }
  
  // 获取锁定状态
  getLockStatus() {
    const currentTime = Math.floor(Date.now() / 1000);
    const isLocked = currentTime < this.unlockTime;
    const remainingTime = Math.max(0, this.unlockTime - currentTime);
    
    return {
      isLocked,
      unlockTime: this.unlockTime,
      currentTime,
      remainingTime
    };
  }
}

// 使用示例
const unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后解锁
const timeLockedSig = new TimeLockedSignature(SECRET_KEY_1, unlockTime);

console.log('锁定状态:', timeLockedSig.getLockStatus());

// 尝试签名
try {
  const signature = timeLockedSig.signWithTimeLock(message);
  console.log('签名成功:', signature.toString('hex'));
} catch (error) {
  console.log('签名失败:', error.message);
}
```

## 错误处理

### 1. 常见签名错误

```javascript
function handleSignatureError(error) {
  if (error.message.includes('Invalid private key')) {
    console.log('私钥格式错误，请检查私钥');
  } else if (error.message.includes('Invalid message')) {
    console.log('消息格式错误，请检查消息');
  } else if (error.message.includes('Signature verification failed')) {
    console.log('签名验证失败，请检查签名和公钥');
  } else if (error.message.includes('Public key recovery failed')) {
    console.log('公钥恢复失败，请检查签名和消息');
  } else {
    console.log('未知签名错误:', error.message);
  }
}
```

### 2. 重试机制

```javascript
async function retrySignature(signFunction, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await signFunction();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      console.log(`签名失败，${i + 1}/${maxRetries} 次重试...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// 使用重试机制
const signature = await retrySignature(() => 
  signMessage(message, SECRET_KEY_1)
);
```

## 完整示例

```javascript
const { Avalanche, avm, utils } = require('avalanche');
const createHash = require('create-hash');
require('dotenv').config();

async function main() {
  try {
    // 配置
    const avalanche = new Avalanche('api.avax-test.network', 443, 'https', 5);
    const xchain = avalanche.XChain();
    const keychain = xchain.keyChain();
    
    // 导入私钥
    const { SECRET_KEY_1 } = process.env;
    const keyPair = keychain.importKey(Buffer.from(SECRET_KEY_1, 'hex'));
    
    // 准备消息
    const message = Buffer.from('c74f28c8abbe0a4f656eab6a70980d7bd8849ed53972cfb75dd461b7e8d15f18', 'hex');
    
    console.log('=== 消息签名示例 ===');
    
    // 1. 签名消息
    const signature = keyPair.sign(message);
    console.log('消息签名:', signature.toString('hex'));
    
    // 2. 验证签名
    const isValid = keyPair.verify(message, signature, keyPair.getPublicKey());
    console.log('签名验证:', isValid);
    
    // 3. 恢复公钥
    const recoveredPubKey = keyPair.recover(message, signature);
    console.log('公钥恢复:', recoveredPubKey.equals(keyPair.getPublicKey()));
    
    // 4. 地址验证
    const address = keyPair.getAddressString();
    const generatedAddress = avm.KeyPair.addressFromPublicKey(keyPair.getPublicKey());
    console.log('地址匹配:', address === generatedAddress);
    
    console.log('=== 示例完成 ===');
    
  } catch (error) {
    console.error('程序执行失败:', error);
  }
}

// 运行程序
main();
```