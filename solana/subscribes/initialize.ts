import { Connection, PublicKey } from '@solana/web3.js';

function onLogs(conn: Connection, poolId: PublicKey) {
  conn.onLogs(
    poolId,
    ({ err, logs, signature }) => {
      if (err) return;
      if (logs && logs.some((log) => log.includes('initialize') || log.includes('initialize2'))) {
        console.log(`Raydium Liquidity Pool initialized: https://solscan.io/tx/${signature}`);
      }
      console.log(logs);
    },
    'confirmed',
  );
}

function main() {
  const url = process.env.SOLANA_RPC_URL!;
  const conn = new Connection(url, {
    commitment: 'confirmed',
    wsEndpoint: process.env.SOLANA_WS_URL!,
  });

  // Raydium Liquidity Pool V4
  const poolId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
  onLogs(conn, poolId);
}

main();
