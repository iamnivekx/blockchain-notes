# 比特币脚本分类

比特币脚本分类是识别和理解不同类型脚本的关键工具。本文档将详细介绍如何识别和分类各种标准的比特币脚本类型。

## 脚本类型概述

比特币支持多种标准脚本类型，每种都有特定的用途和结构：

1. **P2PKH** - 支付到公钥哈希
2. **P2PK** - 支付到公钥
3. **P2SH** - 支付到脚本哈希
4. **P2WPKH** - 支付到见证公钥哈希
5. **P2WSH** - 支付到见证脚本哈希
6. **P2MS** - 多重签名
7. **NULLDATA** - 空数据（OP_RETURN）
8. **WITNESS_COMMITMENT** - 见证承诺

## 核心依赖

```typescript
const typeforce = require('typeforce');
import { compile, decompile, isCanonicalPubKey } from './script';
const OPS = require('bitcoin-ops');
const OP_INT_BASE = OPS.OP_RESERVED; // OP_1 - 1
```

## 类型常量定义

```typescript
export const types = {
  P2MS: 'multisig',
  NONSTANDARD: 'nonstandard',
  NULLDATA: 'nulldata',
  P2PK: 'pubkey',
  P2PKH: 'pubkeyhash',
  P2SH: 'scripthash',
  P2WPKH: 'witnesspubkeyhash',
  P2WSH: 'witnessscripthash',
  WITNESS_COMMITMENT: 'witnesscommitment',
};
```

## P2PKH脚本识别

### 脚本结构

P2PKH脚本的标准结构：
```
OP_DUP OP_HASH160 <PublicKeyHash> OP_EQUALVERIFY OP_CHECKSIG
```

### 识别函数

```typescript
export function p2pkh(script: Buffer) {
  typeforce(typeforce.Buffer, script);
  const buffer = compile(script);
  
  return (
    buffer.length === 25 && // 总长度25字节
    buffer[0] === OPS.OP_DUP && // 第一个操作码是OP_DUP
    buffer[1] === OPS.OP_HASH160 && // 第二个操作码是OP_HASH160
    buffer[2] === 0x14 && // 第三个字节是0x14 (20字节)
    buffer[23] === OPS.OP_EQUALVERIFY && // 倒数第二个操作码是OP_EQUALVERIFY
    buffer[24] === OPS.OP_CHECKSIG // 最后一个操作码是OP_CHECKSIG
  );
}
```

### 使用示例

```typescript
// 测试P2PKH脚本
const p2pkhScript = Buffer.from('76a914...88ac', 'hex'); // 你的P2PKH脚本
const isP2PKH = p2pkh(p2pkhScript);
console.log('Is P2PKH:', isP2PKH);
```

## P2PK脚本识别

### 脚本结构

P2PK脚本的标准结构：
```
<PublicKey> OP_CHECKSIG
```

### 识别函数

```typescript
export function p2pk(script: Buffer) {
  const chunks = decompile(script);
  
  return (
    chunks?.length === 2 && // 只有2个块
    isCanonicalPubKey(chunks[0]) && // 第一个块是规范公钥
    chunks[1] === OPS.OP_CHECKSIG // 第二个块是OP_CHECKSIG
  );
}
```

### 使用示例

```typescript
// 测试P2PK脚本
const p2pkScript = Buffer.from('41...ac', 'hex'); // 你的P2PK脚本
const isP2PK = p2pk(p2pkScript);
console.log('Is P2PK:', isP2PK);
```

## P2SH脚本识别

### 脚本结构

P2SH脚本的标准结构：
```
OP_HASH160 <ScriptHash> OP_EQUAL
```

### 识别函数

```typescript
export function p2sh(script) {
  typeforce(typeforce.Buffer, script);
  const buffer = compile(script);
  
  return (
    buffer.length === 23 && // 总长度23字节
    buffer[0] === OPS.OP_HASH160 && // 第一个操作码是OP_HASH160
    buffer[1] === 0x14 && // 第二个字节是0x14 (20字节)
    buffer[22] === OPS.OP_EQUAL // 最后一个操作码是OP_EQUAL
  );
}
```

### 使用示例

```typescript
// 测试P2SH脚本
const p2shScript = Buffer.from('a914...87', 'hex'); // 你的P2SH脚本
const isP2SH = p2sh(p2shScript);
console.log('Is P2SH:', isP2SH);
```

## P2WPKH脚本识别

### 脚本结构

P2WPKH脚本的标准结构：
```
OP_0 <PublicKeyHash>
```

### 识别函数

```typescript
export function p2wpkh(script) {
  typeforce(typeforce.Buffer, script);
  const buffer = compile(script);

  return (
    buffer.length === 22 && // 总长度22字节
    buffer[0] === OPS.OP_0 && // 第一个操作码是OP_0
    buffer[1] === 0x14 // 第二个字节是0x14 (20字节)
  );
}
```

### 使用示例

```typescript
// 测试P2WPKH脚本
const p2wpkhScript = Buffer.from('0014...', 'hex'); // 你的P2WPKH脚本
const isP2WPKH = p2wpkh(p2wpkhScript);
console.log('Is P2WPKH:', isP2WPKH);
```

## P2WSH脚本识别

### 脚本结构

P2WSH脚本的标准结构：
```
OP_0 <ScriptHash>
```

### 识别函数

```typescript
export function p2wsh(script) {
  typeforce(typeforce.Buffer, script);
  const buffer = compile(script);

  return (
    buffer.length === 34 && // 总长度34字节
    buffer[0] === OPS.OP_0 && // 第一个操作码是OP_0
    buffer[1] === 0x20 // 第二个字节是0x20 (32字节)
  );
}
```

### 使用示例

```typescript
// 测试P2WSH脚本
const p2wshScript = Buffer.from('0020...', 'hex'); // 你的P2WSH脚本
const isP2WSH = p2wsh(p2wshScript);
console.log('Is P2WSH:', isP2WSH);
```

## 多重签名脚本识别

### 脚本结构

多重签名脚本的标准结构：
```
OP_M <PublicKey1> ... <PublicKeyN> OP_N OP_CHECKMULTISIG
```

### 识别函数

```typescript
export function multisig(script: Buffer) {
  const chunks = decompile(script);
  const length = chunks.length;
  
  if (length < 4) return false; // 至少需要4个块
  if (chunks[length - 1] !== OPS.OP_CHECKMULTISIG) return false; // 最后一个必须是OP_CHECKMULTISIG
  
  if (!typeforce.Number(chunks[0])) return false; // 第一个必须是数字
  if (!typeforce.Number(chunks[length - 2])) return false; // 倒数第二个必须是数字

  const m = chunks[0] - OP_INT_BASE; // 计算M值
  const n = chunks[length - 2] - OP_INT_BASE; // 计算N值

  if (m <= 0) return false; // M必须大于0
  if (n > 16) return false; // N不能超过16
  if (m > n) return false; // M不能大于N
  
  // 验证公钥数量
  if (n !== length - 3) return false;

  // 验证所有公钥
  const keys = chunks.slice(1, -2);
  return keys.every(isCanonicalPubKey);
}
```

### 使用示例

```typescript
// 测试多重签名脚本
const multisigScript = Buffer.from('52...ae', 'hex'); // 你的多重签名脚本
const isMultisig = multisig(multisigScript);
console.log('Is Multisig:', isMultisig);
```

## 见证承诺脚本识别

### 脚本结构

见证承诺脚本的标准结构：
```
OP_RETURN <WitnessCommitment>
```

### 识别函数

```typescript
export function witness_commitment(script) {
  typeforce(typeforce.Buffer, script);
  const buffer = compile(script);
  
  return (
    buffer.length === 25 && // 总长度25字节
    buffer[0] === OPS.OP_RETURN && // 第一个操作码是OP_RETURN
    buffer[1] === 0x24 && // 第二个字节是0x24 (36字节)
    buffer.slice(2, 6).equals(Buffer.from('0x6a24aa21a9ed', 'hex')) // 特定的前缀
  );
}
```

### 使用示例

```typescript
// 测试见证承诺脚本
const witnessCommitmentScript = Buffer.from('6a24aa21a9ed...', 'hex');
const isWitnessCommitment = witness_commitment(witnessCommitmentScript);
console.log('Is Witness Commitment:', isWitnessCommitment);
```

## 主分类函数

### 脚本类型识别

```typescript
export function classifyScript(script: Buffer): string {
  // 按优先级检查各种脚本类型
  if (p2pkh(script)) return types.P2PKH;
  if (p2pk(script)) return types.P2PK;
  if (p2sh(script)) return types.P2SH;
  if (p2wpkh(script)) return types.P2WPKH;
  if (p2wsh(script)) return types.P2WSH;
  if (multisig(script)) return types.P2MS;
  if (witness_commitment(script)) return types.WITNESS_COMMITMENT;
  
  // 检查是否为OP_RETURN脚本
  try {
    const chunks = decompile(script);
    if (chunks && chunks.length > 0 && chunks[0] === OPS.OP_RETURN) {
      return types.NULLDATA;
    }
  } catch (error) {
    // 忽略反编译错误
  }
  
  return types.NONSTANDARD;
}
```

### 使用示例

```typescript
// 分类各种脚本
const scripts = [
  Buffer.from('76a914...88ac', 'hex'), // P2PKH
  Buffer.from('41...ac', 'hex'),       // P2PK
  Buffer.from('a914...87', 'hex'),     // P2SH
  Buffer.from('0014...', 'hex'),       // P2WPKH
  Buffer.from('0020...', 'hex'),       // P2WSH
  Buffer.from('52...ae', 'hex'),       // Multisig
  Buffer.from('6a24aa21a9ed...', 'hex') // Witness Commitment
];

scripts.forEach((script, index) => {
  const type = classifyScript(script);
  console.log(`Script ${index + 1}: ${type}`);
});
```

## 批量脚本分析

### 批量分类

```typescript
function analyzeScripts(scripts: Buffer[]) {
  const analysis = {
    total: scripts.length,
    types: {},
    nonstandard: []
  };
  
  scripts.forEach((script, index) => {
    const type = classifyScript(script);
    
    // 统计类型
    analysis.types[type] = (analysis.types[type] || 0) + 1;
    
    // 记录非标准脚本
    if (type === types.NONSTANDARD) {
      analysis.nonstandard.push({
        index,
        script: script.toString('hex'),
        size: script.length
      });
    }
  });
  
  return analysis;
}

// 使用示例
const scriptAnalysis = analyzeScripts(scripts);
console.log('Script Analysis:', scriptAnalysis);
```

## 脚本验证工具

### 完整性检查

```typescript
function validateScript(script: Buffer): {
  isValid: boolean;
  type: string;
  issues: string[];
} {
  const result = {
    isValid: true,
    type: '',
    issues: []
  };
  
  try {
    // 检查脚本大小
    if (script.length > 10000) {
      result.isValid = false;
      result.issues.push('Script too large (>10KB)');
    }
    
    // 尝试反编译
    const chunks = decompile(script);
    if (!chunks) {
      result.isValid = false;
      result.issues.push('Failed to decompile script');
      return result;
    }
    
    // 检查操作码数量
    let opCount = 0;
    for (const chunk of chunks) {
      if (!Buffer.isBuffer(chunk) && chunk > OPS.OP_16) {
        opCount++;
        if (opCount > 201) {
          result.isValid = false;
          result.issues.push('Too many opcodes (>201)');
          break;
        }
      }
    }
    
    // 分类脚本
    result.type = classifyScript(script);
    
  } catch (error) {
    result.isValid = false;
    result.issues.push(`Error: ${error.message}`);
  }
  
  return result;
}
```

## 性能优化

### 缓存机制

```typescript
const scriptTypeCache = new Map();

function getCachedScriptType(script: Buffer): string {
  const key = script.toString('hex');
  
  if (scriptTypeCache.has(key)) {
    return scriptTypeCache.get(key);
  }
  
  const type = classifyScript(script);
  scriptTypeCache.set(key, type);
  
  return type;
}
```

### 批量处理优化

```typescript
function batchClassifyScripts(scripts: Buffer[]): string[] {
  // 并行处理多个脚本
  return scripts.map(script => getCachedScriptType(script));
}
```

## 错误处理

### 常见错误类型

```typescript
function handleClassificationErrors(error: Error, script: Buffer) {
  if (error.message.includes('Invalid script')) {
    console.error('无效的脚本格式');
  } else if (error.message.includes('Decompile failed')) {
    console.error('脚本反编译失败');
  } else if (error.message.includes('Type mismatch')) {
    console.error('类型不匹配');
  } else {
    console.error('未知错误:', error.message);
  }
  
  // 记录失败的脚本
  console.error('Failed script:', script.toString('hex'));
}
```

## 最佳实践

1. **类型优先级**: 按照标准程度设置检查顺序
2. **错误处理**: 实现完善的错误处理机制
3. **性能优化**: 使用缓存和批量处理
4. **验证完整性**: 检查脚本的完整性和有效性
5. **文档维护**: 保持脚本类型定义的更新

## 常见问题

### Q: 如何识别自定义脚本？
A: 使用 `classifyScript` 函数，非标准脚本会返回 `NONSTANDARD` 类型。

### Q: 脚本分类失败怎么办？
A: 检查脚本格式、大小和操作码，使用 `validateScript` 函数诊断问题。

### Q: 如何优化分类性能？
A: 使用缓存机制、批量处理和并行处理。

### Q: 支持新的脚本类型吗？
A: 可以扩展 `classifyScript` 函数添加新的识别逻辑。

