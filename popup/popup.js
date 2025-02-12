// popup/popup.js
document.addEventListener('DOMContentLoaded', () => {
    // Request enabled clickable scripts from the background service worker.
    chrome.runtime.sendMessage({ action: 'getEnabledClickables' }, (response) => {
      const container = document.getElementById('clickable-buttons-container');
      if (response && Array.isArray(response.clickables)) {
        response.clickables.forEach(script => {
          // Create a button element for each clickable script.
          const btn = document.createElement('button');
          btn.textContent = script.name;
          btn.className = 'btn btn-primary mb-2';
          // When the button is clicked, inject the corresponding script into the active tab.
          btn.addEventListener('click', async () => {
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.id) {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: [script.file]
              }, () => {
                console.log(`Injected ${script.name} into tab ${tab.id}`);
              });
            }
          });
          container.appendChild(btn);
        });
      }
    });

    // Open the options page when the corresponding button is clicked.
    document.getElementById("open-options").addEventListener("click", () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL("options/options.html")
          });
      });
  });
  