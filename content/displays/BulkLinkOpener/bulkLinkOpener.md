# bulkLinkOpener.js

## Overview

The `bulkLinkOpener.js` script is a display function for the BYUI Canvas Admin Tools extension. It enables users to quickly open multiple links on any webpage by holding the **Z** key and dragging a selection box over the desired links. All links within the selection are opened in new tabs upon releasing the mouse button. This tool is especially useful for bulk operations on resource-heavy Canvas pages.

## Features

- **Bulk Link Selection:**  
  Hold the **Z** key and drag with the mouse to draw a selection box over links.
- **Visual Feedback:**  
  - Selected links are highlighted with an orange outline.
  - A floating counter displays the number of links currently selected.
  - A notification appears after a short delay, reminding the user to release to open links.
- **Automatic Opening:**  
  All links within the selection box are opened in new tabs when the mouse button is released.
- **Robust State Handling:**  
  - Cancels selection if the Z key is released or the window loses focus.
  - Cleans up highlights and UI elements after each operation.

## How It Works

1. **Activation:**  
   - The script listens for the **Z** key. When held, clicking and dragging the mouse draws a selection box.
2. **Selection Box:**  
   - The box is rendered as a semi-transparent rectangle. As the mouse moves, the script checks which links intersect the box.
3. **Highlighting and Counter:**  
   - All intersecting links are highlighted.
   - A counter near the cursor shows how many links are selected.
   - After 3 seconds, a notification appears to prompt the user to release the mouse to open links.
4. **Opening Links:**  
   - On mouse release, all highlighted links are opened in new tabs.
   - The selection box, highlights, and notifications are removed.

## Integration

- **Usage:**  
  Include `bulkLinkOpener.js` as a display content script in your extension manifest. It is designed to run on all pages (`<all_urls>`), but you may restrict it to specific Canvas pages if desired.
- **Configuration:**  
  No additional configuration is required. The script runs automatically when loaded.

## Customization

- **Styling:**  
  Modify the inline CSS in the script to change the appearance of the selection box, highlights, counter, or notification.
- **Key Binding:**  
  Change the activation key by editing the key event handlers in the script.
- **Selector Logic:**  
  Adjust the `getLinksInSelection()` function if you want to target different elements (e.g., only certain types of links).

## Troubleshooting

- **Links Not Opening:**  
  Some browsers may block popups if too many tabs are opened at once. Try selecting fewer links or adjust your browser's popup settings.
- **Highlighting Issues:**  
  If links are not being highlighted, ensure that the page structure uses `<a href="...">` elements.
- **Performance:**  
  On pages with thousands of links, performance may be affected during selection.

---
*This script is part of the Admin Tools extension and is intended for use by Canvas course administrators and designers.*