"use client";

import { FC } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Eye } from "lucide-react";

// Dynamically import WalletMultiButton to avoid SSR issues
const WalletMultiButton = dynamic(
    () =>
        import("@solana/wallet-adapter-react-ui").then(
            (mod) => mod.WalletMultiButton,
        ),
    { ssr: false },
);

export const Navbar: FC = () => {
    return (
        <nav className="border-b border-gray-800 bg-[#11111b]/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11111b]"
                    aria-label="RealityCheck home"
                >
                    <Eye className="w-8 h-8 text-green-400" />
                    <span className="text-xl font-bold">
                        <span className="text-green-400">Reality</span>Check
                    </span>
                </Link>

                {/* Wallet Button */}
                <WalletMultiButton />
            </div>
        </nav>
    );
};
