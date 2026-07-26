# Soroban Voting DApp

A decentralized voting application built on the **Stellar** network using **Soroban smart contracts** and a **Next.js** frontend. Voters connect their Freighter wallet, initialize elections with custom candidate lists, and cast votes — all on-chain on Stellar testnet.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Smart Contract](#smart-contract)
  - [Functions](#functions)
  - [Storage Model](#storage-model)
  - [Tests](#tests)
- [Frontend](#frontend)
  - [Components](#components)
  - [Wallet Integration](#wallet-integration)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Run Tests](#run-tests)
  - [Deploy the Contract](#deploy-the-contract)
  - [Run the Frontend](#run-the-frontend)
- [How It Works](#how-it-works)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│  VotingApp.tsx  ──►  hooks/contract.ts  ──►  Freighter│
└──────────────────────────┬──────────────────────────┘
                           │ RPC (HTTPS)
                           ▼
┌─────────────────────────────────────────────────────┐
│              Stellar Testnet (Soroban)               │
│         Smart Contract (CBQ5G...DEVFH)              │
│  initialize()  vote()  get_votes()  get_candidates()│
└─────────────────────────────────────────────────────┘
```

The frontend communicates with the Stellar Soroban RPC server to simulate and submit transactions. Write operations (initialize, vote) require wallet signing via the Freighter browser extension. Read operations (get_votes, get_candidates) are simulated without signing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Rust, Soroban SDK v25 |
| Blockchain | Stellar Testnet |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Wallet | Freighter Browser Extension |
| Contract Bindings | Auto-generated TypeScript via `stellar contract bindings typescript` |
| Package Manager | Bun |

---

## Project Structure

```
project/
├── README.md
├── contract/                          # Soroban smart contract (Rust)
│   ├── Cargo.toml                     # Workspace root
│   └── contracts/contract/
│       ├── Cargo.toml                 # Contract crate config
│       └── src/
│           ├── lib.rs                 # Contract logic (4 functions, ~50 lines)
│           └── test.rs                # 6 unit tests covering all edge cases
│
└── client/                            # Next.js frontend
    ├── package.json
    ├── tsconfig.json
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx             # Root layout with fonts
    │   │   ├── page.tsx               # Home page rendering VotingApp
    │   │   └── globals.css            # Tailwind + theme variables
    │   ├── components/
    │   │   └── VotingApp.tsx          # Main voting UI (wallet, create, vote)
    │   └── hooks/
    │       └── contract.ts            # Contract interaction layer
    └── packages/
        └── contract/                  # Auto-generated typed contract bindings
            └── src/index.ts           # Type-safe Client class
```

---

## Smart Contract

The Soroban smart contract manages an election with candidates, enforces one-vote-per-address, and stores all data on-chain.

### Functions

| Function | Parameters | Description |
|---|---|---|
| `initialize` | `candidates: Vec<String>` | Creates an election with the given candidate names. Stores candidates, empty vote counts, and an empty voter registry. |
| `vote` | `voter: Address, candidate: String` | Casts a vote. Requires `voter` auth. Panics if voter already voted or candidate is invalid. |
| `get_votes` | `candidate: String` | Returns the current vote count for a candidate (`u32`). Returns `0` if no votes. |
| `get_candidates` | _(none)_ | Returns the full list of candidate names (`Vec<String>`). |

### Storage Model

All data is stored in Soroban **instance storage** (shared TTL):

| Key | Type | Purpose |
|---|---|---|
| `Candidates` | `Vec<String>` | List of candidate names |
| `Votes` | `Map<String, u32>` | Candidate name to vote count |
| `Voters` | `Map<Address, bool>` | Tracks who has already voted |

### Tests

Six unit tests covering all scenarios:

1. **test_initialize_and_get_candidates** — initializes with 3 candidates, verifies they are stored correctly
2. **test_vote_and_get_votes** — two voters vote for Alice, verifies counts (2 for Alice, 0 for Bob)
3. **test_cannot_vote_twice** — panics with `"already voted"` when same address votes again
4. **test_vote_invalid_candidate** — panics with `"invalid candidate"` for a non-existent name
5. **test_get_votes_before_any_votes** — returns `0` before any votes are cast
6. **test_voting_across_multiple_candidates** — multiple voters split across 3 candidates, verifies all counts

---

## Frontend

### Components

**`VotingApp.tsx`** — The main (and only) UI component. Renders:

- **Wallet connection** — a button to connect Freighter; shows the connected address after linking
- **Election creation form** — visible only when no candidates exist; takes comma-separated names
- **Candidate cards** — each candidate shows their name, current vote count, and a Vote button
- **Error display** — shows transaction or loading errors in a red banner

### Wallet Integration

**`hooks/contract.ts`** — The contract interaction layer:

- `connectWallet()` — checks Freighter installation, requests access, returns the user's public key
- `getConnectedAddress()` — silently checks if a wallet is already connected
- `initializeElection(caller, candidates)` — builds, signs, and sends an `initialize` transaction
- `vote(caller, candidate)` — builds, signs, and sends a `vote` transaction
- `getVotes(candidate)` — simulates a read-only `get_votes` call
- `getCandidates()` — simulates a read-only `get_candidates` call

The generated TypeScript bindings (`packages/contract/`) provide full type safety — all method parameters and return types match the Rust contract exactly.

---

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) with the `wasm32v1-none` target
- [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools) (`stellar`)
- [Bun](https://bun.sh/) or npm
- [Freighter](https://freighter.app/) browser extension (Chrome/Firefox/Brave)
- A funded Stellar testnet account (for deployment)

### Run Tests

```bash
cd contract
cargo test
```

All 6 tests should pass with `test result: ok`.

### Deploy the Contract

```bash
cd contract

# Build the WASM binary
stellar contract build

# Generate a testnet keypair and fund it
stellar keys generate dev --network testnet --fund

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/contract.wasm \
  --source-account dev \
  --network testnet
```

This prints a contract address (e.g., `CBQ5GN4HK33KOX4Z3EMDBJ43YMUK3XRLTGBW7EMIVZLLILDEVFHOPVBL`).

### Regenerate TypeScript Bindings

After deploying (or redeploying with a new address), regenerate the typed client:

```bash
cd client

stellar contract bindings typescript \
  --network testnet \
  --contract-id <YOUR_CONTRACT_ADDRESS> \
  --output-dir packages/contract

cd packages/contract && bun install && bun run build
```

Then update the `contractId` in `src/hooks/contract.ts` if needed (the bindings auto-embed it).

### Run the Frontend

```bash
cd client
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How It Works

1. **Connect Wallet** — Click the button to link your Freighter wallet. Your Stellar public key is displayed.
2. **Create an Election** — Enter candidate names separated by commas (e.g., `Alice, Bob, Charlie`) and click Create. This submits an `initialize` transaction signed by your wallet.
3. **Vote** — Click the Vote button on any candidate card. A `vote` transaction is built, simulated, signed by your wallet, and submitted to the network.
4. **View Results** — Vote counts update automatically after each successful vote. Each wallet address can only vote once per election.
5. **Persistence** — All data lives on-chain. Refresh the page and reconnect to see the current state.

---

## License

MIT
