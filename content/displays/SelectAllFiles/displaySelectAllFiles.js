"use strict";

/**
 * Ensures that the "Select All" checkbox and its label remain visible.
 * This function forces their display style and removes any classes that might hide them.
 */
const ensureSelectAllVisible = () => {
  const selectAllCheckbox = document.querySelector('#selectAllCheckbox');
  const selectAllLabel = document.querySelector('#selectAllCheckbox + [for="selectAllCheckbox"]');
  if (selectAllCheckbox && selectAllLabel) {
    // Force the elements to be visible regardless of page changes.
    selectAllCheckbox.style.display = 'inline-block';
    selectAllLabel.style.display = 'inline-block';
    selectAllCheckbox.classList.remove("screenreader-only");
    selectAllLabel.classList.remove("screenreader-only");
  }
};

/**
 * Initializes the "Select All" functionality by adding event listeners
 * to the "Select All" checkbox and all individual file checkboxes.
 * This function marks the elements as initialized so that event listeners
 * are not attached multiple times.
 */
const initializeSelectAll = () => {
  const selectAllCheckbox = document.querySelector('#selectAllCheckbox');
  const selectAllLabel = document.querySelector('#selectAllCheckbox + [for="selectAllCheckbox"]');
  if (!selectAllCheckbox || !selectAllLabel) return;

  // Prevent multiple initializations.
  if (selectAllCheckbox.dataset.initialized === "true") return;
  selectAllCheckbox.dataset.initialized = "true";
  selectAllLabel.dataset.initialized = "true";

  // Reveal the elements.
  selectAllCheckbox.classList.remove("screenreader-only");
  selectAllLabel.classList.remove("screenreader-only");

  // Function to update "Select All" state based on individual file checkboxes.
  const updateSelectAllCheckbox = () => {
    const fileCheckboxes = document.querySelectorAll('.file-checkbox');
    selectAllCheckbox.checked = Array.from(fileCheckboxes).every(cb => cb.checked);
  };

  // When "Select All" is toggled, update all file checkboxes.
  selectAllCheckbox.addEventListener("change", () => {
    const fileCheckboxes = document.querySelectorAll('.file-checkbox');
    fileCheckboxes.forEach(cb => {
      cb.checked = selectAllCheckbox.checked;
    });
  });

  // When any file checkbox is changed, update the "Select All" state.
  const fileCheckboxes = document.querySelectorAll('.file-checkbox');
  fileCheckboxes.forEach(cb => {
    cb.addEventListener("change", updateSelectAllCheckbox);
  });

  console.log("Select All functionality initialized.");
};

/**
 * Runs the initialization and ensures visibility.
 */
const runSelectAll = () => {
  initializeSelectAll();
  ensureSelectAllVisible();
};

// Persistent observer: monitors the document body for changes and re-applies our modifications.
const persistentObserver = new MutationObserver(() => {
  runSelectAll();
});
persistentObserver.observe(document.body, { childList: true, subtree: true });

// Initial run in case elements are already present.
runSelectAll();

// Optionally, check storage to ensure the functionality should run.

runSelectAll();

