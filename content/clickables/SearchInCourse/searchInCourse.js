async function SearchInCourse(){
    // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    // Helper to strip HTML tags from a string
    function stripHTML(html) {
        const tmp = document.createElement('div')
        tmp.innerHTML = html || ''
        return tmp.textContent || tmp.innerText || ''
    }
    
    // Helper to add delay between requests
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    // Helper to pull CSRF token from Canvas cookies
    function getCsrfToken() {
      const match = document.cookie.match('(^|;) *_csrf_token=([^;]*)')
      return match ? decodeURIComponent(match[2]) : ''
    }
  
    // Generic fetch wrapper with retry and error handling
    async function fetchJSON(url, retries = 2) {
      let delay = 500
      
      for (let i = 0; i <= retries; i++) {
        try {
          const res = await fetch(url, {
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-CSRF-Token': getCsrfToken()
            }
          })
          
          if (res.status === 403) {
            // Rate limited, wait and retry if we have retries left
            if (i < retries) {
              console.log(`Rate limited on ${url}, waiting ${delay}ms before retry ${i+1}`)
              await new Promise(r => setTimeout(r, delay))
              delay *= 2 // Exponential backoff
              continue
            }
          }
          
          if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`)
          return await res.json()
        } catch (err) {
          if (i < retries) {
            console.log(`Error on ${url}, retrying: ${err.message}`)
            await new Promise(r => setTimeout(r, delay))
            delay *= 2
            continue
          }
          throw err
        }
      }
    }
  
    // Endpoints with limits to avoid rate issues
    async function getPages(courseID, queryStatus) {
      if (queryStatus) queryStatus.textContent = 'Loading pages...'
      const pages = await fetchJSON(`/api/v1/courses/${courseID}/pages?per_page=100`)
      
      // Remove the slice limit
      const pagesToFetch = pages;
      if (queryStatus) queryStatus.textContent = `Loading page details (0/${pagesToFetch.length})...`
      
      // Fetch pages sequentially to avoid rate limits
      const foundPages = []
      for (let i = 0; i < pagesToFetch.length; i++) {
        try {
          const page = await fetchJSON(`/api/v1/courses/${courseID}/pages/${pagesToFetch[i].url}`)
          foundPages.push(page)
          if (queryStatus) queryStatus.textContent = `Loading page details (${i+1}/${pagesToFetch.length})...`
          
          // Add a small delay between requests
          if (i < pagesToFetch.length - 1) await delay(100)
        } catch (err) {
          console.error(`Error loading page ${pagesToFetch[i].url}:`, err)
          // Continue with other pages even if one fails
        }
      }
      
      console.log(`Loaded ${foundPages.length}/${pages.length} pages`)
      return foundPages
    }
  
    async function getAssignments(courseID, queryStatus) {
      if (queryStatus) queryStatus.textContent = 'Loading assignments...'
      const assignments = await fetchJSON(`/api/v1/courses/${courseID}/assignments?per_page=50`)
      return assignments.map(a => ({ id:a.id, title:a.name, body:a.description }))
    }
  
    async function getQuizzes(courseID, queryStatus) {
      if (queryStatus) queryStatus.textContent = 'Loading quizzes...'
      const quizzes = await fetchJSON(`/api/v1/courses/${courseID}/quizzes?per_page=50`)
      return quizzes.map(q => ({ id:q.id, title:q.title, body:q.description }))
    }
  
    async function getDiscussions(courseID, queryStatus) {
      if (queryStatus) queryStatus.textContent = 'Loading discussions...'
      const topics = await fetchJSON(`/api/v1/courses/${courseID}/discussion_topics?per_page=100`)
      
      // Remove the slice limit
      const topicsToFetch = topics;
      if (queryStatus) queryStatus.textContent = `Loading discussion entries (0/${topicsToFetch.length})...`
      
      // Fetch discussion entries sequentially
      const results = []
      for (let i = 0; i < topicsToFetch.length; i++) {
        try {
          const entries = await fetchJSON(
            `/api/v1/courses/${courseID}/discussion_topics/${topicsToFetch[i].id}/entries?per_page=30`
          )
          results.push({ 
            id: topicsToFetch[i].id, 
            title: topicsToFetch[i].title, 
            body: topicsToFetch[i].message, 
            entries 
          })
          if (queryStatus) queryStatus.textContent = `Loading discussion entries (${i+1}/${topicsToFetch.length})...`
          
          // Add a small delay between requests
          if (i < topicsToFetch.length - 1) await delay(100)
        } catch (err) {
          console.error(`Error loading discussion ${topicsToFetch[i].id}:`, err)
          // Continue with other discussions even if one fails
        }
      }
      
      console.log(`Loaded ${results.length}/${topics.length} discussions`)
      return results
    }
  
    // Extract courseID from URL
    function getCourseID() {
      const m = window.location.pathname.match(/\/courses\/(\d+)/)
      return m ? m[1] : null
    }
  
    // Build global index - now sequential to avoid rate limits
    async function buildCourseContent(courseID, queryStatus) {
      try {
        if (queryStatus) {
          // Create a structured progress display for all content types
          queryStatus.innerHTML = `
            <div style="text-align: left; font-size: 0.9em; color: #555; margin-bottom: 8px;">
              <div id="pages-progress">Pages: Waiting to start...</div>
              <div id="assignments-progress">Assignments: Waiting to start...</div>
              <div id="quizzes-progress">Quizzes: Waiting to start...</div>
              <div id="discussions-progress">Discussions: Waiting to start...</div>
            </div>
          `;
        }
        
        // Get references to progress elements
        const pagesProgress = document.getElementById('pages-progress');
        const assignmentsProgress = document.getElementById('assignments-progress');
        const quizzesProgress = document.getElementById('quizzes-progress');
        const discussionsProgress = document.getElementById('discussions-progress');
        
        // Start all content type requests in parallel
        const [pages, assignments, quizzes, discussions] = await Promise.all([
          getPages(courseID, pagesProgress),
          getAssignments(courseID, assignmentsProgress),
          getQuizzes(courseID, quizzesProgress),
          getDiscussions(courseID, discussionsProgress)
        ]);
        
        window.adminToolsCourseContent = { pages, assignments, quizzes, discussions }
        console.log('courseContent ready', window.adminToolsCourseContent)
        
        if (queryStatus) queryStatus.textContent = 'Ready to search'
        return window.adminToolsCourseContent
      } catch (err) {
        console.error('Error building course content:', err)
        if (queryStatus) queryStatus.textContent = 'Error loading content. Try again later.'
        throw err
      }
    }
  
    // Search helper - unchanged
    window.searchCourseContent = function(term, isHTML) {
      if (!window.adminToolsCourseContent) {
        console.warn('adminToolsCourseContent not loaded yet – call await buildCourseContent(courseID) first')
        return {}
      }
      const lower = term.toLowerCase()
      const results = {}
      for (const [section, items] of Object.entries(window.adminToolsCourseContent)) {
        results[section] = items.filter(item => {
            if(isHTML) {
                const hay = `${item.title||''} ${item.body||''}`.toLowerCase()
                return hay.includes(lower)
            }
            const hay = `${item.title||''} ${stripHTML(item.body)||''}`.toLowerCase()
            return hay.includes(lower)
          
        })
      }
      return results
    }
  
    // Auto-kickoff with modal display first
    const cid = getCourseID()
    if (cid) {
      // First build the modal, then load content
      const modal = buildSearchModal()
      const queryStatus = modal.querySelector('p.query-status')
      
      // Start loading content with status updates
      queryStatus.textContent = 'Loading course content...'
      buildCourseContent(cid, queryStatus)
        .then(() => {
          queryStatus.textContent = 'Query too short.'
        })
        .catch(err => {
          queryStatus.textContent = 'Error loading content. Try again later.'
          console.error('Content loading error:', err)
        })
    } else {
      console.warn('Cannot detect courseID in URL; call buildCourseContent(courseID) manually.')
    }

    function buildSearchModal() {
      // Create modal elements
      const modalOverlay = document.createElement('div');
      modalOverlay.id = 'search-modal-overlay';
      Object.assign(modalOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start', // Align to the top
        zIndex: '10000', 
        paddingTop: '50px', // Add some padding from the top
        overflowY: 'auto' // Allow scrolling for long results
      });

      const modal = document.createElement('div');
      modal.id = 'search-modal';
      Object.assign(modal.style, {
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '600px', // Adjusted width
        maxWidth: '90%',
        position: 'relative', // For close button positioning
        paddingBottom: '60px' // Increased padding at the bottom
      });

      const header = document.createElement('div');
      Object.assign(header.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#006EB6', 
        color: 'white',
        padding: '10px 20px',
        marginLeft: '-20px', // Extend to edges
        marginRight: '-20px', // Extend to edges
        marginTop: '-20px', // Extend to top edge
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
      });

      const title = document.createElement('h2');
      title.textContent = 'Search Course Content';
      Object.assign(title.style, {
        margin: '0',
        fontSize: '1.5em'
      });
      
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;'; // X character
      Object.assign(closeButton.style, {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '1.8em',
        cursor: 'pointer',
        padding: '0 10px'
      });
      closeButton.onclick = () => modalOverlay.remove();

      header.appendChild(title);
      const headerControls = document.createElement('div');
      Object.assign(headerControls.style, {
          display: 'flex',
          alignItems: 'center'
      });
      headerControls.appendChild(closeButton);
      header.appendChild(headerControls);

      const content = document.createElement('div');
      Object.assign(content.style, {
        padding: '20px 0 0 0' // Add padding to the top of the content area
      });

      const promptText = document.createElement('p');
      promptText.textContent = 'What do you want to search for?';
      Object.assign(promptText.style, {
        fontSize: '1.2em',
        fontWeight: 'bold',
        margin: '0 0 5px 0',
        textAlign: 'center'
      });

      const subText = document.createElement('p');
      subText.innerHTML = 'Add text to search for. Use <b>*</b> as a wildcard for any text up to 10 chars.';
      Object.assign(subText.style, {
        fontSize: '0.9em',
        color: '#555',
        margin: '0 0 20px 0',
        textAlign: 'center'
      });

      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search 1 course for:';
      Object.assign(searchInput.style, {
        width: 'calc(100% - 22px)', // Account for padding and border
        padding: '10px',
        fontSize: '1em',
        border: '1px solid #ccc',
        borderRadius: '4px',
        marginBottom: '10px'
      });

      // Create checkbox container for horizontal alignment
      const checkboxContainer = document.createElement('div');
      Object.assign(checkboxContainer.style, {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '10px 0'
      });
      
      // Create checkbox for HTML search
      const htmlCheckbox = document.createElement('input');
      htmlCheckbox.type = 'checkbox';
      htmlCheckbox.id = 'search-html-checkbox';
      Object.assign(htmlCheckbox.style, {
        margin: '0 5px 0 0'
      });
      
      // Create label for the checkbox
      const htmlCheckboxLabel = document.createElement('label');
      htmlCheckboxLabel.htmlFor = 'search-html-checkbox';
      htmlCheckboxLabel.textContent = 'Search HTML';
      Object.assign(htmlCheckboxLabel.style, {
        fontSize: '0.9em',
        color: '#555',
        cursor: 'pointer'
      });
      
      // Assemble checkbox and label
      checkboxContainer.appendChild(htmlCheckbox);
      checkboxContainer.appendChild(htmlCheckboxLabel);
      
      const queryStatus = document.createElement('p');
      queryStatus.textContent = 'Loading...';
      queryStatus.classList.add('query-status'); // Add class for easier selection
      Object.assign(queryStatus.style, {
        fontSize: '0.9em',
        color: '#777',
        margin: '5px 0 10px 0', // Added bottom margin
        textAlign: 'right'
      });

      const resultsContainer = document.createElement('div');
      resultsContainer.id = 'search-results-container';
      Object.assign(resultsContainer.style, {
        marginTop: '15px',
        borderTop: '1px solid #eee',
        paddingTop: '10px', // Adjusted padding
        maxHeight: '60vh',   // Limit height to prevent super long results
        overflowY: 'auto'    // Make results scrollable
      });
      
      // Assemble content
      content.appendChild(promptText);
      content.appendChild(subText);
      content.appendChild(searchInput);
      content.appendChild(checkboxContainer); // Add checkbox container
      content.appendChild(queryStatus);
      content.appendChild(resultsContainer); // Add results container

      // Assemble modal
      modal.appendChild(header);
      modal.appendChild(content);
      modalOverlay.appendChild(modal);

      // Append to body
      document.body.appendChild(modalOverlay);

      // Focus on the input field
      searchInput.focus();

      // Add event listener for search
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const searchTerm = searchInput.value.trim();
        resultsContainer.innerHTML = ''; // Clear previous results

        if (searchTerm.length < 3 && !searchTerm.includes('*')) {
          queryStatus.textContent = 'Query too short.';
          return;
        } else if (searchTerm === '' && !searchTerm.includes('*')) { // Also check if empty after trim
          queryStatus.textContent = 'Query too short.';
          return;
        }
        
        queryStatus.textContent = 'Searching...'; 
        
        searchTimeout = setTimeout(() => {
            // Get the checkbox state to determine if we should search HTML content
            const searchHTML = htmlCheckbox.checked;
            const searchResults = window.searchCourseContent(searchTerm, searchHTML); // Pass checkbox state
            displayResults(searchResults, searchTerm, resultsContainer, getCourseID());
            
            if (resultsContainer.innerHTML === '' && !(searchTerm.length < 3 && !searchTerm.includes('*'))) {
                // If displayResults didn't add anything and query is not "too short"
                queryStatus.textContent = ''; // Clear "Searching..."
            } else if (!(searchTerm.length < 3 && !searchTerm.includes('*'))) {
                queryStatus.textContent = ''; // Clear "Searching..." if not "too short"
            }
            // If query is too short, message is already set
        }, 300); // Debounce search input
      });
      
      // Also trigger search when checkbox changes (if there's already a search term)
      htmlCheckbox.addEventListener('change', () => {
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length >= 3 || searchTerm.includes('*')) {
          // Manually trigger input event to refresh search results
          const inputEvent = new Event('input', { bubbles: true });
          searchInput.dispatchEvent(inputEvent);
        }
      });
      
      return modal; // Return modal for access to queryStatus
    }

    // Add this helper function to escape HTML for display
    function escapeHTML(html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function displayResults(results, searchTerm, container, courseID) {
      container.innerHTML = ''; // Clear previous results
      let totalMatches = 0;
      const searchHTML = document.getElementById('search-html-checkbox').checked;

      const courseURL = `/courses/${courseID}`;

      for (const [section, items] of Object.entries(results)) {
        const matchedItems = items.filter(item => {
            const lowerTerm = searchTerm.toLowerCase();
            const hay = searchHTML 
                ? `${item.title||''} ${item.body||''}`.toLowerCase()
                : `${item.title||''} ${stripHTML(item.body)||''}`.toLowerCase();
            return hay.includes(lowerTerm);
        });

        if (matchedItems.length > 0) {
          totalMatches += matchedItems.length;
          const sectionTitleText = `${matchedItems.length} match${matchedItems.length === 1 ? '' : 'es'} in ${capitalizeFirstLetter(section)}`;
          const sectionHeader = document.createElement('p'); // Changed to P for less emphasis than H3
          sectionHeader.innerHTML = sectionTitleText; // Use innerHTML if you might add links/icons here later
          Object.assign(sectionHeader.style, {
            fontSize: '1em', // Adjusted size
            fontWeight: 'normal', // Normal weight
            color: '#333',
            margin: '15px 0 8px 0',
          });
          container.appendChild(sectionHeader);

          const list = document.createElement('ul');
          Object.assign(list.style, {
            listStyleType: 'none',
            paddingLeft: '0',
            margin: '0'
          });

          matchedItems.forEach(item => {
            const listItem = document.createElement('li');
            Object.assign(listItem.style, {
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid #f0f0f0'
            });
            
            // Link to the item
            const titleLink = document.createElement('a');
            let itemUrl = '#'; 
            let itemTitle = item.title || 'Untitled';
            
            switch(section) {
                case 'pages':
                    itemUrl = `${courseURL}/pages/${item.url}`;
                    break;
                case 'assignments':
                    itemUrl = `${courseURL}/assignments/${item.id}`;
                    break;
                case 'quizzes':
                    itemUrl = `${courseURL}/quizzes/${item.id}`;
                    break;
                case 'discussions':
                    itemUrl = `${courseURL}/discussion_topics/${item.id}`;
                    break;
                // Syllabus is not a standard section from API like others, handle if needed
            }
            
            titleLink.href = itemUrl;
            titleLink.target = '_blank'; 
            // The title text itself should be part of the link, then the icon
            titleLink.innerHTML = `<strong>${capitalizeFirstLetter(section === 'pages' ? 'Page' : section.slice(0,-1))}:</strong> ${itemTitle} <span style="font-size: 0.8em;">&#x2197;</span>`;


            Object.assign(titleLink.style, {
              color: '#007bff',
              textDecoration: 'none',
              display: 'block', // Make link take full width for easier clicking
              marginBottom: '3px'
            });
            titleLink.onmouseover = () => titleLink.style.textDecoration = 'underline';
            titleLink.onmouseout = () => titleLink.style.textDecoration = 'none';
            listItem.appendChild(titleLink);


            // Excerpt modification for HTML search
            if (item.body) {
              let bodyText;
              let excerpt;
              
              if (searchHTML) {
                // For HTML search, escape the HTML to display as text
                bodyText = item.body;
                excerpt = createExcerpt(bodyText, searchTerm, 120);
                
                // Escape HTML after creating the excerpt with proper highlighting
                // but before setting it as innerHTML
                excerpt = escapeHTML(excerpt);
                
                // Re-add the highlighting that was escaped
                excerpt = excerpt.replace(/&lt;mark&gt;/g, '<mark>').replace(/&lt;\/mark&gt;/g, '</mark>');
              } else {
                // For regular search, continue with current behavior
                bodyText = stripHTML(item.body);
                excerpt = createExcerpt(bodyText, searchTerm, 120);
              }
              
              const excerptPara = document.createElement('p');
              excerptPara.innerHTML = excerpt; 
              Object.assign(excerptPara.style, {
                fontSize: '0.9em',
                color: '#555',
                margin: '0 0 0 15px', // Indent excerpt
                lineHeight: '1.4'
              });
              listItem.appendChild(excerptPara);
            }
            list.appendChild(listItem);
          });
          container.appendChild(list);
        }
      }

      if (totalMatches === 0) {
        const noResultsMessage = document.createElement('p');
        noResultsMessage.textContent = 'No matches found for your query.';
        Object.assign(noResultsMessage.style, {
            textAlign: 'center',
            color: '#777',
            marginTop: '20px'
        });
        container.appendChild(noResultsMessage);
      }
    }

    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function escapeRegExp(string) {
      if (!string) return '';
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    function createExcerpt(text, term, maxLength) {
        if (!text) return '';
        const lowerText = text.toLowerCase();
        const lowerTerm = term.toLowerCase(); // Use the full term for finding index initially
    
        let bestIndex = -1;
        // Try to find the exact term first for centering
        if (lowerTerm.trim() !== "") { // ensure lowerTerm is not just spaces or empty
            bestIndex = lowerText.indexOf(lowerTerm);
        }

        // If exact term not found, or term is just wildcard, try to find a non-wildcard part
        if (bestIndex === -1 && term.includes('*')) {
            const parts = term.split('*').filter(p => p.length > 0);
            for (const part of parts) {
                const idx = lowerText.indexOf(part.toLowerCase());
                if (idx !== -1) {
                    bestIndex = idx;
                    break;
                }
            }
        }
        
        if (bestIndex === -1 && lowerTerm.trim() === "") { // If term was empty or just wildcard and no parts found
            bestIndex = 0; 
        } else if (bestIndex === -1) { // If no part of the term is found, just truncate from start
             const excerpt = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
             // Still try to highlight if the term is simple and might be found by regex
             return term.trim() !== "" ? excerpt.replace(new RegExp(escapeRegExp(term), 'gi'), '<mark>$&</mark>') : excerpt;
        }

        const termDisplayLength = term.length; 
        const start = Math.max(0, bestIndex - Math.floor((maxLength - termDisplayLength) / 2));
        const end = Math.min(text.length, start + maxLength);
        
        let excerpt = text.substring(start, end);
        
        // Highlight the original search term (case-insensitive)
        if (term.trim() !== "") {
            excerpt = excerpt.replace(new RegExp(escapeRegExp(term), 'gi'), (match) => `<mark>${match}</mark>`);
        }

        if (start > 0) {
            excerpt = '...' + excerpt;
        }
        if (end < text.length) {
            excerpt = excerpt + '...';
        }
        return excerpt;
    }

}

// Build the content when clickable is clicked.
SearchInCourse();