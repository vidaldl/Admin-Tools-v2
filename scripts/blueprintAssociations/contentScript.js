function blueprintAssociations() {
    let associatedCourses = document.querySelectorAll('span[dir="ltr"] .bca-associations-table tr[id^="course_"]');

    associatedCourses.forEach(v => {
        let courseID = v.id.split('_')[1];
        let linkSpan = v.querySelector('td span');
        let html = linkSpan.innerHTML;
        // Check if the link is already wrapped
        if (!linkSpan.querySelector(`a[href="/courses/${courseID}"]`)) {
            linkSpan.innerHTML = `<a href="/courses/${courseID}" target="_blank">${html}</a>`;
        }
    });
}


function waitFor(parent, fn, cb) {
    const observer = new MutationObserver(mutations => {
        if (fn()) {
            observer.disconnect(); // Disconnect immediately before executing the callback
            cb();
        }
    });

    if (fn()) { // Check the condition before starting to observe
        observer.disconnect();
        cb();
    } else {
        observer.observe(parent, {
            childList: true,
            subtree: true,
        });
    }
}

chrome.storage.sync.get({
    blueprintAssociations: false,
}, function (items) {
    if (items.blueprintAssociations === true) {
        waitFor(document.body, () => document.querySelectorAll('span[dir="ltr"] .bca-associations-table tr[id^="course_"] span').length > 0, blueprintAssociations);
    }
});
