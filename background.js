import { copyAllBrokenLinks } from './scripts/copyAllBrokenLinks/background.js';



/****
 *
 * Adds a button to the right click menu titled "Copy All Broken Links"
 * Creates a popup that allows the user to copy a formatted version of the
 * links in the Course Link Validator.
 *
 * Affected URLs:
 * "[canvas_instance]/course/[courseId]/link_validator"
 *
 ****/
 copyAllBrokenLinks();

