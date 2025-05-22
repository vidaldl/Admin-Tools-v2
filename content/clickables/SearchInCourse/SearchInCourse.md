# searchInCourse.js

## Overview

The `searchInCourse.js` script is a clickable content script for the Canvas Admin Tools V2 extension. Its purpose is to provide a powerful search functionality that allows users to find text within various content types of a Canvas course. When activated, it displays a modal window with a search bar, fetches course content (pages, assignments, quizzes, discussions) via the Canvas API, and presents the results with highlighted excerpts and direct links to the source items.

## Features

- **Comprehensive Content Search:** Searches across course pages, assignments, quizzes (descriptions), and discussion topics (main messages and entries).
- **Dynamic Modal Interface:** Presents a user-friendly modal for search input and results display, created dynamically on the page.
- **Wildcard Support:** Allows the use of `*` as a wildcard character in search terms, matching any sequence of up to 10 characters.
- **Excerpt Generation:** Displays contextual snippets of content where the search term is found, with the term highlighted for easy identification.
- **Contextual Highlighting:** Differentiates between matches found within HTML tag attributes/definitions and those in visible text content, applying distinct visual cues (e.g., background highlight for items with tag matches).
- **Direct Links to Content:** Provides clickable links that navigate directly to the Canvas items (page, assignment, quiz, discussion) where matches are found.
- **Real-time Progress Indication:** Shows a loading percentage in the modal while fetching course content from the API.
- **Debounced Search Input:** Optimizes performance by delaying search execution until the user pauses typing, reducing unnecessary API calls or processing.
- **CSRF Token Handling:** Securely interacts with the Canvas API by including the necessary CSRF token in requests.
- **Basic Rate Limiting Handling:** Implements a retry mechanism with exponential backoff for API requests that might be rate-limited (HTTP 403).
- **HTML Content Processing:** Intelligently handles HTML content by stripping tags for text search where appropriate and by being able to search within HTML structure.

## How It Works

The script's functionality is primarily encapsulated within the main [`SearchInCourse`](content/clickables/SearchInCourse/searchInCourse.js) async function, which is executed when the script is triggered.

1.  **Initialization and UI Setup:**
    *   The script starts by calling the main [`SearchInCourse`](content/clickables/SearchInCourse/searchInCourse.js) function.
    *   It extracts the current `courseID` using [`getCourseID()`](content/clickables/SearchInCourse/searchInCourse.js) from the window's URL.
    *   If a `courseID` is found, [`buildSearchModal()`](content/clickables/SearchInCourse/searchInCourse.js) is called to dynamically create and display the search modal. The modal includes:
        *   A header with a title and close button.
        *   A search input field.
        *   A status area to show loading progress or messages like "Query too short."
        *   A container to display search results.
    *   An event listener is attached to the search input, which debounces user input and then triggers `window.searchCourseContent()` followed by [`displayResults()`](content/clickables/SearchInCourse/searchInCourse.js).

2.  **Content Fetching (`buildCourseContent(courseID, queryStatus)`):**
    *   This function is responsible for fetching all relevant data from the Canvas API.
    *   It uses helper functions ([`updateTotalItems()`](content/clickables/SearchInCourse/searchInCourse.js), [`reportItemAttempted()`](content/clickables/SearchInCourse/searchInCourse.js), [`updateOverallProgress()`](content/clickables/SearchInCourse/searchInCourse.js)) to update the `queryStatus` element in the modal with the loading percentage.
    *   It concurrently fetches data for different content types using `Promise.all` and dedicated getter functions:
        *   [`getPages(courseID, reportItemAttempted, updateTotalItems)`](content/clickables/SearchInCourse/searchInCourse.js): Fetches all course pages.
        *   [`getAssignments(courseID, reportItemAttempted, updateTotalItems)`](content/clickables/SearchInCourse/searchInCourse.js): Fetches all assignments.
        *   [`getQuizzes(courseID, reportItemAttempted, updateTotalItems)`](content/clickables/SearchInCourse/searchInCourse.js): Fetches all quizzes.
        *   [`getDiscussions(courseID, reportItemAttempted, updateTotalItems)`](content/clickables/SearchInSearchInCourse/searchInCourse.js): Fetches all discussion topics and their entries.
    *   All fetched data is stored in the `window.adminToolsCourseContent` object.
    *   The `queryStatus` is updated to "Ready to search" upon successful completion or an error message if fetching fails.

3.  **API Interaction (e.g., `fetchJSON(url, retries)`):**
    *   A generic wrapper function, [`fetchJSON()`](content/clickables/SearchInCourse/searchInCourse.js), handles all API `fetch` requests.
    *   It automatically includes credentials and the CSRF token (retrieved by [`getCsrfToken()`](content/clickables/SearchInCourse/searchInCourse.js)).
    *   It implements a retry mechanism with exponential backoff for HTTP 403 errors, which often indicate rate limiting.
    *   Each content-specific getter function (e.g., [`getPages`](content/clickables/SearchInCourse/searchInCourse.js)) uses [`fetchJSON()`](content/clickables/SearchInCourse/searchInCourse.js) to call the appropriate Canvas API v1 endpoints.

4.  **Search Execution (`window.searchCourseContent(term)`):**
    *   This function, attached to the `window` object, performs the actual search.
    *   It takes the search `term` as input.
    *   If the `term` includes an asterisk (`*`), it constructs a regular expression using [`escapeRegExp()`](content/clickables/SearchInCourse/searchInCourse.js) for literal parts and `.{0,10}` for the wildcard.
    *   It iterates through the `window.adminToolsCourseContent` (pages, assignments, quizzes, discussions).
    *   For each item, it searches the concatenated `title` and `body` (both lowercased) using the regex (if wildcard) or a simple `includes()` check for literal terms.
    *   Returns an object mapping content types to arrays of matching items.

5.  **Displaying Results (`displayResults(results, searchTerm, container, courseID)`):**
    *   Clears any previous results from the `container`.
    *   Iterates over the `results` object. For each content type with matches:
        *   Displays a section header (e.g., "3 matches in Pages").
        *   Creates a list of matched items. Each item includes:
            *   A direct link to the Canvas content item, showing its type (e.g., "Page:") and title.
            *   If the item `body` contains matches, it calls [`getAllMatchDetails()`](content/clickables/SearchInCourse/searchInCourse.js) to find all occurrences.
            *   For each occurrence, [`createExcerpt()`](content/clickables/SearchInCourse/searchInCourse.js) is called to generate a highlighted snippet.
            *   If any match within an item's body is found inside an HTML tag (determined by [`isIndexEffectivelyInTag()`](content/clickables/SearchInCourse/searchInCourse.js)), the list item receives a distinct background style.
    *   If no matches are found, it displays a "No matches found" message.

6.  **Excerpt Generation (`createExcerpt(rawHtmlBody, textToHighlight, maxLength, matchIndex)`):**
    *   Generates a contextual snippet around the `textToHighlight` (the actual matched text segment).
    *   Uses [`isIndexEffectivelyInTag()`](content/clickables/SearchInCourse/searchInCourse.js) to check if the match occurs within an HTML tag's definition.
    *   If inside a tag: the excerpt is HTML-escaped (using [`escapeHTML()`](content/clickables/SearchInCourse/searchInCourse.js)), and the matched term is wrapped in `<mark>` tags that are re-inserted to display as highlighted code.
    *   If not inside a tag: HTML is stripped from the segment (using [`stripHTML()`](content/clickables/SearchInCourse/searchInCourse.js)), and the matched term is highlighted with `<mark>` tags in the plain text.
    *   Adds ellipses (`...`) if the excerpt is truncated.

7.  **Utility Functions:**
    *   [`stripHTML(html)`](content/clickables/SearchInCourse/searchInCourse.js): Removes HTML tags from a string.
    *   [`delay(ms)`](content/clickables/SearchInCourse/searchInCourse.js): Creates a promise-based delay.
    *   [`getCsrfToken()`](content/clickables/SearchInCourse/searchInCourse.js): Retrieves the CSRF token from document cookies.
    *   [`getCourseID()`](content/clickables/SearchInCourse/searchInCourse.js): Extracts the course ID from the current URL.
    *   [`escapeHTML(html)`](content/clickables/SearchInCourse/searchInCourse.js): Escapes HTML special characters for safe display.
    *   [`getAllMatchDetails(text, searchTerm)`](content/clickables/SearchInCourse/searchInCourse.js): Finds all match occurrences in text, returning their index and the actual matched text segment (crucial for wildcard matches).
    *   [`capitalizeFirstLetter(string)`](content/clickables/SearchInCourse/searchInCourse.js): Capitalizes the first letter of a string.
    *   [`escapeRegExp(string)`](content/clickables/SearchInCourse/searchInCourse.js): Escapes characters with special meaning in regular expressions.
    *   [`isIndexEffectivelyInTag(htmlString, targetIndex)`](content/clickables/SearchInCourse/searchInCourse.js): Determines if a given character index within an HTML string is part of a tag's definition.

## Integration

-   **Usage in Extension:**
    This script is included as a "clickable" content script in the extension's manifest. It is identified by the ID `"searchInCourse"` in [`background/background.js`](background/background.js).
-   **Activation:**
    1.  Navigate to a Canvas course page (e.g., the course homepage, as the script needs to extract a course ID from the URL like `/courses/{courseID}/...`).
    2.  Open the extension popup.
    3.  Click the **Search in Course** button.
    4.  A modal will appear, and content loading will begin. Once loading is complete (or a "Query too short" message appears), you can type your search term into the input field.
-   **Dependencies:**
    *   Relies on the Canvas API (v1) for fetching course content.
    *   Assumes a standard Canvas URL structure for course ID extraction and CSRF token availability in cookies.

## Customization

-   **API Endpoints & Content Types:** The specific API endpoints in [`fetchJSON()`](content/clickables/SearchInCourse/searchInCourse.js) calls and the types of content fetched in [`buildCourseContent()`](content/clickables/SearchInCourse/searchInCourse.js) (pages, assignments, quizzes, discussions) can be modified to include more/less data or adapt to API changes.
-   **Search Logic:**
    *   The wildcard behavior (e.g., `.{0,10}` allowing up to 10 characters) in `window.searchCourseContent` can be adjusted.
    *   The minimum search term length (currently 3 characters, unless a wildcard is used) can be changed in [`buildSearchModal()`](content/clickables/SearchInCourse/searchInCourse.js).
-   **Styling:** All styling for the modal and results is applied inline via JavaScript (e.g., `Object.assign(element.style, {...})`). These styles can be modified to change the appearance.
-   **Excerpt Length:** The `maxLength` parameter (e.g., 120 characters) passed to [`createExcerpt()`](content/clickables/SearchInCourse/searchInCourse.js) can be altered to show longer or shorter snippets.
-   **Rate Limiting Delays:** The `delay` values in [`fetchJSON()`](content/clickables/SearchInCourse/searchInCourse.js) and between batch processing in getter functions can be tuned if rate limiting is an issue.

## Troubleshooting

-   **Modal Not Appearing:**
    *   Ensure you are on a Canvas page where a course ID can be extracted from the URL (e.g., `/courses/YOUR_COURSE_ID/`).
    *   Check the browser's developer console for any errors that might occur during the execution of [`getCourseID()`](content/clickables/SearchInCourse/searchInCourse.js) or [`buildSearchModal()`](content/clickables/SearchInCourse/searchInCourse.js).
-   **"Error loading content" Message:**
    *   Open the developer console to look for specific API error messages logged by [`fetchJSON()`](content/clickables/SearchInCourse/searchInCourse.js).
    *   Verify network connectivity.
    *   Ensure the CSRF token is being correctly retrieved. This can be an issue if Canvas changes its cookie structure.
    *   Persistent errors might indicate Canvas API rate limiting, though the script has basic retry logic.
-   **No Search Results / "Query too short":**
    *   Make sure your search term is at least 3 characters long, or includes a wildcard (`*`).
    *   If loading completed successfully ("Ready to search" was shown), check the console for any errors during the `window.searchCourseContent()` or [`displayResults()`](content/clickables/SearchInCourse/searchInCourse.js) phases.
    *   Confirm that `window.adminToolsCourseContent` was populated correctly by inspecting it in the console after loading.
-   **Incorrect Excerpts or Highlighting:**
    *   This could indicate an issue in the logic of [`createExcerpt()`](content/clickables/SearchInCourse/searchInCourse.js), [`getAllMatchDetails()`](content/clickables/SearchInCourse/searchInCourse.js), [`isIndexEffectivelyInTag()`](content/clickables/SearchInCourse/searchInCourse.js), or [`stripHTML()`](content/clickables/SearchInCourse/searchInCourse.js). Review these functions if excerpts are not appearing as expected.