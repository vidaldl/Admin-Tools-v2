"use strict";

/**
 * Creates a navigation bar at the bottom of the page if it doesn't already exist.
 * The navbar is positioned based on the computed width of the sidebar (#header).
 */
// TODO: Make this function run in any page of the course
function createParentNavbar() {
  const sidebar = document.querySelector('#header');
  if (!sidebar) return;
  const sidebarWidth = window.getComputedStyle(sidebar).getPropertyValue('width');

  const impersonateBar = document.getElementById('fixed_bottom');
  let bottomOffset = '0';
  if (impersonateBar) {
    const barHeight = window.getComputedStyle(impersonateBar).getPropertyValue('height');
    const height = parseInt(barHeight);
    bottomOffset = `${height}px`;
  }
  
  const navbar = document.createElement('div');
  navbar.id = 'navToModule_ext';
  Object.assign(navbar.style, {
    height: '24px',
    lineHeight: '24px',
    width: `calc(100vw - ${sidebarWidth})`,
    maxWidth: `calc(100vw - ${sidebarWidth})`,
    zIndex: '10',
    backgroundColor: 'white',
    borderTop: '1px solid #ddd',
    padding: '2px',
    color: 'black',
    position: 'fixed',
    bottom: bottomOffset,  // prevents the navbar being covered by the impersonate bar
    left: sidebarWidth,
    display: 'flex'
  });
  
  document.body.appendChild(navbar);
}

/**
 * Fetches blueprint subscription data for the current course using the Fetch API.
 * Removes any extraneous prefixes from the response before parsing.
 * @returns {Promise<Object[]>} - A promise that resolves with an array of blueprint subscriptions.
 */
async function buildDetails() {
  const courseID = new URL(document.location.href).pathname.split('/')[2];
  try {
    const host = window.location.origin;
    const response = await fetch(`${host}/api/v1/courses/${courseID}/blueprint_subscriptions`);
    const responseJSON = await response.json();
    return responseJSON;
  } catch (err) {
    throw new Error(`Failure to retrieve data for course ${courseID}: ${err}`);
  }
}

/**
 * Fetches blueprint subscription data and, if available, creates or updates
 * the navbar with a link to the parent blueprint course.
 */
async function addBlueprintParent() {
  try {
    const blueprintData = await buildDetails();
    const host = window.location.origin;
    if (Object.keys(blueprintData).length > 0) {
      if (!document.getElementById('navToModule_ext')) {
        createParentNavbar();
      }
      const blueprintID = blueprintData[0].blueprint_course.id;
      const navbar = document.getElementById('navToModule_ext');
      // Create an anchor element for the parent blueprint link
      const anchor = document.createElement('a');
      anchor.href = `${host}/courses/${blueprintID}`;
      anchor.id = 'parentBlueprintCourse';
      anchor.target = '_blank';
      Object.assign(anchor.style, {
        fontSize: '14px',
        padding: '0 7px',
        position: 'fixed',
        right: '0'
      });
      anchor.textContent = 'Parent Blueprint';
      navbar.appendChild(anchor);
    }
  } catch (error) {
    console.error(error);
  }
}

// Check if the option to add the blueprint parent link is enabled
addBlueprintParent();

