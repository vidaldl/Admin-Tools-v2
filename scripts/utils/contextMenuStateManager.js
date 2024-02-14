// Function to update the state of a context menu item
export function setContextMenuState(itemId, state, callback) {
    chrome.storage.local.get({ contextMenuItems: {} }, (result) => {
        result.contextMenuItems[itemId] = state;
        chrome.storage.local.set({ contextMenuItems: result.contextMenuItems }, () => {
            if (callback) callback();
        });
    });
}

// Function to check if a context menu item has been created
export function checkContextMenuState(itemId, callback) {
    chrome.storage.local.get({ contextMenuItems: {} }, (result) => {
        const state = result.contextMenuItems[itemId] || false;
        callback(state);
    });
}