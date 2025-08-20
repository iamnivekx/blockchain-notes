import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import 'dotenv/config';

function main() {
  const secretKey = process.env.SOL_SECRET_KEY!;
  if (!secretKey) {
    throw new Error('SOL_SECRET_KEY is not set');
  }
  const keypair = Keypair.fromSecretKey(bs58.decode(secretKey));
  const message = hexToBytes('hello world');
  const signature = nacl.sign.detached(message, keypair.secretKey);
  console.log('signature : ', bytesToHex(signature));
  console.log('bs58      : ', bs58.encode(signature));
}

main();
