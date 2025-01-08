import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { createJupiterApiClient } from '@jup-ag/api';
import bs58 from 'bs58';
import 'dotenv/config';

import { deserializeInstruction, getAddressLookupTableAccounts } from './instruction';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mint address

async function main() {
  const url = process.env.SOLANA_RPC_URL;
  const connection = new Connection(url, 'confirmed');
  const keypair = Keypair.fromSecretKey(bs58.decode(process.env.SOL_SECRET_KEY));
  console.log('userPublicKey : ', keypair.publicKey.toBase58());
  console.log('0.001 SOL : ', 0.001 * LAMPORTS_PER_SOL);
  const client = createJupiterApiClient();
  const quoteResponse = await client.quoteGet({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: 0.001 * LAMPORTS_PER_SOL,

    // platformFeeBps: The platform fee to be added (1 basis points)
    // platformFeeBps: 1,
    onlyDirectRoutes: true,
    maxAccounts: 20,
    autoSlippage: true,
  });

  console.log('quoteResponse : ', quoteResponse);

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

  const addressLookupTableAccounts: AddressLookupTableAccount[] = [];
  addressLookupTableAccounts.push(...(await getAddressLookupTableAccounts(connection, addressLookupTableAddresses)));

  const { blockhash } = await connection.getLatestBlockhash();
  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions.map(deserializeInstruction),
    deserializeInstruction(swapInstructionPayload),
    deserializeInstruction(cleanupInstruction),
  ];
  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(addressLookupTableAccounts);
  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([keypair]);

  const raw = transaction.serialize();
  const txid = await connection.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  console.log('txid : ', txid);
}

main();
