const nearlib = require('nearlib');

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

async function initPhala () {
  return {

  };
}

async function testCallNear (neaerApi) {
  await nearApi.contract.addMessage({text: 'test from bridge - ' + Math.random()});
}

async function bridge () {
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
  await bridge();
}

main();
