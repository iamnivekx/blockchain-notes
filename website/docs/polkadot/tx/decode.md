# 交易解码

Polkadot 交易解码是将已签名的交易数据解析为可读信息的过程。这对于调试、审计和了解交易内容非常重要。

## 交易解码概述

交易解码可以帮助我们了解：

- 交易的发送者和接收者
- 交易的具体操作（转账、调用等）
- 交易参数和数值
- 签名信息
- 交易状态

## 基本解码

### 解码序列化交易

```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');

async function decodeTransaction(serializedTx) {
  // 连接到网络
  const wsProvider = new WsProvider('wss://westend-rpc.polkadot.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  try {
    // 创建 Extrinsic 类型
    const extrinsic = api.createType('Extrinsic', serializedTx);
    
    // 解码交易信息
    console.log('Transaction hex:', extrinsic.toHex());
    console.log('Transaction nonce:', extrinsic.nonce.toNumber());
    console.log('Transaction method:', extrinsic.method.toHuman());
    console.log('Transaction signer:', extrinsic.signer.toString());
    
    return extrinsic;
    
  } catch (error) {
    console.error('Error decoding transaction:', error);
    throw error;
  } finally {
    await api.disconnect();
  }
}
```

### 解码交易哈希

```javascript
async function decodeTransactionByHash(api, txHash) {
  try {
    // 获取交易信息
    const tx = await api.rpc.chain.getBlock(txHash);
    
    if (tx && tx.block) {
      console.log('Block hash:', tx.block.header.hash.toHex());
      console.log('Block number:', tx.block.header.number.toNumber());
      
      // 解码区块中的交易
      const extrinsics = tx.block.extrinsics;
      extrinsics.forEach((extrinsic, index) => {
        console.log(`\nExtrinsic ${index}:`);
        console.log('Method:', extrinsic.method.toHuman());
        console.log('Signer:', extrinsic.signer.toString());
        console.log('Nonce:', extrinsic.nonce.toNumber());
      });
    }
    
  } catch (error) {
    console.error('Error getting transaction by hash:', error);
  }
}
```

## 详细解码

### 解码交易方法

```javascript
function decodeMethod(extrinsic) {
  const method = extrinsic.method;
  
  console.log('Method section:', method.section);
  console.log('Method name:', method.method);
  console.log('Method arguments:', method.args.toHuman());
  
  // 根据方法类型进行特定解码
  if (method.section === 'balances' && method.method === 'transfer') {
    const [dest, value] = method.args;
    console.log('Transfer destination:', dest.toString());
    console.log('Transfer amount:', value.toString());
  }
  
  return method;
}
```

### 解码交易签名

```javascript
function decodeSignature(extrinsic) {
  if (extrinsic.signature.isSome) {
    const signature = extrinsic.signature.unwrap();
    
    console.log('Signature type:', signature.type);
    console.log('Signature value:', signature.value.toHex());
    
    // 验证签名
    const isValid = extrinsic.isSigned;
    console.log('Is signed:', isValid);
    
    return signature;
  } else {
    console.log('Transaction is not signed');
    return null;
  }
}
```

## 网络特定解码

### 自定义类型支持

某些网络可能需要自定义类型定义：

```javascript
const cloverTypes = require('@clover-network/node-types');

async function decodeWithCustomTypes(serializedTx) {
  const wsProvider = new WsProvider('wss://api.clover.finance');
  
  // 使用自定义类型创建 API
  const api = await ApiPromise.create({ 
    provider: wsProvider, 
    types: cloverTypes 
  });
  
  try {
    const extrinsic = api.createType('Extrinsic', serializedTx);
    console.log('Decoded with custom types:', extrinsic.toHuman());
    
    return extrinsic;
    
  } finally {
    await api.disconnect();
  }
}
```

## 批量解码

### 解码多个交易

```javascript
async function decodeMultipleTransactions(api, txHashes) {
  const decodedTxs = [];
  
  for (const txHash of txHashes) {
    try {
      const tx = await api.rpc.chain.getBlock(txHash);
      if (tx && tx.block) {
        const decoded = {
          hash: txHash,
          blockNumber: tx.block.header.number.toNumber(),
          extrinsics: tx.block.extrinsics.map(ext => ({
            method: ext.method.toHuman(),
            signer: ext.signer.toString(),
            nonce: ext.nonce.toNumber()
          }))
        };
        
        decodedTxs.push(decoded);
      }
    } catch (error) {
      console.error(`Error decoding tx ${txHash}:`, error);
    }
  }
  
  return decodedTxs;
}
```

## 事件解码

### 解码交易事件

```javascript
async function decodeTransactionEvents(api, txHash) {
  try {
    // 获取交易收据
    const events = await api.query.system.events();
    
    // 过滤相关事件
    const relevantEvents = events.filter(event => {
      // 根据具体需求过滤事件
      return event.event.section === 'balances' || 
             event.event.section === 'system';
    });
    
    // 解码事件
    relevantEvents.forEach(({ event: { data, method, section } }) => {
      console.log(`${section}.${method}:`, data.toHuman());
    });
    
  } catch (error) {
    console.error('Error decoding events:', error);
  }
}
```

## 完整示例

```javascript
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { formatBalance } = require('@polkadot/util');

async function comprehensiveDecodeExample() {
  // 连接到网络
  const wsProvider = new WsProvider('wss://westend-rpc.polkadot.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  // 设置余额格式
  formatBalance.setDefaults({
    unit: 'WND',
    decimals: 12
  });
  
  try {
    // 示例序列化交易（实际使用时替换为真实的交易数据）
    const serializedTx = '0x4d02840035fdfacc9704ca2672283870b711c9fe8f6787f31ec150fed4d3533ab14b2cf202999eb9fe1f3ac6b7126dacd61be2b56296cbb40a335efd55993ae655b31cbc6d4c8390bf61d35b542eda46d651c5f705452989a4000a3fd9e47ebf8ba60df96c0100040007000045662f3837457c0f76ce2878e3102cb5173bbbb9714429fe100ee2087cc9fb7213c492d56e676adb0d';
    
    console.log('=== Decoding Transaction ===');
    
    // 解码交易
    const extrinsic = api.createType('Extrinsic', serializedTx);
    
    // 基本信息
    console.log('\n1. Basic Information:');
    console.log('Hex:', extrinsic.toHex());
    console.log('Nonce:', extrinsic.nonce.toNumber());
    console.log('Signer:', extrinsic.signer.toString());
    
    // 方法信息
    console.log('\n2. Method Information:');
    const method = extrinsic.method;
    console.log('Section:', method.section);
    console.log('Method:', method.method);
    console.log('Arguments:', method.args.toHuman());
    
    // 签名信息
    console.log('\n3. Signature Information:');
    console.log('Is signed:', extrinsic.isSigned);
    if (extrinsic.signature.isSome) {
      const sig = extrinsic.signature.unwrap();
      console.log('Signature type:', sig.type);
      console.log('Signature value:', sig.value.toHex());
    }
    
    // 交易状态
    console.log('\n4. Transaction Status:');
    console.log('Version:', extrinsic.version);
    console.log('Era:', extrinsic.era.toHuman());
    
    return extrinsic;
    
  } catch (error) {
    console.error('Decoding failed:', error);
    throw error;
  } finally {
    await api.disconnect();
  }
}

// 运行示例
comprehensiveDecodeExample().catch(console.error);
```

## 最佳实践

1. **错误处理**: 始终处理解码过程中可能出现的错误
2. **类型检查**: 验证交易数据的格式和完整性
3. **网络兼容性**: 确保使用正确的网络和类型定义
4. **性能考虑**: 对于大量交易，考虑批量处理
5. **安全验证**: 验证签名的有效性

## 常见问题

### Q: 如何解码失败的交易？
A: 失败的交易仍然可以解码，但需要检查事件中的错误信息。

### Q: 支持哪些编码格式？
A: 支持十六进制、Base58 和原始字节数组格式。

### Q: 如何解码自定义类型的交易？
A: 需要提供相应的类型定义文件。

### Q: 解码需要连接到网络吗？
A: 基本解码不需要，但获取完整信息需要网络连接。
