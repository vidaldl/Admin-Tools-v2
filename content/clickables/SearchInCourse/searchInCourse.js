async function SearchInCourse() {
    // Strip HTML tags from a string.
    function stripHTML(html) {
        const tmp = document.createElement('div')
        tmp.innerHTML = html || ''
        return tmp.textContent || tmp.innerText || ''
    }
    
    // Delay helper.
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    // Retrieve CSRF token from Canvas cookies.
    function getCsrfToken() {
        const match = document.cookie.match('(^|;) *_csrf_token=([^;]*)')
        return match ? decodeURIComponent(match[2]) : ''
    }
  
    // Generic fetch wrapper with retry and error handling.
    async function fetchJSON(url, retries = 2) {
        let delayTime = 500
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
                if (res.status === 403 && i < retries) {
                    console.log(`Rate limited on ${url}, waiting ${delayTime}ms before retry ${i+1}`)
                    await delay(delayTime)
                    delayTime *= 2
                    continue
                }
                if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`)
                return await res.json()
            } catch (err) {
                if (i < retries) {
                    console.log(`Error on ${url}, retrying: ${err.message}`)
                    await delay(delayTime)
                    delayTime *= 2
                    continue
                }
                throw err
            }
        }
    }
  
    // Fetch pages (including bodies) with pagination.
    async function getPages(courseID, reportItemAttempted, updateTotalItems) {
        const foundPages = []
        let url = `/api/v1/courses/${courseID}/pages?include[]=body&per_page=100`
        
        // Initial request.
        let response = await fetchJSON(url)
        foundPages.push(...response)
        if (updateTotalItems) updateTotalItems(response.length)
        if (reportItemAttempted) response.forEach(() => reportItemAttempted())
      
        // Handle additional pages.
        while (response.length === 100) {
            try {
                const nextUrl = `/api/v1/courses/${courseID}/pages?include[]=body&per_page=100&page=${Math.floor(foundPages.length / 100) + 2}`
                response = await fetchJSON(nextUrl)
                if (response.length > 0) {
                    foundPages.push(...response)
                    if (updateTotalItems) updateTotalItems(response.length)
                    if (reportItemAttempted) response.forEach(() => reportItemAttempted())
                    await delay(50)
                }
            } catch (err) {
                console.error('Error loading additional pages:', err)
                break
            }
        }
      
        console.log(`Loaded ${foundPages.length} pages with bodies included`)
        return foundPages
    }
  
    // Fetch assignments with progress updates.
    async function getAssignments(courseID, reportItemAttempted, updateTotalItems) {
        const assignments = await fetchJSON(`/api/v1/courses/${courseID}/assignments?per_page=100`)
        if (updateTotalItems) updateTotalItems(assignments.length)
        const result = []
        const batchSize = 10
        for (let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i]
            result.push({ id: assignment.id, title: assignment.name, body: assignment.description })
            if (reportItemAttempted) reportItemAttempted()
            if ((i + 1) % batchSize === 0 && i < assignments.length - 1) {
                await delay(10)
            }
        }
        return result
    }
  
    // Fetch quizzes with progress updates.
    async function getQuizzes(courseID, reportItemAttempted, updateTotalItems) {
        const quizzes = await fetchJSON(`/api/v1/courses/${courseID}/quizzes?per_page=100`)
        if (updateTotalItems) updateTotalItems(quizzes.length)
        const result = []
        const batchSize = 10
        for (let i = 0; i < quizzes.length; i++) {
            const quiz = quizzes[i]
            result.push({ id: quiz.id, title: quiz.title, body: quiz.description })
            if (reportItemAttempted) reportItemAttempted()
            if ((i + 1) % batchSize === 0 && i < quizzes.length - 1) {
                await delay(10)
            }
        }
        return result
    }
  
    // Fetch discussions with pagination.
    async function getDiscussions(courseID, reportItemAttempted, updateTotalItems) {
        const foundDiscussions = []
        let url = `/api/v1/courses/${courseID}/discussion_topics?per_page=100`
      
        let response = await fetchJSON(url)
        foundDiscussions.push(...response)
        if (updateTotalItems) updateTotalItems(response.length)
        if (reportItemAttempted) response.forEach(() => reportItemAttempted())
      
        while (response.length === 100) {
            try {
                const nextUrl = `/api/v1/courses/${courseID}/discussion_topics?per_page=100&page=${Math.floor(foundDiscussions.length / 100) + 2}`
                response = await fetchJSON(nextUrl)
                if (response.length > 0) {
                    foundDiscussions.push(...response)
                    if (updateTotalItems) updateTotalItems(response.length)
                    if (reportItemAttempted) response.forEach(() => reportItemAttempted())
                    await delay(50)
                }
            } catch (err) {
                console.error('Error loading additional discussions:', err)
                break
            }
        }
      
        const results = foundDiscussions.map(topic => ({
            id: topic.id,
            title: topic.title,
            body: topic.message || ''
        }))
      
        console.log(`Loaded ${results.length} discussions with bodies included`)
        return results
    }
  
    // Extract courseID from the current URL.
    function getCourseID() {
        const m = window.location.pathname.match(/\/courses\/(\d+)/)
        return m ? m[1] : null
    }
  
    // Build the global course content index with progress updates.
    async function buildCourseContent(courseID, queryStatus) {
        queryStatus.textContent = 'Loading 0%...'
        let totalItemsToProcess = 0
        let itemsAttempted = 0
    
        function updateTotalItems(count) {
            totalItemsToProcess += count
            updateOverallProgress()
        }
    
        function reportItemAttempted() {
            itemsAttempted++
            updateOverallProgress()
        }
    
        function updateOverallProgress() {
            if (totalItemsToProcess > 0) {
                const percentage = Math.min(100, Math.round((itemsAttempted / totalItemsToProcess) * 100))
                queryStatus.textContent = `Loading ${percentage}%...`
            } else {
                queryStatus.textContent = 'Loading 0%...'
            }
        }
    
        try {
            const [pages, assignments, quizzes, discussions] = await Promise.all([
                getPages(courseID, reportItemAttempted, updateTotalItems),
                getAssignments(courseID, reportItemAttempted, updateTotalItems),
                getQuizzes(courseID, reportItemAttempted, updateTotalItems),
                getDiscussions(courseID, reportItemAttempted, updateTotalItems)
            ])
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
  
    // Search helper.
    window.searchCourseContent = function(term) {
        if (!window.adminToolsCourseContent) {
            console.warn('Course content not loaded yet – call buildCourseContent(courseID) first')
            return {}
        }
      
        const lowerTerm = term.toLowerCase()
        let searchRegex = null
        if (term.includes('*')) {
            const pattern = lowerTerm.split('*').map(part => escapeRegExp(part)).join('.{0,10}')
            try {
                searchRegex = new RegExp(pattern)
            } catch (e) {
                console.error("Error creating RegExp for wildcard search:", e)
            }
        }
    
        const results = {}
        for (const [section, items] of Object.entries(window.adminToolsCourseContent)) {
            results[section] = items.filter(item => {
                const hay = `${item.title || ''} ${item.body || ''}`.toLowerCase()
                return searchRegex ? searchRegex.test(hay) : hay.includes(lowerTerm)
            })
        }
        return results
    }
  
    // Auto-kickoff: build the search modal and load course content.
    const cid = getCourseID()
    if (cid) {
        const modal = buildSearchModal()
        const queryStatus = modal.querySelector('p.query-status')
        queryStatus.textContent = 'Loading course content...'
        buildCourseContent(cid, queryStatus)
            .then(() => {
                queryStatus.textContent = 'Query too short.'
                modal.searchInput.disabled = false
                modal.searchInput.focus()
            })
            .catch(err => {
                queryStatus.textContent = 'Error loading content. Try again later.'
                console.error('Content loading error:', err)
            })
    } else {
        console.warn('Cannot detect courseID in URL; call buildCourseContent(courseID) manually.')
    }
  
    function buildSearchModal() {
        const modalOverlay = document.createElement('div')
        modalOverlay.id = 'search-modal-overlay'
        Object.assign(modalOverlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            zIndex: '10000',
            paddingTop: '50px',
            overflowY: 'auto'
        })
    
        const modal = document.createElement('div')
        modal.id = 'search-modal'
        Object.assign(modal.style, {
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            width: '600px',
            maxWidth: '90%',
            position: 'relative',
            paddingBottom: '60px'
        })
    
        const header = document.createElement('div')
        Object.assign(header.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#006EB6',
            color: 'white',
            padding: '10px 20px',
            marginLeft: '-20px',
            marginRight: '-20px',
            marginTop: '-20px',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
        })
    
        const title = document.createElement('h2')
        title.textContent = 'Search Course Content'
        Object.assign(title.style, {
            margin: '0',
            fontSize: '1.5em'
        })
    
        const closeButton = document.createElement('button')
        closeButton.innerHTML = '&times;'
        Object.assign(closeButton.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.8em',
            cursor: 'pointer',
            padding: '0 10px'
        })
        closeButton.onclick = () => modalOverlay.remove()
    
        header.appendChild(title)
        const headerControls = document.createElement('div')
        Object.assign(headerControls.style, {
            display: 'flex',
            alignItems: 'center'
        })
        headerControls.appendChild(closeButton)
        header.appendChild(headerControls)
    
        const content = document.createElement('div')
        Object.assign(content.style, {
            padding: '20px 0 0 0'
        })
    
        const promptText = document.createElement('p')
        promptText.textContent = 'What do you want to search for?'
        Object.assign(promptText.style, {
            fontSize: '1.2em',
            fontWeight: 'bold',
            margin: '0 0 5px 0',
            textAlign: 'center'
        })
    
        const subText = document.createElement('p')
        subText.innerHTML = 'Add text to search for. Use <b>*</b> as a wildcard for any text up to 10 chars.'
        Object.assign(subText.style, {
            fontSize: '0.9em',
            color: '#555',
            margin: '0 0 20px 0',
            textAlign: 'center'
        })
    
        const searchInput = document.createElement('input')
        searchInput.type = 'text'
        searchInput.placeholder = 'Search 1 course for:'
        searchInput.disabled = true
        Object.assign(searchInput.style, {
            width: 'calc(100% - 22px)',
            padding: '10px',
            fontSize: '1em',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '10px'
        })
        modal.searchInput = searchInput
    
        const queryStatus = document.createElement('p')
        queryStatus.textContent = 'Loading...'
        queryStatus.classList.add('query-status')
        Object.assign(queryStatus.style, {
            fontSize: '0.9em',
            color: '#777',
            margin: '5px 0 10px 0',
            textAlign: 'right'
        })
    
        const resultsContainer = document.createElement('div')
        resultsContainer.id = 'search-results-container'
        Object.assign(resultsContainer.style, {
            marginTop: '15px',
            borderTop: '1px solid #eee',
            paddingTop: '10px',
            maxHeight: '60vh',
            overflowY: 'auto'
        })
    
        content.appendChild(promptText)
        content.appendChild(subText)
        content.appendChild(searchInput)
        content.appendChild(queryStatus)
        content.appendChild(resultsContainer)
    
        modal.appendChild(header)
        modal.appendChild(content)
        modalOverlay.appendChild(modal)
    
        document.body.appendChild(modalOverlay)
        searchInput.focus()
    
        let searchTimeout
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout)
            const searchTerm = searchInput.value.trim()
            resultsContainer.innerHTML = ''
    
            if ((searchTerm.length < 3 && !searchTerm.includes('*')) || searchTerm === '') {
                queryStatus.textContent = 'Query too short.'
                return
            }
    
            queryStatus.textContent = 'Searching...'
            searchTimeout = setTimeout(() => {
                const searchResults = window.searchCourseContent(searchTerm)
                displayResults(searchResults, searchTerm, resultsContainer, getCourseID())
                queryStatus.textContent = ''
            }, 300)
        })
    
        return modal
    }
  
    // Escape HTML for safe display.
    function escapeHTML(html) {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
    }
  
    // Get all match details for search.
    function getAllMatchDetails(text, searchTerm) {
        const matches = []
        if (!text || !searchTerm) return matches
    
        if (searchTerm.includes('*')) {
            const pattern = searchTerm
                .toLowerCase()
                .split('*')
                .map(part => escapeRegExp(part))
                .join('.{0,10}')
            try {
                const regex = new RegExp(pattern, 'gi')
                let matchResult
                while ((matchResult = regex.exec(text)) !== null) {
                    matches.push({ index: matchResult.index, text: matchResult[0] })
                }
            } catch (e) {
                console.error("Error creating/using RegExp in getAllMatchDetails:", e)
            }
        } else {
            const lowerText = text.toLowerCase()
            const lowerSearchTerm = searchTerm.toLowerCase()
            let startIndex = 0, index
            while ((index = lowerText.indexOf(lowerSearchTerm, startIndex)) > -1) {
                matches.push({ index: index, text: text.substring(index, index + lowerSearchTerm.length) })
                startIndex = index + lowerSearchTerm.length
            }
        }
        return matches
    }
  
    function displayResults(results, searchTerm, container, courseID) {
        container.innerHTML = ''
        let totalMatches = 0
        const courseURL = `/courses/${courseID}`
    
        for (const [section, items] of Object.entries(results)) {
            const matchedItems = items
            if (matchedItems.length > 0) {
                totalMatches += matchedItems.length
                const sectionTitleText = `${matchedItems.length} match${matchedItems.length === 1 ? '' : 'es'} in ${capitalizeFirstLetter(section)}`
                const sectionHeader = document.createElement('p')
                sectionHeader.innerHTML = sectionTitleText
                Object.assign(sectionHeader.style, {
                    fontSize: '1em',
                    fontWeight: 'normal',
                    color: '#333',
                    margin: '15px 0 8px 0'
                })
                container.appendChild(sectionHeader)
    
                const list = document.createElement('ul')
                Object.assign(list.style, {
                    listStyleType: 'none',
                    paddingLeft: '0',
                    margin: '0'
                })
    
                matchedItems.forEach(item => {
                    const listItem = document.createElement('li')
                    Object.assign(listItem.style, {
                        marginBottom: '12px',
                        padding: '5px 8px 8px 8px',
                        borderBottom: '1px solid #f0f0f0',
                        borderRadius: '4px'
                    })
                    
                    const titleLink = document.createElement('a')
                    let itemUrl = '#'
                    let itemTitle = item.title || 'Untitled'
                    
                    switch(section) {
                        case 'pages':
                            itemUrl = `${courseURL}/pages/${item.url}`
                            break
                        case 'assignments':
                            itemUrl = `${courseURL}/assignments/${item.id}`
                            break
                        case 'quizzes':
                            itemUrl = `${courseURL}/quizzes/${item.id}`
                            break
                        case 'discussions':
                            itemUrl = `${courseURL}/discussion_topics/${item.id}`
                            break
                    }
    
                    titleLink.href = itemUrl
                    titleLink.target = '_blank'
                    titleLink.innerHTML = `<strong>${capitalizeFirstLetter(section === 'pages' ? 'Page' : section.slice(0,-1))}:</strong> ${itemTitle} <span style="font-size: 0.8em;">&#x2197;</span>`
                    Object.assign(titleLink.style, {
                        color: '#007bff',
                        textDecoration: 'none',
                        display: 'block',
                        marginBottom: '3px'
                    })
                    titleLink.onmouseover = () => titleLink.style.textDecoration = 'underline'
                    titleLink.onmouseout = () => titleLink.style.textDecoration = 'none'
                    listItem.appendChild(titleLink)
    
                    if (item.body && item.body.trim() !== '') {
                        const matchDetails = getAllMatchDetails(item.body, searchTerm)
                        let itemHasOverallTagMatch = false
                        if (matchDetails.length > 0) {
                            const excerptsWrapper = document.createElement('div')
                            Object.assign(excerptsWrapper.style, {
                                marginLeft: '15px',
                                marginTop: '5px'
                            })
    
                            matchDetails.forEach((detail, i) => {
                                const { excerpt, matchInTagContext } = createExcerpt(item.body, detail.text, 120, detail.index)
                                const excerptPara = document.createElement('p')
                                excerptPara.innerHTML = excerpt
                                Object.assign(excerptPara.style, {
                                    fontSize: '0.9em',
                                    color: '#555',
                                    margin: '0 0 5px 0',
                                    lineHeight: '1.4'
                                })
                                if (i > 0) {
                                    excerptPara.style.borderTop = '1px dashed #eee'
                                    excerptPara.style.paddingTop = '5px'
                                    excerptPara.style.marginTop = '8px'
                                }
                                excerptsWrapper.appendChild(excerptPara)
    
                                if (matchInTagContext) itemHasOverallTagMatch = true
                            })
                            listItem.appendChild(excerptsWrapper)
                        }
    
                        if (itemHasOverallTagMatch) {
                            listItem.style.backgroundColor = '#e9ecef'
                        }
                    }
                    list.appendChild(listItem)
                })
                container.appendChild(list)
            }
        }
    
        if (totalMatches === 0) {
            const noResultsMessage = document.createElement('p')
            noResultsMessage.textContent = 'No matches found for your query.'
            Object.assign(noResultsMessage.style, {
                textAlign: 'center',
                color: '#777',
                marginTop: '20px'
            })
            container.appendChild(noResultsMessage)
        }
    }
  
    function capitalizeFirstLetter(string) {
        if (!string) return ''
        return string.charAt(0).toUpperCase() + string.slice(1)
    }
  
    function escapeRegExp(string) {
        if (!string) return ''
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
  
    // Determine if a given index is inside an HTML tag.
    function isIndexEffectivelyInTag(htmlString, targetIndex) {
        if (!htmlString || targetIndex < 0 || targetIndex >= htmlString.length) return false
        let inTag = false
        for (let i = 0; i < htmlString.length; i++) {
            if (htmlString[i] === '<') inTag = true
            if (i === targetIndex) return inTag
            if (htmlString[i] === '>') inTag = false
        }
        return false
    }
  
    // Create an excerpt from the raw HTML with the matched term highlighted.
    function createExcerpt(rawHtmlBody, textToHighlight, maxLength, matchIndex) {
        if (!rawHtmlBody || !textToHighlight || matchIndex === -1) {
            let fallbackExcerpt = rawHtmlBody ? rawHtmlBody.substring(0, maxLength) : ''
            if (rawHtmlBody && rawHtmlBody.length > maxLength) fallbackExcerpt += '...'
            return { excerpt: escapeHTML(fallbackExcerpt), matchInTagContext: false }
        }
      
        const actualMatchedTerm = textToHighlight
        const matchInTag = isIndexEffectivelyInTag(rawHtmlBody, matchIndex)
        const contextChars = Math.floor((maxLength - actualMatchedTerm.length) / 2)
        const excerptStart = Math.max(0, matchIndex - contextChars)
        const excerptEnd = Math.min(rawHtmlBody.length, matchIndex + actualMatchedTerm.length + contextChars)
        let segment = rawHtmlBody.substring(excerptStart, excerptEnd)
        let finalExcerpt
      
        if (matchInTag) {
            let highlighted = segment.replace(new RegExp(escapeRegExp(actualMatchedTerm), 'g'), match => `<mark>${match}</mark>`)
            finalExcerpt = escapeHTML(highlighted)
            finalExcerpt = finalExcerpt.replace(/&lt;mark&gt;/g, '<mark>').replace(/&lt;\/mark&gt;/g, '</mark>')
        } else {
            const textOnlySegment = stripHTML(segment)
            finalExcerpt = textOnlySegment.replace(new RegExp(escapeRegExp(actualMatchedTerm), 'gi'), match => `<mark>${match}</mark>`)
        }
      
        if (excerptStart > 0) finalExcerpt = '...' + finalExcerpt
        if (excerptEnd < rawHtmlBody.length) finalExcerpt += '...'
      
        return { excerpt: finalExcerpt, matchInTagContext: matchInTag }
    }
}
  
SearchInCourse();