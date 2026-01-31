import { PublicKey } from "@solana/web3.js";

// Replace this with your deployed program ID after running `anchor deploy`
export const PROGRAM_ID = new PublicKey(
    "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
);

// IDL for the RealityCheck program
// This will be auto-generated after building the program with `anchor build`
// Copy the contents of target/idl/reality_check.json here after building
export const IDL = {
    address: PROGRAM_ID.toBase58(),
    version: "0.1.0",
    name: "reality_check",
    instructions: [
        {
            name: "registerImage",
            accounts: [
                {
                    name: "imageState",
                    isMut: true,
                    isSigner: false,
                },
                {
                    name: "author",
                    isMut: true,
                    isSigner: true,
                },
                {
                    name: "systemProgram",
                    isMut: false,
                    isSigner: false,
                },
            ],
            args: [
                {
                    name: "imageHash",
                    type: "string",
                },
                {
                    name: "ipfsCid",
                    type: "string",
                },
            ],
        },
    ],
    accounts: [
        {
            name: "ImageState",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "author",
                        type: "publicKey",
                    },
                    {
                        name: "timestamp",
                        type: "i64",
                    },
                    {
                        name: "imageHash",
                        type: "string",
                    },
                    {
                        name: "ipfsCid",
                        type: "string",
                    },
                ],
            },
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
};

export type RealityCheckIDL = typeof IDL;
