# displayBreadcrumbs.js

## Overview

The `displayBreadcrumbs.js` script is a display function designed to enhance the breadcrumb trail on Canvas LMS pages. It fetches section data for the current course via the Canvas API, processes and abbreviates section names according to custom rules, and then appends the formatted section information to the appropriate breadcrumb link. This script is integrated into the extension to provide real-time, contextual display of course sections in the navigation area.

## Features

- **Dynamic Data Fetching:**  
  Uses the modern Fetch API with async/await to retrieve section data for the current course.

- **Data Formatting:**  
  Processes each section name by abbreviating long names, applying specific labels (e.g., "REF", "CCV", "BP"), and conditionally styling the text (e.g., using blue text if the section is cross-listed).

- **Breadcrumb Enhancement:**  
  Finds the corresponding breadcrumb link for the course and appends the formatted section information to it.

- **Error Handling:**  
  Uses try/catch to handle any errors during data retrieval, logging useful error messages to the console.

## How It Works

### 1. Data Retrieval (`getData`)
- **Purpose:**  
  Fetches section data for a given course ID.
- **Process:**  
  - Uses the Fetch API to send a GET request to the Canvas LMS API.
  - Parses and returns the JSON data containing an array of section objects.

### 2. Data Formatting (`createSectionNumbers`)
- **Purpose:**  
  Converts the array of section objects into a single, formatted string of section numbers.
- **Process:**  
  - Maps over the sections array to extract and format each section’s name.
  - Applies custom formatting rules:
    - Replaces words like "section" (case-insensitive) and trims whitespace.
    - Converts names including "Reference", "Course Council View", or "Blueprint" to their abbreviations ("REF", "CCV", "BP").
    - Abbreviates long section names and pads single-character names.
  - Joins the formatted names with commas and encloses the result in parentheses.

### 3. Updating the Breadcrumb (`displayBreadcrumbs`)
- **Purpose:**  
  Integrates the formatted section data into the breadcrumb trail.
- **Process:**  
  - Extracts the course ID from the current page’s URL.
  - Locates the breadcrumb link corresponding to the current course.
  - Calls `getData` to fetch section data and then `createSectionNumbers` to format it.
  - Appends the resulting formatted string to the breadcrumb link’s innerHTML if it is non-empty.

### 4. Integration with Extension Settings
- **Purpose:**  
  Ensures the script runs only when the relevant option is enabled.
- **Process:**  
  - Retrieves the `sectionsBreadcrumb` flag from `chrome.storage.sync`.
  - If enabled, executes `displayBreadcrumbs()` to update the breadcrumb.

## Integration

- **Usage in Extension:**  
  Include this script as a display content script in your extension. It is designed to run on pages that match your target URL (e.g., `https://*.instructure.com/*`).
  
- **Configuration:**  
  The script relies on the assumption that:
  - The current course ID is located in the URL (extracted from the pathname).
  - The breadcrumb navigation is structured with a container that contains links referencing the course.
  - The Canvas API returns section data with a "while(1);" prefix that needs to be removed.

## Customization

- **Formatting Rules:**  
  You can modify the logic in `createSectionNumbers` to adjust how section names are abbreviated or styled.
  
- **Styling:**  
  Adjust the inline styles (e.g., the blue color defined in `color:#42aaf4`) as needed to match your extension’s design.

## Troubleshooting

- **No Breadcrumb Found:**  
  Ensure the page contains a breadcrumb element matching the selector `#breadcrumbs a[href*='/courses/{courseID}']`.
  
- **API Errors:**  
  Check console logs for any errors related to fetching data. Verify that the API endpoint is correct and that the response text is in the expected format.
  
- **Empty Data:**  
  If the formatted section string is empty (i.e., `()`), no data will be appended to the breadcrumb. Confirm that the course has associated sections in the API response.

## License

*(Include license information if applicable.)*
