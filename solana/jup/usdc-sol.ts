import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { createJupiterApiClient } from '@jup-ag/api';
import bs58 from 'bs58';
import Decimal from 'decimal.js';
import 'dotenv/config';

import { deserializeInstruction, getAddressLookupTableAccounts } from './instruction';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mint address
const feePubkey = new PublicKey('EGByCQVcZ9Cq164rEHjprSDykHFymTM93b48bom2DiB2');

async function main() {
  const url = process.env.SOLANA_RPC_URL;
  const connection = new Connection(url, 'confirmed');
  const keypair = Keypair.fromSecretKey(bs58.decode(process.env.SOL_SECRET_KEY));
  console.log('userPublicKey : ', keypair.publicKey.toBase58());
  const amount = 0.1 * 10 ** 6;
  const userPublicKey = keypair.publicKey;
  // const amount = new Decimal(AMOUNT).mul(new Decimal(0.99)).toNumber();

  const client = createJupiterApiClient();
  const quoteResponse = await client.quoteGet({
    inputMint: USDC_MINT,
    outputMint: SOL_MINT,
    amount,
    onlyDirectRoutes: true,
    maxAccounts: 20,
    autoSlippage: true,
  });
  const fee = new Decimal(quoteResponse.outAmount).mul(0.01).toFixed(0);

  const feeInstruction = SystemProgram.transfer({
    fromPubkey: userPublicKey,
    toPubkey: new PublicKey(feePubkey),
    lamports: BigInt(fee),
  });
  const swapInstructionsResponse = await client.swapInstructionsPost({
    swapRequest: {
      // feeAccount, // Use actual key
      userPublicKey: keypair.publicKey.toBase58(),
      quoteResponse: quoteResponse,
    },
  });

  const {
    tokenLedgerInstruction, // If you are using `useTokenLedger = true`.
    computeBudgetInstructions, // The necessary instructions to setup the compute budget.
    setupInstructions, // Setup missing ATA for the users.
    swapInstruction: swapInstructionPayload, // The actual swap instruction.
    cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
    addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
  } = swapInstructionsResponse;
  console.log('tokenLedgerInstruction : ', tokenLedgerInstruction);
  const addressLookupTableAccounts: AddressLookupTableAccount[] = [];
  addressLookupTableAccounts.push(...(await getAddressLookupTableAccounts(connection, addressLookupTableAddresses)));

  const { blockhash } = await connection.getLatestBlockhash();
  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions.map(deserializeInstruction),
    deserializeInstruction(swapInstructionPayload),
    deserializeInstruction(cleanupInstruction),
    feeInstruction,
  ];
  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(addressLookupTableAccounts);
  const transactionV0 = new VersionedTransaction(messageV0);
  transactionV0.sign([keypair]);

  const raw = transactionV0.serialize();
  const txid = await connection.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  console.log('txid : ', txid);
}

main();
