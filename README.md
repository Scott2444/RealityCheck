# RealityCheck - Decentralized Media Verification

**Verifying Reality in the Age of AI**

**Spartahack 11** | Track: Roots and Renewal (Social Good)

RealityCheck is a decentralized media registry that acts as a notary public for digital content. By leveraging Solana blockchain technology, it provides immutable Proof of Existence and Proof of Authorship for photos and videos.

---

## Project Structure

```
RealityCheck/
├── program/              # Solana/Anchor smart contract
│   ├── programs/
│   │   └── reality_check/
│   │       └── src/
│   │           └── lib.rs
│   └── tests/
│       └── reality_check.ts
├── app/                  # Next.js web application
│   └── src/
│       ├── app/
│       │   ├── api/verify/route.ts
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── UploadZone.tsx
│       │   ├── VerifySection.tsx
│       │   └── WalletProvider.tsx
│       └── lib/
│           └── idl.ts
└── extension/            # Chrome browser extension
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── content.js
    ├── content.css
    └── background.js
```

---

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.17+)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation) (v0.29+)
- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/) or npm

### Step 1: Setup Solana CLI

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Configure for Devnet
solana config set --url devnet

# Generate a new keypair (if you don't have one)
solana-keygen new

# Airdrop some SOL for testing
solana airdrop 2
```

### Step 2: Build & Deploy the Solana Program

```bash
cd program

# Install dependencies
yarn install

# Build the program
anchor build

# Get your program ID
solana address -k target/deploy/reality_check-keypair.json

#   IMPORTANT: Update the program ID in these files:
# - Anchor.toml (both localnet and devnet)
# - programs/reality_check/src/lib.rs (declare_id! macro)
# - ../app/src/lib/idl.ts (PROGRAM_ID constant)

# Deploy to Devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

### Step 3: Copy the IDL to Next.js App

After building the program, the IDL is generated at:

```
program/target/idl/reality_check.json
```

Copy its contents to `app/src/lib/idl.ts` (replace the existing IDL object).

### Step 4: Run the Next.js Application

```bash
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:3000**

### Step 5: Load the Browser Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `extension/` folder
5. The RealityCheck icon should appear in your toolbar

> **Note:** Create placeholder icons (16x16, 48x48, 128x128 PNG files) in `extension/icons/` or the extension will show a default icon.

---

## How It Works

### Registration Flow

1. **Upload**: User drops an image into the web app
2. **Hash**: SHA-256 hash is calculated client-side (browser)
3. **IPFS**: Image is uploaded to IPFS (mocked in demo)
4. **Sign**: User signs a Solana transaction with their wallet
5. **Store**: Hash + metadata stored on-chain in a PDA

### Verification Flow

1. **Check**: User uploads an image to verify (or uses extension)
2. **Hash**: Same SHA-256 hash is calculated
3. **Lookup**: PDA is derived from hash for O(1) lookup
4. **Result**: Blockchain data returned (author, timestamp, etc.)

### PDA Structure

Images are stored in PDAs derived from:

```rust
seeds = [b"image", image_hash.as_bytes()]
```

This allows instant lookup by hash without iteration.

---

## 🔧 Tech Stack

| Component      | Technology                                      |
| -------------- | ----------------------------------------------- |
| Blockchain     | Solana (Devnet)                                 |
| Smart Contract | Anchor Framework (Rust)                         |
| Frontend       | Next.js 14, TypeScript, Tailwind CSS            |
| Web3 Client    | @solana/wallet-adapter-react, @coral-xyz/anchor |
| Hashing        | Web Crypto API (SHA-256)                        |
| Extension      | Chrome Manifest V3                              |
| Icons          | Lucide React                                    |

---

## 🎯 Key Features

- **Immutable Timestamping**: Proves an image existed at a specific time
- **Censorship Resistance**: Records stored on blockchain, no central authority
- **O(1) Lookup**: PDA-based storage allows instant verification by hash
- **Browser Extension**: Verify any image on the web with one click
- **Dark Mode UI**: Modern, accessible interface

---

## 📝 API Reference

### GET `/api/verify`

Verify an image hash against the blockchain.

**Query Parameters:**

- `hash` (required): 64-character hex SHA-256 hash

**Response (verified):**

```json
{
    "verified": true,
    "data": {
        "author": "5FHw...abc",
        "timestamp": 1706745600,
        "imageHash": "abc123...",
        "ipfsCid": "Qm..."
    }
}
```

**Response (not found):**

```json
{
    "verified": false,
    "message": "Image not found in blockchain registry"
}
```

---

## 🔐 Error Handling

The smart contract returns the following errors:

| Code | Name              | Description                            |
| ---- | ----------------- | -------------------------------------- |
| 6000 | InvalidHashLength | Hash must be exactly 64 hex characters |
| 6001 | InvalidCidLength  | IPFS CID must be ≤100 characters       |

Attempting to register the same image twice will fail with an "account already in use" error (handled gracefully in the UI).

---

## 🛠️ Development

### Local Testing with Validator

```bash
# Start local Solana validator
solana-test-validator

# In another terminal
cd program
anchor test --skip-local-validator
```

### Extension Development

The extension uses plain HTML/JS/CSS with no build step. Simply edit the files and reload the extension in Chrome.

