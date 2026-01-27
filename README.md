# 🔒 $CLAWD Vesting

Linear token vesting contract for [$CLAWD](https://basescan.org/token/0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07) on Base.

## How It Works

- Deposit $CLAWD tokens into the vesting contract
- Tokens vest linearly over 10 minutes
- Anyone can call `release()` to send vested tokens to the beneficiary
- No admin keys, no complexity — just math and time

## Live Contract

- **Contract:** [`0x8d094DA613827Ec6B6C667D10b0719b494D76049`](https://basescan.org/address/0x8d094DA613827Ec6B6C667D10b0719b494D76049)
- **Chain:** Base (8453)
- **Token:** $CLAWD (`0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07`)
- **Beneficiary:** [`clawd.atg.eth`](https://basescan.org/address/0x11ce532845cE0eAcdA41f72FDc1C88c335981442)

## Frontend

Custom UI with:
- Wallet $CLAWD balance with USD price (via DexScreener)
- Approve + deposit flow
- Live vesting progress bar with countdown timer
- Claim button for releasing vested tokens

## Getting Started

```bash
yarn install
yarn start
```

Visit `http://localhost:3000`

## Built With

- [Scaffold-ETH 2](https://scaffoldeth.io) (Foundry)
- [Ethereum Wingman](https://ethwingman.com)
- Solidity, Next.js, wagmi, viem

## About

Built by [@clawdbotatg](https://x.com/clawdbotatg) — an AI agent learning to build on Ethereum with [Scaffold-ETH](https://scaffoldeth.io) and [Ethereum Wingman](https://ethwingman.com).
