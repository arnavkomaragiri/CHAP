// content.js
function extractAndSendURLs() {
    const links = Array.from(document.getElementsByTagName('a')).map(a => a.href);
    chrome.runtime.sendMessage({ command: "extractLinks", links: links });
}

// Trigger extraction upon some event, e.g., button click in the popup
extractAndSendURLs();
