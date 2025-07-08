function bulkLinkOpener() {
    let zPressed = false;
    let isDrawing = false;
    let startX, startY;
    let boxEl = null;
    let linkCounter = null;
    let notificationEl = null;
    let notificationTimer = null;
    const prevHighlighted = new Set();

    // 1) Inject CSS for link highlighting
    const style = document.createElement('style');
    style.textContent = `
      a.bulk-link-highlight {
        outline: 2px solid #4287f5 !important;
      }
    `;
    document.head.appendChild(style);

    // 2) Create link counter + notification elements
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
    createLinkCounter();

    // 3) Utility: get all links overlapping the selection box
    function getLinksInSelection() {
        if (!boxEl) return [];
        const boxRect = boxEl.getBoundingClientRect();
        return Array.from(document.querySelectorAll('a[href]')).filter(link => {
            const r = link.getBoundingClientRect();
            return (
                r.left < boxRect.right &&
                r.right > boxRect.left &&
                r.top < boxRect.bottom &&
                r.bottom > boxRect.top
            );
        });
    }

    // 4) Utility: clear pending notification
    function clearNotification() {
        if (notificationTimer) {
            clearTimeout(notificationTimer);
            notificationTimer = null;
        }
        notificationEl.style.display = 'none';
    }

    // 5) Key handlers: track Z press/release
    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'z') zPressed = true;
    });
    document.addEventListener('keyup', e => {
        if (e.key.toLowerCase() === 'z') {
            zPressed = false;
            // cancel any in-progress draw
            if (boxEl) { boxEl.remove(); boxEl = null; }
            linkCounter.style.display = 'none';
            clearNotification();
            // remove any leftover highlights
            prevHighlighted.forEach(l => l.classList.remove('bulk-link-highlight'));
            prevHighlighted.clear();
        }
    });

    // 6) Mouse down: begin selection
    document.addEventListener('mousedown', e => {
        if (!zPressed || e.button !== 0) return;
        isDrawing = true;
        startX = e.pageX;
        startY = e.pageY;

        boxEl = document.createElement('div');
        boxEl.style.cssText = `
            position: absolute;
            border: 3px dashed #4287f5;
            background-color: rgba(66, 135, 245, 0.2);
            z-index: 999998;
            pointer-events: none;
        `;
        document.body.appendChild(boxEl);

        linkCounter.textContent = '0 links';
        linkCounter.style.display = 'block';
        linkCounter.style.left = (e.clientX - 50) + 'px';
        linkCounter.style.top = (e.clientY + 20) + 'px';

        clearNotification();
        notificationTimer = setTimeout(() => {
            if (isDrawing) {
                notificationEl.style.display = 'block';
                notificationEl.style.left = (e.pageX - 50) + 'px';
                notificationEl.style.top = (e.pageY + 50) + 'px';
            }
        }, 3000);

        e.preventDefault();
    });

    // 7) Mouse move: resize box, update counter & highlight links
    document.addEventListener('mousemove', e => {
        if (!isDrawing || !boxEl) return;

        const left = Math.min(startX, e.pageX);
        const top = Math.min(startY, e.pageY);
        const width = Math.abs(e.pageX - startX);
        const height = Math.abs(e.pageY - startY);

        Object.assign(boxEl.style, {
            left: left + 'px',
            top: top + 'px',
            width: width + 'px',
            height: height + 'px'
        });

        const selected = getLinksInSelection();
        const count = selected.length;
        linkCounter.textContent = `${count} link${count !== 1 ? 's' : ''}`;
        linkCounter.style.left = (e.clientX - 50) + 'px';
        linkCounter.style.top = (e.clientY + 20) + 'px';

        // Highlight logic
        prevHighlighted.forEach(l => l.classList.remove('bulk-link-highlight'));
        prevHighlighted.clear();
        selected.forEach(l => {
            l.classList.add('bulk-link-highlight');
            prevHighlighted.add(l);
        });

        if (notificationEl.style.display === 'block') {
            notificationEl.style.left = (e.pageX - 50) + 'px';
            notificationEl.style.top = (e.pageY + 50) + 'px';
        }

        e.preventDefault();
    });

    // 8) Mouse up: open links & clean up
    document.addEventListener('mouseup', e => {
        if (!isDrawing) return;
        isDrawing = false;

        const selected = getLinksInSelection();
        if (boxEl) { boxEl.remove(); boxEl = null; }

        selected.forEach(link => {
            try { window.open(link.href, '_blank'); }
            catch (err) { /* ignore */ }
        });

        linkCounter.style.display = 'none';
        clearNotification();

        // Remove highlights
        prevHighlighted.forEach(l => l.classList.remove('bulk-link-highlight'));
        prevHighlighted.clear();

        e.preventDefault();
    });
}

// Run immediately on script load
try {
    bulkLinkOpener();
} catch (err) {
    // Silent error handling
}

