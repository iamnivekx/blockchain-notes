import { AptosClient, AptosAccount, HexString, BCS, TransactionBuilder, TransactionBuilderABI, TxnBuilderTypes } from 'aptos';
import nacl from 'tweetnacl';
import assert from 'assert';

const aptosCoin = '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>';

const NODE_URL = 'https://fullnode.testnet.aptoslabs.com';
const client = new AptosClient(NODE_URL);

const COIN_ABIS = [
	"01087472616E73666572000000000000000000000000000000000000000000000000000000000000000104636F696E3C205472616E73666572732060616D6F756E7460206F6620636F696E732060436F696E54797065602066726F6D206066726F6D6020746F2060746F602E0109636F696E5F747970650202746F0406616D6F756E7402"
];

function walletAccount(privKey) {
	const privKeyHexStr = new HexString(privKey);
	const account = new AptosAccount(privKeyHexStr.toUint8Array());
	const address = account.address();
	const privateKeyObject = account.toPrivateKeyObject();
	console.log('address			: ', address);
	console.log('privateKeyObject	: ', privateKeyObject);
	return account;
}

async function getAccountResources(address) {
	const resources = await client.getAccountResources(address);
	const accountResource = resources.find((r) => r.type === aptosCoin);
	console.log('resources 		 : ', resources);
	console.log('accountResource : ', accountResource);
	console.log(`address coins	 : ${accountResource?.data?.coin?.value}.`);
}

async function getReqPayload(address, expiration_timestamp_secs = 1672531204n) {
	const chainId = await client.getChainId();
	const { sequence_number } = await client.getAccount(address);
	const { gas_estimate } = await client.estimateGasPrice()
	// const max_gas_amount = await client.estimateMaxGasAmount(address)
	const payload = {
		sequence_number,
		gas_unit_price: gas_estimate,
		// max_gas_amount,
		expiration_timestamp_secs,
		chain_id: chainId,
	}
	return payload
}

async function main() {
	const expiration_timestamp_secs = 1672531204n;
	// sender account
	let senderAddress, senderAccount, receiverAddress;

	{
		var privateKeyHex = '0x4cd1fff838717a1a175df49a502107f0377476a79d256ecd696121f72226a61c';
		const account = walletAccount(privateKeyHex);
		senderAccount = account;
		senderAddress = account.address();
		await getAccountResources(senderAddress);
	}
	// receiver account
	{
		var privateKeyHex = '0xea10a580a56a5cb656c99e99e96eb97a3d9893e63d625e4749f46b92f5380777';
		const account = walletAccount(privateKeyHex);
		receiverAddress = account.address();
		await getAccountResources(receiverAddress);
	}
	const payload = {
		type: 'entry_function_payload',
		function: '0x1::coin::transfer',
		type_arguments: ['0x1::aptos_coin::AptosCoin'],
		arguments: [receiverAddress.hex(), 717],
	};
	const config = await getReqPayload(senderAddress);
	console.log('config : ', config);

	// steps 1-3
	const rawTxn = await client.generateTransaction(senderAddress, payload, config);
	console.log('rawTxn : ', rawTxn);
	{
		const transactionBuilder = new TransactionBuilderABI(COIN_ABIS.map((abi) => new HexString(abi).toUint8Array()));
		// const transactionBuilder = new TransactionBuilderRemoteABI(aptos);
		const payload = transactionBuilder.buildTransactionPayload(
			"0x1::coin::transfer",
			['0x1::aptos_coin::AptosCoin'],
			[receiverAddress.hex(), 717],
		);
		const payloadBytes = BCS.bcsToBytes(payload);
		console.log("payload : ", HexString.fromUint8Array(payloadBytes).hex());

		const builderConfig = {
			sender: senderAddress,
			chainId: config.chain_id,
			sequenceNumber: config.sequence_number,
			gasUnitPrice: config.gas_unit_price,
			expirationTimestampSecs: config.expiration_timestamp_secs,
			maxGasAmount: 20000n,
		};
		// const rawTx = await client.generateRawTransaction(senderAddress, payload, extraArgs);
		const rawTxn = new TxnBuilderTypes.RawTransaction(
			TxnBuilderTypes.AccountAddress.fromHex(senderAddress),
			BigInt(builderConfig.sequenceNumber),
			payload,
			BigInt(builderConfig.maxGasAmount || 20000n),
			BigInt(builderConfig.gasUnitPrice),
			BigInt(builderConfig.expirationTimestampSecs),
			new TxnBuilderTypes.ChainId(builderConfig.chainId),
		);

		const signingMsg = TransactionBuilder.getSigningMessage(rawTxn);
		const signedMsg = nacl.sign(signingMsg, senderAccount.signingKey.secretKey);
		const signedMsgHexStr = HexString.fromUint8Array(signedMsg.slice(0, 64))

		const signature = new TxnBuilderTypes.Ed25519Signature(signedMsgHexStr.toUint8Array());
		const authenticator = new TxnBuilderTypes.AccountAuthenticatorEd25519(
			new TxnBuilderTypes.Ed25519PublicKey(senderAccount.pubKey().toUint8Array()),
			signature,
		);
		const signedTxn = new TxnBuilderTypes.SignedTransaction(rawTxn, authenticator);
		const bscSignedTxn = BCS.bcsToBytes(signedTxn);

		const bcsData = BCS.bcsToBytes(signedTxn);
		const deserializer = new BCS.Deserializer(bcsData);
		const tx = TxnBuilderTypes.UserTransaction.load(deserializer);
		const pubKey = new TxnBuilderTypes.Ed25519PublicKey(senderAccount.pubKey().toUint8Array());
		const result = await client.simulateTransaction(pubKey, rawTxn);
		console.log('result : ', result);
		console.log('rawTxn : ', HexString.fromUint8Array(BCS.bcsToBytes(rawTxn)).hex());
		console.log('bscSignedTxn: ', HexString.fromUint8Array(bscSignedTxn).hex());
		console.log('tx hash: ', HexString.fromUint8Array(tx.hash()).hex());

		const transactionRes = await client.submitTransaction(bscSignedTxn);
		console.log('signingMsg  : ', HexString.fromUint8Array(signingMsg).hex());
		console.log('signedMsg   : ', signedMsgHexStr.hex());
		console.log('bscSignedTxn: ', HexString.fromUint8Array(bscSignedTxn).hex());
		console.log('txHash	 	 : ', transactionRes.hash);
	}

	const serializer = new BCS.Serializer();
	rawTxn.expiration_timestamp_secs = config.expiration_timestamp_secs;
	rawTxn.serialize(serializer);
	const rawTxnSerialized = HexString.fromUint8Array(serializer.getBytes()).hex();
	console.log('[step] rawTxn 			: ', rawTxn);
	assert.strictEqual(
		rawTxnSerialized,
		'0x76ee354c4354ae46f741bdf5cdf8987d6e3dc8dfbe62b10a0b7f2de27898bdaf070000000000000002000000000000000000000000000000000000000000000000000000000000000104636f696e087472616e73666572010700000000000000000000000000000000000000000000000000000000000000010a6170746f735f636f696e094170746f73436f696e000220689b4250f7d1c3784c5fb947fc9f15fd8e1842b4425976d8a44e4221150b1f7908cd02000000000000204e000000000000640000000000000004cdb0630000000021',
		'rawTxnSerialized should be equal',
	);

	console.log('[step] rawTxnSerialized 	: ', rawTxnSerialized);
	const signedTxn = await client.signTransaction(senderAccount, rawTxn);

	const signingMessage = TransactionBuilder.getSigningMessage(rawTxn);
	const sigHexStr = senderAccount.signBuffer(signingMessage);
	console.log('[step] signing hex : ', sigHexStr.hex());

	{
		const signedMsg = nacl.sign(signingMessage, senderAccount.signingKey.secretKey);
		const signedMsgHexStr = HexString.fromUint8Array(signedMsg.slice(0, 64))
		console.log('[step] signingMessage : ', HexString.fromUint8Array(signingMessage).hex());
		console.log('[step] signingHex     : ', signedMsgHexStr.hex());
		assert.strictEqual(signedMsgHexStr.hex(), sigHexStr.hex(), 'sigHexStr should be equal');
	}

	const bscSignedTxn = AptosClient.generateBCSTransaction(senderAddress, rawTxn);
	assert.strictEqual(
		HexString.fromUint8Array(signedTxn).hex(),
		HexString.fromUint8Array(bscSignedTxn).hex(),
		'signedTxn should be equal',
	);

	{
		const signature = new TxnBuilderTypes.Ed25519Signature(sigHexStr.toUint8Array());
		const authenticator = new TxnBuilderTypes.AccountAuthenticatorEd25519(
			new TxnBuilderTypes.Ed25519PublicKey(senderAddress.pubKey().toUint8Array()),
			signature,
		);
		const signedTransaction = new TxnBuilderTypes.SignedTransaction(rawTxn, authenticator);
		const signedTransactionSerialized = BCS.bcsToBytes(signedTransaction);
		assert.strictEqual(
			HexString.fromUint8Array(signedTransactionSerialized).hex(),
			HexString.fromUint8Array(bscSignedTxn).hex(),
			'signedTransactionSerialized should be equal',
		);
	}
	const result = await client.submitBCSSimulation(signedTxn);
	console.log('result : ', result);
	console.log('[step] signedTxn	 Hex 	: ', HexString.fromUint8Array(signedTxn).hex());

	const transactionRes = await client.submitTransaction(signedTxn);
	await client.waitForTransaction(transactionRes.hash);

	await getAccountResources(receiverAddress);
}

main().catch(console.error);
