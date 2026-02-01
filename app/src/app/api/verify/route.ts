import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, clusterApiUrl, Keypair } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { IDL, PROGRAM_ID } from "@/lib/idl";

// Read-only wallet for fetching data (no signing needed)
class ReadOnlyWallet implements Wallet {
    publicKey: PublicKey;
    payer: Keypair;

    constructor() {
        // Dummy keypair - not used for signing, just for read operations
        this.payer = Keypair.generate();
        this.publicKey = this.payer.publicKey;
    }

    async signTransaction(): Promise<never> {
        throw new Error("Read-only wallet cannot sign transactions");
    }

    async signAllTransactions(): Promise<never> {
        throw new Error("Read-only wallet cannot sign transactions");
    }
}

export async function GET(request: NextRequest) {
    try {
        // Get hash from query params
        const { searchParams } = new URL(request.url);
        const hash = searchParams.get("hash");

        if (!hash) {
            return NextResponse.json(
                { error: "Missing hash parameter", verified: false },
                { status: 400 },
            );
        }

        // Validate hash format (64 hex characters for SHA-256)
        if (!/^[a-fA-F0-9]{64}$/.test(hash)) {
            return NextResponse.json(
                {
                    error: "Invalid hash format. Expected 64 hex characters.",
                    verified: false,
                },
                { status: 400 },
            );
        }

        // Connect to Solana Devnet
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

        // Create read-only provider
        const wallet = new ReadOnlyWallet();
        const provider = new AnchorProvider(connection, wallet, {
            commitment: "confirmed",
        });

        // Initialize program
        const program = new Program(IDL as any, provider);

        // Derive PDA for the image state using the first 32 bytes of the hash (to match registration)
        const [imageStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("image"), Buffer.from(hash.slice(0, 32))],
            PROGRAM_ID,
        );

        try {
            // Fetch the account data
            const imageState = (await (program.account as any).imageState.fetch(
                imageStatePda,
            )) as {
                author: PublicKey;
                timestamp: { toNumber: () => number };
                imageHash: string;
                ipfsCid: string;
            };

            // Image is verified - return the data
            return NextResponse.json({
                verified: true,
                data: {
                    author: imageState.author.toBase58(),
                    timestamp: imageState.timestamp.toNumber(),
                    imageHash: imageState.imageHash,
                    ipfsCid: imageState.ipfsCid,
                },
            });
        } catch (fetchError: any) {
            // Account doesn't exist - image not registered
            if (fetchError.message?.includes("Account does not exist")) {
                return NextResponse.json({
                    verified: false,
                    message: "Image not found in blockchain registry",
                });
            }
            throw fetchError;
        }
    } catch (error: any) {
        console.error("Verification error:", error);
        return NextResponse.json(
            {
                verified: false,
                error: "Failed to verify image",
                details: error.message,
            },
            { status: 500 },
        );
    }
}

// Enable CORS for browser extension
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
