function bulkLinkOpener() {
    let zPressed = false;
    let isDrawing = false;
    let startX, startY;
    let boxEl = null;
    let linkCounter = null;

    // Create link counter element
    function createLinkCounter() {
        linkCounter = document.createElement('div');
        linkCounter.id = 'bulk-link-counter';
        linkCounter.style.cssText = `
            position: fixed;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            pointer-events: none;
            z-index: 999999;
            display: none;
        `;
        document.body.appendChild(linkCounter);
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
            border: 2px dashed blue;
            background-color: rgba(0, 0, 255, 0.1);
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
        
        e.preventDefault();
    });

    // Handle mouse move - update selection box
    document.addEventListener('mousemove', e => {
        if (!isDrawing) return;  // Fixed missing return statement
        
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
        
        e.preventDefault();
    });

    // Handle mouse up - process selected links
    document.addEventListener('mouseup', e => {
        if (!isDrawing) return;  // Fixed missing return statement
        isDrawing = false;
        
        // Get selected links
        const selectedLinks = getLinksInSelection();
        
        if (boxEl) {
            boxEl.remove();
            boxEl = null;
        }
        
        // Open each selected link in a new tab
        selectedLinks.forEach(link => {
            window.open(link.href, '_blank');
        });
        
        // Hide the counter
        if (linkCounter) {
            linkCounter.style.display = 'none';
        }
        
        e.preventDefault();
    });
}

bulkLinkOpener();

