document.getElementById('input').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    // Prevent the default action to stop the form from being submitted
    event.preventDefault();

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: {tabId: tabs[0].id},
        function: pageDataExtraction
      });
    });
  }
});

document.getElementById('send').addEventListener('click', function() {
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
  document.getElementById('send').addEventListener('click', function() {
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

// ------------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.command === "cleanedData") {
    sendDataToServer(message.data);
  }
});


function sendDataToServer(data) {
  // // Prevent the default action to stop the form from being submitted
  // event.preventDefault();

  // Get the input value
  let inputText = document.getElementById('input').value;

  // Get the selected service
  let service = document.getElementById('service').value;
  
  // Append the user input to the chatbox
  let chatbox = document.getElementById('chatbox');
  let userMessageDiv = document.createElement('div');
  userMessageDiv.setAttribute('id', 'user');
  userMessageDiv.textContent = inputText;
  chatbox.appendChild(userMessageDiv);

  // Send the input data to the server
  const dataToSend = {
    service: service,
    prompt: "Answer the following prompt given the context:" + inputText,
    data: "Context (use the following text to answer): " + data
  };

  // Clear the input field
  document.getElementById('input').value = '';
  
  const url = "http://localhost:8000"; // Ensure this matches your server's URL

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataToSend)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(responseData => {
    chatbox = document.getElementById('chatbox');
    let botResponseDiv = document.createElement('div');
    botResponseDiv.setAttribute('id', 'bot');
    botResponseDiv.textContent = responseData.response;
    chatbox.appendChild(botResponseDiv);
  })
  .catch(error => {
    const chatbox = document.getElementById('chatbox');
    const botResponseDiv = document.createElement('div');
    botResponseDiv.setAttribute('id', 'bot');
    botResponseDiv.textContent = "error";
    chatbox.appendChild(botResponseDiv);
  });
}
