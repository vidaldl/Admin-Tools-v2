# deleteAllQuizQuestions.js

## Overview

The `deleteAllQuizQuestions.js` script is a clickable content script for the BYUI Canvas Admin Tools extension. Its purpose is to delete all quiz questions on a quiz edit page by directly calling the Canvas API. The script verifies that the current page URL follows the pattern `/courses/{courseID}/quizzes/{quizID}/edit`, extracts the necessary course and quiz identifiers, gathers all question IDs from the DOM, sends DELETE requests to the Canvas API for each question (including proper CSRF token handling), and finally refreshes the page to reflect the changes.

## Features

- **URL Pattern Validation:**  
  Uses the URL API to ensure that the script only runs on quiz edit pages, where the URL matches `/courses/{courseID}/quizzes/{quizID}/edit`.

- **Dynamic Extraction:**  
  Automatically extracts the course ID, quiz ID, and individual question IDs from the DOM.

- **Direct API Calls:**  
  Sends DELETE requests to the Canvas LMS API for each quiz question, handling CSRF tokens for secure communication.

- **Single Confirmation Prompt:**  
  Prompts the user once to confirm deletion of all quiz questions.

- **Automatic Page Refresh:**  
  Reloads the page after the deletion process completes to update the UI.

## How It Works

1. **Quiz Identifiers Extraction (`getQuizIdentifiers`):**  
   - Parses the current page URL.
   - Checks that the URL matches the expected pattern.
   - Returns an object containing `courseID` and `quizID` if the pattern matches, or `null` otherwise.

2. **Question IDs Extraction (`getQuizQuestionIDs`):**  
   - Selects quiz question elements from the DOM (using the selector `#questions .display_question`).
   - Extracts and returns an array of question IDs from the element IDs.

3. **Deleting a Quiz Question (`deleteQuizQuestion`):**  
   - Retrieves the CSRF token from the document cookies.
   - Constructs the API endpoint URL for the specific quiz question.
   - Sends a DELETE request to the API endpoint with the required headers and credentials.
   - Returns a boolean indicating whether the deletion was successful.

4. **Main Deletion Process (`deleteAllQuizQuestions`):**  
   - Uses `getQuizIdentifiers` to ensure the script is running on a valid quiz edit page.
   - Prompts the user with a single confirmation dialog.
   - Uses `getQuizQuestionIDs` to gather all question IDs.
   - Sends deletion requests for all questions concurrently using `Promise.all`.
   - Logs the results and refreshes the page with `window.location.reload()`.

## Integration

- **Usage:**  
  Include `deleteAllQuizQuestions.js` as a clickable content script in your extension's manifest. This script should only be executed on quiz edit pages.

- **Activation:**  
  Trigger the script via your extension's UI (for example, from a popup button). The script will confirm deletion with the user, delete all quiz questions, and then refresh the page.

## Customization

- **API Endpoint:**  
  Adjust the endpoint URL in `deleteQuizQuestion` if your Canvas LMS instance uses a different URL structure for deleting quiz questions.

- **DOM Selectors:**  
  If the structure of the quiz page changes, update the selector in `getQuizQuestionIDs` accordingly.

- **Confirmation Message:**  
  You can customize the text in the confirmation prompt in `deleteAllQuizQuestions`.

## Troubleshooting

- **Multiple Confirmations:**  
  Ensure that the URL is correctly recognized as a quiz edit page. The script only runs if `getQuizIdentifiers` returns valid identifiers.

- **API Errors:**  
  Check the console logs for any errors during the DELETE requests. Verify that the CSRF token is correctly retrieved and that you have the appropriate permissions.

- **Page Not Refreshing:**  
  If the page does not refresh after deletion, confirm that `window.location.reload()` is executed after all deletion promises resolve.
