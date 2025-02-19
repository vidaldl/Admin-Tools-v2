# displayParentLink.js

## Overview

The `displayParentLink.js` script is a display function for the BYUI Canvas Admin Tools extension. Its purpose is to enhance blueprint association links by ensuring that each course row in the blueprint associations table has a clickable link to the course page. The script fetches the necessary course ID from each row, constructs a link, and inserts it into the DOM. Additionally, it uses a debounced MutationObserver to update the links whenever the table content changes—ensuring that the links are always visible, even if you re-open the window without refreshing the page.

## Features

- **Dynamic Link Creation:**  
  For each course row in the blueprint associations table, the script extracts the course ID and creates an `<a>` element linking to the course page. If the link is not already present, it is inserted into the appropriate span.

- **Immediate Execution:**  
  The script checks for the presence of the target elements on load and immediately enhances the blueprint associations if they exist.

- **Real-time Updates:**  
  A debounced MutationObserver is set up on the document, ensuring that any changes in the table trigger an update to the blueprint links without requiring a full page refresh.


## How It Works

1. **Blueprint Associations Enhancement:**  
   - The `blueprintAssociations` function gathers all relevant course rows from the blueprint associations table.
   - For each row, it extracts the course ID from the element’s ID, then builds the expected link HTML.
   - If the link isn’t already present in the span, it updates the innerHTML to include a clickable link that opens in a new tab.

2. **Immediate Execution:**  
   - The `runImmediately` function checks if the target elements exist upon script load and calls `blueprintAssociations()` right away to ensure the links are visible.

3. **Observing DOM Changes:**  
   - The `observeChanges` function sets up a debounced MutationObserver on the document.
   - When changes are detected, it waits for a brief delay (default 250ms) before calling `blueprintAssociations()` again—ensuring that any dynamic changes to the table update the links.

4. **Conditional Activation:**  
   - The script checks the `blueprintAssociations` flag in `chrome.storage.sync` and only executes if the option is enabled.

## Usage

- **Integration:**  
  Include `displayParentLink.js` as a display content script in your extension. It is designed to run on Canvas LMS pages (or other target pages) that include a blueprint associations table.


## Customization

- **Debounce Timing:**  
  Adjust the debounce delay in the `observeChanges` function if needed.
- **Styling:**  
  Modify the link or container styles directly in the function as required.




