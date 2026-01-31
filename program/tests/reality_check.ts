import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RealityCheck } from "../target/types/reality_check";
import { expect } from "chai";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as crypto from "crypto";

describe("reality_check", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.RealityCheck as Program<RealityCheck>;

    // Generate unique test data for each run to avoid conflicts on devnet
    const testImageHash = crypto.randomBytes(32).toString("hex"); // Valid 64-char hex hash
    const testIpfsCid = "QmTzQ1Nk8Q6VkY5gK9X2sY3wZ4xN5cM7bH8jL2pF6rD9vE";

    // Helper function to derive the image state PDA
    const getImageStatePda = (imageHash: string): PublicKey => {
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("image"), Buffer.from(imageHash.substring(0, 32))],
            program.programId,
        );
        return pda;
    };

    it("Registers an image successfully", async () => {
        const imageStatePda = getImageStatePda(testImageHash);

        // Register the image
        const tx = await program.methods
            .registerImage(testImageHash, testIpfsCid)
            .accounts({
                imageState: imageStatePda,
                author: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        console.log("Transaction signature:", tx);

        // Fetch the account and verify the data
        const imageState =
            await program.account.imageState.fetch(imageStatePda);

        expect(imageState.author.toBase58()).to.equal(
            provider.wallet.publicKey.toBase58(),
        );
        expect(imageState.imageHash).to.equal(testImageHash);
        expect(imageState.ipfsCid).to.equal(testIpfsCid);
        expect(imageState.timestamp.toNumber()).to.be.greaterThan(0);

        console.log("Image State:", {
            author: imageState.author.toBase58(),
            timestamp: new Date(
                imageState.timestamp.toNumber() * 1000,
            ).toISOString(),
            imageHash: imageState.imageHash,
            ipfsCid: imageState.ipfsCid,
        });
    });

    it("Fails to register the same image twice", async () => {
        const imageStatePda = getImageStatePda(testImageHash);

        // Try to register the same image again - should fail
        try {
            await program.methods
                .registerImage(testImageHash, testIpfsCid)
                .accounts({
                    imageState: imageStatePda,
                    author: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            // Should not reach here
            expect.fail("Expected transaction to fail");
        } catch (error: any) {
            // Account already exists error
            expect(error.toString()).to.include("already in use");
            console.log("Correctly rejected duplicate registration");
        }
    });

    it("Fails with invalid hash length", async () => {
        // Use a 32-char hash (enough for PDA seed derivation, but not valid 64-char SHA-256)
        const invalidHash = "a".repeat(32);
        const imageStatePda = getImageStatePda(invalidHash);

        try {
            await program.methods
                .registerImage(invalidHash, testIpfsCid)
                .accounts({
                    imageState: imageStatePda,
                    author: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            expect.fail("Expected transaction to fail");
        } catch (error: any) {
            // The error may be wrapped, so check for the error code
            const errorStr = error.toString();
            expect(
                errorStr.includes("InvalidHashLength") || 
                errorStr.includes("6000") || // Anchor error code
                errorStr.includes("custom program error")
            ).to.be.true;
            console.log("Correctly rejected invalid hash length");
        }
    });

    it("Can look up an image by hash (O(1) lookup)", async () => {
        // Demonstrate O(1) lookup by deriving PDA from hash (first 32 chars as seed)
        const lookupHash = testImageHash;
        const imageStatePda = getImageStatePda(lookupHash);

        // Fetch directly by PDA - no iteration needed
        const imageState =
            await program.account.imageState.fetch(imageStatePda);

        expect(imageState.imageHash).to.equal(lookupHash);
        console.log(
            "O(1) lookup successful for hash:",
            lookupHash.substring(0, 16) + "...",
        );
    });
});
