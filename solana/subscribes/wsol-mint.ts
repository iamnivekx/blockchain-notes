import { Connection, PublicKey } from '@solana/web3.js';
import { PoolInfoLayout, SqrtPriceMath } from '@raydium-io/raydium-sdk';
import 'dotenv/config';
import Decimal from 'decimal.js';

const marketId = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj');
const CLMM_PROGRAM_ID = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK');
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
// const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

let solUsd = new Decimal(197.7);

function onWSolPrice(conn: Connection) {
  conn.onAccountChange(
    marketId,
    async (accountInfo) => {
      try {
        const poolData = PoolInfoLayout.decode(accountInfo.data);
        const price = SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB);
        console.log(`WSOL/USDC:`, price);
        solUsd = price;
      } catch (error) {
        console.error('Error decoding pool data:', error);
      }
    },
    {
      commitment: 'confirmed',
    },
  );
}

function onWSolToMint(conn: Connection) {
  conn.onProgramAccountChange(
    CLMM_PROGRAM_ID,
    (account) => {
      try {
        if (!CLMM_PROGRAM_ID.equals(account.accountInfo.owner)) {
          console.warn('Not a CLMM pool account');
          return;
        }
        const poolInfo = PoolInfoLayout.decode(account.accountInfo.data);
        const currentPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
          poolInfo.sqrtPriceX64,
          poolInfo.mintDecimalsA,
          poolInfo.mintDecimalsB,
        ).toDecimalPlaces(10);
        const priceUsd = new Decimal(solUsd).div(currentPrice);

        console.log({
          poolAddress: account.accountId.toBase58(),
          mintA: poolInfo.mintA.toBase58(), // WSOL
          mintB: poolInfo.mintB.toBase58(), // Mint
          price: currentPrice.toString(),
          priceUsd: priceUsd.toString(),
          timestamp: new Date().toISOString(),
          liquidity: poolInfo.liquidity.toString(),
        });
      } catch (error) {
        console.error('Error processing pool update:', error);
      }
    },
    {
      commitment: 'confirmed',
      filters: [
        { dataSize: PoolInfoLayout.span },
        {
          memcmp: {
            offset: PoolInfoLayout.offsetOf('mintA'),
            bytes: WSOL_MINT.toBase58(),
          },
        },
        // {
        //   memcmp: {
        //     offset: PoolInfoLayout.offsetOf('mintB'),
        //     bytes: USDC_MINT.toBase58(),
        //   },
        // },
      ],
    },
  );
}

async function main() {
  const { SOLANA_RPC_URL, SOLANA_WS_URL } = process.env;
  const conn = new Connection(SOLANA_RPC_URL, {
    commitment: 'confirmed',
    wsEndpoint: SOLANA_WS_URL,
  });

  onWSolPrice(conn);
  onWSolToMint(conn);
}

main().catch(console.error);
