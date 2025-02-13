// displaySectionColumns.js
"use strict";

let courseRows = [];

/**
 * Asynchronously builds course details from a row.
 * @param {HTMLElement} row - A table row element representing a course.
 * @returns {Promise<Object>} An object containing course details and its sections.
 */
async function buildDetails(row) {
  const courseLink = row.querySelector('a[href*="/courses/"]');
  if (!courseLink) throw new Error("Course link not found in row.");
  const href = courseLink.getAttribute('href');
  const courseID = href.split('/courses/')[1];
  const info = { row, courseLink, courseID, sections: [] };

  const response = await fetch(`https://byui.instructure.com/api/v1/courses/${courseID}/sections`);
  const text = await response.text();
  info.sections = JSON.parse(text.replace('while(1);', ''));
  return info;
}

/**
 * Creates a new column header if it doesn't already exist.
 * @param {string} columnID - The ID to assign to the header.
 * @param {string} title - The title to display in the header.
 */
function createColumn(columnID, title) {
  if (document.getElementById(columnID)) return;
  const headerRow = document.querySelector('thead > tr');
  if (!headerRow) return;
  const newHeader = document.createElement('th');
  newHeader.id = columnID;
  newHeader.innerText = title;
  headerRow.appendChild(newHeader);
}

/**
 * Creates new cells for the specified column in every course row.
 * @param {string} columnID - The class name used to identify the new cells.
 */
function createColumnCells(columnID) {
  courseRows.forEach(row => {
    if (!row.querySelector(`td.${columnID}`)) {
      const newCell = document.createElement('td');
      newCell.classList.add(columnID);
      row.appendChild(newCell);
    }
  });
}

/**
 * Populates the specified column cells with formatted section data.
 * @param {Array} courses - Array of course detail objects.
 * @param {string} columnID - The identifier for the column.
 */
function populateSectionsColumn(courses, columnID) {
  courses.forEach(course => {
    const cellContents = course.sections
      .map(section => {
        const style = section.nonxlist_course_id !== null ? 'color:#42aaf4' : '';
        let name = section.name.replace(/section/i, '').trim();
        name = name.includes('Reference') ? 'REF' : name;
        name = name.includes('Course Council View') ? 'CCV' : name;
        name = name.includes('Blueprint') ? 'BP' : name;
        name = name.length > 5 ? `${name.substring(0, 5)}...` : name;
        if (name.length === 1) name = `0${name}`;
        return `<span style="${style}">${name}</span>`;
      })
      .join(', ');
    const cell = course.row.querySelector(`td.${columnID}`);
    if (cell) cell.innerHTML = cellContents;
  });
}

/**
 * Main function that updates the display column.
 */
async function main() {
  const tbody = document.querySelector('tbody[data-automation="courses list"]');
  if (!tbody) return;
  courseRows = Array.from(tbody.querySelectorAll('tr')).slice(1);
  createColumn('crossListedSections', 'Sections');
  createColumnCells('crossListedSections');
  try {
    const courses = await Promise.all(courseRows.map(buildDetails));
    populateSectionsColumn(courses, 'crossListedSections');
  } catch (error) {
    console.error("Error updating sections column:", error);
  }
}

/**
 * Waits for a condition to be met on a parent element and then calls a callback.
 * @param {HTMLElement} parent - The element to observe.
 * @param {Function} conditionFn - A function returning a boolean.
 * @param {Function} callback - Function to execute once the condition is met.
 */
function waitFor(parent, conditionFn, callback) {
  const observer = new MutationObserver(() => {
    if (conditionFn()) {
      observer.disconnect();
      callback();
    }
  });
  observer.observe(parent, { childList: true, subtree: true });
}

// If the option to show the sections column is enabled, monitor changes and update the column.

let lastHTML = '';
const contentContainer = document.querySelector('#content');
waitFor(contentContainer, () => {
    const tbody = document.querySelector('tbody[data-automation="courses list"]');
    if (!tbody) return false;
    const currentHTML = tbody.innerHTML;
    return currentHTML && currentHTML !== lastHTML;
}, async () => {
    await main();
    const tbody = document.querySelector('tbody[data-automation="courses list"]');
    if (tbody) lastHTML = tbody.innerHTML;
});


