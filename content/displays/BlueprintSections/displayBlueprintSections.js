// displayParentLink.js
"use strict";

/**
 * Enhances blueprint association links by ensuring that each module row
 * in the blueprint associations table includes a clickable link to the course.
 */
const blueprintAssociations = () => {
  const associatedCourses = document.querySelectorAll(
    'span[dir="ltr"] .bca-associations-table tr[id^="course_"]'
  );

  associatedCourses.forEach((row) => {
    const courseID = row.id.split("_")[1];
    if (!courseID) return;

    const linkSpan = row.querySelector("td span");
    if (!linkSpan) return;

    const href = `/courses/${courseID}`;

    // If we already wrapped it, do nothing (idempotent).
    const existingAnchor = linkSpan.querySelector("a");
    if (existingAnchor) {
      if (existingAnchor.getAttribute("href") !== href) {
        existingAnchor.setAttribute("href", href);
      }
      if (existingAnchor.getAttribute("target") !== "_blank") {
        existingAnchor.setAttribute("target", "_blank");
      }
      return;
    }

    // Wrap existing contents (preserves any formatting/nodes inside the span).
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";

    while (linkSpan.firstChild) {
      a.appendChild(linkSpan.firstChild);
    }
    linkSpan.appendChild(a);
  });
};

/**
 * Sets up a debounced MutationObserver on the given parent element.
 * The callback (blueprintAssociations) is invoked after changes are detected,
 * debounced by the specified delay.
 * @param {HTMLElement} parent - The element to observe.
 * @param {number} delay - Debounce delay in milliseconds.
 */
function observeChanges(parent, delay = 250) {
  let timeoutId;
  const observer = new MutationObserver(() => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      blueprintAssociations();
    }, delay);
  });
  observer.observe(parent, { childList: true, subtree: true });
  return observer;
}

// Always run the blueprintAssociations function immediately if the target elements exist.
const runImmediately = () => {
  const targets = document.querySelectorAll('span[dir="ltr"] .bca-associations-table tr[id^="course_"] span');
  if (targets.length > 0) {
    blueprintAssociations();
  }
};


// Run immediately to ensure links are displayed when the page is opened.
runImmediately();
// Set up an observer on the entire document to capture future changes.
observeChanges(document, 250);
