"use strict";

// Override window.confirm immediately so that all event handlers reference this version.
window.confirm = () => true;
