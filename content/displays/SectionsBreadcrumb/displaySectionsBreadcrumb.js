// displayBreadcrumbs.js
"use strict";

/**
 * Fetches section data for the given course ID using the Fetch API.
 * @param {string} courseID - The course identifier.
 * @returns {Promise<Object[]>} - The parsed array of section objects.
 */
async function getData(courseID) {

    const host = window.location.origin;
    const response = await fetch(`${host}/api/v1/courses/${courseID}/sections`);
    const jsonReponse = await response.json();

    return jsonReponse;
}

/**
 * Formats section data into a single string of abbreviated section names.
 * @param {Object[]} sections - Array of section objects.
 * @returns {string} - Formatted section numbers enclosed in parentheses.
 */
function createSectionNumbers(sections) {
  const sectionNumbers = sections.map(section => {
    const colorStyle = section.nonxlist_course_id !== null ? 'color:#42aaf4' : '';
    let name = section.name.replace(/section/i, '').trim();
    name = name.includes('Reference') ? 'REF' : name;
    name = name.includes('Course Council View') ? 'CCV' : name;
    name = name.includes('Blueprint') ? 'BP' : name;
    name = name.length > 5 ? `${name.substring(0, 5)}...` : name;
    if (name.length === 1) name = `0${name}`;
    return `<span style="${colorStyle}">${name}</span>`;
  }).join(', ');
  return `(${sectionNumbers})`;
}

/**
 * Fetches section data for the current course and updates the breadcrumb trail.
 */
async function displayBreadcrumbs() {
  const courseID = new URL(document.location.href).pathname.split('/')[2];
  const breadcrumbLink = document.querySelector(`#breadcrumbs a[href*='/courses/${courseID}']`);
  if (!breadcrumbLink) return;
  
  try {
    const sections = await getData(courseID);
    const sectionNumbers = createSectionNumbers(sections);
    if (sectionNumbers !== '()') {
      breadcrumbLink.innerHTML += ' ' + sectionNumbers;
    }
  } catch (error) {
    console.error("Error fetching section data:", error);
  }
}

// Display Breadcrumbs

displayBreadcrumbs();

