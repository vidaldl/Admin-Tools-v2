// background/background.js
"use strict";

/* --------------------------
   Master Lists for Scripts
--------------------------- */
// Master list for clickable scripts (triggered from the popup)
const clickableScripts = [
  { id: "clickableScript1", name: "Action One", file: "content/clickables/clickableScript1.js" },
  { id: "clickableScript2", name: "Action Two", file: "content/clickables/clickableScript2.js" }
  // Add more clickable scripts as needed
];

// Master list for display scripts (auto-registered on target pages)
const displayScripts = [
  {
    id: "displayScript1",
    file: "content/displays/displayScript1.js",
    matches: ["https://byui.instructure.com/*"],
    runAt: "document_idle"
  },
  {
    id: "displayScript2",
    file: "content/displays/displayScript2.js",
    matches: ["https://byui.instructure.com/*"],
    runAt: "document_idle"
  }
  // Add additional display scripts as needed
];

/* --------------------------
   Initialization Function
--------------------------- */
function initializeConfiguration() {
  // Retrieve existing configuration from storage
  chrome.storage.sync.get(["enabledClickables", "enabledDisplays"], (data) => {
    let configToSet = {};

    // If there's no configuration for clickable scripts, set defaults based on the master list
    if (!data.enabledClickables) {
      configToSet.enabledClickables = {};
      clickableScripts.forEach(script => {
        configToSet.enabledClickables[script.id] = true;
      });
    }
    // Similarly for display scripts
    if (!data.enabledDisplays) {
      configToSet.enabledDisplays = {};
      displayScripts.forEach(script => {
        configToSet.enabledDisplays[script.id] = true;
      });
    }

    // If any defaults need to be set, update the storage; otherwise, use existing settings
    if (Object.keys(configToSet).length > 0) {
      chrome.storage.sync.set(configToSet, () => {
        console.log("[background] Default configuration has been set.");
        registerDisplayScripts();
      });
    } else {
      console.log("[background] Existing configuration found.");
      registerDisplayScripts();
    }
  });
}

/* --------------------------
   Dynamic Registration of Display Scripts
--------------------------- */
function registerDisplayScripts() {
  chrome.storage.sync.get("enabledDisplays", (data) => {
    const enabledConfig = data.enabledDisplays || {};
    displayScripts.forEach(scriptDef => {
      if (enabledConfig[scriptDef.id]) {
        // Register the display script dynamically
        chrome.scripting.registerContentScripts([{
          id: scriptDef.id,
          js: [scriptDef.file],
          matches: scriptDef.matches,
          runAt: scriptDef.runAt,
          persistAcrossSessions: true // Optional: ensures registration persists
        }]).then(() => {
          console.log(`[background] Registered display script: ${scriptDef.id}`);
        }).catch(err => {
          console.error(`[background] Failed to register ${scriptDef.id}:`, err);
        });
      } else {
        // Unregister the script if it's disabled
        chrome.scripting.unregisterContentScripts({ ids: [scriptDef.id] })
          .then(() => console.log(`[background] Unregistered display script: ${scriptDef.id}`))
          .catch(err => console.error(`[background] Failed to unregister ${scriptDef.id}:`, err));
      }
    });
  });
}

/* --------------------------
   Listen for Storage Changes
--------------------------- */
// Update display script registrations if the enabledDisplays configuration changes.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.enabledDisplays) {
    console.log("[background] Display configuration changed, updating registrations...");
    registerDisplayScripts();
  }
});

/* --------------------------
   Message Passing to Provide Data
--------------------------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getEnabledClickables") {
    chrome.storage.sync.get("enabledClickables", (data) => {
      const enabledConfig = data.enabledClickables || {};
      const enabledClickables = clickableScripts.filter(script => enabledConfig[script.id]);
      sendResponse({ clickables: enabledClickables });
    });
    return true; // Indicate asynchronous response.
  } else if (msg.action === "getEnabledDisplays") {
    chrome.storage.sync.get("enabledDisplays", (data) => {
      const enabledConfig = data.enabledDisplays || {};
      const enabledDisplays = displayScripts.filter(script => enabledConfig[script.id]);
      sendResponse({ displays: enabledDisplays });
    });
    return true;
  } else if (msg.action === "getMasterLists") {
    // New endpoint to provide the master lists for both clickable and display scripts.
    sendResponse({ clickableScripts, displayScripts });
  }
});

/* --------------------------
   Initialization on Extension Events
--------------------------- */
// When the extension is installed:
chrome.runtime.onInstalled.addListener(() => {
  console.log("[background] Extension installed.");
  initializeConfiguration();
});

// When the extension starts up:
chrome.runtime.onStartup.addListener(() => {
  console.log("[background] Extension started.");
  initializeConfiguration();
});
