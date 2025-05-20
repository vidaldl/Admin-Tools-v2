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
          if (i < pagesToFetch.length - 1) await delay(0)
        } catch (err) {
          console.error(`Error loading page ${pagesToFetch[i].url}:`, err)
          // Continue with other pages even if one fails
        }
      }
      
      if (queryStatus) queryStatus.textContent = `Pages: Complete (${foundPages.length}/${pages.length})`;
      console.log(`Loaded ${foundPages.length}/${pages.length} pages`)
      return foundPages
    }
  
    // Update getAssignments to show detailed progress
    async function getAssignments(courseID, progressElement) {
      if (progressElement) progressElement.textContent = 'Assignments: Loading list...';
      const assignments = await fetchJSON(`/api/v1/courses/${courseID}/assignments?per_page=100`);
      
      // Even though there's no detailed fetching like with pages,
      // we'll show a "processing" step for consistency
      if (progressElement) progressElement.textContent = `Assignments: Processing (0/${assignments.length})...`;
      
      // Process assignments in batches to show progress
      const result = [];
      const batchSize = 10;
      
      for (let i = 0; i < assignments.length; i += batchSize) {
        const batch = assignments.slice(i, i + batchSize);
        result.push(...batch.map(a => ({ id: a.id, title: a.name, body: a.description })));
        
        if (progressElement) {
          const processed = Math.min(i + batchSize, assignments.length);
          progressElement.textContent = `Assignments: Processing (${processed}/${assignments.length})...`;
        }
        
        // Small delay to allow UI update and prevent freezing on large courses
        if (i + batchSize < assignments.length) await delay(10);
      }
      
      if (progressElement) progressElement.textContent = `Assignments: Complete (${assignments.length})`;
      return result;
    }
  
    // Update getQuizzes to show detailed progress
    async function getQuizzes(courseID, progressElement) {
      if (progressElement) progressElement.textContent = 'Quizzes: Loading list...';
      const quizzes = await fetchJSON(`/api/v1/courses/${courseID}/quizzes?per_page=100`);
      
      // Show processing progress for consistency
      if (progressElement) progressElement.textContent = `Quizzes: Processing (0/${quizzes.length})...`;
      
      // Process quizzes in batches to show progress
      const result = [];
      const batchSize = 10;
      
      for (let i = 0; i < quizzes.length; i += batchSize) {
        const batch = quizzes.slice(i, i + batchSize);
        result.push(...batch.map(q => ({ id: q.id, title: q.title, body: q.description })));
        
        if (progressElement) {
          const processed = Math.min(i + batchSize, quizzes.length);
          progressElement.textContent = `Quizzes: Processing (${processed}/${quizzes.length})...`;
        }
        
        // Small delay to allow UI update and prevent freezing on large courses
        if (i + batchSize < quizzes.length) await delay(10);
      }
      
      if (progressElement) progressElement.textContent = `Quizzes: Complete (${quizzes.length})`;
      return result;
    }
  
    // Update getDiscussions for consistent naming pattern
    async function getDiscussions(courseID, progressElement) {
      if (progressElement) progressElement.textContent = 'Discussions: Loading list...';
      const topics = await fetchJSON(`/api/v1/courses/${courseID}/discussion_topics?per_page=100`);
      
      // Remove the slice limit
      const topicsToFetch = topics;
      if (progressElement) progressElement.textContent = `Discussions: Loading details (0/${topicsToFetch.length})...`;
      
      // Fetch discussion entries sequentially
      const results = [];
      for (let i = 0; i < topicsToFetch.length; i++) {
        try {
          const entries = await fetchJSON(
            `/api/v1/courses/${courseID}/discussion_topics/${topicsToFetch[i].id}/entries?per_page=30`
          );
          results.push({ 
            id: topicsToFetch[i].id, 
            title: topicsToFetch[i].title, 
            body: topicsToFetch[i].message, 
            entries 
          });
          if (progressElement) progressElement.textContent = `Discussions: Loading details (${i+1}/${topicsToFetch.length})...`;
          
          // Add a small delay between requests
          if (i < topicsToFetch.length - 1) await delay(100);
        } catch (err) {
          console.error(`Error loading discussion ${topicsToFetch[i].id}:`, err);
          // Continue with other discussions even if one fails
        }
      }
      
      if (progressElement) progressElement.textContent = `Discussions: Complete (${results.length}/${topics.length})`;
      console.log(`Loaded ${results.length}/${topics.length} discussions`);
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
  
    // Search helper - always searches HTML content now
    window.searchCourseContent = function(term) {
      if (!window.adminToolsCourseContent) {
        console.warn('adminToolsCourseContent not loaded yet – call await buildCourseContent(courseID) first')
        return {}
      }
      
      const lowerTerm = term.toLowerCase();
      let searchRegex = null;

      if (term.includes('*')) {
        // Escape regex special characters in parts, then replace '*' with '.{0,10}'
        // This ensures other special characters in 'term' are treated literally.
        const pattern = lowerTerm
          .split('*')
          .map(part => escapeRegExp(part)) // escapeRegExp is already defined in your script
          .join('.{0,10}'); // '*' matches any text up to 10 chars
        try {
          searchRegex = new RegExp(pattern);
        } catch (e) {
          console.error("Error creating RegExp for wildcard search:", e);
          // Fallback to literal search if regex is invalid, though unlikely with current setup
          // Or, simply return no results for an invalid pattern.
          // For now, we'll let it proceed to the 'else' block if searchRegex remains null.
        }
      }

      const results = {}
      for (const [section, items] of Object.entries(window.adminToolsCourseContent)) {
        results[section] = items.filter(item => {
            const hay = `${item.title||''} ${item.body||''}`.toLowerCase();
            if (searchRegex) {
              return searchRegex.test(hay);
            } else {
              return hay.includes(lowerTerm);
            }
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
        marginBottom: '10px' // Keep margin for spacing
      });

      // REMOVE Checkbox container, checkbox, and label elements
      // const checkboxContainer = document.createElement('div'); ...
      // const htmlCheckbox = document.createElement('input'); ...
      // const htmlCheckboxLabel = document.createElement('label'); ...
      
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
      // REMOVE: content.appendChild(checkboxContainer); 
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
            // Always search HTML, checkbox state is no longer needed
            const searchResults = window.searchCourseContent(searchTerm); 
            displayResults(searchResults, searchTerm, resultsContainer, getCourseID());
            
            // Clear "Searching..." message logic (simplified as checkbox is gone)
            if (resultsContainer.innerHTML === '' && !(searchTerm.length < 3 && !searchTerm.includes('*'))) {
                queryStatus.textContent = ''; 
            } else if (!(searchTerm.length < 3 && !searchTerm.includes('*'))) {
                queryStatus.textContent = ''; 
            }
            // If query is too short, message is already set
        }, 300); // Debounce search input
      });
      
      // REMOVE: htmlCheckbox.addEventListener('change', ...);
      
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

    // REPLACE the existing getAllMatchIndices function (lines 468-481) with this new function:
    function getAllMatchDetails(text, searchTerm) {
        const matches = [];
        if (!text || !searchTerm) return matches;

        if (searchTerm.includes('*')) {
            const pattern = searchTerm
                .toLowerCase() // Prepare pattern for case-insensitive regex
                .split('*')
                .map(part => escapeRegExp(part)) // escapeRegExp is already defined
                .join('.{0,10}'); // '*' matches any text up to 10 chars
            try {
                const regex = new RegExp(pattern, 'gi'); // 'g' for global, 'i' for case-insensitive
                let matchResult;
                // Execute regex on the original-case text
                while ((matchResult = regex.exec(text)) !== null) {
                    matches.push({ index: matchResult.index, text: matchResult[0] });
                }
            } catch (e) {
                console.error("Error creating/using RegExp in getAllMatchDetails:", e);
                // If regex fails, return no matches for this wildcard term
            }
        } else {
            // Literal search (case-insensitive)
            const lowerText = text.toLowerCase();
            const lowerSearchTerm = searchTerm.toLowerCase();
            let startIndex = 0;
            let index;
            while ((index = lowerText.indexOf(lowerSearchTerm, startIndex)) > -1) {
                // Extract the original-cased text segment that matched
                matches.push({ index: index, text: text.substring(index, index + lowerSearchTerm.length) });
                startIndex = index + lowerSearchTerm.length;
            }
        }
        return matches;
    }

    function displayResults(results, searchTerm, container, courseID) {
      container.innerHTML = ''; // Clear previous results
      let totalMatches = 0;

      const courseURL = `/courses/${courseID}`;

      for (const [section, items] of Object.entries(results)) {
        const matchedItems = items; 

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
              paddingTop: '5px', 
              paddingBottom: '8px', 
              paddingLeft: '8px',   
              paddingRight: '8px',  
              borderBottom: '1px solid #f0f0f0',
              borderRadius: '4px' 
            });
            
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

            // Excerpt modification for multiple occurrences
            if (item.body && item.body.trim() !== '') {
              // const matchIndices = getAllMatchIndices(item.body, searchTerm); // OLD LINE
              const matchDetails = getAllMatchDetails(item.body, searchTerm); // NEW: Use new function
              let itemHasOverallTagMatch = false;

              // if (matchIndices.length > 0) { // OLD LINE
              if (matchDetails.length > 0) { // NEW: Check new details
                const excerptsWrapper = document.createElement('div');
                Object.assign(excerptsWrapper.style, {
                    marginLeft: '15px', // Indent excerpts container
                    marginTop: '5px'
                });

                // matchIndices.forEach((matchIdx, i) => { // OLD LINE
                matchDetails.forEach((detail, i) => { // NEW: Iterate over new details
                  // Pass item.body (original case) and the specific matchIndex
                  // const { excerpt, matchInTagContext } = createExcerpt(item.body, searchTerm, 120, matchIdx); // OLD LINE
                  // NEW: Pass actual matched text (detail.text) and its index (detail.index) to createExcerpt
                  const { excerpt, matchInTagContext } = createExcerpt(item.body, detail.text, 120, detail.index);
                  
                  const excerptPara = document.createElement('p');
                  excerptPara.innerHTML = excerpt; 
                  Object.assign(excerptPara.style, {
                    fontSize: '0.9em',
                    color: '#555',
                    margin: '0 0 5px 0', 
                    lineHeight: '1.4'
                  });
                  
                  if (i > 0) { // Add a little visual separation for subsequent excerpts
                    excerptPara.style.borderTop = '1px dashed #eee';
                    excerptPara.style.paddingTop = '5px';
                    excerptPara.style.marginTop = '8px';
                  }
                  excerptsWrapper.appendChild(excerptPara);

                  if (matchInTagContext) {
                    itemHasOverallTagMatch = true;
                  }
                });
                listItem.appendChild(excerptsWrapper);
              }
              // else: No matches in body (term might have been in title only)

              if (itemHasOverallTagMatch) {
                listItem.style.backgroundColor = '#e9ecef'; 
              }
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

    function isIndexEffectivelyInTag(htmlString, targetIndex) {
        if (!htmlString || targetIndex < 0 || targetIndex >= htmlString.length) return false;
        
        let currentlyInTagDefinition = false;
        for (let i = 0; i < htmlString.length; i++) {
            if (htmlString[i] === '<') {
                // This is a simplified check. It doesn't handle comments or CDATA sections
                // containing '<' or '>' characters, or script/style tags with '<' or '>'.
                currentlyInTagDefinition = true;
            }
            
            if (i === targetIndex) {
                // The state of currentlyInTagDefinition when we reach the targetIndex
                // determines if targetIndex itself is part of a tag.
                return currentlyInTagDefinition;
            }

            if (htmlString[i] === '>') {
                 // If we passed a '>', we are no longer in that specific tag's definition 
                 // for subsequent characters, unless a new tag starts.
                currentlyInTagDefinition = false;
            }
        }
        // This line should ideally not be reached if targetIndex is within bounds,
        // as the return inside the loop should catch it.
        return false; 
    }


    // Modified createExcerpt to accept a specific matchIndex
    // The second parameter `term` will now be the actual matched text segment.
    function createExcerpt(rawHtmlBody, textToHighlight, maxLength, matchIndex) { // Changed `term` to `textToHighlight`
        // rawHtmlBody is original case.
        // textToHighlight is the actual segment from rawHtmlBody that matched (e.g., "caterpillar" if searchTerm was "cat*").
        // matchIndex is the starting index of textToHighlight within rawHtmlBody.

        if (!rawHtmlBody || !textToHighlight || matchIndex === -1) {
             // Fallback if somehow called with no valid matchIndex
            let fallbackExcerpt = rawHtmlBody ? rawHtmlBody.substring(0, maxLength) : '';
            if (rawHtmlBody && rawHtmlBody.length > maxLength) fallbackExcerpt += '...';
            return { excerpt: escapeHTML(fallbackExcerpt), matchInTagContext: false };
        }

        // `textToHighlight` is the actual segment that we want to work with and highlight.
        const actualMatchedTerm = textToHighlight; 
        
        // Determine if the start of this specific match is within an HTML tag's definition
        const matchIsInsideTagDefinition = isIndexEffectivelyInTag(rawHtmlBody, matchIndex);

        const contextChars = Math.floor((maxLength - actualMatchedTerm.length) / 2);
        const excerptStart = Math.max(0, matchIndex - contextChars);
        const excerptEnd = Math.min(rawHtmlBody.length, matchIndex + actualMatchedTerm.length + contextChars);
        
        let currentExcerptSegment = rawHtmlBody.substring(excerptStart, excerptEnd);
        let finalDisplayExcerpt;

        if (matchIsInsideTagDefinition) {
            // Match is in HTML tag: display as HTML code, highlight term
            // Highlight the actualMatchedTerm (preserving its original case)
            let highlightedExcerpt = currentExcerptSegment.replace(
                new RegExp(escapeRegExp(actualMatchedTerm), 'g'), // Use 'g' for all occurrences in segment
                (match) => `<mark>${match}</mark>`
            );
            // Escape the HTML in the excerpt for safe display, then re-insert <mark> tags
            finalDisplayExcerpt = escapeHTML(highlightedExcerpt);
            finalDisplayExcerpt = finalDisplayExcerpt.replace(/&lt;mark&gt;/g, '<mark>').replace(/&lt;\/mark&gt;/g, '</mark>');
        } else {
            // Match is in text content: display as stripped text, highlight term
            // Strip HTML from the current segment to get the text content
            const textOnlySegment = stripHTML(currentExcerptSegment);
            // Highlight the actualMatchedTerm (which has its original casing)
            // The 'gi' flag ensures that if stripping HTML somehow changed casing (unlikely for the match itself), it's still found.
            // However, since actualMatchedTerm is from the original text, 'g' should be sufficient if textOnlySegment preserves relative casing.
            // Sticking to 'gi' as per original user code's else block for safety/consistency.
            finalDisplayExcerpt = textOnlySegment.replace(
                new RegExp(escapeRegExp(actualMatchedTerm), 'gi'), 
                (match) => `<mark>${match}</mark>`
            );
        }

        // Add ellipses if the excerpt is truncated
        if (excerptStart > 0) {
            finalDisplayExcerpt = '...' + finalDisplayExcerpt;
        }
        if (excerptEnd < rawHtmlBody.length) {
            finalDisplayExcerpt = finalDisplayExcerpt + '...';
        }

        return { excerpt: finalDisplayExcerpt, matchInTagContext: matchIsInsideTagDefinition };
    }

}

// Build the content when clickable is clicked.
SearchInCourse();