// options/options.js
document.addEventListener("DOMContentLoaded", () => {
    // Request the master lists from the background service worker.
    chrome.runtime.sendMessage({ action: "getMasterLists" }, (response) => {
      if (response) {
        const { clickableScripts, displayScripts } = response;
  
        // Retrieve existing settings from storage.
        chrome.storage.sync.get(["enabledDisplays", "enabledClickables"], (data) => {
          const enabledDisplays = data.enabledDisplays || {};
          const enabledClickables = data.enabledClickables || {};
  
          // Populate the Display Scripts section.
          const displayContainer = document.getElementById("display-scripts-options");
          displayScripts.forEach(script => {
            // Create the container div
            const div = document.createElement("div");
            div.className = "form-check form-switch mb-3";
  
            // Create the checkbox input
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            checkbox.id = script.id;
            // Default to true if not explicitly set.
            checkbox.checked = (enabledDisplays[script.id] === undefined) ? true : enabledDisplays[script.id];
  
            // Create the label with the script name.
            const label = document.createElement("label");
            label.className = "form-check-label fw-semibold";
            label.htmlFor = script.id;
            label.textContent = script.name;
  
            // Create the paragraph for the description.
            const p = document.createElement("p");
            p.className = "toggle-description";
            p.textContent = script.description;
  
            // Append elements to the container div.
            div.appendChild(checkbox);
            div.appendChild(label);
            div.appendChild(p);
  
            // Append the container div to the display section.
            displayContainer.appendChild(div);
          });
  
          // Populate the Clickable Scripts section.
          const clickableContainer = document.getElementById("clickable-scripts-options");
          clickableScripts.forEach(script => {
            const div = document.createElement("div");
            div.className = "form-check form-switch mb-3";
  
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            checkbox.id = script.id;
            checkbox.checked = (enabledClickables[script.id] === undefined) ? true : enabledClickables[script.id];
  
            const label = document.createElement("label");
            label.className = "form-check-label fw-semibold";
            label.htmlFor = script.id;
            label.textContent = script.name;
  
            const p = document.createElement("p");
            p.className = "toggle-description";
            p.textContent = script.description;
  
            div.appendChild(checkbox);
            div.appendChild(label);
            div.appendChild(p);
            clickableContainer.appendChild(div);
          });
        });
      }
    });
  
    // Auto-save changes for Display Scripts when any toggle changes.
    document.getElementById("display-scripts-options").addEventListener("change", (e) => {
      if (e.target && e.target.type === "checkbox") {
        const container = document.getElementById("display-scripts-options");
        const newEnabledDisplays = {};
        Array.from(container.querySelectorAll("input[type='checkbox']")).forEach(checkbox => {
          newEnabledDisplays[checkbox.id] = checkbox.checked;
        });
        chrome.storage.sync.set({ enabledDisplays: newEnabledDisplays }, () => {
          console.log("Updated enabledDisplays:", newEnabledDisplays);
        });
      }
    });
  
    // Auto-save changes for Clickable Scripts when any toggle changes.
    document.getElementById("clickable-scripts-options").addEventListener("change", (e) => {
      if (e.target && e.target.type === "checkbox") {
        const container = document.getElementById("clickable-scripts-options");
        const newEnabledClickables = {};
        Array.from(container.querySelectorAll("input[type='checkbox']")).forEach(checkbox => {
          newEnabledClickables[checkbox.id] = checkbox.checked;
        });
        chrome.storage.sync.set({ enabledClickables: newEnabledClickables }, () => {
          console.log("Updated enabledClickables:", newEnabledClickables);
        });
      }
    });
  });
  