// Popup script - queries content script for page stats
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        if (tab?.id) {
            // Send message to content script to get stats
            chrome.tabs.sendMessage(
                tab.id,
                { type: "GET_STATS" },
                (response) => {
                    if (response) {
                        document.getElementById("imagesFound").textContent =
                            response.imagesFound || 0;
                        document.getElementById("imagesVerified").textContent =
                            response.imagesVerified || 0;
                    }
                },
            );
        }
    } catch (error) {
        console.log("Could not get stats from page");
    }
});
