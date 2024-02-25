document.getElementById('extractBtn').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) {
            console.error("No active tab found.");
            return;
        }
        try {
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                function: extractData
            }, (injectionResults) => {
                // Handle the response here
                chrome.runtime.sendMessage({
                    command: "saveData",
                    data: injectionResults[0].result
                }, response => {
                    console.log(response.status);
                });
            });
        } catch (error) {
            console.error("Failed to execute script:", error);
        }
    });
});

function extractData() {
    return document.documentElement.innerText;
}
