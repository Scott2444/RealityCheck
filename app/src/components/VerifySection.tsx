"use client";

import { FC, useState, useCallback } from "react";
import {
    Search,
    Upload,
    CheckCircle,
    XCircle,
    Loader2,
    User,
    Clock,
} from "lucide-react";

interface VerificationResult {
    verified: boolean;
    data?: {
        author: string;
        timestamp: number;
        ipfsCid: string;
    };
}

export const VerifySection: FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageHash, setImageHash] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<
        "idle" | "hashing" | "verifying" | "done"
    >("idle");
    const [result, setResult] = useState<VerificationResult | null>(null);

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

    // Handle file drop
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setStatus("idle");
        setResult(null);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            setFile(droppedFile);
            setPreview(URL.createObjectURL(droppedFile));

            setStatus("hashing");
            const hash = await calculateHash(droppedFile);
            setImageHash(hash);

            // Automatically verify after hashing
            await verifyImage(hash);
        }
    }, []);

    // Handle file input change
    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            setStatus("idle");
            setResult(null);

            const selectedFile = e.target.files?.[0];
            if (selectedFile && selectedFile.type.startsWith("image/")) {
                setFile(selectedFile);
                setPreview(URL.createObjectURL(selectedFile));

                setStatus("hashing");
                const hash = await calculateHash(selectedFile);
                setImageHash(hash);

                // Automatically verify after hashing
                await verifyImage(hash);
            }
        },
        [],
    );

    // Verify image against blockchain
    const verifyImage = async (hash: string) => {
        setStatus("verifying");

        try {
            const response = await fetch(`/api/verify?hash=${hash}`);
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error("Verification error:", error);
            setResult({ verified: false });
        }

        setStatus("done");
    };

    // Reset the form
    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setImageHash(null);
        setStatus("idle");
        setResult(null);
    };

    // Format timestamp
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    // Truncate address
    const truncateAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
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
                        document.getElementById("verifyFileInput")?.click()
                    }
                >
                    <input
                        id="verifyFileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <Search className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">
                        Drop an image to verify
                    </p>
                    <p className="text-sm text-gray-500">
                        Check if it&apos;s registered on the blockchain
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Image Preview with Border Indicator */}
                    <div className="relative">
                        <img
                            src={preview!}
                            alt="Preview"
                            className={`w-full max-h-64 object-contain rounded-lg bg-[#181825] border-4 ${
                                status === "done"
                                    ? result?.verified
                                        ? "border-green-500"
                                        : "border-red-500"
                                    : "border-transparent"
                            }`}
                        />
                        <button
                            onClick={handleReset}
                            className="absolute top-2 right-2 bg-[#11111b]/80 hover:bg-[#11111b] p-2 rounded-full transition-colors"
                        >
                            <XCircle className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Loading State */}
                    {(status === "hashing" || status === "verifying") && (
                        <div className="flex items-center justify-center gap-3 py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-green-400" />
                            <span className="text-gray-400">
                                {status === "hashing"
                                    ? "Calculating hash..."
                                    : "Verifying on blockchain..."}
                            </span>
                        </div>
                    )}

                    {/* Verification Result */}
                    {status === "done" && result && (
                        <div
                            className={`rounded-lg p-4 ${
                                result.verified
                                    ? "bg-green-900/20 border border-green-500"
                                    : "bg-red-900/20 border border-red-500"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {result.verified ? (
                                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                                )}
                                <div className="flex-1">
                                    <p
                                        className={`font-bold text-lg ${
                                            result.verified
                                                ? "text-green-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {result.verified
                                            ? "✓ Verified Original"
                                            : "⚠ Not Verified"}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {result.verified
                                            ? "This image is registered on the Solana blockchain"
                                            : "No blockchain record found. This image may be unregistered, modified, or AI-generated."}
                                    </p>

                                    {/* Additional Details for Verified Images */}
                                    {result.verified && result.data && (
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-500">
                                                    Author:
                                                </span>
                                                <a
                                                    href={`https://explorer.solana.com/address/${result.data.author}?cluster=devnet`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-400 hover:underline font-mono"
                                                >
                                                    {truncateAddress(
                                                        result.data.author,
                                                    )}
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-500">
                                                    Registered:
                                                </span>
                                                <span>
                                                    {formatDate(
                                                        result.data.timestamp,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hash Display */}
                    {imageHash && (
                        <div className="bg-[#181825] rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">
                                SHA-256 Hash
                            </p>
                            <code className="text-xs text-gray-300 break-all font-mono">
                                {imageHash}
                            </code>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
