document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['associatedBpCourse', 'linkToBpParentAccount', 'displaySectionInBreadcrumb', 'sectionColumn'], function(result) {
        document.getElementById('associatedBpCourse').checked = result.associatedBpCourse || false;
        document.getElementById('linkToBpParentAccount').checked = result.linkToBpParentAccount || false;
        document.getElementById('displaySectionInBreadcrumb').checked = result.displaySectionInBreadcrumb || false;
        document.getElementById('sectionColumn').checked = result.sectionColumn || false;
    });
});

function savePreference(id) {
    let obj = {};
    obj[id] = document.getElementById(id).checked;
    chrome.storage.sync.set(obj);
}

document.getElementById('associatedBpCourse').addEventListener('change', function() {
    savePreference('associatedBpCourse');
});

document.getElementById('linkToBpParentAccount').addEventListener('change', function() {
    savePreference('linkToBpParentAccount');
});

document.getElementById('displaySectionInBreadcrumb').addEventListener('change', function() {
    savePreference('displaySectionInBreadcrumb');
});

document.getElementById('sectionColumn').addEventListener('change', function() {
    savePreference('sectionColumn');
});