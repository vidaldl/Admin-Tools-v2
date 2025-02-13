# displayModulesNavbar.js

## Overview

The `displayModulesNavbar.js` script is a display function for the BYUI Canvas Admin Tools extension. Its purpose is to create a dynamic navigation bar at the bottom of the page that allows quick access to various course modules. The script collects module links from the page, generates a responsive navbar based on the width of the sidebar, and populates the navbar with links whose titles are derived from nearby header elements.

## Features

- **Module Retrieval:**  
  Uses modern DOM APIs to collect anchor tags that represent course modules, filtering out any invalid entries.

- **Dynamic Navbar Creation:**  
  Calculates the sidebar width and creates a fixed navigation bar that spans the remaining viewport width. This ensures a responsive layout.

- **Dynamic Link Population:**  
  For each module, the script locates a nearby header element to derive the link title. It applies formatting rules to abbreviate titles (e.g., converting lesson/week identifiers to a standardized format).

- **Conditional Execution:**  
  The script only runs if the user has enabled the `navToModules` option in chrome.storage.

## How It Works

1. **getModules():**  
   Collects all module anchor tags from elements with a `data-module-id` attribute, filtering out any anchors with an invalid ID.

2. **createNavbar():**  
   - Retrieves the computed width of the sidebar (`#header`).
   - Creates a new `<div>` element styled as a navigation bar.
   - Sets the navbar’s width to the remaining viewport width and positions it fixed at the bottom.
   - Appends the navbar to the `<body>`.

3. **fillNavbar(modules):**  
   - Iterates over the module anchors.
   - For each module, it locates an adjacent header element (using a CSS sibling selector) to extract the module title.
   - Applies regex-based formatting to abbreviate titles (e.g., converting "Week 2" to "W02").
   - Generates a series of `<a>` elements that link to the module, appending them into the navbar.

4. **Integration with Extension Settings:**  
   - Uses `chrome.storage.sync.get()` to check if the `navToModules` option is enabled.
   - If enabled, the script creates the navbar (if not already present) and populates it with module links.


## Customization

- **Styling:**  
  The navbar's styling is defined inline via JavaScript. You can modify the styles in the `Object.assign()` call within `createNavbar()` to suit your design needs.
  
- **Link Title Formatting:**  
  The regex in `fillNavbar()` can be adjusted to match different module naming conventions if needed.

## Troubleshooting

- **Navbar Not Appearing:**  
  Ensure that the `navToModules` option is enabled in chrome.storage and that the page contains elements matching the selectors used in `getModules()` and `createNavbar()`.
  
- **Incorrect Titles:**  
  Verify that the adjacent header elements are correctly selected. Adjust the CSS selector in `fillNavbar()` if your page structure differs.
