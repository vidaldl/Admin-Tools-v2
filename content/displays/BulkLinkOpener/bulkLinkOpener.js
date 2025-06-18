function bulkLinkOpener() {
    let zPressed = false;
    let isDrawing = false;
    let startX, startY;
    let boxEl = null;
    let linkCounter = null;
    let notificationEl = null;
    let notificationTimer = null;

    // Create link counter element
    function createLinkCounter() {
        linkCounter = document.createElement('div');
        linkCounter.id = 'bulk-link-counter';
        linkCounter.style.cssText = `
            position: fixed;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            pointer-events: none;
            z-index: 999999;
            display: none;
            border: 2px solid #4287f5;
        `;
        document.body.appendChild(linkCounter);
        
        // Create notification element
        notificationEl = document.createElement('div');
        notificationEl.id = 'bulk-link-notification';
        notificationEl.style.cssText = `
            position: fixed;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            pointer-events: none;
            z-index: 999999;
            display: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            border-left: 4px solid #ff6b6b;
        `;
        notificationEl.textContent = 'Release to open selected links';
        document.body.appendChild(notificationEl);
    }
    
    // Create counter element right away
    createLinkCounter();

    // Function to get links within selection box
    function getLinksInSelection() {
        if (!boxEl) {
            return [];
        }
        
        const boxRect = boxEl.getBoundingClientRect();
        const links = document.querySelectorAll('a[href]');
        const selectedLinks = [];
        
        links.forEach(link => {
            const linkRect = link.getBoundingClientRect();
            
            // Check if the link overlaps with the selection box
            if (
                linkRect.left < boxRect.right &&
                linkRect.right > boxRect.left &&
                linkRect.top < boxRect.bottom &&
                linkRect.bottom > boxRect.top
            ) {
                selectedLinks.push(link);
            }
        });
        
        return selectedLinks;
    }
    
    // Clear notification timer
    function clearNotification() {
        if (notificationTimer) {
            clearTimeout(notificationTimer);
            notificationTimer = null;
        }
        if (notificationEl) {
            notificationEl.style.display = 'none';
        }
    }

    // Handle key down - check for Z key
    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'z') {
            zPressed = true;
        }
    });

    // Handle key up - check for Z key release
    document.addEventListener('keyup', e => {
        if (e.key.toLowerCase() === 'z') {
            zPressed = false;
            
            if (boxEl) {
                boxEl.remove();
                boxEl = null;
            }
            
            if (linkCounter) {
                linkCounter.style.display = 'none';
            }
            
            clearNotification();
        }
    });

    // Handle mouse down - start drawing selection box
    document.addEventListener('mousedown', e => {
        if (!zPressed) return;
        
        isDrawing = true;
        startX = e.pageX;
        startY = e.pageY;
        
        // Create box element
        boxEl = document.createElement('div');
        boxEl.style.cssText = `
            position: absolute;
            border: 3px dashed #4287f5;
            background-color: rgba(66, 135, 245, 0.2);
            z-index: 999998;
            pointer-events: none;
        `;
        document.body.appendChild(boxEl);
        
        // Initialize counter near mouse cursor
        if (linkCounter) {
            linkCounter.textContent = '0 links';
            linkCounter.style.display = 'block';
            linkCounter.style.left = (e.pageX - 50) + 'px';
            linkCounter.style.top = (e.pageY + 20) + 'px';
        }
        
        // Set a timer for notification after 3 seconds
        clearNotification();
        notificationTimer = setTimeout(() => {
            if (isDrawing && notificationEl) {
                notificationEl.style.display = 'block';
                notificationEl.style.left = (e.pageX - 50) + 'px';
                notificationEl.style.top = (e.pageY + 50) + 'px';
            }
        }, 3000);
        
        e.preventDefault();
    });

    // Handle mouse move - update selection box
    document.addEventListener('mousemove', e => {
        if (!isDrawing) return;
        
        const width = Math.abs(e.pageX - startX);
        const height = Math.abs(e.pageY - startY);
        
        let left = Math.min(startX, e.pageX);
        let top = Math.min(startY, e.pageY);
        
        boxEl.style.left = left + 'px';
        boxEl.style.top = top + 'px';
        boxEl.style.width = width + 'px';
        boxEl.style.height = height + 'px';
        
        // Update counter content
        const selectedLinks = getLinksInSelection();
        const linkCount = selectedLinks.length;
        
        if (linkCounter) {
            linkCounter.textContent = `${linkCount} link${linkCount !== 1 ? 's' : ''}`;
            linkCounter.style.left = (e.pageX - 50) + 'px';
            linkCounter.style.top = (e.pageY + 20) + 'px';
        }
        
        // Update notification position if visible
        if (notificationEl && notificationEl.style.display === 'block') {
            notificationEl.style.left = (e.pageX - 50) + 'px';
            notificationEl.style.top = (e.pageY + 50) + 'px';
        }
        
        e.preventDefault();
    });

    // Handle mouse up - process selected links
    document.addEventListener('mouseup', e => {
        if (!isDrawing) return;
        isDrawing = false;
        
        // Get selected links
        const selectedLinks = getLinksInSelection();
        
        if (boxEl) {
            boxEl.remove();
            boxEl = null;
        }
        
        // Open each selected link in a new tab
        selectedLinks.forEach(link => {
            try {
                window.open(link.href, '_blank');
            } catch (err) {
                // Silent error handling
            }
        });
        
        // Hide the counter
        if (linkCounter) {
            linkCounter.style.display = 'none';
        }
        
        // Clear notification
        clearNotification();
        
        e.preventDefault();
    });
}

// Run immediately on script load
try {
    bulkLinkOpener();
} catch (err) {
    // Silent error handling
}

