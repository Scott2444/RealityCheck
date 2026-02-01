"use client";

import { FC, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
    Upload,
    Image,
    CheckCircle,
    XCircle,
    Loader2,
    Hash,
} from "lucide-react";
import { IDL, PROGRAM_ID } from "@/lib/idl";

export const UploadZone: FC = () => {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageHash, setImageHash] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<
        "idle" | "hashing" | "uploading" | "registering" | "success" | "error"
    >("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // Calculate SHA-256 hash of file
    const calculateHash = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return hashHex;
    };

    // Mock IPFS upload - In production, replace with actual IPFS/Arweave upload
    const mockIpfsUpload = async (file: File): Promise<string> => {
        // TODO: Replace with actual IPFS upload using Pinata, Infura, or web3.storage
        // Example with web3.storage:
        // const client = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN });
        // const cid = await client.put([file]);
        // return cid;

        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate upload delay
        return "QmTzQ1Nk8Q6VkY5gK9X2sY3wZ4xN5cM7bH8jL2pF6rD9vE"; // Fake CID
    };

    // Handle file drop
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setStatus("idle");
        setErrorMessage(null);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            setFile(droppedFile);
            setPreview(URL.createObjectURL(droppedFile));

            setStatus("hashing");
            const hash = await calculateHash(droppedFile);
            setImageHash(hash);
            setStatus("idle");
        }
    }, []);

    // Handle file input change
    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            setStatus("idle");
            setErrorMessage(null);

            const selectedFile = e.target.files?.[0];
            if (selectedFile && selectedFile.type.startsWith("image/")) {
                setFile(selectedFile);
                setPreview(URL.createObjectURL(selectedFile));

                setStatus("hashing");
                const hash = await calculateHash(selectedFile);
                setImageHash(hash);
                setStatus("idle");
            }
        },
        [],
    );

    // Register image on Solana
    const handleRegister = async () => {
        if (
            !wallet.publicKey ||
            !wallet.signTransaction ||
            !file ||
            !imageHash
        ) {
            setErrorMessage("Please connect your wallet first");
            return;
        }

        try {
            setStatus("uploading");

            // Mock IPFS upload
            const ipfsCid = await mockIpfsUpload(file);

            setStatus("registering");

            // Create Anchor provider
            const provider = new AnchorProvider(connection, wallet as any, {
                commitment: "confirmed",
            });

            // Initialize program (Anchor 0.30+ syntax)
            const program = new Program(IDL as any, provider);

            // Derive PDA for the image state
            // Use only first 32 bytes of hash to match program seeds
            const [imageStatePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("image"), Buffer.from(imageHash.slice(0, 32))],
                PROGRAM_ID,
            );

            // Call register_image instruction
            const tx = await program.methods
                .registerImage(imageHash, ipfsCid)
                .accounts({
                    imageState: imageStatePda,
                    author: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            setTxSignature(tx);
            setStatus("success");
        } catch (error: any) {
            console.error("Registration error:", error);
            setStatus("error");

            if (error.message?.includes("already in use")) {
                setErrorMessage(
                    "This image has already been registered on the blockchain!",
                );
            } else {
                setErrorMessage(error.message || "Failed to register image");
            }
        }
    };

    // Reset the form
    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setImageHash(null);
        setStatus("idle");
        setErrorMessage(null);
        setTxSignature(null);
    };

    return (
        <div className="bg-[#1e1e2e] rounded-2xl p-6 border border-gray-800">
            {/* Dropzone */}
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? "active" : ""}`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() =>
                        document.getElementById("fileInput")?.click()
                    }
                >
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                        Drop your image here
                    </p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Image Preview */}
                    <div className="relative">
                        <img
                            src={preview!}
                            alt="Preview"
                            className="w-full max-h-64 object-contain rounded-lg bg-[#181825]"
                        />
                        <button
                            onClick={handleReset}
                            className="absolute top-2 right-2 bg-[#11111b]/80 hover:bg-[#11111b] p-2 rounded-full transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>

                    {/* File Info */}
                    <div className="bg-[#181825] rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Image className="w-5 h-5 text-green-400" />
                            <span className="font-medium truncate">
                                {file.name}
                            </span>
                            <span className="text-sm text-gray-500">
                                ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                        </div>

                        {imageHash && (
                            <div className="flex items-start gap-3">
                                <Hash className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        SHA-256 Hash
                                    </p>
                                    <code className="text-xs text-gray-300 break-all font-mono">
                                        {imageHash}
                                    </code>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Messages */}
                    {status === "success" && (
                        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-green-400">
                                    Image Registered Successfully!
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    Transaction:{" "}
                                    <a
                                        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-400 hover:underline"
                                    >
                                        {txSignature?.slice(0, 20)}...
                                    </a>
                                </p>
                            </div>
                        </div>
                    )}

                    {status === "error" && errorMessage && (
                        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-red-400">
                                    Registration Failed
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {errorMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Register Button */}
                    {status !== "success" && (
                        <button
                            onClick={handleRegister}
                            disabled={
                                !wallet.publicKey ||
                                status === "hashing" ||
                                status === "uploading" ||
                                status === "registering"
                            }
                            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {status === "hashing" && (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Calculating Hash...
                                </>
                            )}
                            {status === "uploading" && (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading to IPFS...
                                </>
                            )}
                            {status === "registering" && (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Registering on Solana...
                                </>
                            )}
                            {(status === "idle" || status === "error") && (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    {wallet.publicKey
                                        ? "Register Truth"
                                        : "Connect Wallet to Register"}
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
