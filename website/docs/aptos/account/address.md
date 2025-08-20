# 地址管理

在Aptos中，地址是账户的唯一标识符，用于接收代币、NFT和调用智能合约。理解地址的生成和验证对于开发安全的应用程序至关重要。

## 地址格式

Aptos地址使用以下格式：

- **长度**: 32字节（64个十六进制字符）
- **前缀**: 0x（可选）
- **字符集**: 0-9, a-f
- **示例**: `0xdd7862a1d347806c9470ba6e4d13b91b60ba5539a00065090ce8bbc24c4dd37a`

## 地址生成

### 从公钥生成地址

```typescript
import { sha3_256 } from '@noble/hashes/sha3';
import { HexString } from "aptos";

function generateAddressFromPublicKey(publicKey: Uint8Array): HexString {
  // 1. 创建SHA3-256哈希实例
  const hash = sha3_256.create();
  
  // 2. 添加公钥数据
  hash.update(publicKey);
  
  // 3. 添加空字节分隔符
  hash.update("\0");
  
  // 4. 生成哈希并转换为地址
  const digest = hash.digest();
  return HexString.fromUint8Array(digest);
}

// 使用示例
const publicKey = new HexString('0xacdf5b6a88282858e157589119ea965cdeedab5f062ee3fb252b65cb15f7cbe9').toUint8Array();
const address = generateAddressFromPublicKey(publicKey);
console.log('Generated Address:', address.hex());
```

### 从认证密钥生成地址

```typescript
import { TxnBuilderTypes } from "aptos";

function generateAddressFromAuthKey(authKey: Uint8Array): HexString {
  // 认证密钥本身就是地址
  return HexString.fromUint8Array(authKey);
}

// 使用示例
const authKey = new HexString('0xdd7862a1d347806c9470ba6e4d13b91b60ba5539a00065090ce8bbc24c4dd37a').toUint8Array();
const address = generateAddressFromAuthKey(authKey);
console.log('Address from Auth Key:', address.hex());
```

## 地址验证

### 基本格式验证

```typescript
function isValidAptosAddress(address: string): boolean {
  // 移除0x前缀
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  
  // 检查长度（64个十六进制字符）
  if (cleanAddress.length !== 64) {
    return false;
  }
  
  // 检查是否只包含十六进制字符
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(cleanAddress);
}

// 测试地址
const testAddresses = [
  '0xdd7862a1d347806c9470ba6e4d13b91b60ba5539a00065090ce8bbc24c4dd37a',
  'dd7862a1d347806c9470ba6e4d13b91b60ba5539a00065090ce8bbc24c4dd37a',
  '0xinvalid',
  'short',
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
];

testAddresses.forEach(addr => {
  console.log(`${addr}: ${isValidAptosAddress(addr)}`);
});
```

### 高级验证

```typescript
function validateAptosAddress(address: string): {
  isValid: boolean;
  error?: string;
  normalizedAddress: string;
} {
  try {
    // 基本格式检查
    if (!isValidAptosAddress(address)) {
      return {
        isValid: false,
        error: 'Invalid address format',
        normalizedAddress: ''
      };
    }
    
    // 标准化地址（添加0x前缀）
    const normalizedAddress = address.startsWith('0x') ? address : `0x${address}`;
    
    // 尝试创建HexString对象
    new HexString(normalizedAddress);
    
    return {
      isValid: true,
      normalizedAddress
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      normalizedAddress: ''
    };
  }
}
```

## 地址转换

### 不同格式之间的转换

```typescript
class AddressConverter {
  // 添加0x前缀
  static addPrefix(address: string): string {
    return address.startsWith('0x') ? address : `0x${address}`;
  }
  
  // 移除0x前缀
  static removePrefix(address: string): string {
    return address.startsWith('0x') ? address.slice(2) : address;
  }
  
  // 转换为字节数组
  static toBytes(address: string): Uint8Array {
    const cleanAddress = this.removePrefix(address);
    return new HexString(cleanAddress).toUint8Array();
  }
  
  // 从字节数组转换
  static fromBytes(bytes: Uint8Array): string {
    return HexString.fromUint8Array(bytes).hex();
  }
  
  // 转换为大写
  static toUpperCase(address: string): string {
    return this.removePrefix(address).toUpperCase();
  }
  
  // 转换为小写
  static toLowerCase(address: string): string {
    return this.removePrefix(address).toLowerCase();
  }
}

// 使用示例
const address = '0xdd7862a1d347806c9470ba6e4d13b91b60ba5539a00065090ce8bbc24c4dd37a';

console.log('With Prefix:', AddressConverter.addPrefix(address));
console.log('Without Prefix:', AddressConverter.removePrefix(address));
console.log('To Bytes:', AddressConverter.toBytes(address));
console.log('To Upper:', AddressConverter.toUpperCase(address));
console.log('To Lower:', AddressConverter.toLowerCase(address));
```

## 地址派生

### 从多重签名公钥派生地址

```typescript
import { TxnBuilderTypes } from "aptos";

function deriveMultisigAddress(
  publicKeys: Uint8Array[], 
  threshold: number
): HexString {
  // 创建多重签名公钥
  const multiSigPublicKey = new TxnBuilderTypes.MultiEd25519PublicKey(
    publicKeys.map(pubKey => new TxnBuilderTypes.Ed25519PublicKey(pubKey)),
    threshold
  );
  
  // 从多重签名公钥生成认证密钥
  const authKey = TxnBuilderTypes.AuthenticationKey.fromMultiEd25519PublicKey(
    multiSigPublicKey
  );
  
  // 派生地址
  return authKey.derivedAddress();
}

// 使用示例
const publicKey1 = new HexString('0xacdf5b6a88282858e157589119ea965cdeedab5f062ee3fb252b65cb15f7cbe9').toUint8Array();
const publicKey2 = new HexString('0x37072fb5c8c60c7a231e6d02ca8f87e20498d03d5df0a728fb4ecf5bdf620b42').toUint8Array();
const publicKey3 = new HexString('0x80788bafb59eecd31aeb869f3934916dee373b458d12fb71de1e629e5633c16d').toUint8Array();

const multisigAddress = deriveMultisigAddress([publicKey1, publicKey2, publicKey3], 2);
console.log('Multisig Address:', multisigAddress.hex());
```

## 地址比较

### 安全比较

```typescript
function addressesEqual(address1: string, address2: string): boolean {
  try {
    const normalized1 = AddressConverter.addPrefix(address1).toLowerCase();
    const normalized2 = AddressConverter.addPrefix(address2).toLowerCase();
    return normalized1 === normalized2;
  } catch {
    return false;
  }
}

// 使用示例
const addr1 = '0xDD7862A1D347806C9470BA6E4D13B91B60BA5539A00065090CE8BBC24C4DD37A';
const addr2 = '0xdd7862a1d347806c9470ba6e4d13b91b60ba5539a00065090ce8bbc24c4dd37a';

console.log('Addresses Equal:', addressesEqual(addr1, addr2)); // true
```

## 批量地址处理

### 地址列表验证

```typescript
function validateAddressList(addresses: string[]): {
  valid: string[];
  invalid: { address: string; error: string }[];
} {
  const valid: string[] = [];
  const invalid: { address: string; error: string }[] = [];
  
  addresses.forEach(address => {
    const validation = validateAptosAddress(address);
    if (validation.isValid) {
      valid.push(validation.normalizedAddress);
    } else {
      invalid.push({
        address,
        error: validation.error || 'Unknown error'
      });
    }
  });
  
  return { valid, invalid };
}

// 使用示例
const addressList = [
  '0xdd7862a1d347806c9470ba6e4d13b91b60ba5539a00065090ce8bbc24c4dd37a',
  '0xinvalid',
  '0x37072fb5c8c60c7a231e6d02ca8f87e20498d03d5df0a728fb4ecf5bdf620b42',
  'short'
];

const result = validateAddressList(addressList);
console.log('Valid Addresses:', result.valid);
console.log('Invalid Addresses:', result.invalid);
```

## 完整示例

```typescript
import { AptosAccount, HexString } from "aptos";
import { sha3_256 } from '@noble/hashes/sha3';

async function addressManagementExample() {
  // 1. 创建账户并获取地址
  const account = new AptosAccount();
  const address = account.address();
  console.log('Account Address:', address.hex());
  
  // 2. 验证地址格式
  const isValid = isValidAptosAddress(address.hex());
  console.log('Address Valid:', isValid);
  
  // 3. 从公钥重新生成地址
  const publicKey = account.signingKey.publicKey;
  const regeneratedAddress = generateAddressFromPublicKey(publicKey);
  console.log('Regenerated Address:', regeneratedAddress.hex());
  
  // 4. 验证地址匹配
  const addressesMatch = address.hex() === regeneratedAddress.hex();
  console.log('Addresses Match:', addressesMatch);
  
  // 5. 地址格式转换
  const withoutPrefix = AddressConverter.removePrefix(address.hex());
  const withPrefix = AddressConverter.addPrefix(withoutPrefix);
  console.log('Format Conversion:', {
    original: address.hex(),
    withoutPrefix,
    withPrefix
  });
  
  // 6. 批量地址验证
  const testAddresses = [
    address.hex(),
    '0xinvalid',
    regeneratedAddress.hex()
  ];
  
  const validationResult = validateAddressList(testAddresses);
  console.log('Batch Validation:', validationResult);
}

// 运行示例
addressManagementExample().catch(console.error);
```

## 最佳实践

1. **地址验证**: 始终验证用户输入的地址格式
2. **大小写处理**: 使用一致的地址大小写格式
3. **错误处理**: 实现适当的错误处理和用户反馈
4. **地址标准化**: 在存储和比较时使用标准化格式
5. **安全比较**: 使用安全的字符串比较方法

## 常见问题

### Q: 为什么地址以0x开头？
A: 0x前缀表示十六进制格式，Aptos地址是32字节的十六进制字符串。

### Q: 地址可以重复使用吗？
A: 每个私钥对应唯一的地址，地址不会重复。

### Q: 如何检查地址是否存在于区块链上？
A: 使用AptosClient查询账户信息，如果返回错误说明地址不存在。

### Q: 地址区分大小写吗？
A: 地址本身不区分大小写，但建议使用一致的格式。
