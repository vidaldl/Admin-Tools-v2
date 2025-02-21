# blueprintUnlock.js

## Overview

The `blueprintUnlock.js` script is a clickable content script for the BYUI Canvas Admin Tools extension. Its purpose is to unlock every blueprint item present on the page—such as those found in modules, assignments, quizzes, etc.—by simulating clicks on all elements that are currently locked. This script is intended to be triggered by a user action (for example, from a popup button) and is part of the master list under the ID `"blueprintUnlock"`.

## Features

- **Bulk Unlocking:**  
  The script automatically selects all elements on the page that match the CSS selector `.lock-icon.lock-icon-locked`, which represent blueprint items that are currently locked, and simulates a click on each to unlock them.

- **Console Logging:**  
  Logs key actions (start, if no items are found, and completion) to the console for debugging and confirmation purposes.

## How It Works

1. **Element Selection:**  
   - The script selects all elements with the classes `.lock-icon` and `.lock-icon-locked` using `document.querySelectorAll`.
   - These elements are assumed to represent blueprint items that are currently locked.

2. **Condition Check:**  
   - If no locked blueprint items are found, the script logs "There is nothing to unlock." and exits.

3. **Simulated Clicks:**  
   - For each locked blueprint element found, the script simulates a click event to unlock it.
   - Once all locked items are processed, the script logs "Unlocked" to the console.

4. **Execution:**  
   - The script runs immediately when injected, so that it performs the unlocking action on demand.
