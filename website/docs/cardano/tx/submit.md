# 交易提交

交易提交是将已签名的 Cardano 交易广播到网络的过程。本示例展示了如何使用不同的方法提交交易。

## 使用 cardano-wallet-js

### 安装依赖

```bash
npm install cardano-wallet-js axios
```

### 基本提交

```typescript
import axios from 'axios';
import { Seed, WalletServer } from 'cardano-wallet-js';

async function main() {
  // 生成恢复短语（可选）
  // let recoveryPhrase = Seed.generateRecoveryPhrase();
  // console.log('Recovery Phrase: ', recoveryPhrase);
  
  // 转换为助记词列表
  // let mnemonic_sentence = Seed.toMnemonicList(recoveryPhrase);
  
  // 设置密码和名称
  // let passphrase = 'tangocrypto';
  // let name = 'namet';

  // 准备交易数据
  const buffer = Buffer.from('0x....', 'hex');
  
  // 提交到测试网
  const response = await axios({
    headers: {
      'Content-Type': 'application/cbor',
    },
    method: 'post',
    url: 'https://submit-api.testnet.dandelion.link/api/submit/tx',
    data: buffer,
  });
  
  console.log(response);
}
```

## 提交端点

### 测试网端点

```typescript
// Dandelion 测试网
const TESTNET_SUBMIT_URL = 'https://submit-api.testnet.dandelion.link/api/submit/tx';

// IOHK 测试网
const IOHK_TESTNET_URL = 'https://testnet.cardano.org/api/submit/tx';
```

### 主网端点

```typescript
// 主网提交端点
const MAINNET_SUBMIT_URL = 'https://submit-api.mainnet.dandelion.link/api/submit/tx';
```

## 交易格式

### CBOR 格式

Cardano 交易以 CBOR (Concise Binary Object Representation) 格式提交：

```typescript
// 从十六进制字符串转换为 Buffer
const hexString = '0x...'; // 你的交易十六进制字符串
const buffer = Buffer.from(hexString, 'hex');

// 或者从 Base64 字符串转换
const base64String = '...'; // 你的交易 Base64 字符串
const buffer = Buffer.from(base64String, 'base64');
```

### 请求头设置

```typescript
const headers = {
  'Content-Type': 'application/cbor',
  'Accept': 'application/json',
};
```

## 错误处理

### 基本错误处理

```typescript
try {
  const response = await axios({
    headers: {
      'Content-Type': 'application/cbor',
    },
    method: 'post',
    url: submitUrl,
    data: buffer,
    timeout: 30000, // 30 秒超时
  });
  
  console.log('Transaction submitted successfully:', response.data);
  return response.data;
  
} catch (error) {
  if (error.response) {
    // 服务器响应了错误状态码
    console.error('Submission failed:', error.response.status, error.response.data);
  } else if (error.request) {
    // 请求已发出但没有收到响应
    console.error('No response received:', error.request);
  } else {
    // 设置请求时发生错误
    console.error('Request setup error:', error.message);
  }
  throw error;
}
```

### 常见错误码

- **400**: 请求格式错误
- **403**: 交易验证失败
- **500**: 服务器内部错误
- **503**: 服务不可用

## 交易状态检查

### 检查交易确认

```typescript
async function checkTransactionStatus(txHash: string) {
  try {
    const response = await axios.get(
      `https://explorer.cardano-testnet.iohkdev.io/api/transactions/${txHash}`
    );
    
    const status = response.data;
    console.log('Transaction status:', status);
    
    return status;
  } catch (error) {
    console.error('Failed to check transaction status:', error);
    throw error;
  }
}
```

## 批量提交

### 多个交易提交

```typescript
async function submitMultipleTransactions(transactions: Buffer[]) {
  const results = [];
  
  for (let i = 0; i < transactions.length; i++) {
    try {
      console.log(`Submitting transaction ${i + 1}/${transactions.length}`);
      
      const response = await axios({
        headers: { 'Content-Type': 'application/cbor' },
        method: 'post',
        url: submitUrl,
        data: transactions[i],
      });
      
      results.push({
        index: i,
        success: true,
        data: response.data
      });
      
      // 添加延迟避免过载
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.push({
        index: i,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

## 完整示例

查看 `examples/cardano/tx/submit.ts` 文件获取完整的交易提交示例代码。

## 注意事项

- 确保交易已正确签名
- 检查网络参数（主网/测试网）
- 设置适当的超时时间
- 处理提交失败的情况
- 验证交易哈希确认提交成功
- 考虑网络拥堵时的重试机制
