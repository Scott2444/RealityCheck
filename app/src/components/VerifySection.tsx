"use client";

import { FC, useEffect, useRef, useState, useCallback } from "react";
import {
    Search,
    CheckCircle,
    XCircle,
    Loader2,
    User,
    Clock,
    Copy,
} from "lucide-react";

interface VerificationResult {
    verified: boolean;
    message?: string;
    error?: string;
    details?: string;
    data?: {
        author: string;
        timestamp: number;
        ipfsCid: string;
    };
}

export const VerifySection: FC = () => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageHash, setImageHash] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<
        "idle" | "hashing" | "verifying" | "done"
    >("idle");
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [hashCopied, setHashCopied] = useState(false);

    const MAX_FILE_SIZE_MB = 10;

    useEffect(() => {
        if (!preview) return;
        return () => {
            URL.revokeObjectURL(preview);
        };
    }, [preview]);

    // Calculate SHA-256 hash of file
    const calculateHash = useCallback(async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return hashHex;
    }, []);

    const validateFile = useCallback(
        (candidate: File): string | null => {
        if (!candidate.type.startsWith("image/")) {
            return "Please select an image file.";
        }
        if (candidate.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            return `Image must be ≤ ${MAX_FILE_SIZE_MB}MB.`;
        }
        return null;
        },
        [MAX_FILE_SIZE_MB],
    );

    // Verify image against blockchain
    const verifyImage = useCallback(async (hash: string) => {
        setStatus("verifying");

        try {
            const response = await fetch(`/api/verify?hash=${hash}`);
            const data = (await response
                .json()
                .catch(() => ({ verified: false }))) as VerificationResult;

            if (!response.ok) {
                setResult({
                    verified: false,
                    message:
                        data.error ||
                        data.message ||
                        "Verification request failed.",
                    error: data.error,
                    details: data.details,
                });
            } else {
                setResult(data);
            }
        } catch (error) {
            console.error("Verification error:", error);
            setResult({
                verified: false,
                message: "Network error while verifying image.",
            });
        }

        setStatus("done");
    }, []);

    const startVerificationFlow = useCallback(async (selectedFile: File) => {
        setErrorMessage(null);
        setResult(null);
        setStatus("idle");
        setHashCopied(false);

        const validationError = validateFile(selectedFile);
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));

        setStatus("hashing");
        const hash = await calculateHash(selectedFile);
        setImageHash(hash);

        await verifyImage(hash);
    }, [calculateHash, validateFile, verifyImage]);

    // Handle file drop
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (!droppedFile) return;

        await startVerificationFlow(droppedFile);
    }, [startVerificationFlow]);

    // Handle file input change
    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (!selectedFile) return;

            await startVerificationFlow(selectedFile);
        },
        [startVerificationFlow],
    );

    // Reset the form
    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setImageHash(null);
        setStatus("idle");
        setResult(null);
        setErrorMessage(null);
        setHashCopied(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const triggerFilePicker = () => {
        if (!fileInputRef.current) return;
        fileInputRef.current.value = "";
        fileInputRef.current.click();
    };

    const handleCopyHash = async () => {
        if (!imageHash) return;
        try {
            await navigator.clipboard.writeText(imageHash);
            setHashCopied(true);
            window.setTimeout(() => setHashCopied(false), 1200);
        } catch {
            // Ignore clipboard failures
        }
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
                    role="button"
                    tabIndex={0}
                    aria-label="Select an image to verify"
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={triggerFilePicker}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            triggerFilePicker();
                        }
                    }}
                >
                    <input
                        id="verifyFileInput"
                        ref={fileInputRef}
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
                            aria-label="Remove image"
                            className="absolute top-2 right-2 bg-[#11111b]/80 hover:bg-[#11111b] p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181825]"
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
                                                                                        : result.message ||
                                                                                            "No blockchain record found. This image may be unregistered, modified, or AI-generated."}
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
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-xs text-gray-500">
                                    SHA-256 Hash
                                </p>
                                <button
                                    type="button"
                                    onClick={handleCopyHash}
                                    className="text-xs text-green-400 hover:underline inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#181825] rounded"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    {hashCopied ? "Copied" : "Copy"}
                                </button>
                            </div>
                            <code className="text-xs text-gray-300 break-all font-mono">
                                {imageHash}
                            </code>
                        </div>
                    )}
                </div>
            )}

            {/* Inline error */}
            {!file && errorMessage && (
                <p className="mt-4 text-sm text-red-400" role="alert">
                    {errorMessage}
                </p>
            )}
        </div>
    );
};
