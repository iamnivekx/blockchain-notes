import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  AddressLookupTableAccount,
} from '@solana/web3.js';
import { createJupiterApiClient, SwapRequestPrioritizationFeeLamports } from '@sola-hq/jup-api';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import BigNumber from 'bignumber.js';
import 'dotenv/config';

import { deserializeInstruction, getAddressLookupTableAccounts } from './instruction';
import { createAssociatedTokenAccountIdempotentInstruction, createCloseAccountInstruction, createTransferInstruction, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';


const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mint address
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'; // USDT mint address
// const FEE_ACCOUNT = 'EUZPnG5KaGYmh33RKdNGurrDqYXkLhT1DbGmDhNFm3yU';

function getFeeLamports(prioritizationFeeLamports: number, jitoFeeLamports: number, signers: number, setupInstructions: TransactionInstruction[], wrapAndUnwrapSol: boolean) {
  // const mintRentFeeLamports = await connection.getMinimumBalanceForRentExemption(165);
  // const mintRentFeeLamports = 2039280;
  const mintRentFeeLamports = 2039280;
  // const setupFeeLamports = mintRentFeeLamports * setupInstructions.length;
  let feeLamports = prioritizationFeeLamports + jitoFeeLamports;

  const setups = setupInstructions.filter((instruction: TransactionInstruction) => {
    if (instruction.programId.equals(ASSOCIATED_TOKEN_PROGRAM_ID)) {
      // return Buffer.from(instruction.data).equals(Buffer.from([1]));
      return true;
    }
    return false;
  }).length;

  // mintRentFeeLamports lamports is the fee for each setup,
  // n * mintRentFeeLamports
  if (setups > 0) {
    feeLamports += setups * mintRentFeeLamports;
  }

  // 1 lamports is the fee for wrap and unwrap sol
  if (wrapAndUnwrapSol) {
    feeLamports += 1;
  }

  // 5000 lamports is the fee for each signer
  if (signers > 0) {
    feeLamports += 5000 * signers;
  }


  return feeLamports;
}

function getPrioritizationFeeLamports(): SwapRequestPrioritizationFeeLamports {
  return {
    priorityLevelWithMaxLamports: {
      priorityLevel: 'veryHigh',
      maxLamports: 0.0001 * LAMPORTS_PER_SOL,
    },
  };
}

// 监听交易信息，如果交易成功，则返回交易信息
async function onSignature(connection: Connection, txid: string) {
  if (txid === '') return;
  return new Promise((resolve) => {
    connection.onSignature(txid, (signatureInfo) => {
      console.log('tx updated   : ', new Date().toISOString());
      console.log('signatureInfo: ', signatureInfo.err);
      resolve(signatureInfo);
    });
  });
}

// 签名并发送交易
async function signAndSendTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  maker: Keypair,
  payer: Keypair,
  blockhash: string,
  addressLookupTableAccounts: AddressLookupTableAccount[] = []
) {
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(addressLookupTableAccounts);

  const transaction = new VersionedTransaction(messageV0);

  const msgHash = transaction.message.serialize();

  const makerSignature = nacl.sign.detached(msgHash, maker.secretKey);
  const payerSignature = nacl.sign.detached(msgHash, payer.secretKey);

  transaction.addSignature(maker.publicKey, makerSignature);
  transaction.addSignature(payer.publicKey, payerSignature);


  const raw = transaction.serialize();

  console.log('signature base58 : ', bs58.encode(payerSignature));

  console.log('---------服务端发送交易请求，并返回交易id---------');
  console.time('sendRawTransaction');
  const txid = await connection.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: 'processed',
  });
  console.log('txid : ', txid);
  console.timeEnd('sendRawTransaction');
  return txid;
}

// sol_usdc 交易, 不需要开户
async function sol2usdcWithOutRent(connection: Connection, maker: Keypair, payer: Keypair) {
  const label = 'sol_usdc_without_rent';
  console.time(label);
  const client = createJupiterApiClient();
  console.time('quoteGet');
  console.log('---------客户端预估请求---------'); // prepare
  const quoteResponse = await client.quoteGet({
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    amount: 0.001 * LAMPORTS_PER_SOL,

    // platformFeeBps: The platform fee to be added (1 basis points)
    platformFeeBps: 1,
    onlyDirectRoutes: true,
  });
  console.timeEnd('quoteGet');

  console.log('---------客户端发起交易请求，带上预估结果---------');
  console.time('swapInstructionsResponse');
  const swapInstructionsResponse = await client.swapInstructionsPost({
    swapRequest: {
      // feeAccount: FEE_ACCOUNT, // Use actual key
      userPublicKey: maker.publicKey.toBase58(),
      quoteResponse: quoteResponse,
      prioritizationFeeLamports: getPrioritizationFeeLamports(),
    },
  });
  console.timeEnd('swapInstructionsResponse');
  const {
    computeBudgetInstructions, // The necessary instructions to setup the compute budget.
    setupInstructions: setupInstructionsPayload = [], // Setup missing ATA for the users.
    swapInstruction: swapInstructionPayload, // The actual swap instruction.
    cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
    addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    otherInstructions,
  } = swapInstructionsResponse;
  const prioritizationFeeLamports = swapInstructionsResponse.prioritizationFeeLamports;
  const blockhashWithMetadata = swapInstructionsResponse.blockhashWithMetadata;
  const blockhash = bs58.encode(blockhashWithMetadata.blockhash);

  const closeAccountInstruction = deserializeInstruction(cleanupInstruction);
  const setupInstructions = setupInstructionsPayload.map(deserializeInstruction);

  const addressLookupTableAccounts = await getAddressLookupTableAccounts(connection, addressLookupTableAddresses);

  const feeLamports = getFeeLamports(prioritizationFeeLamports, 0, 2, setupInstructions, true);
  // 1 + 5000 * 2 + prioritizationFeeLamports + jitoFeeLamports;

  const feeInstruction = SystemProgram.transfer({
    fromPubkey: maker.publicKey,
    toPubkey: payer.publicKey,
    lamports: feeLamports
  });

  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions,
    deserializeInstruction(swapInstructionPayload),
    closeAccountInstruction,
    ...otherInstructions.map(deserializeInstruction),
    feeInstruction,
  ];

  const txid = await signAndSendTransaction(
    connection,
    instructions,
    maker,
    payer,
    blockhash,
    addressLookupTableAccounts
  );

  console.log('wait for signature');
  console.time('onSignature');
  console.log('---------监听交易信息，如果交易成功，则返回交易信息---------');
  await onSignature(connection, txid);
  console.timeEnd('onSignature');
  console.timeEnd(label);
  return;
}

// sol_usdc 交易, 需要开户
async function sol2usdtWithRent(connection: Connection, maker: Keypair, payer: Keypair) {
  const label = 'sol_usdt_with_rent';
  console.time(label);
  const client = createJupiterApiClient();
  console.time('quoteGet');
  console.log('---------客户端预估请求---------'); // prepare
  const quoteResponse = await client.quoteGet({
    inputMint: SOL_MINT,
    outputMint: USDT_MINT,
    amount: 0.001 * LAMPORTS_PER_SOL,

    // platformFeeBps: The platform fee to be added (1 basis points)
    // platformFeeBps: 1,
    // onlyDirectRoutes: true,
  });
  console.timeEnd('quoteGet');

  console.log('---------客户端发起交易请求，带上预估结果---------');
  console.time('swapInstructionsResponse');
  const swapInstructionsResponse = await client.swapInstructionsPost({
    swapRequest: {
      payer: payer.publicKey.toBase58(),
      // feeAccount: FEE_ACCOUNT, // Use actual key
      userPublicKey: maker.publicKey.toBase58(),
      quoteResponse: quoteResponse,
      prioritizationFeeLamports: getPrioritizationFeeLamports(),
    },
  });
  console.timeEnd('swapInstructionsResponse');
  const {
    computeBudgetInstructions, // The necessary instructions to setup the compute budget.
    setupInstructions: setupInstructionsPayload = [], // Setup missing ATA for the users.
    swapInstruction: swapInstructionPayload, // The actual swap instruction.
    cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
    addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    otherInstructions,
  } = swapInstructionsResponse;
  const prioritizationFeeLamports = swapInstructionsResponse.prioritizationFeeLamports;
  const blockhashWithMetadata = swapInstructionsResponse.blockhashWithMetadata;
  const blockhash = bs58.encode(blockhashWithMetadata.blockhash);
  const setupInstructions = setupInstructionsPayload.map(deserializeInstruction);
  console.log('swapInstructionsResponse : ', swapInstructionsResponse)
  console.log('prioritizationFeeLamports : ', prioritizationFeeLamports);
  console.log('swapInstructionsResponse : ', swapInstructionsResponse);

  const feeLamports = getFeeLamports(prioritizationFeeLamports, 0, 2, setupInstructions, true);
  console.log('setupInstructions         : ', setupInstructions);
  console.log('prioritizationFeeLamports : ', prioritizationFeeLamports);
  console.log('feeLamports               : ', feeLamports);

  const closeAccountInstruction = deserializeInstruction(cleanupInstruction);
  const addressLookupTableAccounts = await getAddressLookupTableAccounts(connection, addressLookupTableAddresses);
  const feeInstruction = SystemProgram.transfer({
    fromPubkey: maker.publicKey,
    toPubkey: payer.publicKey,
    lamports: feeLamports
  });

  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions,
    deserializeInstruction(swapInstructionPayload),
    closeAccountInstruction,
    ...otherInstructions.map(deserializeInstruction),
    feeInstruction,
  ];

  const txid = await signAndSendTransaction(
    connection,
    instructions,
    maker,
    payer,
    blockhash,
    addressLookupTableAccounts
  );

  console.log('wait for signature');
  console.time('onSignature');
  console.log('---------监听交易信息，如果交易成功，则返回交易信息---------');
  await onSignature(connection, txid);
  console.timeEnd('onSignature');
  console.timeEnd(label);
  return;
}

// usdc_usdt 交易
async function usdc2usdtWithoutRent(connection: Connection, maker: Keypair, payer: Keypair) {
  const label = 'usdc_usdt_without_rent';
  const SOL_USDC = 154.22; // 1 sol = 154.22 usdc
  console.time(label);
  const client = createJupiterApiClient();
  console.time('quoteGet');
  console.log('---------客户端预估请求---------'); // prepare
  const quoteResponse = await client.quoteGet({
    inputMint: USDC_MINT,
    outputMint: USDT_MINT,
    amount: 0.1 * 10 ** 6, // 0.1 usdc
    // platformFeeBps: The platform fee to be added (1 basis points)
    // platformFeeBps: 1,
    onlyDirectRoutes: true,
  });
  console.timeEnd('quoteGet');

  console.log('---------客户端发起交易请求，带上预估结果---------');
  console.time('swapInstructionsResponse');
  const swapInstructionsResponse = await client.swapInstructionsPost({
    swapRequest: {
      // payer: payer.publicKey.toBase58(),
      userPublicKey: maker.publicKey.toBase58(),
      // feeAccount: FEE_ACCOUNT, // Use actual key
      quoteResponse: quoteResponse,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          priorityLevel: 'veryHigh',
          maxLamports: 0.001 * LAMPORTS_PER_SOL,
        },
      },
    },
  });
  console.timeEnd('swapInstructionsResponse');
  const {
    computeBudgetInstructions, // The necessary instructions to setup the compute budget.
    setupInstructions = [], // Setup missing ATA for the users.
    swapInstruction: swapInstructionPayload, // The actual swap instruction.
    cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
    addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    otherInstructions,
  } = swapInstructionsResponse;
  const prioritizationFeeLamports = swapInstructionsResponse.prioritizationFeeLamports;
  // const x = swapInstructionsResponse.jitoTipLamports;
  const blockhashWithMetadata = swapInstructionsResponse.blockhashWithMetadata;
  const blockhash = bs58.encode(blockhashWithMetadata.blockhash);
  // const mintRentExempt = await connection.getMinimumBalanceForRentExemption(165);
  const mintRentFeeLamports = 2039280;
  const setupFeeLamports = mintRentFeeLamports * setupInstructions.length;

  console.log('swapInstructionsResponse : ', swapInstructionsResponse);
  console.log('setupInstructions : ', setupInstructions);
  const addressLookupTableAccounts = await getAddressLookupTableAccounts(connection, addressLookupTableAddresses);
  const feeLamports = getFeeLamports(prioritizationFeeLamports, 2, setupInstructions.length, 0, false);
  //  5000 * 2 + prioritizationFeeLamports + jitoFeeLamports + setupFeeLamports;
  const usdcAmount = new BigNumber(feeLamports).times(SOL_USDC).div(10 ** 3).toFixed(0, BigNumber.ROUND_CEIL);

  console.log('setupFeeLamports : ', setupFeeLamports);
  console.log('prioritizationFeeLamports : ', prioritizationFeeLamports);
  console.log('feeLamports : ', feeLamports);
  console.log(`usdcAmount: ${usdcAmount} usdc, feeLamports: ${feeLamports} lamports, SOL_USDC: ${SOL_USDC}`);

  const payerTokenAccount = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), payer.publicKey, true);
  const makerTokenAccount = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), maker.publicKey, true);
  const feeInstruction = createTransferInstruction(
    makerTokenAccount,
    payerTokenAccount,
    maker.publicKey,
    BigInt(usdcAmount),
  );

  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions.map(deserializeInstruction),
    deserializeInstruction(swapInstructionPayload),
  ];

  if (cleanupInstruction) {
    instructions.push(deserializeInstruction(cleanupInstruction));
  }

  if (otherInstructions.length > 0) {
    instructions.push(...otherInstructions.map(deserializeInstruction));
  }

  instructions.push(feeInstruction);

  const txid = await signAndSendTransaction(
    connection,
    instructions,
    maker,
    payer,
    blockhash,
    addressLookupTableAccounts
  );

  console.log('wait for signature');
  console.time('onSignature');
  console.log('---------监听交易信息，如果交易成功，则返回交易信息---------');
  await onSignature(connection, txid);
  console.timeEnd('onSignature');
  console.timeEnd(label);
  return;
}

// usdc_usdt 交易
async function usdc2sdtWithRent(connection: Connection, maker: Keypair, payer: Keypair) {
  const label = 'usdc_sdt_with_rent';
  const SOL_USDC = 147.73; // 1 sol = 147.73 usd
  console.time(label);
  const client = createJupiterApiClient();
  console.log('---------客户端预估请求---------'); // prepare
  console.time('quoteGet');
  const quoteResponse = await client.quoteGet({
    inputMint: USDC_MINT,
    outputMint: USDT_MINT,
    amount: 0.1 * 10 ** 6, // 0.1 usdc
    // platformFeeBps: The platform fee to be added (1 basis points)
    // platformFeeBps: 1,
    onlyDirectRoutes: true,
  });
  console.timeEnd('quoteGet');
  console.log('---------客户端发起交易请求，带上预估结果---------');
  console.time('swapInstructionsResponse');
  const swapInstructionsResponse = await client.swapInstructionsPost({
    swapRequest: {
      payer: payer.publicKey.toBase58(),
      userPublicKey: maker.publicKey.toBase58(),
      // feeAccount: FEE_ACCOUNT, // Use actual key
      quoteResponse: quoteResponse,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          priorityLevel: 'veryHigh',
          maxLamports: 0.001 * LAMPORTS_PER_SOL,
        },
      },
    },
  });
  console.timeEnd('swapInstructionsResponse');
  const {
    computeBudgetInstructions, // The necessary instructions to setup the compute budget.
    setupInstructions = [], // Setup missing ATA for the users.
    swapInstruction: swapInstructionPayload, // The actual swap instruction.
    cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
    addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    otherInstructions,
  } = swapInstructionsResponse;
  const prioritizationFeeLamports = swapInstructionsResponse.prioritizationFeeLamports;
  // const x = swapInstructionsResponse.jitoTipLamports;
  const blockhashWithMetadata = swapInstructionsResponse.blockhashWithMetadata;
  const blockhash = bs58.encode(blockhashWithMetadata.blockhash);
  // const mintRentExempt = await connection.getMinimumBalanceForRentExemption(165);
  const mintRentFeeLamports = 2039280;
  const setupFeeLamports = mintRentFeeLamports * setupInstructions.length;

  console.log('swapInstructionsResponse : ', swapInstructionsResponse);
  console.log('setupInstructions : ', setupInstructions);

  const addressLookupTableAccounts = await getAddressLookupTableAccounts(connection, addressLookupTableAddresses);
  const feeLamports = getFeeLamports(prioritizationFeeLamports, 2, setupInstructions.length, 0, false);

  const usdcAmount = new BigNumber(feeLamports).times(SOL_USDC).div(10 ** 3).toFixed(0, BigNumber.ROUND_CEIL);

  console.log('setupFeeLamports : ', setupFeeLamports);
  console.log('prioritizationFeeLamports : ', prioritizationFeeLamports);
  console.log('feeLamports : ', feeLamports);
  console.log(`usdcAmount: ${usdcAmount} usdc, feeLamports: ${feeLamports} lamports, SOL_USDC: ${SOL_USDC}`);

  const payerTokenAccount = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), payer.publicKey, true);
  const makerTokenAccount = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), maker.publicKey, true);
  const feeInstruction = createTransferInstruction(
    makerTokenAccount,
    payerTokenAccount,
    maker.publicKey,
    BigInt(usdcAmount),
  );

  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions.map(deserializeInstruction),
    deserializeInstruction(swapInstructionPayload),
  ];

  if (cleanupInstruction) {
    instructions.push(deserializeInstruction(cleanupInstruction));
  }

  if (otherInstructions.length > 0) {
    instructions.push(...otherInstructions.map(deserializeInstruction));
  }

  if (feeLamports > 0) {
    instructions.push(feeInstruction);
  }

  const txid = await signAndSendTransaction(
    connection,
    instructions,
    maker,
    payer,
    blockhash,
    addressLookupTableAccounts
  );

  console.log('wait for signature');
  console.time('onSignature');
  console.log('---------监听交易信息，如果交易成功，则返回交易信息---------');
  await onSignature(connection, txid);
  console.timeEnd('onSignature');
  console.timeEnd(label);
  return;
}

// usdc_usdt 交易
async function usdt2usdcWithoutRent(connection: Connection, maker: Keypair, payer: Keypair) {
  const label = 'usdt_usdc';
  const SOL_USDC = 154.22; // 1 sol = 154.22 usdc
  console.time(label);
  const client = createJupiterApiClient();
  console.time('quoteGet');
  console.log('---------客户端预估请求---------'); // prepare
  const quoteResponse = await client.quoteGet({
    inputMint: USDT_MINT,
    outputMint: USDC_MINT,
    amount: 100000, // 0.1 usdt
    // platformFeeBps: The platform fee to be added (1 basis points)
    // platformFeeBps: 1,
  });
  console.timeEnd('quoteGet');

  console.log('---------客户端发起交易请求，带上预估结果---------');
  console.time('swapInstructionsResponse');
  const swapInstructionsResponse = await client.swapInstructionsPost({
    swapRequest: {
      payer: payer.publicKey.toBase58(),
      userPublicKey: maker.publicKey.toBase58(),
      // feeAccount: FEE_ACCOUNT, // Use actual key
      quoteResponse: quoteResponse,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          priorityLevel: 'veryHigh',
          maxLamports: 0.001 * LAMPORTS_PER_SOL,
        },
      },
    },
  });
  console.timeEnd('swapInstructionsResponse');
  const {
    computeBudgetInstructions, // The necessary instructions to setup the compute budget.
    setupInstructions = [], // Setup missing ATA for the users.
    swapInstruction: swapInstructionPayload, // The actual swap instruction.
    cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
    addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    otherInstructions,
  } = swapInstructionsResponse;
  const prioritizationFeeLamports = swapInstructionsResponse.prioritizationFeeLamports;
  // const x = swapInstructionsResponse.jitoTipLamports;
  const blockhashWithMetadata = swapInstructionsResponse.blockhashWithMetadata;
  const blockhash = bs58.encode(blockhashWithMetadata.blockhash);
  // const mintRentExempt = await connection.getMinimumBalanceForRentExemption(165);
  const mintRentFeeLamports = 2039280;
  const setupFeeLamports = mintRentFeeLamports * setupInstructions.length;
  console.log('setupInstructions : ', setupInstructions.length);

  const addressLookupTableAccounts = await getAddressLookupTableAccounts(connection, addressLookupTableAddresses);
  const jitoFeeLamports = 0;
  const feeLamports = 5000 * 2 + prioritizationFeeLamports + jitoFeeLamports + setupFeeLamports;
  const usdcAmount = new BigNumber(feeLamports).times(SOL_USDC).div(10 ** 3).toFixed(0, BigNumber.ROUND_CEIL);

  console.log('setupFeeLamports : ', setupFeeLamports);
  console.log('prioritizationFeeLamports : ', prioritizationFeeLamports);
  console.log('feeLamports : ', feeLamports);
  console.log(`usdcAmount: ${usdcAmount} usdc, feeLamports: ${feeLamports} lamports, SOL_USDC: ${SOL_USDC}`);

  const payerTokenAccount = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), payer.publicKey, true);
  const makerTokenAccount = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), maker.publicKey, true);
  const feeInstruction = createTransferInstruction(
    makerTokenAccount,
    payerTokenAccount,
    maker.publicKey,
    BigInt(usdcAmount),
  );

  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions.map(deserializeInstruction),
    deserializeInstruction(swapInstructionPayload),
  ];

  if (cleanupInstruction) {
    instructions.push(deserializeInstruction(cleanupInstruction));
  }

  if (otherInstructions.length > 0) {
    instructions.push(...otherInstructions.map(deserializeInstruction));
  }

  instructions.push(feeInstruction);

  const txid = await signAndSendTransaction(
    connection,
    instructions,
    maker,
    payer,
    blockhash,
    addressLookupTableAccounts
  );

  console.log('wait for signature');
  console.time('onSignature');
  console.log('---------监听交易信息，如果交易成功，则返回交易信息---------');
  await onSignature(connection, txid);
  console.timeEnd('onSignature');
  console.timeEnd(label);
  return;
}

// usdt_sol 交易
async function usdt2solWithRent(connection: Connection, maker: Keypair, payer: Keypair) {
  const label = 'usdt_sol_with_rent';
  console.time(label);
  const client = createJupiterApiClient();
  console.time('quoteGet');
  console.log('---------客户端预估请求---------'); // prepare
  const quoteResponse = await client.quoteGet({
    inputMint: USDT_MINT,
    outputMint: SOL_MINT,
    amount: 699844, // 0.1 usdt
    // platformFeeBps: The platform fee to be added (1 basis points)
    // platformFeeBps: 1,
    onlyDirectRoutes: true,
  });
  console.timeEnd('quoteGet');

  console.log('---------客户端发起交易请求，带上预估结果---------');
  console.time('swapInstructionsResponse');
  const swapInstructionsResponse = await client.swapInstructionsPost({
    swapRequest: {
      payer: payer.publicKey.toBase58(),
      userPublicKey: maker.publicKey.toBase58(),
      // feeAccount: FEE_ACCOUNT, // Use actual key
      quoteResponse: quoteResponse,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          priorityLevel: 'veryHigh',
          maxLamports: 0.0001 * LAMPORTS_PER_SOL,
        },
      },
    },
  });
  console.timeEnd('swapInstructionsResponse');
  const {
    computeBudgetInstructions, // The necessary instructions to setup the compute budget.
    setupInstructions = [], // Setup missing ATA for the users.
    swapInstruction: swapInstructionPayload, // The actual swap instruction.
    cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
    addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    otherInstructions,
  } = swapInstructionsResponse;
  const prioritizationFeeLamports = swapInstructionsResponse.prioritizationFeeLamports;
  // const x = swapInstructionsResponse.jitoTipLamports;
  const blockhashWithMetadata = swapInstructionsResponse.blockhashWithMetadata;
  const blockhash = bs58.encode(blockhashWithMetadata.blockhash);
  // const mintRentExempt = await connection.getMinimumBalanceForRentExemption(165);
  const mintRentFeeLamports = 2039280;
  const setupFeeLamports = mintRentFeeLamports * setupInstructions.length;
  console.log('setupInstructions : ', setupInstructions.length);

  const addressLookupTableAccounts = await getAddressLookupTableAccounts(connection, addressLookupTableAddresses);
  const jitoFeeLamports = 0;
  // if the output is sol + 1;
  const feeLamports = 1 + 5000 * 2 + prioritizationFeeLamports + jitoFeeLamports + setupFeeLamports;

  console.log('setupFeeLamports : ', setupFeeLamports);
  console.log('prioritizationFeeLamports : ', prioritizationFeeLamports);
  console.log('feeLamports : ', feeLamports);

  const feeInstruction = SystemProgram.transfer({
    fromPubkey: maker.publicKey,
    toPubkey: payer.publicKey,
    lamports: feeLamports,
  });

  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions.map(deserializeInstruction),
    deserializeInstruction(swapInstructionPayload),
  ];

  if (cleanupInstruction) {
    instructions.push(deserializeInstruction(cleanupInstruction));
  }

  if (otherInstructions.length > 0) {
    instructions.push(...otherInstructions.map(deserializeInstruction));
  }

  instructions.push(feeInstruction);

  const txid = await signAndSendTransaction(
    connection,
    instructions,
    maker,
    payer,
    blockhash,
    addressLookupTableAccounts
  );

  console.log('wait for signature');
  console.time('onSignature');
  console.log('---------监听交易信息，如果交易成功，则返回交易信息---------');
  await onSignature(connection, txid);
  console.timeEnd('onSignature');
  console.timeEnd(label);
  return;
}

// usdc2sol 交易, 需要开户
async function usdc2solWithRent(connection: Connection, maker: Keypair, payer: Keypair) {
  const label = 'usdc2sol_with_rent';
  console.time(label);
  const client = createJupiterApiClient();
  console.time('quoteGet');
  console.log('---------客户端预估请求---------'); // prepare
  const quoteResponse = await client.quoteGet({
    inputMint: USDC_MINT,
    outputMint: SOL_MINT,
    amount: 0.1 * 10 ** 6, // 0.1 usdc
    // platformFeeBps: The platform fee to be added (1 basis points)
    // platformFeeBps: 1,
    onlyDirectRoutes: true,
  });
  console.timeEnd('quoteGet');
  console.log('---------客户端发起交易请求，带上预估结果---------');
  console.time('swapInstructionsResponse');
  const swapInstructionsResponse = await client.swapInstructionsPost({
    swapRequest: {
      payer: payer.publicKey.toBase58(),
      userPublicKey: maker.publicKey.toBase58(),
      // feeAccount: FEE_ACCOUNT, // Use actual key
      quoteResponse: quoteResponse,
      prioritizationFeeLamports: {
        priorityLevelWithMaxLamports: {
          priorityLevel: 'veryHigh',
          maxLamports: 0.001 * LAMPORTS_PER_SOL,
        },
      },
    },
  });
  console.timeEnd('swapInstructionsResponse');
  const {
    computeBudgetInstructions, // The necessary instructions to setup the compute budget.
    setupInstructions = [], // Setup missing ATA for the users.
    swapInstruction: swapInstructionPayload, // The actual swap instruction.
    cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
    addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    otherInstructions,
  } = swapInstructionsResponse;
  const prioritizationFeeLamports = swapInstructionsResponse.prioritizationFeeLamports;
  // const x = swapInstructionsResponse.jitoTipLamports;
  const blockhashWithMetadata = swapInstructionsResponse.blockhashWithMetadata;
  const blockhash = bs58.encode(blockhashWithMetadata.blockhash);
  const mintRentFeeLamports = 2039280;
  const setupFeeLamports = mintRentFeeLamports * setupInstructions.length;

  console.log('swapInstructionsResponse : ', swapInstructionsResponse);
  console.log('setupInstructions : ', setupInstructions);

  const addressLookupTableAccounts = await getAddressLookupTableAccounts(connection, addressLookupTableAddresses);
  const jitoFeeLamports = 0;
  const feeLamports = 1 + 5000 * 2 + prioritizationFeeLamports + jitoFeeLamports + setupFeeLamports;
  console.log('prioritizationFeeLamports : ', prioritizationFeeLamports);
  console.log('feeLamports : ', feeLamports);

  const feeInstruction = SystemProgram.transfer({
    fromPubkey: maker.publicKey,
    toPubkey: payer.publicKey,
    lamports: feeLamports,
  });

  const instructions = [
    ...computeBudgetInstructions.map(deserializeInstruction),
    ...setupInstructions.map(deserializeInstruction),
    deserializeInstruction(swapInstructionPayload),
  ];

  if (cleanupInstruction) {
    instructions.push(deserializeInstruction(cleanupInstruction));
  }

  if (otherInstructions.length > 0) {
    instructions.push(...otherInstructions.map(deserializeInstruction));
  }

  instructions.push(feeInstruction);

  const txid = await signAndSendTransaction(
    connection,
    instructions,
    maker,
    payer,
    blockhash,
    addressLookupTableAccounts
  );

  console.log('wait for signature');
  console.time('onSignature');
  console.log('---------监听交易信息，如果交易成功，则返回交易信息---------');
  await onSignature(connection, txid);
  console.timeEnd('onSignature');
  console.timeEnd(label);
  return;
}

async function closeTokenAccount(connection: Connection, maker: Keypair, payer: Keypair) {
  const label = 'close';
  console.time(label);
  const mint = new PublicKey(USDT_MINT);
  const remainingBalance = 149811;

  const makerTokenAccount = getAssociatedTokenAddressSync(mint, maker.publicKey, true);
  const payerTokenAccount = getAssociatedTokenAddressSync(mint, payer.publicKey, true);

  const instructions = [
    createAssociatedTokenAccountIdempotentInstruction(payer.publicKey, payerTokenAccount, payer.publicKey, mint),
    createTransferInstruction(makerTokenAccount, payerTokenAccount, maker.publicKey, BigInt(remainingBalance)),
    createCloseAccountInstruction(makerTokenAccount, payer.publicKey, maker.publicKey),
  ];
  const { blockhash } = await connection.getLatestBlockhash();

  const txid = await signAndSendTransaction(
    connection,
    instructions,
    maker,
    payer,
    blockhash,
  );
  console.time('onSignature');
  console.log('---------监听交易信息，如果交易成功，则返回交易信息---------');
  await onSignature(connection, txid);
  console.timeEnd('onSignature');
  console.timeEnd('close');
}

async function sendUsdcToPayer(connection: Connection, maker: Keypair, payer: Keypair) {
  const makerUsdcATA = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), maker.publicKey, true);
  const payerUsdcATA = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), payer.publicKey, true);

  const makerUsdtATA = getAssociatedTokenAddressSync(new PublicKey(USDT_MINT), maker.publicKey, true);
  const payerUsdtATA = getAssociatedTokenAddressSync(new PublicKey(USDT_MINT), payer.publicKey, true);

  // const usdcAmount = 2732999; // 2.732999 usdc
  // const usdtAmount = 699844; // 0.699844 usdt

  const makerWsolATA = getAssociatedTokenAddressSync(new PublicKey(SOL_MINT), maker.publicKey, true);
  const instructions = [
    // createTransferInstruction(makerUsdcATA, payerUsdcATA, maker.publicKey, BigInt(usdcAmount)),
    // createCloseAccountInstruction(makerUsdcATA, maker.publicKey, maker.publicKey),
    // createTransferInstruction(makerUsdtATA, payerUsdtATA, maker.publicKey, BigInt(usdtAmount)),
    // createCloseAccountInstruction(makerUsdtATA, maker.publicKey, maker.publicKey),

    // createTransferInstruction(makerWsolATA, payerWsolATA, maker.publicKey, BigInt(wsolAmount)),
    createCloseAccountInstruction(makerWsolATA, maker.publicKey, maker.publicKey),

  ];
  const { blockhash } = await connection.getLatestBlockhash();
  const txid = await signAndSendTransaction(
    connection,
    instructions,
    maker,
    payer,
    blockhash,
  );
  console.time('onSignature');
  console.log('---------监听交易信息，如果交易成功，则返回交易信息---------');
  await onSignature(connection, txid);
  console.timeEnd('onSignature');
  console.timeEnd('close');
}

async function main() {
  const label = 'sol_usdc';
  console.time(label);
  const url = process.env.SOLANA_RPC_URL!;
  const wsUrl = process.env.SOLANA_WS_URL!;
  const connection = new Connection(url, {
    commitment: 'processed',
    wsEndpoint: wsUrl,
  });

  const maker = Keypair.fromSecretKey(bs58.decode(process.env.SOL_SECRET_KEY!));
  const payer = Keypair.fromSecretKey(bs58.decode(process.env.SOL_PAYER_SECRET_KEY!));
  console.log('maker : ', maker.publicKey.toBase58());
  console.log('payer : ', payer.publicKey.toBase58());

  // const rentExempt = await connection.getMinimumBalanceForRentExemption(165);
  // console.log('rentExempt : ', rentExempt);

  // send rent fee to payer at last.
  // 2Lb2iaVcCW5pC8nDAJGTLcckebkjvkEh168nPPSDW2xDzPMPuVaFUiQ8gSXJBNvbzo7TEyKgonnu4JoVV3PRLmh9
  // await usdc2solWithRent(connection, maker, payer);

  // close token account
  // await closeTokenAccount(connection, maker, payer);

  // 不需要开户
  // await usdc2usdtWithoutRent(connection, maker, payer);

  // 需要开户
  // await usdc2sdtWithRent(connection, maker, payer);

  // 不需要开户
  // https://solscan.io/tx/5X6Kgg7QpAWqdE1TTXrgbEEAFU8DbJPhhSzVX9RDBhV4VBDAxdWWbeCuMQSotE2tCRBXDM6cC3hx2Y4zErKEJVWD
  // await usdt2usdcWithoutRent(connection, maker, payer);

  // 需要开户
  // 4m1e7fG73zxbmZ5Qf2vmkEzQotAHrD11qTp4o27dgex3t8ToSpZfzkYCXkASmMwQitAhQXRrFVwRNbJTUBmxKFiC
  // await usdt2solWithRent(connection, maker, payer);

  // SOL -> USDC, 不需要开户, 需要SOL开户
  // https://solscan.io/tx/3EQZrkvH7cQ8AmhA4TDnpnANcD2xkXqDepHPqoCmjHfifV5Yd7FVdVHCTK88KtMN96EV1s4RwLRthMBQKJS3Lv7y
  // await sol2usdcWithOutRent(connection, maker, payer);


  // SOL -> USDT, 需要开户, 需要SOL开户
  // https://solscan.io/tx/2TteLULpEuy5E9ZkkSuR2ehxWHYKPSGerp6FC2dkd3K1KGDKLnw4CqdwrvcKQLccHdYPYzBeUs5cey6KVt2LrdSW#solBalanceChange
  await sol2usdtWithRent(connection, maker, payer);
  // await closeTokenAccount(connection, maker, payer);

  // await sendUsdcToPayer(connection, maker, payer);
}


main().catch(console.error);