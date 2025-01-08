import { Connection, PublicKey } from '@solana/web3.js';
import { PoolInfoLayout, SqrtPriceMath } from '@raydium-io/raydium-sdk';
import 'dotenv/config';
// Raydium Liquidity Pool V4: WSOL-USDC
const marketId = new PublicKey('8sLbNZoA1cfnvMJLPfp98ZLAnFSYCFApfJKMbiXNLwxj');
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

function onPriceChange(conn: Connection) {
  conn.onAccountChange(
    marketId,
    async (accountInfo) => {
      const poolData = PoolInfoLayout.decode(accountInfo.data);
      const price = SqrtPriceMath.sqrtPriceX64ToPrice(poolData.sqrtPriceX64, poolData.mintDecimalsA, poolData.mintDecimalsB).toFixed(6);
      console.log(`WSOL/USDC:`, price);
    },
    {
      commitment: 'confirmed',
    },
  );
}

function main() {
  // Establish new connect to mainnet - websocket client connected to mainnet will also be registered here
  const { SOLANA_RPC_URL, SOLANA_WS_URL } = process.env;
  console.log('SOLANA_RPC_URL : ', SOLANA_WS_URL);

  const conn = new Connection(SOLANA_RPC_URL, {
    commitment: 'confirmed',
    wsEndpoint: SOLANA_WS_URL,
  });
  onPriceChange(conn);
}

main();
