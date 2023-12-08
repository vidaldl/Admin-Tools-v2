
//exports these fuctions so the background script can use them
export function copyAllBrokenLinks () {

    // creates a clickable link in the right click menu
    chrome.contextMenus.create({
        id: "copy-all-broken",
        title: "Copy All Broken Links",
        contexts: ["page"],
        documentUrlPatterns: ["https://*.instructure.com/courses/*/link_validator"]
    });

    //listens for the user to click on the right click button that was created
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

    // hears the message from the ContentSctipt and collects the arrays
    // It then stores the arrays to the local storage
    // It then opens a popup
    chrome.runtime.onMessage.addListener(function (request) {
        if (request.action === "sendArraysToBackground") {
            console.log("Page Url Array received in the background");
            let PageUrls = request.array1;
            let BrokenLinks = request.array2;
            let Titles = request.array3;


            chrome.storage.local.set({
                brokenLinksPageUrls: PageUrls,
                brokenLinksURLS: BrokenLinks,
                brokenLinksTitles: Titles
            }, function() {
                chrome.windows.create({
                    type: 'popup',
                    url: './scripts/copyAllBrokenLinks/copyAllBrokenLinksPopup.html',
                    width: 630,
                    height: 325
                });
            });

        }
    });


}