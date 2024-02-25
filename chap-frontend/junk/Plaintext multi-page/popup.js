document.getElementById('extractBtn').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            function: pageDataExtraction
        });
    });
});

function pageDataExtraction() {
    const data = document.documentElement.innerText;
    const links = Array.from(document.getElementsByTagName('a')).map(a => a.href);
    chrome.runtime.sendMessage({command: "processPage", data: data, links: links});
}


document.addEventListener('DOMContentLoaded', function() {
    // Example button click listener
    document.getElementById('extractBtn').addEventListener('click', function() {
        // Example of sending a message to your background script to trigger data processing
        chrome.runtime.sendMessage({command: "processPage"});
    });

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.command === "dataSaved") {
            // Update the popup UI based on the success or failure of the operation
            const statusElement = document.getElementById('status');
            if (message.success) {
                statusElement.textContent = message.message; // "Data successfully sent to the server."
                statusElement.style.color = "green";

            } else {
                statusElement.textContent = message.message; // "Failed to send data to the server."
                statusElement.style.color = "red";
            }
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('extractBtn').addEventListener('click', function() {
        // Trigger data processing in the background script
        chrome.runtime.sendMessage({command: "processPage"});
    });

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.command === "dataProcessed") {
            // Update the snippet element with the first 20 characters of the data
            document.getElementById("snippet").innerText = message.snippet;
        }
    });
});