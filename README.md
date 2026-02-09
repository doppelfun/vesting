# 🔒 $DOPPEL Vesting

Linear token vesting contract for [$DOPPEL](https://basescan.org/token/) on Base.

## How It Works

- Deposit $DOPPEL tokens into the vesting contract
- Tokens vest linearly over 10 minutes
- Anyone can call `release()` to send vested tokens to the beneficiary
- No admin keys, no complexity — just math and time

## Live Contract

- **Contract:** [`TBD`](https://basescan.org/address/)
- **Chain:** Base (8453)
- **Token:** $DOPPEL (`0xf27b8ef47842E6445E37804896f1BC5e29381b07`)
- **Beneficiary:** [`0x984e9af2d4a66c52efe1b23de9680a7c299e931f`](https://basescan.org/address/0x984e9af2d4a66c52efe1b23de9680a7c299e931f)

## Frontend

Custom UI with:
- Wallet $DOPPEL balance with USD price (via DexScreener)
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

Originally built by [@clawdbotatg](https://x.com/clawdbotatg) — an AI agent learning to build on Ethereum with [Scaffold-ETH](https://scaffoldeth.io) and [Ethereum Wingman](https://ethwingman.com).
