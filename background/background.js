// background/background.js
"use strict";

/* --------------------------
   Master Lists for Scripts
--------------------------- */
// Master list for clickable scripts (triggered from the popup)
const clickableScripts = [
  { 
    id: "deleteAllQuestions", 
    name: "Delete All Quiz Questions", 
    description:"Deletes all questions in a given quiz.", 
    file: "content/clickables/DeleteAllQuestions/deleteAllQuestions.js" 
  },
  { 
    id: "blueprintLock", 
    name: "Lock Blueprint Items", 
    description:"Locks every blueprint item present in the page. Only works in a list of items where the lock button is present (modules, assignments, quizzes, etc).", 
    file: "content/clickables/BlueprintLock/blueprintLock.js" 
  },
  { 
    id: "blueprintUnlock", 
    name: "Unlock Blueprint Items", 
    description:"Unlocks every blueprint item present in the page. Only works in a list of items where the lock button is present (modules, assignments, quizzes, etc).", 
    file: "content/clickables/BlueprintUnlock/blueprintUnlock.js" 
  },
  {
    id: "copyAllBrokenLinks", 
    name: "Copy All Broken Links", 
    description: "Displays a window with all broken links in the course and allows you to copy them to the clipboard.",
    file: "content/clickables/CopyBrokenLinks/copyBrokenLinks.js"
  },
  {
    id: "searchInCourse", 
    name: "Search in Course", 
    description: "Searches for text in the course and displays a window with all the results.",
    file: "content/clickables/SearchInCourse/searchInCourse.js"
  },
  {
    id: "shiftDates", 
    name: "Shift Course Dates", 
    description: "Changes the dates of all assignments, quizzes, discussions, and announcements in the course by a specified number of days.",
    file: "content/clickables/ShiftDates/shiftDates.js"
  }
  // Add more clickable scripts as needed
];

// Master list for display scripts (auto-registered on target pages)
const displayScripts = [

  {
    id: "displaySectionColumns",
    file: "content/displays/SectionColumn/displaySectionColumns.js",
    matches: ["https://*.instructure.com/accounts/*"],
    name: "Sections Column",
    description: "Adds a dedicated 'Sections' column to the course listings on Canvas. Get a quick, at-a-glance summary of each course's section details.",
    runAt: "document_idle"
  },
  {
    id: "displaySectionsBreadcrumb",
    file: "content/displays/SectionsBreadcrumb/displaySectionsBreadcrumb.js",
    matches: ["https://*.instructure.com/courses/*"],
    name: "Sections in Breadcrumbs",
    description: "Enhances the breadcrumb trail by appending formatted section numbers for the current course.",
    runAt: "document_idle"
  },
  {
    id: "displayModuleNavbar",
    file: "content/displays/ModuleNavbar/displayModuleNavbar.js",
    matches: ["https://*.instructure.com/*/modules"],
    name: "Module Navbar",
    description: "Displays a navbar on the modules page of a course.",
    runAt: "document_idle"
  },
  {
    id: "displayParentLink",
    file: "content/displays/ParentLink/displayParentLink.js",
    matches: ["https://*.instructure.com/courses/*"],
    name: "Blueprint Parent Link",
    description: "Adds link in the bottom of the page to a course to its blueprint if it is a blueprint child.",
    runAt: "document_idle"
  },
  {
    id: "displayBlueprintSections",
    file: "content/displays/BlueprintSections/displayBlueprintSections.js",
    matches: ["https://*.instructure.com/courses/*"],
    name: "Blueprint Associated Sections",
    description: `Adds a link to the sections associated with a blueprint course when in "Associated Courses".`,
    runAt: "document_idle"
  },
  {
    id: "displaySelectAllFiles",
    file: "content/displays/SelectAllFiles/displaySelectAllFiles.js",
    matches: ["https://*.instructure.com/courses/*/files*"],
    name: "Select All Files Button",
    description: `Adds a "Select All" button to the Files page in Canvas.`,
    runAt: "document_idle"
  },
  {
    id: "displaySortNavigation",
    file: "content/displays/SortNavigation/displaySortNavigation.js",
    matches: ["https://*.instructure.com/courses/*/settings", "https://*.instructure.com/courses/*/details"],
    name: "Sort Navigation Button",
    description: `Adds a "Sort Navigation" button to the "Navigation" tab's disabled items in the course settings page in Canvas.`,
    runAt: "document_idle"
  },
  {
    id: "bulkLinkOpener",
    file: "content/displays/BulkLinkOpener/bulkLinkOpener.js",
    matches: ["<all_urls>"],
    name: "Bulk Link Opener",
    description: `Enables users to hold the Z key and drag a selection box over links on a webpage to open them all in new tabs.`,
    runAt: "document_idle"
  }
  // Add additional display scripts as needed
];

const utilScripts = [
  {
    id: "overrideConfirm",
    matches: ["https://*.instructure.com/courses/*/quizzes/*/edit"],
    file: "content/utils/overrideConfirm.js",
    "run_at": "document_start"
  }
]




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
        configToSet.enabledClickables[script.id] = false;
      });
    }
    // Similarly for display scripts
    if (!data.enabledDisplays) {
      configToSet.enabledDisplays = {};
      displayScripts.forEach(script => {
        configToSet.enabledDisplays[script.id] = false;
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
      // Unregister any previously registered script with this ID to prevent duplicates.
      chrome.scripting.unregisterContentScripts({ ids: [scriptDef.id] })
        .catch(err => {
          // It's safe to ignore errors if the script wasn't registered.
          console.warn(`[background] Unregister warning for ${scriptDef.id}:`, err);
        })
        .finally(() => {
          // If the script is enabled, register it.
          if (enabledConfig[scriptDef.id]) {
            chrome.scripting.registerContentScripts([{
              id: scriptDef.id,
              js: [scriptDef.file],
              matches: scriptDef.matches,
              runAt: scriptDef.runAt,
              persistAcrossSessions: true
            }]).then(() => {
              console.log(`[background] Registered display script: ${scriptDef.id}`);
            }).catch(err => {
              console.error(`[background] Failed to register ${scriptDef.id}:`, err);
            });
          }
        });
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
  } else if(msg.action === "showBrokenLinksPopup") {
    const popupURL = chrome.runtime.getURL('content/clickables/CopyBrokenLinks/copyAllBrokenLinksPopup.html');
    chrome.windows.create({
      type: 'popup',
      url: popupURL,
      width: 980,
      height: 470,
      focused: true
    });
  } else if (msg.action === "openLink") {    
      chrome.tabs.create({ url: msg.url });
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
