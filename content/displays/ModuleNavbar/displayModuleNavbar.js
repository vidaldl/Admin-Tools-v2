"use strict";

/**
 * Retrieves module anchor tags from the page, filtering out any that don't have a valid ID.
 * @returns {HTMLElement[]} An array of module anchor elements.
 */
const getModules = () => {
  return Array.from(document.querySelectorAll('[data-module-id] > a[id*="module_"]'))
    .filter(anchor => anchor.id !== 'module_');
};

/**
 * Creates a navigation bar element for modules if it doesn't already exist.
 */
const createNavbar = () => {
  const sidebar = document.querySelector('#header');
  if (!sidebar) return;
  const sidebarWidth = window.getComputedStyle(sidebar).getPropertyValue('width');
  const navbar = document.createElement('div');

  const impersonateBar = document.getElementById('fixed_bottom');
  let bottomOffset = '0';
  if (impersonateBar) {
    const barHeight = window.getComputedStyle(impersonateBar).getPropertyValue('height');
    const height = parseInt(barHeight);
    bottomOffset = `${height}px`;
  }

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
};

/**
 * Populates the navigation bar with links derived from the modules.
 * Each link's title is based on a nearby header element.
 * @param {HTMLElement[]} modules - An array of module anchor elements.
 */
const fillNavbar = (modules) => {
  const navbar = document.querySelector('#navToModule_ext');
  if (!navbar) return;
  navbar.innerHTML = modules.reduce((acc, module) => {
    const headerEl = document.querySelector(`#${module.id} + div > h2`);
    if (!headerEl) return acc;
    let title = headerEl.innerHTML;
    const match = title.match(/(lesson|week|w|l)\s*(\d\d?)/i);
    if (match) {
      const digits = match[2];
      title = digits.length === 1 ? `W0${digits}` : `W${digits}`;
    }
    return acc + `<a href="#${module.id}" id="${title}" style="font-size: 14px; padding: 0 7px;">${title}</a>`;
  }, '');
};

// Check if the navToModules option is enabled and then create and populate the navbar.

if (!document.querySelector('#navToModule_ext')) {
    createNavbar();
}

fillNavbar(getModules());
