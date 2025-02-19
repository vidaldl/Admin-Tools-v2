"use strict";

/**
 * Waits for a condition to be true on a given parent element before calling a callback function.
 * @param {HTMLElement} parent - The element to observe for changes.
 * @param {Function} conditionFn - A function returning a boolean indicating whether the condition is met.
 * @param {Function} callback - The function to call once the condition is met.
 */
const waitFor = (parent, conditionFn, callback) => {
  const observer = new MutationObserver(() => {
    if (conditionFn()) {
      observer.disconnect();
      callback();
    }
  });
  observer.observe(parent, {
    attributes: true,
    childList: true,
    subtree: true,
  });
};

/**
 * Waits for the "select all" button elements to appear in the DOM,
 * then removes the "screenreader-only" class from both the checkbox and its label.
 */
const displaySelectAllButton = () => {
  let checkbox, label;
  waitFor(document, () => {
    checkbox = document.querySelector('#selectAllCheckbox');
    label = document.querySelector('#selectAllCheckbox + [for="selectAllCheckbox"]');
    return checkbox && label;
  }, () => {
    checkbox.classList.remove("screenreader-only");
    label.classList.remove("screenreader-only");
    console.log("Select All button is now visible.");
  });
};

// Run displaySelectAllButton.

displaySelectAllButton();
