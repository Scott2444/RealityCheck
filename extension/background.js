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
        fetch(message.url)
            .then((response) => response.blob())
            .then((blob) => blob.arrayBuffer())
            .then((buffer) => {
                // Convert to base64 for message passing
                const uint8Array = new Uint8Array(buffer);
                const base64 = btoa(
                    String.fromCharCode.apply(null, uint8Array),
                );
                sendResponse({ success: true, data: base64 });
            })
            .catch((error) => {
                sendResponse({ success: false, error: error.message });
            });

        return true; // Keep message channel open for async response
    }

    if (message.type === "VERIFY_HASH") {
        // Forward verification request to API
        fetch(`http://localhost:3000/api/verify?hash=${message.hash}`)
            .then((response) => response.json())
            .then((data) => {
                sendResponse(data);
            })
            .catch((error) => {
                sendResponse({ verified: false, error: error.message });
            });

        return true;
    }
});
