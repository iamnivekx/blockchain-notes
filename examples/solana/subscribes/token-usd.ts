import { Connection, PublicKey } from '@solana/web3.js';
import { LIQUIDITY_STATE_LAYOUT_V4, PoolInfoLayout, SqrtPriceMath } from '@raydium-io/raydium-sdk';
import { AccountLayout, MintLayout } from '@solana/spl-token';
import Decimal from 'decimal.js';
import 'dotenv/config';

const marketId = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj');
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const CLMM_PROGRAM_ID = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK');
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

let solUsd = new Decimal(197.7);

function onSolPriceChange(conn: Connection) {
  conn.onAccountChange(
    marketId,
    async (accountInfo) => {
      const poolData = PoolInfoLayout.decode(accountInfo.data);
      const price = SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB);
      console.log(`WSOL/USDC:`, price);
      solUsd = price;
    },
    {
      commitment: 'confirmed',
    },
  );
}

function onTokenPriceChange(conn: Connection) {
  conn.onAccountChange(USDC_MINT, async (accountInfo) => {
    const decodedAccount = decodeTokenAccount(accountInfo.data);
  });
}

// decode token account
function decodeTokenAccount(data: Uint8Array) {
  if (data.length !== AccountLayout.span) return;
  return AccountLayout.decode(data);
}

function decodeMintLayout(data: Uint8Array) {
  if (data.length !== MintLayout.span) return;
  return MintLayout.decode(data);
}

async function main() {
  // Establish new connect to mainnet - websocket client connected to mainnet will also be registered here
  const { SOLANA_RPC_URL, SOLANA_WS_URL } = process.env;
  const conn = new Connection(SOLANA_RPC_URL, {
    commitment: 'confirmed',
    wsEndpoint: SOLANA_WS_URL,
  });
  console.log('conn', SOLANA_RPC_URL, SOLANA_WS_URL);

  // conn.onProgramAccountChange(SYSTEM_PROGRAM_ID, (account) => {
  //   systemCounter++;
  //   // console.log('system : ', account);
  //   console.log(`System: ${systemCounter}, Token: ${tokenCounter}, Raydium: ${raydiumCounter}`);
  // });

  conn.onProgramAccountChange(
    TOKEN_PROGRAM_ID,
    (account, context) => {
      console.log('--------------------------');
      console.log('account id       :', account.accountId.toBase58());
      console.log('account owner    :', account.accountInfo.owner.toBase58());
      console.log('SOL     balance  :', account.accountInfo.lamports);
      console.log('rent    epoch    :', account.accountInfo.rentEpoch);
      console.log('slot             :', context.slot);
      const decodedAccount = decodeTokenAccount(account.accountInfo.data);
      if (decodedAccount) {
        console.log('Token account    :', account.accountId.toBase58());
        console.log('Token mint       :', decodedAccount.mint.toBase58());
        console.log('Token owner      :', decodedAccount.owner.toBase58());
        console.log('Token balance    :', decodedAccount.amount);
        return;
      }

      const decodedMint = decodeMintLayout(account.accountInfo.data);
      if (decodedMint) {
        console.log('Mint is initialized   :', decodedMint.isInitialized);
        console.log('Mint authority option :', decodedMint.mintAuthorityOption);
        console.log('Mint authority        :', decodedMint.mintAuthority.toBase58());
        console.log('Mint freeze authority option :', decodedMint.freezeAuthorityOption);
        console.log('Mint freeze authority :', decodedMint.freezeAuthority.toBase58());
        console.log('Mint supply           :', decodedMint.supply);
        console.log('Mint decimals         :', decodedMint.decimals);
        return;
      }
    },
    {
      commitment: 'confirmed',
    },
  );

  // conn.onProgramAccountChange(
  //   CLMM_PROGRAM_ID,
  //   (account) => {
  //     try {
  //       if (!CLMM_PROGRAM_ID.equals(account.accountInfo.owner)) {
  //         console.warn('Not a CLMM pool account');
  //         return;
  //       }
  //       console.log(account.accountId.toBase58());
  //       const poolInfo = PoolInfoLayout.decode(account.accountInfo.data);
  //       const currentPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
  //         poolInfo.sqrtPriceX64,
  //         poolInfo.mintDecimalsA,
  //         poolInfo.mintDecimalsB,
  //       ).toDecimalPlaces(10);
  //       console.log(
  //         JSON.stringify({
  //           id: account.accountId.toBase58(),
  //           ...poolInfo,
  //         }),
  //       );
  //       return;
  //       // console.log(JSON.stringify(JSON.parse(poolInfo.liquidity.toString())));
  //       console.log({
  //         poolAddress: account.accountId.toBase58(),
  //         base: poolInfo.mintB.toBase58(),
  //         quote: poolInfo.mintA.toBase58(), // WSOL
  //         price: currentPrice.toString(),
  //         priceUsd: new Decimal(solUsd).div(currentPrice).toString(),
  //         timestamp: new Date().toISOString(),
  //         liquidity: poolInfo.liquidity.toString(),
  //         // volume: poolInfo.fundFeesTokenA.toString(),
  //         // sqrtPriceX64: poolInfo.sqrtPriceX64.toString(),
  //         // tickCurrent: poolInfo.tickCurrent,
  //         // observationIndex: poolInfo.observationIndex,
  //         // observationUpdateDuration: poolInfo.observationUpdateDuration,
  //       });
  //     } catch (error) {
  //       console.error('Error processing pool update:', error);
  //     }
  //   },
  //   {
  //     commitment: 'confirmed',
  //     filters: [
  //       { dataSize: PoolInfoLayout.span },
  //       {
  //         memcmp: {
  //           offset: PoolInfoLayout.offsetOf('mintA'),
  //           bytes: WSOL_MINT.toBase58(),
  //         },
  //       },
  //       {
  //         memcmp: {
  //           offset: PoolInfoLayout.offsetOf('mintB'),
  //           bytes: USDC_MINT.toBase58(),
  //         },
  //       },
  //     ],
  //   },
  // );
}

main().catch(console.error);
