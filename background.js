import { copyAllBrokenLinks } from './scripts/copyAllBrokenLinks/background.js';



/****
 *
 * Adds a button to the right click menu titled "Copy All Broken Links"
 * Creates a popup that allows the user to copy a formatted version of the
 * links in the Course Link Validator.
 *
 * Affected URLs:
 * [canvas_instance]/course/[courseId]/link_validator
 *
 ****/
 copyAllBrokenLinks();

/********************************
 *
 *
 *
 ********************************/
let thing = '';
chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        console.log("First Load");

        chrome.runtime.openOptionsPage();
        thing = 'installed';
    } else if (details.reason == 'update') {
        console.log('Update');
        chrome.runtime.openOptionsPage();
        thing = 'updated';
    } else {
        console.log(details);

    }
    addEmailOption();
});

/********************************
 *
 *
 *
 ********************************/
function firstLoad() {
    let returnValue = thing;
    thing = '';
    return returnValue;
}

/********************************
 *
 * Adds right-click menu option to
 * copy student emails to clipboard.
 *
 ********************************/
function addEmailOption() {
    chrome.contextMenus.create({
        id: "email-students",
        title: "Email Students On This List",
        contexts: ["page"],
        documentUrlPatterns: ["https://*.instructure.com/courses/*/quizzes/*/statistics"]
    });

    chrome.contextMenus.onClicked.addListener(function(info, tab) {
        if (info.menuItemId == "email-students") {
            chrome.tabs.query({
                "active": true,
                "currentWindow": true
            }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    "functiontoInvoke": "emailStudents"
                });
            });
        }
    });
}

