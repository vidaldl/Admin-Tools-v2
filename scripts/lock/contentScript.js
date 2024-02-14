

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // On any message it catches it here and runs it's respsective function
        // This is supposed to be listening to the messages sent by main.js
        switch (message) {
            case "unlockSections":
                unlockElements();
                sendResponse("Sections unlocked!");
                break;
            case "lockSections":
                lockElements();
                sendResponse("Sections locked!");
                break;
            default:
                sendResponse("Feature could not be found.");
            }
        });   


function lockElements() {
    console.log('running');
    let elms = document.querySelectorAll('.icon-blueprint');
    if (elms.length === 0) {
        console.log('There is nothing to lock.');
        return;
    }
    elms.forEach(el => {
        el.click();
    })
    console.log('Locked');
}

function unlockElements() {
    let elms = document.querySelectorAll('.icon-blueprint-lock');
    if (elms.length === 0) {
        console.log('There is nothing to unlock.');
        return;
    }
    elms.forEach(el => {
        el.click();
    })
    console.log('Unlocked');
}