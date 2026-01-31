"use client";

import { Navbar } from "@/components/Navbar";
import { UploadZone } from "@/components/UploadZone";
import { VerifySection } from "@/components/VerifySection";
import { Shield, Lock, Globe } from "lucide-react";

export default function Home() {
    return (
        <main className="min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        <span className="text-green-400">Reality</span>Check
                    </h1>
                    <p className="text-xl text-gray-400 mb-8">
                        Decentralized Media Verification on Solana. Anchor your
                        images to the blockchain to fight disinformation.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        <div className="flex items-center gap-2 bg-[#1e1e2e] px-4 py-2 rounded-full">
                            <Shield className="w-5 h-5 text-green-400" />
                            <span className="text-sm">Immutable Proof</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#1e1e2e] px-4 py-2 rounded-full">
                            <Lock className="w-5 h-5 text-green-400" />
                            <span className="text-sm">
                                Censorship Resistant
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#1e1e2e] px-4 py-2 rounded-full">
                            <Globe className="w-5 h-5 text-green-400" />
                            <span className="text-sm">Decentralized</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upload Section */}
            <section className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 text-center">
                        Register Your Image
                    </h2>
                    <UploadZone />
                </div>
            </section>

            {/* Verify Section */}
            <section className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 text-center">
                        Verify an Image
                    </h2>
                    <VerifySection />
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-gray-500 border-t border-gray-800">
                <p>Built for Spartahack 11 • Powered by Solana</p>
            </footer>
        </main>
    );
}
