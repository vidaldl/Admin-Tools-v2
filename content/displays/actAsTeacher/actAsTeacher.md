# actAsTeacher.js

## Overview

The `actAsTeacher.js` script is a display function for the BYUI Canvas Admin Tools extension. Its purpose is to provide the Canvas admin a convinient buton to quickly impersonate a teacher. The script checks if the current web page is in a Canvas course, then it fetches the teacher and populates the impersonate button along with both the navigation bar and the link to parent blueprint all together at the bottom of the browser.

## Features

- **Convinient act as teacher button:**  
  For courses that have teacher(s), it will now have a button that takes you directly to the impersonate page of that teacher. There is also a dropdown menu where you can select different teacher if the course has multiple. 


## How It Works

1. **Impersonate button population:**  
   - The `ensureActAsTeacherControlsHost` function checks for any existing "Impersonate" button and populates one if there is none.
   - For each teacher in the course, it makes an API call to Canvas and sorts the fetched teachers alphabetically.

2. **Dynamic navigation bar checker**
   - The `ensureBottomNavbar` function dynamicaly checks for the existence of a navigation bar populated by another script.
   - If the navigation bar does not exist, it creates and renders one right away.


## Usage

- **Integration:**  
  Include `actAsTeacher.js` as a display content script in your extension. It is designed to run on Canvas LMS course pages (or other target pages) that have active teachers.




