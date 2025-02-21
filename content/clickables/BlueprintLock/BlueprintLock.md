# blueprintLock.js

## Overview

The `blueprintLock.js` script is a clickable content script for the BYUI Canvas Admin Tools extension. Its purpose is to lock every blueprint item present on a page—such as those found in modules, assignments, quizzes, etc.—by simulating clicks on all elements that are currently unlocked. This script is intended to be triggered by a user action (e.g., clicking a button in the popup) and is part of the master list under the ID `"blueprintLock"`.

## Features

- **Bulk Locking:**  
  Automatically locates and clicks all elements with the classes `.lock-icon` and `.btn-unlocked` to lock blueprint items in one operation.

- **Console Logging:**  
  Logs key actions (starting the process, if no elements are found, and completion) to the console for debugging and confirmation purposes.

## How It Works

1. **Element Selection:**  
   The script selects all elements on the page that match the CSS selector `.lock-icon.btn-unlocked`. These elements represent blueprint items that are currently unlocked.

2. **Condition Check:**  
   If no such elements are found, the script logs a message ("There is nothing to lock.") and exits.

3. **Simulated Clicks:**  
   For each unlocked blueprint element, the script simulates a click event, triggering the locking mechanism built into the page.

4. **Logging:**  
   The script logs "running" at the start and "Locked" after processing all elements, providing feedback on its operation.
