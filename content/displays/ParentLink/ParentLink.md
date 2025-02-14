# displayParentLink.js

## Overview

The `displayParentLink.js` script is a display function designed to enhance the BYUI Canvas Admin Tools extension. Its primary purpose is to fetch blueprint subscription data for the current course from the Canvas LMS API and, if blueprint data is available, create a navigation bar (if it doesn’t already exist) and append a link to the parent blueprint course. This link appears fixed at the bottom of the page and opens in a new tab.

## Features

- **Dynamic Navbar Creation:**  
  Creates a responsive navbar at the bottom of the page based on the width of the sidebar (`#header`).

- **Data Fetching with Modern APIs:**  
  Uses async/await with the Fetch API to retrieve blueprint subscription data, removing extraneous prefixes before parsing.

- **Conditional Link Injection:**  
  If blueprint subscription data is present, the script appends a "Parent Blueprint" link to the navbar. The link’s destination is derived from the fetched data.


## How It Works

1. **Navbar Creation (`createNavbar`):**  
   - The function retrieves the computed width of the sidebar (`#header`) and creates a `<div>` element styled as a navbar.
   - The navbar is fixed at the bottom of the page, spans the remaining viewport width, and is appended to the `<body>`.

2. **Data Fetching (`buildDetails`):**  
   - Extracts the course ID from the current URL.
   - Uses the Fetch API to send a GET request to the Canvas LMS API endpoint for blueprint subscriptions.
   - Cleans the response by removing the `"while(1);"` prefix and parses the JSON data.

3. **Blueprint Link Injection (`addBlueprintParent`):**  
   - Calls `buildDetails` to obtain blueprint data.
   - If data exists, it ensures that the navbar is present by calling `createNavbar` if necessary.
   - Extracts the blueprint course ID from the data and creates an `<a>` element with the text "Parent Blueprint."
   - The link is styled and appended to the navbar; it opens in a new tab.

4. **Option Check:**  
   - The script checks the `addBlueprintParent` option stored in `chrome.storage.sync`.
   - If the option is enabled (`true`), `addBlueprintParent()` is executed.

## Integration

- **Usage:**  
  Include `displayParentLink.js` as a display content script in your extension. Ensure that your manifest grants the necessary permissions and that your Canvas LMS pages match the required URL patterns.

- **Configuration:**  
  The script is activated based on the `addBlueprintParent` setting in `chrome.storage.sync`. Adjust this setting via your extension's options page to enable or disable the blueprint parent link feature.

## Customization

- **Styling:**  
  The navbar and link styles are set using inline styles via `Object.assign()`. Modify these values to suit your design requirements.
  
- **Data Endpoint:**  
  The API endpoint URL is hard-coded; update it if your Canvas LMS domain changes.

## Troubleshooting

- **Navbar Not Appearing:**  
  Ensure that the page contains a sidebar element with the ID `#header`, as the navbar’s position and width are based on this element.
  
- **Data Fetch Errors:**  
  Check the console for errors related to fetching data. Ensure the API endpoint is correct and that the response format is as expected.
  
