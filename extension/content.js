// RealityCheck Content Script
// Adds verification buttons to images and checks them against the blockchain


const REALITYCHECK_API_BASE = "https://reality-check-deployment.vercel.app";
const REALITYCHECK_API_VERIFY = `${REALITYCHECK_API_BASE}/api/verify`;

(function () {
    "use strict";

    // Configuration
    const MIN_IMAGE_SIZE = 50; // Minimum width/height to add verify button

    // Stats tracking
    let stats = {
        imagesFound: 0,
        imagesVerified: 0,
    };

    // Track processed images to avoid duplicates
    const processedImages = new WeakSet();
    const verificationCache = new Map();

    /**
     * Calculate SHA-256 hash of an ArrayBuffer
     */
    async function calculateHash(buffer) {
        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    /**
     * Fetch image as blob and calculate hash
     */
    async function getImageHash(imgElement) {
        try {
            // Get the image source
            let imgSrc = imgElement.currentSrc || imgElement.src;

            // Handle data URLs directly
            if (imgSrc.startsWith("data:") || imgSrc.startsWith("blob:")) {
                const response = await fetch(imgSrc);
                const blob = await response.blob();
                const buffer = await blob.arrayBuffer();
                return calculateHash(buffer);
            }

            // Use background script to fetch image (bypasses CORS)
            const response = await chrome.runtime.sendMessage({
                type: "FETCH_IMAGE",
                url: imgSrc,
            });

            if (!response.success) {
                throw new Error(response.error || "Failed to fetch image");
            }

            // Convert base64 back to ArrayBuffer
            const binaryString = atob(response.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return calculateHash(bytes.buffer);
        } catch (error) {
            console.error("RealityCheck: Error fetching image:", error);
            throw error;
        }
    }

    /**
     * Verify image against the blockchain API
     */
    async function verifyImage(hash) {
        // Check cache first
        if (verificationCache.has(hash)) {
            return verificationCache.get(hash);
        }

        try {
            const response = await fetch(
                `${REALITYCHECK_API_VERIFY}?hash=${encodeURIComponent(hash)}`,
            );
            const data = await response.json();

            // If the API returns a non-2xx, treat it as an error so we don't
            // incorrectly label it as "Not Found".
            if (!response.ok) {
                const errorPayload = {
                    verified: false,
                    error:
                        data?.error ||
                        data?.message ||
                        `Verification request failed (${response.status})`,
                    details: data?.details,
                };
                verificationCache.set(hash, errorPayload);
                return errorPayload;
            }

            // Cache the result
            verificationCache.set(hash, data);

            return data;
        } catch (error) {
            // Common causes here: CORS blocked by page context, mixed-content,
            // localhost unreachable. Fall back to background service worker.
            console.error("RealityCheck: Verification API error:", error);

            try {
                const data = await chrome.runtime.sendMessage({
                    type: "VERIFY_HASH",
                    hash,
                });

                verificationCache.set(hash, data);
                return data;
            } catch (fallbackError) {
                console.error(
                    "RealityCheck: Background verification failed:",
                    fallbackError,
                );
                return { verified: false, error: "API unavailable" };
            }
        }
    }

    /**
     * Create the verify button element
     */
    function createVerifyButton() {
        const button = document.createElement("button");
        button.className = "realitycheck-verify-btn";
        button.innerHTML = "Verify";
        button.style.display = "none";
        return button;
    }

    /**
     * Create status badge
     */
    function createBadge(verified, data) {
        const badge = document.createElement("div");
        badge.className = `realitycheck-badge ${verified ? "verified" : "unverified"}`;

        if (verified && data) {
            const date = new Date(data.timestamp * 1000).toLocaleDateString();
            badge.innerHTML = `✓ Verified • ${date}`;
        } else {
            badge.innerHTML = "⚠ Not Verified";
        }

        return badge;
    }

    /**
     * Add verification functionality to an image
     */
    function processImage(img) {
        // Skip if already processed
        if (processedImages.has(img)) return;

        // Skip small images (likely icons/decorations)
        if (img.width < MIN_IMAGE_SIZE || img.height < MIN_IMAGE_SIZE) return;

        // Skip images without src
        if (!img.src && !img.currentSrc) return;

        processedImages.add(img);
        stats.imagesFound++;

        // Create wrapper if image isn't already wrapped
        let wrapper = img.parentElement;
        if (!wrapper.classList.contains("realitycheck-wrapper")) {
            // For images with complex parents, just position relative
            const computedStyle = window.getComputedStyle(img.parentElement);
            if (computedStyle.position === "static") {
                img.parentElement.style.position = "relative";
            }
            wrapper = img.parentElement;
        }

        // Create verify button
        const verifyBtn = createVerifyButton();

        // Position button relative to image
        const updateButtonPosition = () => {
            const rect = img.getBoundingClientRect();
            const parentRect = wrapper.getBoundingClientRect();

            verifyBtn.style.position = "absolute";
            verifyBtn.style.top = `${rect.top - parentRect.top + 8}px`;
            verifyBtn.style.right = `${parentRect.right - rect.right + 8}px`;
        };

        // Add button to wrapper
        wrapper.appendChild(verifyBtn);

        // Show button on hover
        img.addEventListener("mouseenter", () => {
            updateButtonPosition();
            verifyBtn.style.display = "flex";
        });

        img.addEventListener("mouseleave", (e) => {
            // Don't hide if moving to the button
            if (e.relatedTarget === verifyBtn) return;
            verifyBtn.style.display = "none";
        });

        verifyBtn.addEventListener("mouseleave", (e) => {
            if (e.relatedTarget !== img) {
                verifyBtn.style.display = "none";
            }
        });

        // Handle verification click
        verifyBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Show loading state
            verifyBtn.classList.add("loading");
            verifyBtn.innerHTML = "Checking...";

            try {
                // Calculate hash
                const hash = await getImageHash(img);
                console.log("RealityCheck: Image hash:", hash);

                // Verify against blockchain
                const result = await verifyImage(hash);
                console.log("RealityCheck: Verification result:", result);

                // Update UI based on result
                img.classList.remove(
                    "realitycheck-verified",
                    "realitycheck-unverified",
                );

                if (result.verified) {
                    img.classList.add("realitycheck-verified");
                    verifyBtn.innerHTML = "✓ Verified";
                    verifyBtn.style.background = "#22c55e";
                    stats.imagesVerified++;
                } else if (result.error) {
                    img.classList.add("realitycheck-unverified");
                    verifyBtn.innerHTML = "⚠ Error";
                    verifyBtn.style.background = "#f59e0b";
                } else {
                    img.classList.add("realitycheck-unverified");
                    verifyBtn.innerHTML = "✗ Not Found";
                    verifyBtn.style.background = "#ef4444";
                }

                // Remove existing badge if any
                const existingBadge = wrapper.querySelector(".realitycheck-badge");
                if (existingBadge) existingBadge.remove();

                // Add status badge
                const badge = createBadge(result.verified, result.data);
                const imgRect = img.getBoundingClientRect();
                const parentRect = wrapper.getBoundingClientRect();
                badge.style.position = "absolute";
                badge.style.bottom = `${parentRect.bottom - imgRect.bottom + 8}px`;
                badge.style.left = `${imgRect.left - parentRect.left + 8}px`;
                wrapper.appendChild(badge);
            } catch (error) {
                console.error("RealityCheck: Verification failed:", error);
                verifyBtn.innerHTML = "⚠ Error";
                verifyBtn.style.background = "#f59e0b";
            }

            verifyBtn.classList.remove("loading");
        });
    }

    /**
     * Scan page for images
     */
    function scanImages() {
        const images = document.querySelectorAll("img");
        images.forEach(processImage);
    }

    /**
     * Initialize extension
     */
    function init() {
        // Don't run on RealityCheck's own website
        if (window.location.href.includes("reality-check-deployment.vercel.app")) {
            console.log("RealityCheck: Skipping extension on RealityCheck website");
            return;
        }

        console.log("RealityCheck: Content script loaded");

        // Initial scan
        scanImages();

        // Watch for dynamically added images
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === "IMG") {
                        processImage(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll("img").forEach(processImage);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Re-scan on scroll (for lazy-loaded images)
        let scrollTimeout;
        window.addEventListener("scroll", () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(scanImages, 500);
        });
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "GET_STATS") {
            sendResponse(stats);
        }
        return true;
    });

    // Run when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
