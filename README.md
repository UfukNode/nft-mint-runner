# NFT Mint Runner

Local browser tool for public SeaDrop NFT mints.

It runs on your own machine, reads public mint configuration on-chain, prepares signed transactions locally, and broadcasts them through selected RPC endpoints. It is not a hosted service.

## Features

- Browser UI, no terminal wizard.
- Ethereum Mainnet, Base, and Robinhood Chain.
- NFT contract address and compatible OpenSea URLs.
- On-chain SeaDrop public mint inspection.
- Multiple local wallets.
- Multiple RPC endpoints with wrong-chain detection.
- Quantity, gas, and balance validation.
- Pre-signed transactions before mint start.
- Concurrent broadcast and per-wallet result tracking.
- English and Turkish UI toggle.

## Security Warning

Private keys stay only in the local Node process memory. They are not saved to disk, `.env`, browser storage, URLs, logs, or API responses.

Use fresh mint wallets with limited balances. Never paste a main wallet key.

## Quick Start

```bash
git clone https://github.com/UfukNode/nft-mint-runner.git
cd nft-mint-runner
npm install
npm start
```

Open:

```text
http://localhost:3000
```

## Codespaces

1. Open the repository on GitHub.
2. Create a Codespace.
3. Wait for `npm install`.
4. Run:

```bash
npm start
```

5. Open forwarded port `3000`.

## Usage

1. Select a network.
2. Paste an NFT contract or compatible OpenSea URL.
3. Click **Analyze Mint**.
4. Add dedicated mint wallets.
5. Check RPC endpoints.
6. Set quantity and gas.
7. Validate.
8. Prepare Mint.
9. Confirm & Arm.
10. Track wallet results.

Do not use armed wallets for other transactions before broadcast. Nonce changes can invalidate prepared transactions.

## RPC

Default public RPCs are included. You can add private/custom RPC endpoints in the UI or `.env`:

```env
RPC_ETHEREUM=
RPC_BASE=
RPC_ROBINHOOD=
```

Do not put private keys in `.env`.

## Limits

This tool supports public SeaDrop stages that can be built from on-chain state. Allowlist, token-gated, or server-signed mints are not supported.

## Development

```bash
npm run dev
npm test
npm run check
```

## Credits

Inspired by the workflow concept of https://github.com/morsyxbt/nft-public-mint.

This is an independently implemented web application.

## License

MIT
