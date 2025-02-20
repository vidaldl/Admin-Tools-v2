# displaySelectAllButton.js

## Overview

The `displaySelectAllButton.js` script is a display function for the BYUI Canvas Admin Tools extension. Its purpose is to reveal and manage the "Select All" functionality for file checkboxes on the page. When the "Select All" checkbox is toggled, all file checkboxes (marked with the class `.file-checkbox`) are either selected or deselected. Additionally, if any individual file checkbox is manually toggled so that not all are selected, the "Select All" checkbox automatically unchecks. This script employs a persistent MutationObserver to ensure that the "Select All" elements remain visible—even if the page re-renders—without reinitializing event listeners multiple times.

## Features

- **Persistent Visibility:**  
  Uses inline style overrides and class removals to force the "Select All" checkbox and its label to remain visible, even when the page is dynamically updated.

- **Single Initialization:**  
  Prevents multiple event listener attachments by marking the "Select All" checkbox and its label as initialized with a data attribute.

- **Toggle Functionality:**  
  - When "Select All" is checked, all file checkboxes are selected.
  - When unchecked, all file checkboxes are deselected.
  - The state of the "Select All" checkbox is automatically updated when any individual file checkbox is changed.

- **Real-Time DOM Monitoring:**  
  A persistent MutationObserver monitors the document for any changes, ensuring that if the "Select All" elements are re-added or hidden by the page, the script re-applies the necessary modifications.

- **Option-Based Activation:**  
  The script runs only if the `selectAllFiles` option is enabled in `chrome.storage.sync`.

## How It Works

1. **ensureSelectAllVisible:**  
   Forces the "Select All" checkbox and its label to be visible by setting their display style and removing any classes (e.g., "screenreader-only") that might hide them.

2. **initializeSelectAll:**  
   Adds event listeners to the "Select All" checkbox and all individual file checkboxes (with class `.file-checkbox`).  
   - Prevents multiple initializations by checking a data attribute.
   - Toggling "Select All" updates all file checkboxes.
   - Changes to individual file checkboxes update the "Select All" state.

3. **runSelectAll:**  
   A helper function that runs both `initializeSelectAll` and `ensureSelectAllVisible`.

4. **Persistent DOM Observation:**  
   A MutationObserver watches the document body for any changes. If the "Select All" checkbox and its label are modified or removed, `runSelectAll()` is called to reapply initialization and ensure they remain visible.


## Integration

- **Usage:**  
  Include `displaySelectAllButton.js` as a display content script in your extension manifest. Ensure that your page includes:
  - A "Select All" checkbox with the ID `selectAllCheckbox` and its corresponding label immediately following it.
  - Individual file checkboxes with the class `.file-checkbox`.

- **Configuration:**  
  The functionality is activated by the `selectAllFiles` flag in chrome.storage. Ensure this option is set to `true` to enable the "Select All" behavior.

## Customization

- **Selectors and Styles:**  
  If your file checkboxes or the "Select All" elements have different selectors or require different styles, adjust the query selectors and inline styles in the script accordingly.
  
- **Observer Behavior:**  
  The persistent MutationObserver can be further tuned (e.g., changing the observation settings) if your page structure requires it.

## Troubleshooting

- **Element Disappearance:**  
  If the "Select All" elements still disappear, ensure that they are not being removed by other scripts. The persistent observer should reapply visibility, but you may need to adjust the observation scope if the page structure is complex.
  
- **Multiple Event Attachments:**  
  The script uses a data attribute to prevent multiple initializations. Verify that this attribute is not being cleared or overridden by the page.
  
