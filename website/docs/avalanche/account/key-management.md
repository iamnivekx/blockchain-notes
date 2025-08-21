# Avalanche 密钥管理

本指南将介绍如何在 Avalanche 上管理密钥，包括助记词生成、HD 钱包创建和密钥导入。

## 基本概念

### 1. 密钥类型

- **助记词**: 人类可读的密钥种子
- **私钥**: 用于签名交易的密钥
- **公钥**: 从私钥派生的公开密钥
- **地址**: 从公钥派生的账户地址

### 2. HD 钱包

Avalanche 使用分层确定性（HD）钱包，可以从一个种子派生多个密钥对。

## 环境设置

```javascript
const { Mnemonic, HDNode, Avalanche } = require('avalanche');

// 网络配置
const networkID = 5;
const avalanche = new Avalanche('api.avax-test.network', 9644350, 'https', networkID);
const xchain = avalanche.XChain();
const keychain = xchain.keyChain();
```

## 生成助记词

### 1. 创建新的助记词

```javascript
// 获取助记词实例
const mnemonic = Mnemonic.getInstance();

// 生成 24 个单词的助记词 (256 位强度)
const words = mnemonic.generateMnemonic(256);
console.log('生成的助记词:', words);

// 生成 12 个单词的助记词 (128 位强度)
const words12 = mnemonic.generateMnemonic(128);
console.log('12 词助记词:', words12);
```

### 2. 使用预定义的助记词

```javascript
// 使用预定义的助记词（仅用于测试）
const predefinedWords = 'juice garden awake mask festival blanket benefit pelican mimic stuff clay edge ten view easy hungry buffalo become exclude salon bamboo inflict fault tiny';
console.log('预定义助记词:', predefinedWords);
```

## 从助记词生成密钥

### 1. 生成种子

```javascript
// 从助记词生成种子
const seed = mnemonic.mnemonicToSeedSync(predefinedWords);
console.log('种子长度:', seed.length);

// 可选：添加密码短语
const seedWithPassphrase = mnemonic.mnemonicToSeedSync(predefinedWords, 'my_password');
```

### 2. 创建 HD 钱包

```javascript
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
// 派生前 3 个地址
for (let i = 0; i <= 2; i++) {
  const child = hdnode.derive(`m/44'/9000'/0'/0/${i}`);
  console.log(`地址 ${i} 私钥:`, child.privateKeyCB58);
  console.log(`地址 ${i} 公钥:`, child.publicKey.toString('hex'));
}
```

## 导入密钥到密钥链

### 1. 导入私钥

```javascript
// 导入私钥到密钥链
for (let i = 0; i <= 0; i++) {
  const child = hdnode.derive(`m/44'/9000'/0'/0/${i}`);
  keychain.importKey(child.privateKeyCB58);
}
```

### 2. 获取导入的地址

```javascript
// 获取所有导入的地址
const xAddressStrings = xchain.keyChain().getAddressStrings();
console.log('导入的地址列表:', xAddressStrings);
```

## 完整示例

```javascript
const { Mnemonic, HDNode, Avalanche } = require('avalanche');

async function main() {
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
    for (let i = 0; i <= 2; i++) {
      const child = hdnode.derive(`m/44'/9000'/0'/0/${i}`);
      console.log(`地址 ${i} 私钥:`, child.privateKeyCB58);
      console.log(`地址 ${i} 公钥:`, child.publicKey.toString('hex'));
    }
    
    // 5. 连接到网络
    const networkID = 5;
    const avalanche = new Avalanche('api.avax-test.network', 9644350, 'https', networkID);
    const xchain = avalanche.XChain();
    const keychain = xchain.keyChain();
    
    // 6. 导入密钥
    for (let i = 0; i <= 0; i++) {
      const child = hdnode.derive(`m/44'/9000'/0'/0/${i}`);
      keychain.importKey(child.privateKeyCB58);
    }
    
    // 7. 获取地址列表
    const addresses = xchain.keyChain().getAddressStrings();
    console.log('导入的地址:', addresses);
    
    console.log('密钥管理完成');
    
  } catch (error) {
    console.error('密钥管理失败:', error);
  }
}

// 运行程序
main();
```

## 安全注意事项

1. **助记词安全**: 永远不要在代码中硬编码助记词
2. **私钥保护**: 私钥应该安全存储，不要暴露给他人
3. **环境变量**: 使用环境变量存储敏感信息
4. **备份**: 定期备份助记词和私钥
