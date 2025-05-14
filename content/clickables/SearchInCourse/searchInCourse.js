async function SearchInCourse(){
    // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
    // Helper to strip HTML tags from a string
    function stripHTML(html) {
        const tmp = document.createElement('div')
        tmp.innerHTML = html || ''
        return tmp.textContent || tmp.innerText || ''
    }
    
    
    // Helper to pull CSRF token from Canvas cookies
    function getCsrfToken() {
      const match = document.cookie.match('(^|;) *_csrf_token=([^;]*)')
      return match ? decodeURIComponent(match[2]) : ''
    }
  
    // Generic fetch wrapper
    async function fetchJSON(url) {
      const res = await fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        }
      })
      if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`)
      return await res.json()
    }
  
    // Endpoints
    async function getPages(courseID) {
      const pages = await fetchJSON(`/api/v1/courses/${courseID}/pages?per_page=100`)
      let foundPages =  Promise.all(pages.map(p=> fetchJSON(`/api/v1/courses/${courseID}/pages/${p.url}`)))
        console.log('found pages: ', foundPages)
      return foundPages
    }
  
    async function getAssignments(courseID) {
      return fetchJSON(`/api/v1/courses/${courseID}/assignments?per_page=100`)
        .then(list => list.map(a => ({ id:a.id, title:a.name, body:a.description })))
    }
  
    async function getQuizzes(courseID) {
      return fetchJSON(`/api/v1/courses/${courseID}/quizzes?per_page=100`)
        .then(list => list.map(q => ({ id:q.id, title:q.title, body:q.description })))
    }
  
    async function getDiscussions(courseID) {
      const topics = await fetchJSON(`/api/v1/courses/${courseID}/discussion_topics?per_page=100`)
      return Promise.all(topics.map(async t => {
        // fetch first batch of entries
        const entries = await fetchJSON(
          `/api/v1/courses/${courseID}/discussion_topics/${t.id}/entries?per_page=100`
        )
        return { id:t.id, title:t.title, body:t.message, entries }
      }))
    }
  
    // Extract courseID from URL
    function getCourseID() {
      const m = window.location.pathname.match(/\/courses\/(\d+)/)
      return m ? m[1] : null
    }
  
    // Build global index
    async function buildCourseContent(courseID) {
      const [pages, assignments, quizzes, discussions] = await Promise.all([
        getPages(courseID),
        getAssignments(courseID),
        getQuizzes(courseID),
        getDiscussions(courseID)
      ])
      window.adminToolsCourseContent = { pages, assignments, quizzes, discussions }
      console.log('courseContent ready', window.adminToolsCourseContent)
      return window.adminToolsCourseContent
    }
  
    // Search helper
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
  
    // Auto-kickoff
    const cid = getCourseID()
    if (cid) {
      await buildCourseContent(cid)
      // build display modal with a search bar 
      buildSearchModal();
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
        paddingBottom: '40px' // Added padding to the bottom
      });

      const header = document.createElement('div');
      Object.assign(header.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#006EB6', // Dark red background
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
      
      const tutorialButton = document.createElement('button');
      tutorialButton.textContent = 'Show Tutorial';
      Object.assign(tutorialButton.style, {
          background: 'white',
          color: '#333',
          border: '1px solid #ccc',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer'
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
      headerControls.appendChild(tutorialButton);
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

      const queryStatus = document.createElement('p');
      queryStatus.textContent = 'Query too short.';
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
        paddingTop: '10px' // Adjusted padding
      });
      
      // Assemble content
      content.appendChild(promptText);
      content.appendChild(subText);
      content.appendChild(searchInput);
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
            const searchResults = window.searchCourseContent(searchTerm, false); 
            displayResults(searchResults, searchTerm, resultsContainer, getCourseID());
            if (resultsContainer.innerHTML === '' && !(searchTerm.length < 3 && !searchTerm.includes('*'))) {
                // If displayResults didn't add anything (e.g. no results found message was cleared by mistake)
                // and query is not "too short"
                 queryStatus.textContent = ''; // Clear "Searching..."
            } else if (!(searchTerm.length < 3 && !searchTerm.includes('*'))) {
                 queryStatus.textContent = ''; // Clear "Searching..." if not "too short"
            }
            // If query is too short, message is already set
        }, 300); // Debounce search input
      });
    }

    function displayResults(results, searchTerm, container, courseID) {
      container.innerHTML = ''; // Clear previous results (e.g. "No matches found")
      let totalMatches = 0;

      const courseURL = `/courses/${courseID}`;

      for (const [section, items] of Object.entries(results)) {
        const matchedItems = items.filter(item => { // Ensure items actually contain the term
            const lowerTerm = searchTerm.toLowerCase();
            const hay = `${item.title||''} ${stripHTML(item.body)||''}`.toLowerCase();
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


            // Excerpt
            if (item.body) {
              const excerpt = createExcerpt(stripHTML(item.body), searchTerm, 120);
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
        // This will highlight "sta*" if term is "sta*", or "start" if term is "start"
        if (term.trim() !== "") {
            excerpt = excerpt.replace(new RegExp(escapeRegExp(term), 'gi'), (match) => `<mark>${match}</mark>`);
        }

        if (start > 0) {
            excerpt = '...' + excerpt;
        }
        if (end < text.length && (start + maxLength) < text.length) { // check if truncation actually happened
            excerpt = excerpt + '...';
        }
        return excerpt;
    }

}


//Build the content when clickable is clicked.
SearchInCourse();