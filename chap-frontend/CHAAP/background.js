chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command === "processPage") {
        var allData = [cleanTextData(request.data)];
        let linksToProcess = request.links.slice(0, 10);
        let linksProcessed = 0;

        if (linksToProcess.length === 0) {
            allData = "";
        } else {
            linksToProcess.forEach(link => {
                try {
                    fetch(link).then(response => response.text()).then(content => {
                        allData.push(`Data from ${link}: ${cleanTextData(content)}`);
                        linksProcessed++;
                    }).catch(error => {
                        console.error(`Error fetching ${link}:`, error);
                        linksProcessed++;
                    });
                } catch (error) {
                    console.error(`Error processing ${link}:`, error);
                    linksProcessed++;
                }
            });
        }
    } 

    let allDataString = allData.join(" ");
    chrome.runtime.sendMessage({command: "cleanedData", data: allDataString})
});

function cleanTextData(text) {
    if (!text) {
        return '';
    }
    // Remove HTML tags
    let cleanedText = text.replace(/<[^>]*>?/gm, '');

    // Remove CSS styl
    cleanedText = cleanedText.replace(/<style[^>]*>.*?<\/style>/gms, '');
    cleanedText = cleanedText.replace(/style="[^"]*"/gm, '');

    // Attempt to remove basic JavaScript
    cleanedText = cleanedText.replace(/<script[^>]*>.*?<\/script>/gms, '');

    // Attempt to remove JavaScript event handlers
    cleanedText = cleanedText.replace(/\son\w+="[^"]*"/gm, '');

    // Enhanced: Remove CSS syntax patterns
    cleanedText = cleanedText.replace(/(\.|#)[\s\S]+?\{[\s\S]+?\}/gm, '');

    // Remove blank lines
    cleanedText = cleanedText.replace(/^\s*[\r\n]/gm, '');

    // JSON Objects
    cleanedText = cleanedText.replace(/\{[^{}]*\}/gm, '');

    // JSON Arrays
    cleanedText = cleanedText.replace(/\[[^\[\]]*\]/gm, '');

    // Remove specific phrases
    cleanedText = cleanedText.replace(/\b(right arrow|left arrow|up arrow|down arrow)\b/gi, '');

    return cleanedText;
}