chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.command === "saveData") {
        const blob = new Blob([request.data], {type: 'text/plain'});
        const reader = new FileReader();
        reader.onload = function() {
            // This event is triggered once reading is complete
            const base64data = reader.result;
            chrome.downloads.download({
                url: base64data,
                filename: 'extracted_data.txt'
            }, function(downloadId) {
                console.log('Data saved as extracted_data.txt', downloadId);
                // Optionally, send a response back if needed
                sendResponse({status: 'Data saved successfully'});
            });
        };
        reader.readAsDataURL(blob);

        // Keep the messaging channel open for the response
        return true;
    }
});
