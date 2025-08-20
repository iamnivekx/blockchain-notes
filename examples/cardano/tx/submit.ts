import axios from 'axios';
import { Seed, WalletServer } from 'cardano-wallet-js';

async function main() {
  // let recoveryPhrase = Seed.generateRecoveryPhrase();
  // console.log('recoveryPhrase: ', recoveryPhrase);
  // let mnemonic_sentence = Seed.toMnemonicList(recoveryPhrase);
  // let passphrase = 'tangocrypto';
  // let name = 'namet';

  const buffer = Buffer.from('0x....', 'hex');
  const response = await axios({
    headers: {
      'Content-Type': 'application/cbor',
    },
    method: 'post',
    url: 'https://submit-api.testnet.dandelion.link/api/submit/tx',
    data: buffer,
  });
  console.log(response);
  return;
}

main().catch(console.error);
