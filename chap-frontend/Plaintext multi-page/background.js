chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command === "processPage") {
        const allData = [cleanTextData(request.data)];
        let linksToProcess = request.links.slice(0, 10); // Simplified for demonstration
        let linksProcessed = 0;

        if (linksToProcess.length === 0) {
            saveData(allData.join("\n\n"));
        } else {
            linksToProcess.forEach(link => {
                try {
                    fetch(link).then(response => response.text()).then(content => {
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
    } else if (request.command === "sendCustomDataToServer") {
        // This part is adapted from the Python code
        sendDataToServer({
            service: "openai",
            prompt: "Hello,",
            data: "world!"
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
    fetch('http://localhost:8000', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: data })
    })
    .then(response => response.json())
    .then(responseData => {
        // document.getElementById("response_text").innerText = responseData;
        console.log('Data successfully sent to the server:', responseData);
        chrome.runtime.sendMessage({command: "dataSaved", success: true, message: "Data successfully sent to the server."});
    })
    .catch(error => {
        console.error('Failed to send data to the server:', error);
        // Optionally, send error status back to popup
        chrome.runtime.sendMessage({command: "dataSaved", success: false, message: "Failed to send data to the server."});
    });
    const snippet = data.slice(0, 20);
    chrome.runtime.sendMessage({
        command: "dataProcessed",
        snippet: snippet
    });
}

function sendDataToServer(data) {
    // Function adapted from the Python example to send specific data to a server
    const url = "http://localhost:8000"; // Replace with your server's URL

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(responseData => console.log('Response from the server:', responseData))
    .catch(error => console.error('Failed to send custom data to the server:', error));
}
