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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function nearGetFistUnprocessedEvent(nearApi, start) {
  const LIMIT = 10;
  while (true) {
    const events = await nearApi.contract.getEvents({start, length: LIMIT});
    if (!events || events.length == 0) {
      // no event
      return null;
    }

    for (let i = 0; i < events.length; i++) {
      // return the first unprocessed egress event we met
      if (events[i].state == 0) {
        return events[i];
      }
    }
    start += LIMIT;
  }
}

function phalaEventFromNear (ev) {
  return ev;
}

async function phalaPushCommand(phalaApi, ev) {
  // -- ev --
  // eid: u32;
  // origin: string;
  // contract: u32;
  // payload: string;
  // state: u8;
  const { contract, payload } = ev;
  // TODO: handle different origin
  const txid = await phalaApi.api.tx.execution.pushCommand(contract, payload)
      .signAndSend(phalaApi.alicePair);
  return txid;
}

async function nearSetProcessed(nearApi, eid) {
  await nearApi.contract.setState({eid, state: 1});  // 1 - processed
}

async function bridge () {
  const phalaApi = await initPhala();
  console.log('Connected to Phala');

  const nearApi = await initNear();
  console.log('Connected to Near');

  let startEid = 0;
  while (true) {
    const ev = await nearGetFistUnprocessedEvent(nearApi, startEid);
    if (!ev) {
      await sleep(200);
      continue;
    }
    console.log('Got unprocessed event:', ev);

    const phalaEv = phalaEventFromNear(ev);
    console.log('Relaying to Phala Network:', phalaEv);

    const result = await phalaPushCommand(phalaApi, phalaEv);
    if (!result) {
      console.log('Phala transaction failed. Retry...');
      continue;
    }

    console.log('Setting event processed:', ev.eid);
    await nearSetProcessed(nearApi, ev.eid);
    startEid = ev.eid + 1;

    await sleep(500);
  }
}

async function main () {
  while (true) {
    try {
      await bridge();
    } catch (err) {
      console.error('Bridge error, pause for 5s:', err);
      await sleep(5000);
    }
  }
}

main();
