document.getElementById('settingsBtn').addEventListener('click', function() {
    chrome.tabs.create({ url: 'views/settings.html' });
});

document.getElementById('helpBtn').addEventListener('click', function() {
    chrome.tabs.create({ url: 'views/help.html' });
});