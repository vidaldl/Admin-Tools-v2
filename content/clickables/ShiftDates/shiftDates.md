# shiftDates.js

## Overview

The `shiftDates.js` script is a clickable content script for the Canvas Admin Tools extension. Its purpose is to allow users to bulk shift the due, unlock, and lock dates for assignments, quizzes, and discussions in a Canvas course. When triggered, it displays a modal interface that lists all course items with due dates, lets the user select which items to shift, and applies the specified date adjustment via the Canvas API.

## Features

- **Bulk Date Shifting:**
  - Allows shifting of due, unlock, and lock dates for assignments, quizzes, and discussions by a user-specified number of days (positive or negative).
- **Dynamic Modal Interface:**
  - Presents a modern, user-friendly modal with a table of all course items that have due dates, including type, title, and current dates.
  - Supports select-all and individual selection of items.
- **Progress and Status Feedback:**
  - Shows loading and update progress bars, percentage indicators, and status messages throughout the process.
- **Robust API Handling:**
  - Uses the Canvas API with CSRF token handling for secure requests.
  - Implements retry logic and exponential backoff for rate-limited or failed requests.
- **Completion Summary:**
  - Displays a summary of successful and failed updates, with options to refresh the page or close the modal.

## How It Works

1. **Course Detection:**
   - Extracts the `courseID` from the current page URL. If not on a course page, alerts the user and exits.

2. **Modal Construction:**
   - Builds and injects a modal overlay into the page, including controls for entering the number of days to shift and a table listing all relevant course items.

3. **Data Loading:**
   - Fetches assignments, quizzes, and discussions with due dates from the Canvas API, updating the progress bar as each type is loaded.
   - Populates the table with the fetched items, grouped by type.

4. **User Interaction:**
   - User selects items and enters the number of days to shift.
   - On confirmation, the script iterates through selected items, updating their dates via the Canvas API and showing progress.

5. **API Requests:**
   - For each item, sends a PUT request to the appropriate Canvas API endpoint to update the due, unlock, and lock dates.
   - Handles rate limiting and errors with retries and exponential backoff.

6. **Completion:**
   - After processing, displays a summary with the number of successful and failed updates, and provides options to refresh or close.

## Usage Notes

- Only items with due dates are listed and eligible for shifting.
- The script must be run from a Canvas course page (URL must include `/courses/{courseID}`).
- All changes are made via the Canvas API and require appropriate permissions.
- The modal can be closed at any time; no changes are made until the user confirms the shift.

---

*This script is part of the Admin Tools extension and is intended for use by Canvas course administrators and designers.*
