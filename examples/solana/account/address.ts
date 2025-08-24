import assert from 'node:assert';
import { Keypair } from '@solana/web3.js';
import { toBase58 } from '@sola-hq/toolkit';
import nacl from 'tweetnacl';

import * as bip39 from 'bip39';
import { HDKey } from 'micro-ed25519-hdkey';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

/**
 * @param mnemonic - The mnemonic phrase to derive the keypair from.
 * @param password - The password to use for the mnemonic.
 * @param index - The index to use for the derivation path.
 * @returns The derived keypair.
 */
function mnemonicToKeypair(mnemonic: string, password: string = '', index: number = 0) {
  const seed = bip39.mnemonicToSeedSync(mnemonic, password);
  const hd = HDKey.fromMasterSeed(seed.toString('hex'));
  const path = `m/44'/501'/${index}'/0'`;
  const derivedSeed = hd.derive(path).privateKey;
  return Keypair.fromSeed(derivedSeed);
}

/**
 * @returns The generated keypair.
 */
function generateRandomKeypair() {
  // 生成新的随机密钥对
  const keypair = Keypair.generate();
  console.log('Public Key:', keypair.publicKey.toBase58());
  console.log('Secret Key:', toBase58(keypair.secretKey));
  console.log('Address   :', keypair.publicKey.toBase58());
  return keypair;
}

function main() {
  const mnemonic = process.env.MNEMONIC;
  const message = hexToBytes('8001000102');
  const keypair = mnemonicToKeypair(mnemonic);

  console.log('keypair publicKey : ', keypair.publicKey.toBase58());
  console.log('keypair secretKey : ', toBase58(keypair.secretKey));
  console.log('address 					 : ', keypair.publicKey.toBase58());
  const signature = nacl.sign.detached(message, keypair.secretKey);
  assert.strict(nacl.sign.detached.verify(message, signature, keypair.publicKey.toBuffer()), 'tweetnacl ed25519 signature verify failed');
  console.log('signature : ', bytesToHex(signature));
  console.log('bs58      : ', toBase58(signature));
}

main();
