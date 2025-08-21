# 比特币脚本系统

比特币脚本是一种基于栈的编程语言，用于定义比特币交易的锁定和解锁条件。本文档将详细介绍脚本的编译、反编译和操作。

## 脚本概述

比特币脚本具有以下特点：

1. **基于栈**: 使用栈数据结构执行操作
2. **无循环**: 不支持循环语句，确保脚本终止
3. **确定性**: 相同输入产生相同输出
4. **简单性**: 指令集有限，易于验证

## 核心依赖

```typescript
import typeforce from 'typeforce';
import OPS from 'bitcoin-ops';
import ecc from 'tiny-secp256k1';
import pushdata from 'pushdata-bitcoin';
import REVERSE_OPS from 'bitcoin-ops/map';
```

## 常量定义

```typescript
const OP_INT_BASE = OPS.OP_RESERVED; // OP_1 - 1
```

## 最小操作码

### asMinimalOP函数

```typescript
export function asMinimalOP(buffer: Uint8Array) {
  // 空缓冲区对应OP_0
  if (buffer.length === 0) return OPS.OP_0;
  
  // 只处理单字节
  if (buffer.length !== 1) return;
  
  // 1-16对应OP_1到OP_16
  if (buffer[0] >= 1 && buffer[0] <= 16) {
    return OP_INT_BASE + buffer[0];
  }
  
  // 0x81对应OP_1NEGATE (-1)
  if (buffer[0] === 0x81) return OPS.OP_1NEGATE;
}
```

### 使用示例

```typescript
// 测试不同值的最小操作码
console.log(asMinimalOP(Buffer.from([])));     // OP_0
console.log(asMinimalOP(Buffer.from([1])));    // OP_1
console.log(asMinimalOP(Buffer.from([16])));   // OP_16
console.log(asMinimalOP(Buffer.from([0x81]))); // OP_1NEGATE
```

## 公钥验证

### 规范公钥检查

```typescript
export function isCanonicalPubKey(buffer: Buffer): boolean {
  return ecc.isPoint(buffer);
}
```

### 使用示例

```typescript
// 验证压缩公钥
const compressedPubkey = Buffer.from('02...', 'hex');
console.log('Is canonical:', isCanonicalPubKey(compressedPubkey));

// 验证未压缩公钥
const uncompressedPubkey = Buffer.from('04...', 'hex');
console.log('Is canonical:', isCanonicalPubKey(uncompressedPubkey));
```

## 脚本编译

### compile函数

```typescript
export function compile(chunks: Uint8Array[]): Buffer {
  // 如果已经是Buffer，直接返回
  if (Buffer.isBuffer(chunks)) return chunks;
  
  // 验证输入类型
  typeforce(typeforce.Array, chunks);

  // 计算总缓冲区大小
  const bufferSize = chunks.reduce((accum, chunk) => {
    // 数据块
    if (Buffer.isBuffer(chunk)) {
      // 遵循BIP62.3最小推送策略
      if (chunk.length === 1 && asMinimalOP(chunk) !== undefined) {
        return accum + 1;
      }
      return accum + pushdata.encodingLength(chunk.length) + chunk.length;
    }
    
    // 操作码
    return accum + 1;
  }, 0.0);

  // 分配缓冲区
  const buffer = Buffer.allocUnsafe(bufferSize);
  let offset = 0;
  
  chunks.forEach((chunk) => {
    // 处理数据块
    if (Buffer.isBuffer(chunk)) {
      // 检查最小操作码
      const opcode = asMinimalOP(chunk);
      if (opcode !== undefined) {
        buffer.writeUInt8(opcode, offset);
        offset += 1;
        return;
      }

      // 编码推送数据
      offset += pushdata.encode(buffer, chunk.length, offset);
      chunk.copy(buffer, offset);
      offset += chunk.length;
    } else {
      // 处理操作码
      buffer.writeUInt8(chunk, offset);
      offset += 1;
    }
  });

  // 验证偏移量
  if (offset !== buffer.length) {
    throw new Error('Could not decode chunks');
  }
  
  return buffer;
}
```

### 使用示例

```typescript
// 编译P2PKH脚本
const pubkeyHash = Buffer.from('1234567890abcdef1234567890abcdef12345678', 'hex');
const p2pkhChunks = [
  OPS.OP_DUP,
  OPS.OP_HASH160,
  pubkeyHash,
  OPS.OP_EQUALVERIFY,
  OPS.OP_CHECKSIG
];

const compiledScript = compile(p2pkhChunks);
console.log('Compiled script:', compiledScript.toString('hex'));
```

## 脚本反编译

### decompile函数

```typescript
export function decompile(buffer: Buffer) {
  // 如果已经是数组，直接返回
  if (typeforce.Array(buffer)) return buffer;
  
  // 验证输入类型
  typeforce(typeforce.Buffer, buffer);

  const chunks = [];
  let i = 0;
  
  while (i < buffer.length) {
    const opcode = buffer[i];

    // 处理数据块
    if (opcode > OPS.OP_0 && opcode <= OPS.OP_PUSHDATA4) {
      const d = pushdata.decode(buffer, i);
      
      if (d === null) return null;

      i += d.size;
      if (i + d.number > buffer.length) return null;

      const data = buffer.slice(i, i + d.number);
      i += d.number;

      // 检查最小操作码
      const op = asMinimalOP(data);
      if (op !== undefined) {
        chunks.push(op);
      } else {
        chunks.push(data);
      }
    } else {
      // 处理操作码
      chunks.push(opcode);
      i += 1;
    }
  }

  return chunks;
}
```

### 使用示例

```typescript
// 反编译脚本
const scriptBuffer = Buffer.from('76a914...88ac', 'hex');
const chunks = decompile(scriptBuffer);

console.log('Decompiled chunks:');
chunks.forEach((chunk, index) => {
  if (Buffer.isBuffer(chunk)) {
    console.log(`${index}: DATA ${chunk.toString('hex')}`);
  } else {
    console.log(`${index}: ${REVERSE_OPS[chunk] || 'UNKNOWN'}`);
  }
});
```

## ASM格式转换

### fromASM函数

```typescript
export function fromASM(asm: string) {
  const separator = ' ';
  typeforce(typeforce.String, asm);
  
  const chunks = asm.split(separator).map((str) => {
    // 操作码
    if (OPS[str] !== undefined) return OPS[str];

    // 十六进制数据
    typeforce(typeforce.Hex, str);
    return Buffer.from(str, 'hex');
  });
  
  return compile(chunks);
}
```

### toASM函数

```typescript
export function toASM(chunks: Uint8Array[]) {
  const separator = ' ';
  
  if (Buffer.isBuffer(chunks)) {
    chunks = decompile(chunks);
  }

  return chunks
    .map((chunk) => {
      if (Buffer.isBuffer(chunk)) {
        const op = asMinimalOP(chunk);
        if (op === undefined) return chunk.toString('hex');
        chunk = op;
      }
      return REVERSE_OPS[chunk];
    })
    .join(separator);
}
```

### 使用示例

```typescript
// ASM转脚本
const asmScript = 'OP_DUP OP_HASH160 1234567890abcdef1234567890abcdef12345678 OP_EQUALVERIFY OP_CHECKSIG';
const scriptBuffer = fromASM(asmScript);
console.log('Script from ASM:', scriptBuffer.toString('hex'));

// 脚本转ASM
const asmString = toASM(scriptBuffer);
console.log('ASM from script:', asmString);
```

## 脚本类型

### 常见脚本模式

```typescript
// P2PKH (Pay to Public Key Hash)
function createP2PKH(pubkeyHash: Buffer) {
  return compile([
    OPS.OP_DUP,
    OPS.OP_HASH160,
    pubkeyHash,
    OPS.OP_EQUALVERIFY,
    OPS.OP_CHECKSIG
  ]);
}

// P2PK (Pay to Public Key)
function createP2PK(pubkey: Buffer) {
  return compile([
    pubkey,
    OPS.OP_CHECKSIG
  ]);
}

// P2SH (Pay to Script Hash)
function createP2SH(scriptHash: Buffer) {
  return compile([
    OPS.OP_HASH160,
    scriptHash,
    OPS.OP_EQUAL
  ]);
}

// 多重签名
function createMultisig(m: number, pubkeys: Buffer[]) {
  const chunks = [OPS.OP_1 + m - 1]; // OP_M
  pubkeys.forEach(pubkey => chunks.push(pubkey));
  chunks.push(OPS.OP_1 + pubkeys.length - 1); // OP_N
  chunks.push(OPS.OP_CHECKMULTISIG);
  
  return compile(chunks);
}
```

## 脚本验证

### 基本验证

```typescript
function validateScript(script: Buffer): boolean {
  try {
    const chunks = decompile(script);
    if (!chunks) return false;
    
    // 检查脚本长度
    if (script.length > 10000) return false; // 最大脚本大小
    
    // 检查操作码数量
    let opCount = 0;
    for (const chunk of chunks) {
      if (!Buffer.isBuffer(chunk) && chunk > OPS.OP_16) {
        opCount++;
        if (opCount > 201) return false; // 最大操作码数量
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}
```

## 最佳实践

1. **BIP62.3遵循**: 使用最小推送策略
2. **脚本大小**: 控制脚本大小在合理范围
3. **操作码限制**: 注意操作码数量限制
4. **错误处理**: 实现完善的错误处理
5. **标准化**: 使用标准脚本模板

## 常见问题

### Q: 什么是最小推送策略？
A: BIP62.3规定，应使用最小的操作码来推送数据，提高效率。

### Q: 脚本执行会失败吗？
A: 是的，脚本可能因为栈下溢、操作码限制等原因失败。

### Q: 如何调试脚本？
A: 使用ASM格式查看脚本内容，逐步分析执行过程。
