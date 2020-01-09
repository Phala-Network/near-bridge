# Phala-NEAR Bridge

Deadly simple cross-chain bridge between Phala.Network and NEAR Protocol. This enables Confidential
Smart Contract provided by Phala.Network for NEAR Protocol.

## The bridge contract

- `assembly/main.ts` for contract code
- `assembly/model.ts` for data structures
- `src/main.js` for wallet integration and contract use with `nearlib`
- `src/index.html` for HTML part


To run from nearstudio: click run. 

To run on a local devnet:
Click "Download" and unarchive to disk. From the archive directory,
```
yarn
yarn build
yarn deploy -- --contract guestbook
```

## The bridge deamon:

- `bridge/index.js`
