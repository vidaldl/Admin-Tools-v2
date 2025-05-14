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
    } else {
      console.warn('Cannot detect courseID in URL; call buildCourseContent(courseID) manually.')
    }
}


//Build the content when clickable is clicked.
SearchInCourse();