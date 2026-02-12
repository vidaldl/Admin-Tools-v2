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
    bottom: '0',
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
 * Locates the current content in pb course by searhing the content name
 */
async function locateCurrentContent(blueprintData) {
  const host = window.location.origin;
  const blueprintID = blueprintData[0].blueprint_course.id;
  const currentURL = window.location.href;
  const urlElements = currentURL.split('/');
  const courseID = urlElements[4];
  let pbUrl = '';
  let pbContentID = '';

  if (urlElements.length < 6) {
    pbUrl = `${host}/courses/${blueprintID}`;
  } else if (urlElements.length > 6){                                      // These are special cases
    const currentContentType = urlElements[5];
    const lastElement = urlElements[urlElements.length - 1];
    if (lastElement === 'syllabus') {
      pbUrl = `${host}/courses/${blueprintID}/assignments/syllabus`;
    } else if (lastElement === '22573') {
      pbUrl = `${host}/courses/${blueprintID}/external_tools/22573`;
    } else if (lastElement === '132') {
      pbUrl = `${host}/courses/${blueprintID}/external_tools/132`;
    } else {                                                               // Logic falls into here if the user is at a specific content page
      const childContentID = urlElements[urlElements.length - 1];
      const apiMap = {
        // TODO: make module, file, and gradebook special cases
        'assignments': {
          'child':`${host}:443/api/v1/courses/${courseID}/assignments/${childContentID}`, 
          'pbSearch': `${host}:443/api/v1/courses/${blueprintID}/assignments?search_term=`,
          'pbBase': `${host}/courses/${blueprintID}/assignments`
        },
        'quizzes': {
          'child': `${host}:443/api/v1/courses/${courseID}/quizzes/${childContentID}`,
          'pbSearch': `${host}:443/api/v1/courses/${blueprintID}/quizzes?search_term=`,
          'pbBase': `${host}/courses/${blueprintID}/quizzes`
        },
        'discussions': {
          'child': `${host}:443/api/v1/courses/${courseID}/discussion_topics/${childContentID}`,
          'pbSearch': `${host}:443/api/v1/courses/${blueprintID}/discussion_topics?search_term=`,
          'pbBase': `${host}/courses/${blueprintID}/discussion_topics`
        },
        'pages': {
          'child': `${host}:443/api/v1/courses/${courseID}/pages/${childContentID}`,
          'pbSearch': `${host}:443/api/v1/courses/${blueprintID}/pages?search_term=`,
          'pbBase': `${host}/courses/${blueprintID}/pages`
        },
        'syllabus': {
          'child': `${host}/courses/${courseID}/syllabus`,
          'pbSearch': '',
          'pbBase': `${host}/courses/${blueprintID}/syllabus`
        },
        'items':{
          'child': `${host}:443/api/v1/courses/${courseID}/items/${childContentID}`,
          'pbSearch': `${host}:443/api/v1/courses/${blueprintID}/items?search_term=`,
          'pbBase': `${host}/courses/${blueprintID}/items`
        },
        'users': {
          'child': `${host}/courses/${courseID}/users`,  // Ratiionale is that users are not in the blueprint course
          'pbSearch': '',
          'pbBase': `${host}/courses/${blueprintID}/users`
        },
        // 'files': `${host}:443/api/v1/courses/${courseID}/files?search_term=`,
        // 'grades': `${host}:443/api/v1/courses/${courseID}/grades}`
      }
      try {
        if (currentContentType !== 'users' && currentContentType !== 'syllabus' && apiMap[currentContentType]) {
          const response = await fetch(apiMap[currentContentType].child);
          const contentData = await response.json();
          const pbContentTitle = contentData.title ? contentData.title : contentData.name;

          // now use the title to search for hte id on pb course
          const url = apiMap[currentContentType].pbSearch + encodeURIComponent(pbContentTitle);
          const pbResponse = await fetch(url);
          const pbContentData = await pbResponse.json();

          // Check if the content is found otherwise the base content url is used
          if (pbContentData && pbContentData.length > 0) {
            pbContentID = pbContentData[0].id;
            pbUrl = `${host}/courses/${blueprintID}/${currentContentType}/${pbContentID}`;
          } else {
            pbUrl = apiMap[currentContentType].pbBase;
          }
        } else {
          pbUrl = apiMap[currentContentType]?.pbBase || `${host}/courses/${blueprintID}`;
        }

      } catch (error) {
        console.error(`Failure to retrieve data for content ${currentContentType}: ${error}`);
        pbUrl = apiMap[currentContentType]?.pbBase || `${host}/courses/${blueprintID}`;
      }

    }
  } else {
    const contentMap = {
      'assignments': `${host}/courses/${blueprintID}/assignments`,
      'quizzes': `${host}/courses/${blueprintID}/quizzes`,
      'discussions': `${host}/courses/${blueprintID}/discussion_topics`,
      'pages': `${host}/courses/${blueprintID}/pages`,
      'wiki': `${host}/courses/${blueprintID}/wiki`,
      'syllabus': `${host}/courses/${blueprintID}/syllabus`,
      'modules': `${host}/courses/${blueprintID}/modules`,
      'items': `${host}/courses/${blueprintID}/items`,
      'files': `${host}/courses/${blueprintID}/files`,
      'users': `${host}/courses/${blueprintID}/users`,
      'grades': `${host}/courses/${blueprintID}/grades`,
      'announcements': `${host}/courses/${blueprintID}/announcements`,
    }
    const currentContentType = urlElements[5];
    pbUrl = contentMap[currentContentType];
  }
  return pbUrl;
}

/**
 * Fetches blueprint subscription data and, if available, creates or updates
 * the navbar with a link to the parent blueprint course.
 */
async function addBlueprintParent() {
  try {
    // See where the user was at in the child course

    const blueprintData = await buildDetails();
    // const host = window.location.origin;
    if (Object.keys(blueprintData).length > 0) {
      if (!document.getElementById('navToModule_ext')) {
        createParentNavbar();
      }
      // const blueprintID = blueprintData[0].blueprint_course.id;
      const navbar = document.getElementById('navToModule_ext');
      // Create an anchor element for the parent blueprint link
      const anchor = document.createElement('a');
      const pbUrl = await locateCurrentContent(blueprintData);
      anchor.href = pbUrl;
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

