import {
  AptosAccount,
  AptosClient,
  CoinClient,
  FaucetClient,
  HexString,
  Network,
  Provider,
} from 'aptos';
import { User } from 'fajaragus';

const MODULE_ADDRESS =
  process.env.MODULE_ADDRESS ||
  '0x4b920b958fcb737625c7b244e2f78b8d99930a796ac644f5dd75494caed5cd1b';
const MODULE_NAME = process.env.MODULE_NAME || 'twitter_clone';

const client = new AptosClient('https://fullnode.testnet.aptoslabs.com');
const faucetClient = new FaucetClient(
  'https://fullnode.testnet.aptoslabs.com',
  'https://faucet.testnet.aptoslabs.com'
);
const coinClient = new CoinClient(client);
const provider = new Provider(Network.TESTNET);

const FUNDING_ACCOUNT_PRIVATE_KEY = process.env.FUNDING_ACCOUNT_PRIVATE_KEY;
const FUNDING_THRESHOLD = 500_0000;

async function fundAccount(accountToFund: AptosAccount) {
  if (FUNDING_ACCOUNT_PRIVATE_KEY) {
    const fundingAccount = new AptosAccount(
      new HexString(FUNDING_ACCOUNT_PRIVATE_KEY).toUint8Array()
    );
    const transfer = await coinClient.transfer(
      fundingAccount,
      accountToFund,
      2500_0000,
      {
        createReceiverIfMissing: true,
      }
    );
    await client.waitForTransaction(transfer, { checkSuccess: true });
  } else {
    await faucetClient.fundAccount(accountToFund.address(), 2500_0000, 5);
  }
}

export function newPrivateKey() {
  const wallet = new AptosAccount();
  const privateKey = wallet.toPrivateKeyObject().privateKeyHex;
  return privateKey;
}

export async function createProfileIfNeeded(user: Omit<User, 'followers' | 'following'>) {
  let aptAccount = new AptosAccount(
    new HexString(user.privateKey).toUint8Array()
  );

  try {
    if (
      (await coinClient.checkBalance(aptAccount.address())) < FUNDING_THRESHOLD
    ) {
      await fundAccount(aptAccount);
      const rawTxn = await provider.generateTransaction(aptAccount.address(), {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_account`,
        type_arguments: [],
        arguments: [user.username, user.name, user.imgSrc || '', []],
      });
    
      const txnResponse = await provider.signAndSubmitTransaction(
        aptAccount,
        rawTxn
      );
    
      const txnResults = await provider.waitForTransactionWithResult(txnResponse) as any;
    
      if (txnResults.success === false) {
        throw new Error(txnResults.vm_status.split('E')[1].split('(')[0]);
      }
    }
  } catch (e: any) {
    await fundAccount(aptAccount);
    const rawTxn = await provider.generateTransaction(aptAccount.address(), {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_account`,
      type_arguments: [],
      arguments: [user.username, user.name, user.imgSrc || '', []],
    });
  
    const txnResponse = await provider.signAndSubmitTransaction(
      aptAccount,
      rawTxn
    );
  
    const txnResults = await provider.waitForTransactionWithResult(txnResponse) as any;
  
    if (txnResults.success === false) {
      throw new Error(txnResults.vm_status.split('E')[1].split('(')[0]);
    }
  }
}

export async function createProfile(user: Omit<User, 'followers' | 'following'>) {

  let aptAccount = new AptosAccount(
    new HexString(user.privateKey).toUint8Array()
  );

  await fundAccount(aptAccount);

  const rawTxn = await provider.generateTransaction(aptAccount.address(), {
    function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_account`,
    type_arguments: [],
    arguments: [user.username, user.name, user.imgSrc || '', []],
  });

  const txnResponse = await provider.signAndSubmitTransaction(
    aptAccount,
    rawTxn
  );

  const txnResults = await provider.waitForTransactionWithResult(txnResponse) as any;

  if (txnResults.success === false) {
    throw new Error(txnResults.vm_status.split('E')[1].split('(')[0]);
  }

  console.log(txnResponse);
  console.log(txnResults);
}
