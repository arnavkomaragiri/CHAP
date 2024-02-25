document.getElementById('sendData').addEventListener('click', function() {
    const dataToSend = {
        command: "sendCustomDataToServer",
        service: "openai",
        prompt: "Hello,",
        data: "world!"
    };
    sendDataToServer(dataToSend);
});

function sendDataToServer(data) {
    const url = "http://localhost:8000"; // Ensure this matches your server's URL

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
    .then(responseData => {
        console.log('Response from the server:', responseData);
        document.getElementById('response').textContent = responseData.response;
    })
    .catch(error => {
        console.error('Failed to send custom data to the server:', error);
        document.getElementById('response').textContent = 'Failed to get response.';
    });
}
