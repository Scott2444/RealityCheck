// RealityCheck Background Service Worker
// Handles cross-origin requests and caching

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
    console.log("RealityCheck extension installed");
});

// Handle messages from content scripts (for CORS bypass if needed)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "FETCH_IMAGE") {
        // Fetch image from background to bypass CORS
        fetch(message.url, {
            mode: "cors",
            credentials: "omit",
            cache: "force-cache",
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        `HTTP error! status: ${response.status}`,
                    );
                }
                return response.blob();
            })
            .then((blob) => blob.arrayBuffer())
            .then((buffer) => {
                // Convert to base64 for message passing
                const uint8Array = new Uint8Array(buffer);
                // Use chunk-based approach for large images to avoid stack overflow
                let base64 = "";
                const chunkSize = 32768; // 32KB chunks
                for (let i = 0; i < uint8Array.length; i += chunkSize) {
                    const chunk = uint8Array.subarray(
                        i,
                        i + chunkSize,
                    );
                    base64 += String.fromCharCode.apply(null, chunk);
                }
                base64 = btoa(base64);
                sendResponse({ success: true, data: base64 });
            })
            .catch((error) => {
                console.error("Background fetch error:", error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // Keep message channel open for async response
    }

    if (message.type === "VERIFY_HASH") {
        // Forward verification request to API
        fetch(
            `http://localhost:3000/api/verify?hash=${encodeURIComponent(
                message.hash,
            )}`,
        )
            .then(async (response) => {
                const data = await response
                    .json()
                    .catch(() => ({ verified: false }));

                if (!response.ok) {
                    sendResponse({
                        verified: false,
                        error:
                            data?.error ||
                            data?.message ||
                            `Verification request failed (${response.status})`,
                        details: data?.details,
                    });
                    return;
                }

                sendResponse(data);
            })
            .catch((error) => {
                sendResponse({ verified: false, error: error.message });
            });

        return true;
    }
});
