const button = document.getElementById("toggleButton");

async function refresh() {
    const result = await chrome.storage.local.get("enabled");

    const enabled = result.enabled ?? false;

    button.textContent = enabled
        ? "Extension ENABLED"
        : "Extension DISABLED";
}

button.addEventListener("click", async () => {
    const result = await chrome.storage.local.get("enabled");

    const enabled = !(result.enabled ?? false);

    await chrome.storage.local.set({ enabled });

    refresh();
});

refresh();