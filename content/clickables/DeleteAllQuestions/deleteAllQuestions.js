"use strict";

/**
 * Checks if the current page URL matches the expected quiz edit page pattern.
 * Expected path format: /courses/{courseID}/quizzes/{quizID}/edit
 * @returns {boolean} True if the URL matches, false otherwise.
 */
const isQuizEditPage = () => {
  try {
    const url = new URL(window.location.href);
    if (!url.protocol.startsWith("https")) return false;
    if (!url.hostname.endsWith(".instructure.com")) return false;
    const segments = url.pathname.split("/").filter(Boolean);
    // Expected segments: ["courses", courseID, "quizzes", quizID, "edit"]
    return segments.length >= 5 &&
           segments[0] === "courses" &&
           segments[2] === "quizzes" &&
           segments[4] === "edit";
  } catch (error) {
    return false;
  }
};

/**
 * Deletes all quiz questions by simulating clicks on each delete link.
 * Temporarily overrides window.confirm to suppress multiple confirmations.
 * Uses node cloning to remove existing event listeners that trigger confirms.
 */
const deleteAllQuizQuestions = () => {
  if (!isQuizEditPage()) {
    console.error("deleteAllQuizQuestions: This script only runs on quiz edit pages.");
    return;
  }

  const originalConfirm = window.confirm;
  try {
    // Override confirm so that it always returns true.
    window.confirm = () => true;

    // Ask for confirmation once using the original confirm.
    if (originalConfirm("Are you sure you want to delete ALL the questions?")) {
      const deleteLinks = document.querySelectorAll("#questions .display_question .delete_question_link");
      deleteLinks.forEach(link => {
        // Clone the node to remove any event listeners that trigger a confirm.
        const clone = link.cloneNode(true);
        link.parentNode.replaceChild(clone, link);
        clone.click();
      });
      console.log("Quiz questions deleted!");
    } else {
      console.log("Deletion cancelled.");
    }
  } catch (err) {
    console.error("Error deleting quiz questions:", err);
  } finally {
    // Restore the original window.confirm function.
    window.confirm = originalConfirm;
  }
};

// Execute the deletion process immediately.
deleteAllQuizQuestions();
