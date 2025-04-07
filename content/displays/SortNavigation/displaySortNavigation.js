"use strict";

const sortNavigation = () => {
    
  // Get the unordered list element
  const ul = document.querySelector('#nav_disabled_list');
  
  // Get all navigation items EXCEPT those with the "disabled" class
  const items = Array.from(ul.querySelectorAll('.navitem:not(.disabled)'));
  
  // Sort the items alphabetically by their text content
  items.sort((a, b) => {
      const aLabel = a.getAttribute('aria-label') || '';
      const bLabel = b.getAttribute('aria-label') || '';
      return aLabel.toLowerCase().localeCompare(bLabel.toLowerCase());
  });
  
  // Remove all existing items from the list (except disabled items)
  const disabledItems = Array.from(ul.querySelectorAll('.disabled'));
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }
  
  // Add the sorted items back to the list
  items.forEach(item => {
    ul.appendChild(item);
  });
  
  // Add the disabled items back at the end
  disabledItems.forEach(item => {
    ul.prepend(item);
  });
    
    

  const saveButton = document.getElementById('nav_form').querySelector('p button')
  if(saveButton) {
    setTimeout(() => {
      saveButton.click();
    }, 200);
  }
      
}


function addButtonToDisabledItems() {
  // Get the unordered list element
  const ul = document.querySelector('#nav_disabled_list');
  
  // Get all list items with the class "disabled"
  const disabledItems = ul.querySelectorAll('li.disabled');
  
  // Iterate through each disabled list item
  disabledItems.forEach(item => {
    // Check if the button already exists to avoid duplicates
    if (!item.querySelector('.action-button')) {
      // Create a new div element
      const div = document.createElement('div');
      div.className = 'button-container';
      
      // Create a new button element with Canvas styling
      const button = document.createElement('button');
      button.textContent = 'Sort';
      button.className = 'action-button btn btn-small btn-primary';
      button.type = 'button';
      
      button.addEventListener('click', () => { 
        sortNavigation();
      });
      // Append the button to the div
      div.appendChild(button);
      
      // Append the div to the list item
      item.appendChild(div);
    }
  });
}

// Call the function to add buttons to disabled items
addButtonToDisabledItems();
