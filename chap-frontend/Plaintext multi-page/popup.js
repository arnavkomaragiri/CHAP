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
