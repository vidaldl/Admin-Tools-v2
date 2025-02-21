"use strict";

/**
 * Checks if the current page URL matches the expected quiz edit page pattern.
 * Expected path format: /courses/{courseID}/quizzes/{quizID}/edit
 * @returns {Object|null} Returns an object with courseID and quizID if matched, otherwise null.
 */
const getQuizIdentifiers = () => {
  try {
    const url = new URL(window.location.href);
    if (!url.protocol.startsWith("https")) return null;
    if (!url.hostname.endsWith(".instructure.com")) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    // Expected segments: ["courses", courseID, "quizzes", quizID, "edit"]
    if (segments.length >= 5 && segments[0] === "courses" && segments[2] === "quizzes" && segments[4] === "edit") {
      return { courseID: segments[1], quizID: segments[3] };
    }
  } catch (error) {
    console.error(error);
  }
  return null;
};

/**
 * Extracts quiz question IDs from the page.
 * Adjust this function to match the actual DOM structure where the question IDs are stored.
 * @returns {string[]} An array of question IDs.
 */
const getQuizQuestionIDs = () => {
  const questionLinks = document.querySelectorAll("#questions .display_question");
  // Assume that each delete link has a data-question-id attribute (adjust selector as needed).
  const idARRAY =  Array.from(questionLinks)
    .map(link => link.getAttribute("id").split("_")[1])
    .filter(id => id); // Filter out null or empty values.
  console.log("Array of ids: " + idARRAY)
  return idARRAY;
};

/**
 * Deletes a single quiz question by calling the Canvas API.
 * @param {string} courseID 
 * @param {string} quizID 
 * @param {string} questionID 
 * @returns {Promise<boolean>} True if the deletion was successful.
 */
async function deleteQuizQuestion(courseID, quizID, questionID) {
  const CSRFtoken = function() {
    return decodeURIComponent((document.cookie.match('(^|;) *_csrf_token=([^;]*)') || '')[2])
  }
  const endpoint = `https://byui.instructure.com/api/v1/courses/${courseID}/quizzes/${quizID}/questions/${questionID}`;
  try {
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        'X-CSRF-Token': CSRFtoken()
    },
      credentials: "include"
    });
    return response.ok;
  } catch (err) {
    console.error(`Error deleting question ${questionID}:`, err);
    return false;
  }
}

/**
 * Main function to delete all quiz questions by directly calling the Canvas API.
 */
async function deleteAllQuizQuestions() {
  const ids = getQuizIdentifiers();
  if (!ids) {
    console.error("Not on a quiz edit page.");
    return;
  }
  
  // Ask for a single confirmation.
  if (!window.confirm("Are you sure you want to delete ALL the questions?")) {
    console.log("Deletion cancelled.");
    return;
  }
  
  const questionIDs = getQuizQuestionIDs();
  if (questionIDs.length === 0) {
    console.log("No quiz questions found to delete.");
    return;
  }
  
  // Attempt to delete all questions sequentially (or in parallel with Promise.all if desired).
  const deletionResults = await Promise.all(questionIDs.map(id => deleteQuizQuestion(ids.courseID, ids.quizID, id)));
  
  if (deletionResults.every(result => result === true)) {
    console.log("All quiz questions deleted successfully!");
  } else {
    console.warn("Some quiz questions may not have been deleted.");
  }
}

// Execute the deletion process.
deleteAllQuizQuestions().then(() => {
  window.location.reload();
});