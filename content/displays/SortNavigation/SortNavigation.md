# displaySortNavigation.js

## Overview

The `displaySortNavigation.js` script is a display function for the Canvas Admin Tools extension. Its purpose is to add a "Sort" button to the "Navigation" tab in the course settings page, allowing users to quickly sort navigation items alphabetically. The script adds the button to a disabled list item, and when clicked, it sorts the non-disabled navigation items and automatically saves the changes.

## Features

- **Dynamic Button Creation:**  
  Adds a "Sort" button to disabled items in the navigation list, using Canvas's native button styling.

- **Alphabetical Sorting:**  
  Sorts navigation items alphabetically based on their aria-label attributes for improved organization.

- **Automatic Saving:**  
  Automatically clicks the save button after sorting to persist the changes without requiring an additional user action.

- **Duplicate Prevention:**  
  Checks if buttons already exist before creating new ones to avoid duplicates during page re-renders.

## How It Works

1. **Button Addition (`addButtonToDisabledItems`):**  
   - Locates all list items with the "disabled" class in the navigation disabled list.
   - Creates a new button element styled with Canvas's UI classes (`btn`, `btn-small`, `btn-primary`).
   - Attaches a click event listener that triggers the sorting function.
   - Appends the button to each disabled list item if it doesn't already have one.

2. **Navigation Sorting (`sortNavigation`):**  
   - Retrieves all navigation items from the list except those with the "disabled" class.
   - Sorts the items alphabetically by comparing their aria-label attributes (case-insensitive).
   - Removes all existing items from the list.
   - Re-adds the sorted items in the new order.
   - Places the disabled items at the beginning of the list.

3. **Automatic Saving:**  
   - Finds the save button in the navigation form.
   - Uses setTimeout to click the save button after a brief delay (200ms), allowing the DOM to update.

4. **Immediate Execution:**  
   - The script runs the `addButtonToDisabledItems` function immediately when loaded to ensure the functionality is available without requiring user interaction.

## Integration

- **Usage in Extension:**  
  Include this script as a display content script in your extension. It is designed to run on pages that match the Canvas course settings URL pattern (e.g., `https://*.instructure.com/courses/*/settings` and `https://*.instructure.com/courses/*/details`).

- **Configuration:**  
  The script relies on the assumption that:
  - The navigation items are in a list with ID `nav_disabled_list`.
  - Disabled items have the class `disabled`.
  - Navigation items have the class `navitem`.
  - The save button is in a form with ID `nav_form`.

## Customization

- **Button Text and Style:**  
  Modify the button's text and class names in the `addButtonToDisabledItems` function to match your extension's design.

- **Sorting Logic:**  
  The current implementation sorts alphabetically by aria-label. You can modify the comparison function in the `items.sort()` method to use different criteria or sorting orders.

- **Delay Timing:**  
  Adjust the setTimeout delay (currently 200ms) if needed to accommodate different page loading speeds.
