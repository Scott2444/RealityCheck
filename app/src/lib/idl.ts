import { PublicKey } from "@solana/web3.js";

// Replace this with your deployed program ID after running `anchor deploy`
export const PROGRAM_ID = new PublicKey(
    "HVR5gk2KaeXxV7dNYDUGksNKKGLJENCmetxzkCCpnt5Q",
);

// IDL for the RealityCheck program
// Copy the contents of program/target/idl/reality_check.json here after building
// The format below matches the Anchor 0.30+ IDL spec
export const IDL = {
    address: "HVR5gk2KaeXxV7dNYDUGksNKKGLJENCmetxzkCCpnt5Q",
    metadata: {
        name: "reality_check",
        version: "0.1.0",
        spec: "0.1.0",
        description: "RealityCheck - Decentralized Media Verification",
    },
    instructions: [
        {
            name: "register_image",
            docs: [
                "Registers an image on-chain by storing its hash and IPFS CID.",
                'The account is a PDA derived from ["image", image_hash].',
            ],
            discriminator: [179, 217, 114, 245, 165, 236, 54, 187],
            accounts: [
                {
                    name: "image_state",
                    writable: true,
                },
                {
                    name: "author",
                    writable: true,
                    signer: true,
                },
                {
                    name: "system_program",
                    address: "11111111111111111111111111111111",
                },
            ],
            args: [
                {
                    name: "image_hash",
                    type: "string",
                },
                {
                    name: "ipfs_cid",
                    type: "string",
                },
            ],
        },
    ],
    accounts: [
        {
            name: "ImageState",
            discriminator: [130, 215, 215, 199, 43, 231, 214, 38],
        },
    ],
    errors: [
        {
            code: 6000,
            name: "InvalidHashLength",
            msg: "Image hash must be exactly 64 characters (SHA-256 hex)",
        },
        {
            code: 6001,
            name: "InvalidCidLength",
            msg: "IPFS CID must be 100 characters or less",
        },
    ],
    types: [
        {
            name: "ImageState",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "author",
                        docs: ["The wallet address of the image author"],
                        type: "pubkey",
                    },
                    {
                        name: "timestamp",
                        docs: ["Unix timestamp when the image was registered"],
                        type: "i64",
                    },
                    {
                        name: "image_hash",
                        docs: ["SHA-256 hash of the image (64 hex characters)"],
                        type: "string",
                    },
                    {
                        name: "ipfs_cid",
                        docs: ["IPFS Content Identifier for the image"],
                        type: "string",
                    },
                ],
            },
        },
    ],
} as const;

export type RealityCheckIDL = typeof IDL;
