# displaySectionColumns.js

## Overview

The `displaySectionColumns.js` script is a display function designed to integrate into our Canvas Admin Tools extension. It dynamically updates a “Sections” column in a table on Canvas LMS pages by fetching course section data via the Canvas API and then formatting and displaying this data in a new column. This script leverages modern JavaScript techniques—using async/await, the fetch API, and a debounced MutationObserver—to handle dynamic content changes efficiently.

## Features

- **Dynamic Data Fetching:**  
  For each course row, the script retrieves section data from the Canvas API.

- **Column & Cell Creation:**  
  It creates a new column header (“Sections”) if it doesn’t exist and appends new cells to each course row for displaying the section data.

- **Data Formatting:**  
  The section names are formatted according to defined rules (e.g., abbreviating long names, applying color styles based on conditions).

- **Real-time Updates:**  
  Uses a debounced MutationObserver to monitor the table for content changes and update the column accordingly.

## How It Works

### 1. Data Retrieval (`buildDetails`)
- **Purpose:**  
  For each course row, this async function fetches section data from the Canvas LMS API.
  
- **Process:**  
  - Finds the course link in the row.
  - Extracts the course ID from the link’s URL.
  - Uses `fetch()` to retrieve section data from the API.
  - Strips the `"while(1);"` prefix from the response and parses the JSON.
  - Returns an object containing the course row, link, ID, and fetched sections.

### 2. Column and Cell Creation
- **`createColumn(columnID, title)`**  
  Creates a new column header (if it doesn't exist) by appending a `<th>` element with the specified ID and title to the table header row.

- **`createColumnCells(columnID)`**  
  Iterates over each course row and appends a new `<td>` cell with a class name matching the columnID if such a cell does not already exist.

### 3. Data Population (`populateSectionsColumn`)
- **Purpose:**  
  Formats the fetched section data for each course and populates the corresponding cell in the newly created column.
  
- **Process:**  
  - Maps over the sections array to format each section’s name.
  - Applies special formatting rules (e.g., abbreviating names, applying a color style if `nonxlist_course_id` is not null).
  - Joins the formatted strings and sets the resulting HTML as the cell’s innerHTML.

### 4. Main Execution (`main`)
- **Purpose:**  
  Orchestrates the update process for the “Sections” column.
  
- **Process:**  
  - Selects the table body (`<tbody data-automation="courses list">`), extracts all course rows (skipping the header), and stores them in `courseRows`.
  - Calls `createColumn` and `createColumnCells` to set up the new column.
  - Uses `Promise.all` to concurrently fetch details for all courses via `buildDetails`.
  - Calls `populateSectionsColumn` with the resulting data to update the column cells.

### 5. Observing Changes
- **Function: `observeTableChanges`**  
  - Uses a `MutationObserver` to continuously watch a parent element (typically `#content`) for changes in the table.
  - Debounces callback execution (default delay of 250ms) to prevent excessive re-runs.
  - Calls the `main()` function when the table’s content changes (detected by comparing the current HTML with the last known HTML).

## Integration

- **Usage in Extension:**  
  Include this script as a display content script in your extension, ensuring it runs on pages matching your target URL (e.g., `https://*.instructure.com/accounts/*`).

- **Assumptions:**  
  - The target page contains a `<thead>` with a `<tr>` for headers.
  - The target page contains a `<tbody>` with the attribute `data-automation="courses list"` that holds course rows.
  - The Canvas API endpoint (`https://*.instructure.com/api/v1/courses/{courseID}/sections`) returns a JSON response prefixed with `"while(1);"`.

## Customization

- **Formatting Rules:**  
  You can adjust the mapping and formatting in `populateSectionsColumn` to change how section names are abbreviated or styled.

- **Debounce Interval:**  
  Modify the `debounceTime` parameter in `observeTableChanges` if you need a shorter or longer delay.

## Troubleshooting

- **Table Not Updating:**  
  Ensure the table’s `<tbody>` has the attribute `data-automation="courses list"`. The observer relies on this selector.
  
- **API Response Issues:**  
  Verify that the API endpoint is correct and that the `"while(1);"` prefix is properly removed before JSON parsing.

