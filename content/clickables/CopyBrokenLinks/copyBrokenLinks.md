# copyBrokenLinks.js

## Overview

The `copyBrokenLinks.js` script is a clickable content script for the Canvas Admin Tools V2 extension. Its purpose is to extract data from the Canvas Link Validator page and present it in an organized, user-friendly popup window that enables easy copying of broken link information. This tool significantly streamlines the process of documenting and addressing broken links in Canvas courses by automatically categorizing and formatting the data.

## Features

- **Comprehensive Data Collection:**  
  Automatically scrapes multiple types of data from the Link Validator page, including:
  - Course name
  - Broken link titles
  - Page URLs containing broken links
  - Broken link URLs
  - Broken link location within the course
  - Reason why links are broken

- **Interactive Popup Interface:**  
  Opens a dedicated popup window with organized columns for each data type, allowing for selective or comprehensive data copying.

- **Intelligent Link Analysis:**  
  Automatically analyzes and categorizes broken links by:
  - Identifying links from external courses
  - Detecting deleted Canvas content
  - Recognizing external resources
  - Flagging inaccessible resources
  - Determining specific locations within the course

- **Flexible Copying Options:**  
  Provides both individual column copying (via dedicated buttons) and a "Copy All" function that formats data into a tab-delimited format suitable for spreadsheet import.

- **Visual Organization:**  
  Presents data in a grid layout with color-coded headers and scrollable text areas for easy navigation of large datasets.

## How It Works

1. **Data Collection (`scrape()`):**  
   - Executes when the script is triggered from the extension popup
   - Calls utility functions to collect various data elements from the Link Validator page:
     - `selectHeaderHREFs()` - Extracts page URLs containing broken links
     - `selectLinksHREFs()` - Extracts the broken link URLs themselves
     - `selectAllTitles()` - Extracts the text/titles of broken links
     - `selectCourseName()` - Extracts and formats the course name
     - `selectBrokenLinkLocation()` - Determines where in the course structure each broken link appears

2. **Data Storage and Popup Initialization:**  
   - Stores all collected data in Chrome's local storage
   - Opens a dedicated popup window (`copyAllBrokenLinksPopup.html`) to display the collected data
   - Sends a message to the background script with the action "showBrokenLinksPopup"

3. **Data Analysis (`populateReasons()`):**  
   - Analyzes broken link URLs to determine why they're broken
   - Uses fetch requests to check status codes
   - Applies logic rules to categorize links based on URL patterns and response codes
   - Categories include: "Hidden Link", "From External Course", "Page Doesn't Exist", "Equella", "Library Resource", "From External Resource", "Image", "Page Not Found", "Site Can't Be Reached"

4. **Popup Interface:**  
   - Displays data in six columns: Course, Reason, Location, Link Titles, Page URLs, and Broken Links
   - Each column has a dedicated "Copy" button for selective copying
   - The "Copy All" button at the bottom formats all data into a tab-delimited structure

5. **Course Location Identification:**  
   - Intelligently determines the location of broken links within the course structure
   - Recognizes specific weeks (W01-W14), Syllabus, Homepage, Resources, and other course sections

## Integration

This script is designed to run on Canvas Link Validator pages, specifically targeting URLs matching the pattern: `[canvas_instance]/course/[courseId]/link_validator`. It requires Chrome storage permissions to temporarily store scraped data and depends on additional popup files (`copyAllBrokenLinksPopup.html`, `copyAllBrokenLinksPopup.css`, and `copyAllBrokenLinksPopup.js`) to display the interactive interface.