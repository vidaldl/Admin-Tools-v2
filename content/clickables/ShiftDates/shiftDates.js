async function ShiftDates() {
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

    // Generic PUT request for updating items.
    async function putJSON(url, data, retries = 2) {
        let delayTime = 500
        for (let i = 0; i <= retries; i++) {
            try {
                const res = await fetch(url, {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': getCsrfToken()
                    },
                    body: JSON.stringify(data)
                })
                if (res.status === 403 && i < retries) {
                    console.log(`Rate limited on ${url}, waiting ${delayTime}ms before retry ${i+1}`)
                    await delay(delayTime)
                    delayTime *= 2
                    continue
                }
                if (!res.ok) throw new Error(`PUT ${url} failed: ${res.status}`)
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

    // Fetch assignments with due dates.
    async function getAssignments(courseID) {
        const assignments = await fetchJSON(`/api/v1/courses/${courseID}/assignments?per_page=100`)
        return assignments.filter(assignment => assignment.due_at).map(assignment => ({
            id: assignment.id,
            title: assignment.name,
            due_at: assignment.due_at,
            unlock_at: assignment.unlock_at,
            lock_at: assignment.lock_at,
            type: 'assignment'
        }))
    }

    // Fetch quizzes with due dates.
    async function getQuizzes(courseID) {
        const quizzes = await fetchJSON(`/api/v1/courses/${courseID}/quizzes?per_page=100`)
        return quizzes.filter(quiz => quiz.due_at).map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            due_at: quiz.due_at,
            unlock_at: quiz.unlock_at,
            lock_at: quiz.lock_at,
            type: 'quiz'
        }))
    }

    // Fetch discussions with due dates.
    async function getDiscussions(courseID) {
        const discussions = await fetchJSON(`/api/v1/courses/${courseID}/discussion_topics?per_page=100`)
        return discussions.filter(discussion => discussion.assignment && discussion.assignment.due_at).map(discussion => ({
            id: discussion.id,
            title: discussion.title,
            due_at: discussion.assignment.due_at,
            unlock_at: discussion.assignment.unlock_at,
            lock_at: discussion.assignment.lock_at,
            type: 'discussion',
            assignment_id: discussion.assignment.id
        }))
    }

    // Extract courseID from the current URL.
    function getCourseID() {
        const m = window.location.pathname.match(/\/courses\/(\d+)/)
        return m ? m[1] : null
    }

    // Format date for display.
    function formatDate(dateString) {
        if (!dateString) return 'Not set'
        const date = new Date(dateString)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }

    // Shift date by specified days.
    function shiftDate(dateString, days) {
        if (!dateString) return null
        const date = new Date(dateString)
        date.setDate(date.getDate() + days)
        return date.toISOString()
    }

    // Update assignment dates.
    async function updateAssignment(courseID, assignmentId, dates) {
        const url = `/api/v1/courses/${courseID}/assignments/${assignmentId}`
        const data = { assignment: {} }
        if (dates.due_at !== undefined) data.assignment.due_at = dates.due_at
        if (dates.unlock_at !== undefined) data.assignment.unlock_at = dates.unlock_at
        if (dates.lock_at !== undefined) data.assignment.lock_at = dates.lock_at
        return await putJSON(url, data)
    }

    // Update quiz dates.
    async function updateQuiz(courseID, quizId, dates) {
        const url = `/api/v1/courses/${courseID}/quizzes/${quizId}`
        const data = { quiz: {} }
        if (dates.due_at !== undefined) data.quiz.due_at = dates.due_at
        if (dates.unlock_at !== undefined) data.quiz.unlock_at = dates.unlock_at
        if (dates.lock_at !== undefined) data.quiz.lock_at = dates.lock_at
        return await putJSON(url, data)
    }

    // Update discussion dates (via assignment).
    async function updateDiscussion(courseID, assignmentId, dates) {
        const url = `/api/v1/courses/${courseID}/assignments/${assignmentId}`
        const data = { assignment: {} }
        if (dates.due_at !== undefined) data.assignment.due_at = dates.due_at
        if (dates.unlock_at !== undefined) data.assignment.unlock_at = dates.unlock_at
        if (dates.lock_at !== undefined) data.assignment.lock_at = dates.lock_at
        return await putJSON(url, data)
    }

    // Build the shift dates modal.
    function buildShiftDatesModal(courseItems) {
        const modalOverlay = document.createElement('div')
        modalOverlay.id = 'shift-dates-modal-overlay'
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
        modal.id = 'shift-dates-modal'
        Object.assign(modal.style, {
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            width: '800px',
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
        title.textContent = 'Shift Due Dates'
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

        // Control section
        const controlSection = document.createElement('div')
        Object.assign(controlSection.style, {
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
        })

        const controlLabel = document.createElement('label')
        controlLabel.textContent = 'Days to shift (positive for future, negative for past): '
        Object.assign(controlLabel.style, {
            display: 'block',
            marginBottom: '10px',
            fontWeight: 'bold'
        })

        const daysInput = document.createElement('input')
        daysInput.type = 'number'
        daysInput.placeholder = 'Enter number of days (e.g., 7 or -3)'
        Object.assign(daysInput.style, {
            width: '200px',
            padding: '8px',
            fontSize: '1em',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginRight: '10px'
        })

        const shiftButton = document.createElement('button')
        shiftButton.textContent = 'Shift Selected Dates'
        Object.assign(shiftButton.style, {
            padding: '8px 16px',
            fontSize: '1em',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        })

        const statusDiv = document.createElement('div')
        Object.assign(statusDiv.style, {
            marginTop: '10px',
            fontSize: '0.9em',
            color: '#666'
        })

        controlSection.appendChild(controlLabel)
        controlSection.appendChild(daysInput)
        controlSection.appendChild(shiftButton)
        controlSection.appendChild(statusDiv)

        // Table section
        const tableContainer = document.createElement('div')
        Object.assign(tableContainer.style, {
            maxHeight: '60vh',
            overflowY: 'auto',
            border: '1px solid #dee2e6',
            borderRadius: '4px'
        })

        const table = document.createElement('table')
        Object.assign(table.style, {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9em'
        })

        // Table header
        const thead = document.createElement('thead')
        const headerRow = document.createElement('tr')
        Object.assign(headerRow.style, {
            backgroundColor: '#e9ecef',
            borderBottom: '2px solid #dee2e6'
        })

        const headers = ['Select', 'Type', 'Title', 'Due Date', 'Unlock Date', 'Lock Date']
        headers.forEach(headerText => {
            const th = document.createElement('th')
            th.textContent = headerText
            Object.assign(th.style, {
                padding: '10px',
                textAlign: 'left',
                fontWeight: 'bold',
                borderRight: '1px solid #dee2e6'
            })
            headerRow.appendChild(th)
        })

        thead.appendChild(headerRow)
        table.appendChild(thead)

        // Table body
        const tbody = document.createElement('tbody')
        
        // Group items by type
        const groupedItems = {
            assignments: courseItems.filter(item => item.type === 'assignment'),
            quizzes: courseItems.filter(item => item.type === 'quiz'),
            discussions: courseItems.filter(item => item.type === 'discussion')
        }

        for (const [groupName, items] of Object.entries(groupedItems)) {
            if (items.length > 0) {
                // Group header
                const groupRow = document.createElement('tr')
                Object.assign(groupRow.style, {
                    backgroundColor: '#f8f9fa',
                    fontWeight: 'bold'
                })

                const groupCell = document.createElement('td')
                groupCell.colSpan = 6
                groupCell.textContent = `${groupName.charAt(0).toUpperCase() + groupName.slice(1)} (${items.length})`
                Object.assign(groupCell.style, {
                    padding: '8px 10px',
                    borderBottom: '1px solid #dee2e6'
                })
                groupRow.appendChild(groupCell)
                tbody.appendChild(groupRow)

                // Items
                items.forEach(item => {
                    const row = document.createElement('tr')
                    Object.assign(row.style, {
                        borderBottom: '1px solid #dee2e6'
                    })

                    // Checkbox
                    const checkboxCell = document.createElement('td')
                    Object.assign(checkboxCell.style, {
                        padding: '8px 10px',
                        textAlign: 'center',
                        borderRight: '1px solid #dee2e6'
                    })
                    const checkbox = document.createElement('input')
                    checkbox.type = 'checkbox'
                    checkbox.dataset.itemId = item.id
                    checkbox.dataset.itemType = item.type
                    checkbox.dataset.assignmentId = item.assignment_id || ''
                    checkboxCell.appendChild(checkbox)
                    row.appendChild(checkboxCell)

                    // Type
                    const typeCell = document.createElement('td')
                    typeCell.textContent = item.type.charAt(0).toUpperCase() + item.type.slice(1)
                    Object.assign(typeCell.style, {
                        padding: '8px 10px',
                        borderRight: '1px solid #dee2e6'
                    })
                    row.appendChild(typeCell)

                    // Title
                    const titleCell = document.createElement('td')
                    titleCell.textContent = item.title
                    Object.assign(titleCell.style, {
                        padding: '8px 10px',
                        borderRight: '1px solid #dee2e6',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    })
                    titleCell.title = item.title
                    row.appendChild(titleCell)

                    // Due Date
                    const dueDateCell = document.createElement('td')
                    dueDateCell.textContent = formatDate(item.due_at)
                    Object.assign(dueDateCell.style, {
                        padding: '8px 10px',
                        borderRight: '1px solid #dee2e6'
                    })
                    row.appendChild(dueDateCell)

                    // Unlock Date
                    const unlockDateCell = document.createElement('td')
                    unlockDateCell.textContent = formatDate(item.unlock_at)
                    Object.assign(unlockDateCell.style, {
                        padding: '8px 10px',
                        borderRight: '1px solid #dee2e6'
                    })
                    row.appendChild(unlockDateCell)

                    // Lock Date
                    const lockDateCell = document.createElement('td')
                    lockDateCell.textContent = formatDate(item.lock_at)
                    Object.assign(lockDateCell.style, {
                        padding: '8px 10px'
                    })
                    row.appendChild(lockDateCell)

                    tbody.appendChild(row)
                })
            }
        }

        table.appendChild(tbody)
        tableContainer.appendChild(table)

        // Shift button click handler
        shiftButton.onclick = async () => {
            const days = parseInt(daysInput.value)
            if (isNaN(days)) {
                statusDiv.textContent = 'Please enter a valid number of days.'
                statusDiv.style.color = '#dc3545'
                return
            }

            const selectedItems = Array.from(tbody.querySelectorAll('input[type="checkbox"]:checked'))
            if (selectedItems.length === 0) {
                statusDiv.textContent = 'Please select at least one item to shift.'
                statusDiv.style.color = '#dc3545'
                return
            }

            statusDiv.textContent = `Shifting ${selectedItems.length} items by ${days} days...`
            statusDiv.style.color = '#007bff'
            shiftButton.disabled = true

            let successCount = 0
            let errorCount = 0

            for (const checkbox of selectedItems) {
                try {
                    const itemId = checkbox.dataset.itemId
                    const itemType = checkbox.dataset.itemType
                    const assignmentId = checkbox.dataset.assignmentId
                    const courseID = getCourseID()

                    // Find the original item to get current dates
                    const originalItem = courseItems.find(item => item.id == itemId && item.type === itemType)
                    
                    const newDates = {
                        due_at: shiftDate(originalItem.due_at, days),
                        unlock_at: shiftDate(originalItem.unlock_at, days),
                        lock_at: shiftDate(originalItem.lock_at, days)
                    }

                    // Update based on item type
                    if (itemType === 'assignment') {
                        await updateAssignment(courseID, itemId, newDates)
                    } else if (itemType === 'quiz') {
                        await updateQuiz(courseID, itemId, newDates)
                    } else if (itemType === 'discussion') {
                        await updateDiscussion(courseID, assignmentId, newDates)
                    }

                    successCount++
                    await delay(100) // Small delay between requests
                } catch (err) {
                    console.error(`Error updating item ${checkbox.dataset.itemId}:`, err)
                    errorCount++
                }
            }

            shiftButton.disabled = false
            
            if (errorCount === 0) {
                statusDiv.textContent = `Successfully shifted ${successCount} items by ${days} days.`
                statusDiv.style.color = '#28a745'
            } else {
                statusDiv.textContent = `Shifted ${successCount} items successfully, ${errorCount} failed.`
                statusDiv.style.color = '#ffc107'
            }

            // Optionally refresh the page after a delay
            setTimeout(() => {
                if (confirm('Dates have been updated. Would you like to refresh the page to see the changes?')) {
                    window.location.reload()
                }
            }, 2000)
        }

        content.appendChild(controlSection)
        content.appendChild(tableContainer)

        modal.appendChild(header)
        modal.appendChild(content)
        modalOverlay.appendChild(modal)

        document.body.appendChild(modalOverlay)
        daysInput.focus()

        return modal
    }

    // Load course items and build modal.
    async function loadCourseItems(courseID) {
        try {
            const [assignments, quizzes, discussions] = await Promise.all([
                getAssignments(courseID),
                getQuizzes(courseID),
                getDiscussions(courseID)
            ])
            
            const allItems = [...assignments, ...quizzes, ...discussions]
            console.log(`Loaded ${allItems.length} items with due dates`)
            
            if (allItems.length === 0) {
                alert('No items with due dates found in this course.')
                return
            }
            
            buildShiftDatesModal(allItems)
        } catch (err) {
            console.error('Error loading course items:', err)
            alert('Error loading course items. Please try again.')
        }
    }

    // Auto-kickoff: load course items and build modal.
    const cid = getCourseID()
    if (cid) {
        loadCourseItems(cid)
    } else {
        console.warn('Cannot detect courseID in URL')
        alert('Cannot detect course ID. Please make sure you are on a Canvas course page.')
    }
}

ShiftDates();