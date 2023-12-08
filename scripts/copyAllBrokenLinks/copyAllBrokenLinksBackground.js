
//exports these fuctions so the background script can use them
export function copyAllBrokenLinks () {

    // creates a clickable link in the right click menu
    function copyAllBrokenLinksCM() {
        chrome.contextMenus.create({
            id: "copy-all-broken",
            title: "Copy All Broken Links",
            contexts: ["page"],
            documentUrlPatterns: ["https://*.instructure.com/courses/*/link_validator"]
        });
    }

    // Initialize context menus
    copyAllBrokenLinksCM();

    //listens for the user to click on the the right click button that was created
    //When it is clicked the contentScript is triggered
    chrome.contextMenus.onClicked.addListener(function(info, tab) {
        if (info.menuItemId == "copy-all-broken") {
            chrome.tabs.query({
                "active": true,
                "currentWindow": true
            }, function (tabs) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['./scripts/copyAllBrokenLinks/contentScript.js']
                });
            });
        }
    });

}