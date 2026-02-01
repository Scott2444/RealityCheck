# RealityCheck - Decentralized Media Verification

**Verifying Reality in the Age of AI**

**Spartahack 11** | Track: Roots and Renewal (Social Good)

RealityCheck is a decentralized media registry that acts as a notary public for digital content. By using Solana blockchain technology, it provides immutable Proof of Existence and Proof of Authorship for photos and videos to combat artificially modified media.

---

## Project Structure

```
RealityCheck/
├── program/              # Solana/Anchor smart contract
├── app/                  # Next.js web application
└── extension/            # Chrome browser extension
```

---

## Tech Stack

| Component      | Technology                                      |
| -------------- | ----------------------------------------------- |
| Blockchain     | Solana (Devnet)                                 |
| Smart Contract | Anchor Framework (Rust)                         |
| Frontend       | Next.js 16, React 19, TypeScript, Tailwind CSS  |
| Web3 Client    | @solana/wallet-adapter-react, @coral-xyz/anchor |
| Hashing        | Web Crypto API (SHA-256)                        |
| Extension      | Chrome Manifest V3                              |
| Icons          | Lucide React                                    |

---

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.17+)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation) (v0.32.1+)
- [Node.js](https://nodejs.org/) (v18.18+ recommended)
- [Yarn](https://yarnpkg.com/) (recommended for `program/`) and/or npm

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

#   IMPORTANT (only if you deploy your own program):
# If your program ID changes, update it in:
# - Anchor.toml (both localnet and devnet)
# - programs/reality_check/src/lib.rs (declare_id! macro)
# - ../app/src/lib/idl.ts (PROGRAM_ID + IDL.address)

# Deploy to Devnet
anchor deploy

# Run tests
anchor test
```

### Step 3: Copy the IDL to Next.js App

After building the program, the IDL is generated at:

```
program/target/idl/reality_check.json
```

Copy the JSON contents into the `IDL` object in `app/src/lib/idl.ts`. The format matches directly—just paste and replace the existing object.

Also update the `PROGRAM_ID` if your program ID changed.

> Note: This repo already includes a working `IDL` + `PROGRAM_ID` for the current deployed program. You only need to do this step if you rebuild/redeploy or modify the program.

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

The Next.js app also serves a ready-to-install zip at `app/public/extension.zip` (and the web UI links to it as `/extension.zip`).

> **Note:** The extension is currently configured to call a hosted API (`https://reality-check-deployment.vercel.app/api/verify`). To use a local dev server, change `REALITYCHECK_API_BASE` in `extension/content.js` (and the matching constant in `extension/background.js`).

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
seeds = [b"image", &image_hash.as_bytes()[..32]]
```

This allows instant lookup by hash without iteration. The program still stores and validates the full 64-character SHA-256 hex string; the PDA uses the first 32 bytes of the string to fit seed limits.

### Image Hashing and File Formats

RealityCheck uses SHA-256 cryptographic hashing on the **raw file bytes**. This means:

| Scenario                              | Same Hash? |
| ------------------------------------- | ---------- |
| Same exact file                       | Yes        |
| JPEG vs PNG of same image             | No         |
| Same JPEG at different quality levels | No         |
| Same file re-saved (even same format) | Often No   |
| Screenshot of the image               | No         |
| Cropped or resized                    | No         |
| Same file, different filename         | Yes        |

**Why different formats produce different hashes:**

Each image format encodes pixels differently (JPEG uses lossy DCT compression, PNG uses lossless deflate, etc.). Even metadata differences like EXIF data or timestamps will change the hash. A single bit difference produces a completely different SHA-256 hash.

**This is intentional.** For Proof of Existence and Proof of Authorship, you want to verify the *exact original file*. Any modification—even minor compression—should be detectable.

**Best practice for users:** Register the original file directly from your camera or source. The exact file you register is what can be verified. If you convert, compress, or edit the image later, it will produce a different hash and won't match the blockchain record.

This design is ideal for photographers, journalists, and creators who need to prove they possess the original, unmodified file.

---

## Key Features

- **Immutable Timestamping**: Proves an image existed at a specific time
- **Censorship Resistance**: Records stored on blockchain, no central authority
- **O(1) Lookup**: PDA-based storage allows instant verification by hash
- **Browser Extension**: Verify any image on the web with one click
- **Dark Mode UI**: Modern, accessible interface

---

## API Reference

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

Notes:

- The API route is implemented in the Next.js app and queries Solana **Devnet**.
- CORS is enabled (including `OPTIONS`) so the browser extension can call it.

---

## Error Handling

The smart contract returns the following errors:

| Code | Name              | Description                            |
| ---- | ----------------- | -------------------------------------- |
| 6000 | InvalidHashLength | Hash must be exactly 64 hex characters |
| 6001 | InvalidCidLength  | IPFS CID must be ≤100 characters       |

Attempting to register the same image twice will fail with an "account already in use" error (handled gracefully in the UI).

---

## Development

### Local Testing with Validator

```bash
# Start local Solana validator
solana-test-validator

# In another terminal
cd program
anchor test
```

> Tip: If you want to run fully local (validator + program + app), set `cluster = "localnet"` under `[provider]` in `program/Anchor.toml`, then rebuild/deploy locally and update the app `PROGRAM_ID`/`IDL`.

### Extension Development

The extension uses plain HTML/JS/CSS with no build step. Simply edit the files and reload the extension in Chrome.

> Heads up: websites often resize/recompress images, which changes the bytes (and therefore the SHA-256 hash). The extension verifies the exact bytes it fetches from the page URL, so it may not match the original file a creator registered.

## Future Features
Rather than enforcing a single authority, RealityCheck is trust-agnostic. Anyone can curate or publish their own database of credible uploaders, and users are free to choose which trust lists they rely on. If you don’t trust one source list, you can switch to another, or create your own.

1. Adding support for using alternative database authorities
2. Implementing a default authority for credible uploaders made up of journalist, professional photographers, and news outlets
