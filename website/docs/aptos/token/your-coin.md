# 自定义代币

在Aptos中，你可以创建自己的代币。本文将介绍如何创建、部署和管理自定义代币。

## 代币类型

Aptos支持两种自定义代币：

- **Managed Coin**: 使用Aptos框架管理的代币
- **Custom Coin**: 完全自定义的代币实现

## 创建Managed Coin

### 基本结构

```typescript
import { AptosClient, AptosAccount, TxnBuilderTypes, HexString } from "aptos";

class YourCoinClient extends AptosClient {
  constructor(nodeUrl: string) {
    super(nodeUrl);
  }

  // 注册代币接收者
  async registerCoin(coinTypeAddress: string, coinReceiver: AptosAccount) {
    const rawTxn = await this.generateTransaction(coinReceiver.address(), {
      function: "0x1::managed_coin::register",
      type_arguments: [`${coinTypeAddress}::moon_coin::MoonCoin`],
      arguments: [],
    });

    const bcsTxn = await this.signTransaction(coinReceiver, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);
    return pendingTxn.hash;
  }

  // 铸造代币
  async mintCoin(minter: AptosAccount, receiverAddress: string, amount: number) {
    const rawTxn = await this.generateTransaction(minter.address(), {
      function: "0x1::managed_coin::mint",
      type_arguments: [`${minter.address()}::moon_coin::MoonCoin`],
      arguments: [receiverAddress, amount],
    });

    const bcsTxn = await this.signTransaction(minter, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);
    return pendingTxn.hash;
  }

  // 转账代币
  async transferCoin(coinTypeAddress: string, receiverAddress: string, amount: number, sender: AptosAccount) {
    const rawTxn = await super.generateTransaction(sender.address(), {
      function: "0x1::coin::transfer",
      type_arguments: [`${coinTypeAddress}::moon_coin::MoonCoin`],
      arguments: [receiverAddress, amount],
    });

    const bcsTxn = await this.signTransaction(sender, rawTxn);
    const pendingTxn = await this.submitTransaction(bcsTxn);
    return pendingTxn.hash;
  }

  // 查询代币余额
  async getBalance(accountAddress: string, coinTypeAddress: string): Promise<number> {
    try {
      const resource = await this.getAccountResource(
        accountAddress,
        `0x1::coin::CoinStore<${coinTypeAddress}::moon_coin::MoonCoin>`,
      );
      return parseInt(resource.data.coin.value);
    } catch (e) {
      return 0;
    }
  }
}
```

### 部署代币

```typescript
async function deployMoonCoin() {
  const client = new YourCoinClient(NODE_URL);
  const faucetClient = new FaucetClient(NODE_URL, FAUCET_URL);
  
  // 创建账户
  const alice = new AptosAccount(HexString.ensure('0x8c9d9e1794ea91cb48c31abcfc54166a818aa542b12de08bb991311c2af7743a').toUint8Array());
  const bob = new AptosAccount();
  const carol = new AptosAccount();
  
  // 资助账户
  await faucetClient.fundAccount(alice.address(), 100_000_000);
  
  // 发布MoonCoin模块
  const packageMetadata = '0x084578616d706c657301000000000000000040443730304142343038324344334339424446413644373936313042423535444242384245373437373336463438463145323838414144323339383143423039418a011f8b08000000000002ff3d8c410a02310c45f73945e9de8e177021a23b4f300c12da28653a49694405f1ee368243b2f9ff3dfe5831ce78a3091817723be78f2f5c6a21f5f0a0a659d8ca6de8e701464ca9912ae90467113e48fef18bb144953811c76c785fefa2a7d6579fd2e62ebd5d9188c5f41086fed73f1cd0dccd9abdfbc017478da0ef9900000001096d6f6f6e5f636f696ebb011f8b08000000000002ff6550c10e82300cbdef2b26070389c96e1e2ae1e259f90432a19045e8cc366222e1dfdda662d09e5e5f5fdf6b2a046ca018b42636e866ec919f3c3e6a450081ad6a0ff9c4b82febcc58bb45c0a79945be1d892b52ae7a39a416a941037c6b5547682f77a287973da56ad9103deb5b9fa0c49b2c326c6000417257bf5c0fc9352a4cb72bc217aef56dc2509621ed4c9dfa42ccf3fe47eddb6b2b7f8a5b24384339b9910b97f4efccd138065fd5b2701000000000300000000000000000000000000000000000000000000000000000000000000010e4170746f734672616d65776f726b0000000000000000000000000000000000000000000000000000000000000000010b4170746f735374646c696200000000000000000000000000000000000000000000000000000000000000010a4d6f76655374646c696200';
  const moduleData = '0xa11ceb0b050000000a01000402040403080b04130205151007254308684006a801150abd01050cc2011200000101000200000003000100010503010100010201060c0001080005060c0a020a020201096d6f6f6e5f636f696e0c6d616e616765645f636f696e084d6f6f6e436f696e0b696e69745f6d6f64756c650b64756d6d795f6669656c640a696e697469616c697a65dd7862a1d347806c9470ba6e4d13b91b60ba5539a00065090ce8bbc24c4dd37a00000000000000000000000000000000000000000000000000000000000000010a020a094d6f6f6e20436f696e0a0205044d4f4f4e00020104010000000001070b000700070131060938000200';
  
  console.log("发布MoonCoin包...");
  const txnHash = await client.publishPackage(
    alice, 
    HexString.ensure(packageMetadata).toUint8Array(), 
    [new TxnBuilderTypes.Module(HexString.ensure(moduleData).toUint8Array())]
  );
  
  await client.waitForTransaction(txnHash, { checkSuccess: true });
  console.log("MoonCoin发布完成，交易哈希:", txnHash);
  
  return txnHash;
}
```

## 代币操作

### 注册代币

```typescript
async function registerAndMint() {
  const client = new YourCoinClient(NODE_URL);
  
  // 注册Bob接收MoonCoin
  const registerHash = await client.registerCoin(
    alice.address().hex(), 
    bob
  );
  await client.waitForTransaction(registerHash);
  console.log("Bob已注册MoonCoin");
  
  // 铸造代币给Bob
  const mintHash = await client.mintCoin(
    alice, 
    bob.address().hex(), 
    1000
  );
  await client.waitForTransaction(mintHash);
  console.log("已铸造1000 MoonCoin给Bob");
  
  // 检查余额
  const balance = await client.getBalance(
    bob.address().hex(), 
    alice.address().hex()
  );
  console.log("Bob的MoonCoin余额:", balance);
}
```

### 代币转账

```typescript
async function transferMoonCoin() {
  const client = new YourCoinClient(NODE_URL);
  
  // Bob转账给Carol
  const transferHash = await client.transferCoin(
    alice.address().hex(),
    carol.address().hex(),
    500,
    bob
  );
  await client.waitForTransaction(transferHash);
  console.log("Bob已转账500 MoonCoin给Carol");
  
  // 检查余额
  const bobBalance = await client.getBalance(bob.address().hex(), alice.address().hex());
  const carolBalance = await client.getBalance(carol.address().hex(), alice.address().hex());
  
  console.log("Bob余额:", bobBalance);
  console.log("Carol余额:", carolBalance);
}
```

## 完整示例

```typescript
async function moonCoinExample() {
  try {
    // 1. 部署MoonCoin
    console.log("=== 部署MoonCoin ===");
    await deployMoonCoin();
    
    // 2. 注册和铸造
    console.log("\n=== 注册和铸造 ===");
    await registerAndMint();
    
    // 3. 转账
    console.log("\n=== 代币转账 ===");
    await transferMoonCoin();
    
    console.log("\n✅ MoonCoin示例完成！");
  } catch (error) {
    console.error("❌ 错误:", error);
  }
}

// 运行示例
moonCoinExample().catch(console.error);
```

## 最佳实践

1. **测试环境**: 先在开发网测试代币功能
2. **错误处理**: 实现适当的错误处理机制
3. **Gas估算**: 合理设置gas限制
4. **权限控制**: 控制代币铸造权限
5. **事件监听**: 监听代币相关事件

## 常见问题

### Q: 如何销毁代币？
A: 使用`burn`函数销毁代币，需要适当的权限。

### Q: 代币可以无限铸造吗？
A: 取决于代币实现，可以设置最大供应量限制。

### Q: 如何实现代币冻结？
A: 在代币合约中添加冻结逻辑和权限控制。