import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "RealityCheck - Decentralized Media Verification",
    description:
        "Anchor your images to the Solana blockchain to fight disinformation",
        icons: {
            icon: [
                { url: "/RealityCheckIcon.svg", type: "image/svg+xml" },
            ],
            shortcut: ["/RealityCheckIcon.svg"],
        },
    };

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <WalletContextProvider>{children}</WalletContextProvider>
            </body>
        </html>
    );
}
