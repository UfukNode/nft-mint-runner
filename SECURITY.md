# Security

## Threat model

This is a local developer tool. The local Node server receives private keys, signs transactions, and stores sensitive session material in memory only. Anyone who can access your machine, browser session, terminal, or a modified copy of this repository may be able to steal funds.

## Private keys

- Private keys are never written to disk by the app.
- Private keys are not stored in `.env`, localStorage, sessionStorage, URLs, or logs.
- Private keys are not returned to the browser after submission.
- Sensitive sessions expire automatically and are cleared on cancellation or completion.

Use dedicated hot wallets with limited balances. Do not paste a main wallet or long-term treasury key.

## Local-only nature

By default the server binds to `127.0.0.1`. In Codespaces it may bind to `0.0.0.0` so the forwarded port works. Do not expose the port publicly while keys are loaded.

## RPC privacy

RPC providers can see submitted raw transactions, read calls, IP metadata, and timing. Private RPC URLs may include API keys; the app redacts likely secrets in UI and error messages, but you should still treat RPC URLs as sensitive.

## Malicious forks

A malicious fork could exfiltrate keys, change transaction recipients, raise gas, or alter calldata. Inspect source before entering private keys, and install dependencies from a trusted lockfile.

## Before minting

- Use fresh dedicated wallets.
- Fund only what you are willing to spend.
- Verify the NFT contract, SeaDrop contract, mint price, start time, and fee recipient.
- Do not use armed wallets for unrelated transactions until execution finishes or is cancelled.
