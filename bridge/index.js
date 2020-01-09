const nearlib = require('nearlib');

const { ApiPromise } = require('@polkadot/api');
const testKeyring = require('@polkadot/keyring/testing');

const bn = require('bn.js');

//
// NEAR Setup
//

const CONTRACT_NAME = 'studio-9c7dtmgna';
const NEAR_BRIDGE_ACCOUNT = 'phalabridgetest';
const NEAR_BRIDGE_PRIVKEY = 'ed25519:hUoob5FLWYcYnMZqWHYXkBHc7dZrLu8tiqazTzBuAB7qj9QHnCoPKvmwE9CVcu9SQ6McA7RpnwsXPL4rZ9sKRHu';
const nearConfig = {
  networkId: 'default',
  nodeUrl: 'https://rpc.nearprotocol.com',
  contractName: CONTRACT_NAME,
  walletUrl: 'https://wallet.nearprotocol.com',
};

async function initNear () {
  let keyStore = new nearlib.keyStores.InMemoryKeyStore();
  keyStore.setKey(
    nearConfig.networkId,
    NEAR_BRIDGE_ACCOUNT,
    nearlib.KeyPair.fromString(NEAR_BRIDGE_PRIVKEY));

  const near = await nearlib.connect(Object.assign({ deps: { keyStore } }, nearConfig));
  const walletAccount = null;  //new nearlib.WalletAccount(near, null);
  const accountId = NEAR_BRIDGE_ACCOUNT;  // walletAccount.getAccountId();
  
  const contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: ['getMessages', 'getEvents'],
    changeMethods: ['addMessage', 'pushCommand', 'setState', 'pay'],
    sender: accountId,
  });

  return { near, walletAccount, accountId, contract };
}

//
// Phala Setup
//

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

async function initPhala () {
  const api = await ApiPromise.create();
  const keyring = testKeyring.default();
  const alicePair = keyring.getPair(ALICE);
  return { api, keyring, alicePair };
}

// 
// Testing methods
// 

async function testCallNear (neaerApi) {
  await nearApi.contract.addMessage({text: 'test from bridge - ' + Math.random()});
}

async function testReadPhala (phalaApi) {
  const nonce = await phalaApi.api.query.system.accountNonce(ALICE);
  console.log('sub nonce:', nonce);
}

async function testCallPhala (phalaApi) {
  const txhash = await phalaApi.api.tx.balances.transfer(BOB, new bn('10000'))
    .signAndSend(phalaApi.alicePair);
  console.log('send tx:', txhash);
}

//
// The main bridge logic
//

async function bridge (phalaApi, nearApi) {
  // loop {
  //   const ev = await near:get-first-unprocessed-event()
  //   if (!ev) {
  //     sleep(...)
  //   }
  //   const subev = subevFromNear(ev)
  //   const result = await substrate:send-tx(subev)
  //   if (result is not success) {
  //     log(...)
  //     continue
  //   }
  //   await near:set-state(ev.id, PROCESSED)
  // }
}

async function main () {
  const phalaApi = await initPhala();
  const nearApi = await initNear();

  // await testCallPhala(phalaApi);
  await bridge(phalaApi, nearApi);
  console.log('leaving main()');
}

main();
