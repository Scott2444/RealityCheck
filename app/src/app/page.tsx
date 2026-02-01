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

                    {/* Extension Download */}
                    <div className="max-w-2xl mx-auto mb-10">
                        <div className="rounded-2xl border border-gray-800 bg-[#12121a] p-6 md:p-7 text-left">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-lg md:text-xl font-semibold">
                                        Get the RealityCheck Browser Extension
                                    </h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Not in the Chrome Web Store yet — install it manually.
                                    </p>
                                </div>
                                <a
                                    href="/extension.zip"
                                    download
                                    className="inline-flex items-center justify-center rounded-xl bg-green-500 px-5 py-3 font-semibold text-black hover:bg-green-400 transition-colors"
                                >
                                    Download Extension (.zip)
                                </a>
                            </div>

                            <div className="mt-5 grid gap-2 text-sm text-gray-300">
                                <p className="text-gray-400">
                                    Install steps:
                                </p>
                                <p>
                                    1) Download and unzip
                                    <span className="font-semibold"> extension.zip</span>
                                </p>
                                <p>
                                    2) Open <span className="font-semibold">chrome://extensions</span>
                                    , enable <span className="font-semibold">Developer mode</span>
                                </p>
                                <p>
                                    3) Click <span className="font-semibold">Load unpacked</span> and
                                    select the unzipped folder
                                </p>
                            </div>
                        </div>
                    </div>

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
