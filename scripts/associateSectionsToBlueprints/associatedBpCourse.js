// Link Associated Blueprint Courses
function associatedBpCourse() {
    console.log("runninggg");
    function blueprintAssociations() {
        // To target the span that contains the associated courses which is in tr
        let associatedCourses = document.querySelectorAll(
            'span[dir="ltr"] .bca-associations-table tr[id^="course_"]'
        );

        associatedCourses.forEach((v) => {
            let courseId = v.id.split('_')[1];
            let linkSpan = v.querySelector('td span');
            let html = linkSpan.innerHTML;
            if (
                !html.includes(
                    `<a href="/courses/${courseId}" target="_blank">${html}</a>`
                )
            ) {
                // Make the textContent in the span a link
                linkSpan.innerHTML = `<a href="/courses/${courseId}" target="_blank">${html}</a>`;
            }
        });
    }

    // If the Associations in the bp button is clicked which
    // make the blueprintAssociations truthy, execute the waitFor
    try {
        setTimeout(() => {
            if (blueprintAssociations) {
                var observer = new MutationObserver(() => {
                    // Check if the user has navigated to Associations
                    if (
                        document.querySelectorAll(
                            'span[dir="ltr"] .bca-associations-table tr[id^="course_"] span'
                        ) &&
                        document.querySelectorAll(
                            'span[dir="ltr"] .bca-associations-table tr[id^="course_"] span'
                        ).length > 0
                    ) {
                        observer.disconnect();
                        blueprintAssociations();
                    }
                    observer.observe(document, {
                        childList: true,
                        subtree: true,
                    });
                });
                observer.observe(document, {
                    childList: true,
                    subtree: true,
                });
                return observer;
            }
        }, 1000);
    } catch (error) {
        console.warn(error);
    }
}
associatedBpCourse();

