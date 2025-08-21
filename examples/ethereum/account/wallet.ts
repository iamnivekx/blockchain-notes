import { ethers } from 'ethers';

// https://docs.ethers.org/v5/api/signer/#Wallet
async function main() {
	const wallet = ethers.Wallet.createRandom();
	console.log('address     : ', await wallet.getAddress());
	console.log('public	 key : ', wallet.publicKey);
	console.log('compressed  : ', ethers.utils.computePublicKey(wallet.publicKey, true));
	console.log('private key : ', wallet.privateKey);
}

main().catch(console.error);

