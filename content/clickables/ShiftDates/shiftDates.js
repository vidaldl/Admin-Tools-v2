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
        let delayTime = 90
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
        let delayTime = 90
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
    function buildShiftDatesModal() {
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

        // Control section (initially disabled)
        const controlSection = document.createElement('div')
        Object.assign(controlSection.style, {
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            opacity: '0.5'
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
        daysInput.disabled = true
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
        shiftButton.disabled = true
        Object.assign(shiftButton.style, {
            padding: '8px 16px',
            fontSize: '1em',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: '0.6'
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

        // Loading section
        const loadingSection = document.createElement('div')
        Object.assign(loadingSection.style, {
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
        })

        const loadingText = document.createElement('p')
        loadingText.textContent = 'Loading course items...'
        Object.assign(loadingText.style, {
            fontSize: '1.1em',
            marginBottom: '15px'
        })

        const progressText = document.createElement('p')
        progressText.textContent = 'Loading 0%...'
        progressText.classList.add('progress-status')
        Object.assign(progressText.style, {
            fontSize: '0.9em',
            color: '#007bff',
            margin: '5px 0'
        })

        const progressBar = document.createElement('div')
        Object.assign(progressBar.style, {
            width: '100%',
            height: '8px',
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: '10px'
        })

        const progressFill = document.createElement('div')
        Object.assign(progressFill.style, {
            width: '0%',
            height: '100%',
            backgroundColor: '#007bff',
            transition: 'width 0.3s ease'
        })

        progressBar.appendChild(progressFill)
        loadingSection.appendChild(loadingText)
        loadingSection.appendChild(progressText)
        loadingSection.appendChild(progressBar)

        // Table container (initially hidden)
        const tableContainer = document.createElement('div')
        Object.assign(tableContainer.style, {
            maxHeight: '60vh',
            overflowY: 'auto',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            display: 'none'
        })

        content.appendChild(controlSection)
        content.appendChild(loadingSection)
        content.appendChild(tableContainer)

        modal.appendChild(header)
        modal.appendChild(content)
        modalOverlay.appendChild(modal)

        document.body.appendChild(modalOverlay)

        // Store references for later use
        modal.controlSection = controlSection
        modal.loadingSection = loadingSection
        modal.tableContainer = tableContainer
        modal.daysInput = daysInput
        modal.shiftButton = shiftButton
        modal.statusDiv = statusDiv
        modal.progressText = progressText
        modal.progressFill = progressFill

        return modal
    }

    // Populate the table with loaded items
    function populateTable(modal, courseItems) {
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
        headers.forEach((headerText, index) => {
            const th = document.createElement('th')
            
            if (index === 0) {
                // Create select all checkbox for the first column
                const selectAllCheckbox = document.createElement('input')
                selectAllCheckbox.type = 'checkbox'
                selectAllCheckbox.title = 'Select/Deselect All'
                Object.assign(selectAllCheckbox.style, {
                    marginRight: '5px'
                })
                
                // Add the checkbox and label to the header
                th.appendChild(selectAllCheckbox)
                th.appendChild(document.createTextNode('Select'))
                
                // Add select all functionality
                selectAllCheckbox.addEventListener('change', () => {
                    const allItemCheckboxes = tbody.querySelectorAll('input[type="checkbox"]')
                    allItemCheckboxes.forEach(checkbox => {
                        checkbox.checked = selectAllCheckbox.checked
                    })
                })
                
                // Store reference for later use
                th.selectAllCheckbox = selectAllCheckbox
            } else {
                th.textContent = headerText
            }
            
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

                    // Checkbox change event to update select all checkbox state
                    checkbox.addEventListener('change', () => {
                        const selectAllCheckbox = thead.querySelector('input[type="checkbox"]')
                        const allItemCheckboxes = tbody.querySelectorAll('input[type="checkbox"]')
                        const checkedCount = tbody.querySelectorAll('input[type="checkbox"]:checked').length
                        
                        // Update select all checkbox state
                        if (checkedCount === 0) {
                            selectAllCheckbox.checked = false
                            selectAllCheckbox.indeterminate = false
                        } else if (checkedCount === allItemCheckboxes.length) {
                            selectAllCheckbox.checked = true
                            selectAllCheckbox.indeterminate = false
                        } else {
                            selectAllCheckbox.checked = false
                            selectAllCheckbox.indeterminate = true
                        }
                    })
                })
            }
        }

        table.appendChild(tbody)
        modal.tableContainer.appendChild(table)

        // Set up shift button click handler
        modal.shiftButton.onclick = async () => {
            const days = parseInt(modal.daysInput.value)
            if (isNaN(days)) {
                modal.statusDiv.textContent = 'Please enter a valid number of days.'
                modal.statusDiv.style.color = '#dc3545'
                return
            }

            const selectedItems = Array.from(tbody.querySelectorAll('input[type="checkbox"]:checked'))
            if (selectedItems.length === 0) {
                modal.statusDiv.textContent = 'Please select at least one item to shift.'
                modal.statusDiv.style.color = '#dc3545'
                return
            }

            // Hide the table and controls, show updating progress
            modal.tableContainer.style.display = 'none'
            modal.controlSection.style.display = 'none'
            
            // Create updating section
            const updatingSection = document.createElement('div')
            Object.assign(updatingSection.style, {
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
            })

            const updatingText = document.createElement('p')
            updatingText.textContent = `Updating ${selectedItems.length} items...`
            Object.assign(updatingText.style, {
                fontSize: '1.1em',
                marginBottom: '15px'
            })

            const updateProgressText = document.createElement('p')
            updateProgressText.textContent = 'Updating 0%...'
            Object.assign(updateProgressText.style, {
                fontSize: '0.9em',
                color: '#007bff',
                margin: '5px 0'
            })

            const updateProgressBar = document.createElement('div')
            Object.assign(updateProgressBar.style, {
                width: '100%',
                height: '8px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '10px'
            })

            const updateProgressFill = document.createElement('div')
            Object.assign(updateProgressFill.style, {
                width: '0%',
                height: '100%',
                backgroundColor: '#28a745',
                transition: 'width 0.3s ease'
            })

            const currentItemText = document.createElement('p')
            currentItemText.textContent = 'Preparing to update items...'
            Object.assign(currentItemText.style, {
                fontSize: '0.8em',
                color: '#999',
                margin: '10px 0 0 0',
                minHeight: '1.2em'
            })

            updateProgressBar.appendChild(updateProgressFill)
            updatingSection.appendChild(updatingText)
            updatingSection.appendChild(updateProgressText)
            updatingSection.appendChild(updateProgressBar)
            updatingSection.appendChild(currentItemText)

            // Insert the updating section
            modal.loadingSection.style.display = 'block'
            modal.loadingSection.innerHTML = ''
            modal.loadingSection.appendChild(updatingSection)

            let successCount = 0
            let errorCount = 0

            for (let i = 0; i < selectedItems.length; i++) {
                const checkbox = selectedItems[i]
                
                try {
                    const itemId = checkbox.dataset.itemId
                    const itemType = checkbox.dataset.itemType
                    const assignmentId = checkbox.dataset.assignmentId
                    const courseID = getCourseID()

                    // Find the original item to get current dates and title
                    const originalItem = courseItems.find(item => item.id == itemId && item.type === itemType)
                    
                    // Update progress display
                    const percentage = Math.round(((i + 1) / selectedItems.length) * 100)
                    updateProgressText.textContent = `Updating ${percentage}%...`
                    updateProgressFill.style.width = `${percentage}%`
                    currentItemText.textContent = `Updating ${originalItem.type}: ${originalItem.title}`
                    
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
                    currentItemText.textContent = `Error updating item. Continuing...`
                    currentItemText.style.color = '#dc3545'
                    await delay(500) // Longer delay on error
                    currentItemText.style.color = '#999'
                }
            }

            // Show completion message
            const completionSection = document.createElement('div')
            Object.assign(completionSection.style, {
                textAlign: 'center',
                padding: '40px 20px',
                color: '#666'
            })

            const completionTitle = document.createElement('h3')
            completionTitle.textContent = 'Update Complete!'
            Object.assign(completionTitle.style, {
                color: errorCount === 0 ? '#28a745' : '#ffc107',
                marginBottom: '15px'
            })

            const completionText = document.createElement('p')
            if (errorCount === 0) {
                completionText.textContent = `Successfully shifted ${successCount} items by ${days} days.`
                completionText.style.color = '#28a745'
            } else {
                completionText.textContent = `Shifted ${successCount} items successfully, ${errorCount} failed.`
                completionText.style.color = '#ffc107'
            }
            Object.assign(completionText.style, {
                fontSize: '1.1em',
                marginBottom: '20px'
            })

            const refreshButton = document.createElement('button')
            refreshButton.textContent = 'Refresh Page'
            Object.assign(refreshButton.style, {
                padding: '10px 20px',
                fontSize: '1em',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
            })
            refreshButton.onclick = () => window.location.reload()

            const closeButton = document.createElement('button')
            closeButton.textContent = 'Close'
            Object.assign(closeButton.style, {
                padding: '10px 20px',
                fontSize: '1em',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
            })
            closeButton.onclick = () => document.getElementById('shift-dates-modal-overlay').remove()

            completionSection.appendChild(completionTitle)
            completionSection.appendChild(completionText)
            completionSection.appendChild(refreshButton)
            completionSection.appendChild(closeButton)

            // Replace updating section with completion section
            modal.loadingSection.innerHTML = ''
            modal.loadingSection.appendChild(completionSection)
        }
    }

    // Load course items with progress updates
    async function loadCourseItems(courseID, modal) {
        let totalSteps = 3
        let currentStep = 0

        function updateProgress(stepName) {
            currentStep++
            const percentage = Math.round((currentStep / totalSteps) * 100)
            modal.progressText.textContent = `Loading ${stepName}... ${percentage}%`
            modal.progressFill.style.width = `${percentage}%`
        }

        try {
            updateProgress('assignments')
            const assignments = await getAssignments(courseID)
            
            updateProgress('quizzes')
            const quizzes = await getQuizzes(courseID)
            
            updateProgress('discussions')
            const discussions = await getDiscussions(courseID)
            
            const allItems = [...assignments, ...quizzes, ...discussions]
            console.log(`Loaded ${allItems.length} items with due dates`)
            
            if (allItems.length === 0) {
                modal.loadingSection.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">No items with due dates found in this course.</p>'
                return
            }

            // Hide loading section and show table
            modal.loadingSection.style.display = 'none'
            modal.tableContainer.style.display = 'block'
            
            // Enable controls
            modal.controlSection.style.opacity = '1'
            modal.daysInput.disabled = false
            modal.shiftButton.disabled = false
            modal.shiftButton.style.opacity = '1'
            modal.daysInput.focus()
            
            // Populate the table
            populateTable(modal, allItems)
            
        } catch (err) {
            console.error('Error loading course items:', err)
            modal.loadingSection.innerHTML = '<p style="color: #dc3545; text-align: center; padding: 20px;">Error loading course items. Please try again.</p>'
        }
    }

    // Auto-kickoff: build modal first, then load items
    const cid = getCourseID()
    if (cid) {
        const modal = buildShiftDatesModal()
        loadCourseItems(cid, modal)
    } else {
        console.warn('Cannot detect courseID in URL')
        alert('Cannot detect course ID. Please make sure you are on a Canvas course page.')
    }
}

ShiftDates();