import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { randomUUID, randomInt } from 'node:crypto';
import { createJupiterApiClient, DefaultApi } from '@jup-ag/api';
import { JitoJsonRpcClient } from 'jito-js-rpc';
import bs58 from 'bs58';
import 'dotenv/config';

import { deserializeInstruction, getAddressLookupTableAccounts } from './instruction';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mint address

/**
 * https://station.jup.ag/api-v6/post-swap-instructions
 * @param connection: Connection
 * @param jupiter: jupiter api client
 * @param keypair: Keypair
 * @param amount: number
 * @returns
 */
async function swapWithJito(connection: Connection, jupiter: DefaultApi, keypair: Keypair, amount: number, jitoTipLamports: number) {
  console.log('userPublicKey  : ', keypair.publicKey.toBase58());
  console.log('amount         : ', amount);
  console.log('jitoTipLamports: ', jitoTipLamports);
  const quoteResponse = await getQuote(jupiter, amount);

  const swapInstructionsResponse = await jupiter.swapPost({
    swapRequest: {
      // feeAccount, // Use actual key
      userPublicKey: keypair.publicKey.toBase58(),
      quoteResponse: quoteResponse,
      // custom priority fee
      prioritizationFeeLamports: { jitoTipLamports }, // or custom lamports: 1000
    },
  });
  console.log('swapInstructionsResponse : ', swapInstructionsResponse);
  const serializedTransaction = Buffer.from(swapInstructionsResponse.swapTransaction, 'base64');
  var transaction = VersionedTransaction.deserialize(serializedTransaction);
  console.log(transaction);

  // sign the transaction
  transaction.sign([keypair]);

  // Execute the transaction
  const rawTransaction = transaction.serialize();
  // const { result: txid, error } = await jito.sendTxn([bs58.encode(rawTransaction)], false);
  const txid = await sendTxnToJito(connection, rawTransaction);

  console.log('Transaction send result:', txid);
  console.log('txid : ', txid);
  await confirmTransaction(connection, txid);
}

async function swapTransactionWithJito(
  connection: Connection,
  jupiter: DefaultApi,
  keypair: Keypair,
  amount: number,
  jitoTipAccount: PublicKey,
  jitoTipLamports: number,
) {
  console.log('userPublicKey  : ', keypair.publicKey.toBase58());
  console.log('amount         : ', amount);
  console.log('jitoTipLamports: ', jitoTipLamports);
  const quoteResponse = await getQuote(jupiter, amount);

  const swapInstructionsResponse = await jupiter.swapInstructionsPost({
    swapRequest: {
      // feeAccount, // Use actual key
      userPublicKey: keypair.publicKey.toBase58(),
      quoteResponse: quoteResponse,
      // custom priority fee
      prioritizationFeeLamports: { jitoTipLamports }, // or custom lamports: 1000
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
    createTipTransaction(keypair.publicKey, jitoTipAccount, jitoTipLamports),
  ];
  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(addressLookupTableAccounts);
  const transaction = new VersionedTransaction(messageV0);
  transaction.sign([keypair]);

  // Execute the transaction
  const rawTransaction = transaction.serialize();
  console.log('rawTransaction : ', rawTransaction);
  const txid = await sendTxnToJito(connection, rawTransaction);

  console.log('Transaction send result:', txid);
  console.log('txid : ', txid);
  await confirmTransaction(connection, txid);
}

/**
 * https://station.jup.ag/api-v6/quote
 * @param client: jupiter api client
 * @param amount: number
 * @returns QuoteResponse
 */
async function getQuote(client: DefaultApi, amount: number) {
  const quoteResponse = await client.quoteGet({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount,
    // platformFeeBps: The platform fee to be added (1 basis points)
    // platformFeeBps: 1,
    onlyDirectRoutes: true,
    maxAccounts: 20,
    autoSlippage: true,
  });
  return quoteResponse;
}

function createTipTransaction(userPublicKey: PublicKey, jitoTipAccount: PublicKey, jitoTipLamports: number): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey: userPublicKey,
    toPubkey: new PublicKey(jitoTipAccount),
    lamports: jitoTipLamports,
  });
}

async function sendToJito(raw: Uint8Array) {
  const jitoClient = new JitoJsonRpcClient('https://mainnet.block-engine.jito.wtf/api/v1', randomUUID());
  const { result: txid, error } = await jitoClient.sendTxn([bs58.encode(raw)], false);
  if (error) throw new Error(`Simulation failed: ${error}`);
  return txid;
}

/**
 * https://www.quicknode.com/docs/solana/sendTransaction
 * Please note that this RPC method requires the Lil' JIT - JITO Bundles and transactions add-on enabled on your QuickNode endpoint.
 * you could use the jito public api to send transaction
 * ```ts
 * const { result: txid, error } = await jitoClient.sendTxn([bs58.encode(raw)], false);
 * if (error) throw new Error(`Send transaction failed: ${error}`);
 * return txid;
 * ```
 * @param raw: Uint8Array
 * @returns TransactionSignature
 */

async function sendTxnToJito(conn: Connection, raw: Uint8Array) {
  //@ts-ignore can use _rpcRequest
  const request = {
    method: 'sendTransaction',
    params: [bs58.encode(raw)],
  };

  //@ts-ignore can use _rpcRequest
  const { result: txid, error } = await conn._rpcRequest(request.method, request.params);
  if (error) throw new Error(`Send transaction failed: ${JSON.stringify(error)}`);
  return txid;
}

/**
 * https://www.quicknode.com/docs/solana/getTipAccounts
 * Please note that this RPC method requires the Lil' JIT - JITO Bundles and transactions add-on enabled on your QuickNode endpoint.
 * you could use the jito public api to get the tip accounts
 * ```ts
 * const randomTipAccount = await jitoClient.getRandomTipAccount();
 * ```
 * @param conn: Connection
 * @returns PublicKey
 */
async function getTipAccount(conn: Connection) {
  const request = {
    method: 'getTipAccounts',
    params: [],
  };
  //@ts-ignore can use _rpcRequest
  const { result: tipAccounts, error } = await conn._rpcRequest(request.method, request.params);
  if (error) throw new Error(`Get tip accounts failed: ${JSON.stringify(error)}`);
  return tipAccounts[Math.floor(Math.random() * tipAccounts.length)];
}

/**
 * https://docs.solana.com/developing/clients/jsonrpc-api#confirmtransaction
 * @param connection: Connection
 * @param txid: string
 */
async function confirmTransaction(connection: Connection, txid: string) {
  console.log('Transaction send result:', txid);
  console.log('txid : ', txid);
  const latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txid,
  });
  console.log(`https://solscan.io/tx/${txid}`);
}

async function main() {
  const url = process.env.SOLANA_RPC_URL;
  console.log('url : ', url);
  const connection = new Connection(url, 'confirmed');
  const jupiter = createJupiterApiClient();
  // const jito = new JitoJsonRpcClient('https://mainnet.block-engine.jito.wtf/api/v1', randomUUID());
  const jitoTipAccount = await getTipAccount(connection);
  console.log('jitoTipAccount : ', jitoTipAccount);

  const keypair = Keypair.fromSecretKey(bs58.decode(process.env.SOL_SECRET_KEY));
  const amount = 0.001 * LAMPORTS_PER_SOL;
  const jitoTipLamports = 0.0005 * LAMPORTS_PER_SOL; // 500_000 lamports
  console.log('userPublicKey  : ', keypair.publicKey.toBase58());
  console.log('amount         : ', amount);
  console.log('jitoTipLamports: ', jitoTipLamports);
  return;
  // await swapWithJito(connection, jupiter, keypair, amount, jitoTipLamports);
  await swapTransactionWithJito(connection, jupiter, keypair, amount, jitoTipAccount, jitoTipLamports);
}

main();
