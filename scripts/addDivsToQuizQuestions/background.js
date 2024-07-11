export function addDivsToQuestions() {
  // This event is fired with the user accepts the permission.
  chrome.runtime.onInstalled.addListener(function () {
    // Create a context menu
    chrome.contextMenus.create({
      id: "unfiled-questions",
      title: "Fix Divs for All Questions",
      contexts: ["page"],
      documentUrlPatterns: [
        "https://*.instructure.com/courses/*/question_banks/*",
      ],
    });
  });

  // Listener for context menu click
  chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (info.menuItemId === "unfiled-questions") {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "ADD_DIV", content: "Trigger Content Script" },
        function (response) {
          if (chrome.runtime.lastError) {
            console.error(
              "Error sending message to content script:",
              chrome.runtime.lastError.message
            );
          } else {
            console.log("Response form the content Script:", response);
          }
        }
      );
    }
  });
}
