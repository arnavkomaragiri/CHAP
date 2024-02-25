chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command === "processPage") {
        // Clean the current page's data before adding
        const allData = [cleanTextData(request.data)];
        let linksToProcess = request.links.slice(0, 10); // Limit the number of links for simplicity and performance
        let linksProcessed = 0;

        if (linksToProcess.length === 0) {
            saveData(allData.join("\n\n"));
            return;
        }

        linksToProcess.forEach(link => {
            try {
                fetch(link).then(response => response.text()).then(content => {
                    // Clean the fetched content before adding
                    allData.push(`Data from ${link}: ${cleanTextData(content)}`);
                    linksProcessed++;
                    if (linksProcessed === linksToProcess.length) {
                        saveData(allData.join("\n\n"));
                    }
                }).catch(error => {
                    console.error(`Error fetching ${link}:`, error);
                    linksProcessed++;
                    if (linksProcessed === linksToProcess.length) {
                        saveData(allData.join("\n\n"));
                    }
                });
            } catch (error) {
                console.error(`Error processing ${link}:`, error);
                linksProcessed++;
                if (linksProcessed === linksToProcess.length) {
                    saveData(allData.join("\n\n"));
                }
            }
        });
    }
});

function cleanTextData(text) {
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



function saveData(data) {
    const blob = new Blob([data], {type: 'text/plain'});
    const reader = new FileReader();
    reader.onload = function() {
        chrome.downloads.download({
            url: reader.result,
            filename: 'extracted_data.txt'
        });
    };
    reader.readAsDataURL(blob);
}
