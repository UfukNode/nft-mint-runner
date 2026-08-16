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

---

## Run Locally (Recommended):

### Windows:

- First, follow my WSL installation guide: https://x.com/UfukDegen/status/1944066889346429338
- After completing the WSL setup, run the commands below.

### macOS:

- Run the commands below in Terminal.

```bash
git clone https://github.com/UfukNode/nft-mint-runner.git
cd nft-mint-runner
npm install
npm start
```

- Open the URL printed after:

Example:

```text
Local: http://localhost:3000
```

If 3000 is already busy, the app automatically uses the next free port and prints it.

<img width="1261" height="533" alt="Ekran Resmi 2026-08-16 16 12 21" src="https://github.com/user-attachments/assets/cebc8525-5e3c-4b65-9f12-60eb935f6b99" />

---

## Run with Codespaces:

1. Open the repository on GitHub.
3. Create a Codespace.

<img width="2916" height="1254" alt="Adsız tasarım (8)" src="https://github.com/user-attachments/assets/04c5f3a0-314a-4d2e-a837-4b65c9f0643e" />

5. Run:

```bash
npm start
```

4. Open forwarded port:

<img width="936" height="296" alt="Adsız tasarım (9)" src="https://github.com/user-attachments/assets/9d6ff385-abc1-4938-ad62-4b10270b53d8" />

---

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

---

## Limits

This tool supports public SeaDrop stages that can be built from on-chain state. Allowlist, token-gated, or server-signed mints are not supported.

---

## License

MIT
