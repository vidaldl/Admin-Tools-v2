// options/options.js
document.addEventListener("DOMContentLoaded", () => {
    // Request master lists from the background service worker.
    chrome.runtime.sendMessage({ action: "getMasterLists" }, (response) => {
      if (response) {
        const { clickableScripts, displayScripts } = response;
  
        // Retrieve existing settings from chrome.storage.sync.
        chrome.storage.sync.get(["enabledDisplays", "enabledClickables"], (data) => {
          const enabledDisplays = data.enabledDisplays || {};
          const enabledClickables = data.enabledClickables || {};
  
          // Populate the Display Scripts section.
          const displayContainer = document.getElementById("display-scripts-options");
          displayScripts.forEach(script => {
            const div = document.createElement("div");
            div.className = "form-check";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            checkbox.id = script.id;
            // Default to true if not explicitly set.
            checkbox.checked = enabledDisplays[script.id] === undefined ? true : enabledDisplays[script.id];
            
            const label = document.createElement("label");
            label.className = "form-check-label";
            label.htmlFor = script.id;
            label.textContent = script.name;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            displayContainer.appendChild(div);
          });
  
          // Populate the Clickable Scripts section.
          const clickableContainer = document.getElementById("clickable-scripts-options");
          clickableScripts.forEach(script => {
            const div = document.createElement("div");
            div.className = "form-check";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            checkbox.id = script.id;
            // Default to true if not explicitly set.
            checkbox.checked = enabledClickables[script.id] === undefined ? true : enabledClickables[script.id];
            
            const label = document.createElement("label");
            label.className = "form-check-label";
            label.htmlFor = script.id;
            label.textContent = script.name;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            clickableContainer.appendChild(div);
          });
        });
      }
    });
  
    // Save options when the "Save Options" button is clicked.
    document.getElementById("save-button").addEventListener("click", () => {
      const displayContainer = document.getElementById("display-scripts-options");
      const clickableContainer = document.getElementById("clickable-scripts-options");
  
      const newEnabledDisplays = {};
      Array.from(displayContainer.querySelectorAll("input[type='checkbox']")).forEach(checkbox => {
        newEnabledDisplays[checkbox.id] = checkbox.checked;
      });
  
      const newEnabledClickables = {};
      Array.from(clickableContainer.querySelectorAll("input[type='checkbox']")).forEach(checkbox => {
        newEnabledClickables[checkbox.id] = checkbox.checked;
      });
  
      chrome.storage.sync.set({
        enabledDisplays: newEnabledDisplays,
        enabledClickables: newEnabledClickables
      }, () => {
        alert("Options saved successfully!");
      });
    });
  });
  