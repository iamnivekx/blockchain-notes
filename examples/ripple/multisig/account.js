const RippleAPI = require('ripple-lib').RippleAPI;

const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net/', // Public rippled server
});

const from_address = 'rfXgErjK96k59evDnC22zX7vRo2hYaSiqc';
const secret = 'ssHAaRfvdDsF62da3dpDHgxHSnw4d';

async function main() {
  await api.connect();

  const account = await api.getAccountInfo(from_address);
  console.log('account', account);

  const preparedTx = await api.prepareTransaction(
    {
      Flags: 0,
      TransactionType: 'SignerListSet',
      Account: from_address,
      Fee: '10000',
      SignerQuorum: 3,
      SignerEntries: [
        {
          SignerEntry: {
            Account: 'r3Q3D8nsyu2nJKFsagHfYdMp8H1VEHd3ps',
            SignerWeight: 2,
          },
        },
        {
          SignerEntry: {
            Account: 'rhiWpgj8ai3QxegWAe3ZpHk6iionnbtAz1',
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: 'r3DtjVnBbAf63zryETCjx8NG2j3ewNcJ9g',
            SignerWeight: 1,
          },
        },
      ],
    },
    //     {
    //       // Expire this transaction if it doesn't execute within ~5 minutes:
    //       //       maxFee
    //       //       maxLedgerVersionOffset: 75,
    //     }
  );

  console.log('prepare', preparedTx);

  const maxLedgerVersion = preparedTx.instructions.maxLedgerVersion;
  console.log('Prepared transaction instructions:', preparedTx.txJSON);
  console.log('Transaction cost:', preparedTx.instructions.fee, 'XRP');
  console.log('Transaction expires after ledger:', maxLedgerVersion);

  const signed = api.sign(preparedTx.txJSON, secret);
  const txID = signed.id;
  const tx_signed = signed.signedTransaction;
  console.log('Identifying hash:', txID);
  console.log('Signed tx:', tx_signed);

  // const ledgerVersion = await api.getLedgerVersion();
  // const earliestLedgerVersion = ledgerVersion + 1;

  const sresult = await api.submit(tx_signed);
  console.log('Tentative result code:', result.resultCode);
  console.log('Tentative result message:', result.resultMessage);

  return api.disconnect();
}

main().then().catch(console.error);
