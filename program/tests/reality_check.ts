import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RealityCheck } from "../target/types/reality_check";
import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";

describe("reality_check", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.RealityCheck as Program<RealityCheck>;

    // Test data
    const testImageHash = "a".repeat(64); // Valid 64-char hex hash
    const testIpfsCid = "QmTzQ1Nk8Q6VkY5gK9X2sY3wZ4xN5cM7bH8jL2pF6rD9vE";

    it("Registers an image successfully", async () => {
        // Derive the PDA for the image state
        const [imageStatePda, bump] = PublicKey.findProgramAddressSync(
            [Buffer.from("image"), Buffer.from(testImageHash)],
            program.programId,
        );

        // Register the image
        const tx = await program.methods
            .registerImage(testImageHash, testIpfsCid)
            .accounts({
                imageState: imageStatePda,
                author: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
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
        // Try to register the same image again - should fail
        const [imageStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("image"), Buffer.from(testImageHash)],
            program.programId,
        );

        try {
            await program.methods
                .registerImage(testImageHash, testIpfsCid)
                .accounts({
                    imageState: imageStatePda,
                    author: provider.wallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
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
        const invalidHash = "tooshort";

        const [imageStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("image"), Buffer.from(invalidHash)],
            program.programId,
        );

        try {
            await program.methods
                .registerImage(invalidHash, testIpfsCid)
                .accounts({
                    imageState: imageStatePda,
                    author: provider.wallet.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                })
                .rpc();

            expect.fail("Expected transaction to fail");
        } catch (error: any) {
            expect(error.toString()).to.include("InvalidHashLength");
            console.log("Correctly rejected invalid hash length");
        }
    });

    it("Can look up an image by hash (O(1) lookup)", async () => {
        // Demonstrate O(1) lookup by deriving PDA from hash
        const lookupHash = testImageHash;

        const [imageStatePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("image"), Buffer.from(lookupHash)],
            program.programId,
        );

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
