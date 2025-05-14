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
        paddingTop: '50px' // Add some padding from the top
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
        position: 'relative' // For close button positioning
      });

      const header = document.createElement('div');
      Object.assign(header.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#c00', // Dark red background
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
        margin: '5px 0 0 0',
        textAlign: 'right'
      });
      
      // Assemble content
      content.appendChild(promptText);
      content.appendChild(subText);
      content.appendChild(searchInput);
      content.appendChild(queryStatus);

      // Assemble modal
      modal.appendChild(header);
      modal.appendChild(content);
      modalOverlay.appendChild(modal);

      // Append to body
      document.body.appendChild(modalOverlay);

      // Focus on the input field
      searchInput.focus();

      // Add event listener for search (example)
      searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value;
        if (searchTerm.length < 3 && !searchTerm.includes('*')) {
          queryStatus.textContent = 'Query too short.';
          // Clear previous results or show message
        } else if (searchTerm.length > 2 || searchTerm.includes('*')) {
          queryStatus.textContent = ''; // Or "Searching..."
          const results = window.searchCourseContent(searchTerm, false); // Assuming default is not HTML search
          console.log('Search results:', results);
          // Here you would update the modal to display the results
          // For now, just logging to console
        }
      });
    }
}


//Build the content when clickable is clicked.
SearchInCourse();