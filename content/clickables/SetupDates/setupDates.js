async function SetupDates() {
  // --------------------------------------------------------------------------
  // Helpers (copied from searchInCourse.js)
  // --------------------------------------------------------------------------
  function getCourseID() {
    const m = window.location.pathname.match(/\/courses\/(\d+)/);
    return m ? m[1] : null;
  }
  function getCsrfToken() {
    const match = document.cookie.match('(^|;) *_csrf_token=([^;]*)');
    return match ? decodeURIComponent(match[2]) : '';
  }
  async function fetchJSON(url, retries = 2) {
    let delayTime = 500;
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          }
        });
        if (res.status === 403 && i < retries) {
          await new Promise(r => setTimeout(r, delayTime));
          delayTime *= 2;
          continue;
        }
        if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
        return await res.json();
      } catch (err) {
        if (i === retries) throw err;
      }
    }
  }
  async function getAssignments(courseID) {
    const url = `/api/v1/courses/${courseID}/assignments?per_page=100`;
    return (await fetchJSON(url))
      .map(a => ({ id: a.id, title: a.name, due_at: a.due_at, type: 'assignment' }));
  }
  async function getQuizzes(courseID) {
    const url = `/api/v1/courses/${courseID}/quizzes?per_page=100`;
    return (await fetchJSON(url))
      .map(q => ({ id: q.id, title: q.title, due_at: q.due_at, type: 'quiz' }));
  }
  async function getDiscussions(courseID) {
    const url = `/api/v1/courses/${courseID}/discussion_topics?per_page=100`;
    const topics = await fetchJSON(url);
    return topics
      .filter(d => d.assignment && d.assignment.due_at === null)
      .map(d => ({
        id: d.id,
        title: d.title,
        due_at: d.assignment.unlock_at, // assume unlock_at as placeholder
        type: 'discussion'
      }));
  }

  function buildSetupDatesModal() {
    // Overlay
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      zIndex: '10000', paddingTop: '50px', overflowY: 'auto'
    });

    // inject compact styling for items when they live in a week
    const style = document.createElement('style');
    style.textContent = `
      /* make week‐board items smaller & padded */
      .drop-zone li {
        font-size: 0.8em;
        padding: 4px 6px;
        margin-bottom: 4px;
        border-radius: 3px;
        background-color: #f1f3f5;
        cursor: grab;
      }
      /* optional highlight on hover */
      .drop-zone li:hover {
        background-color: #e2e6ea;
      }
    `;
    overlay.append(style);

    // Modal container
    const modal = document.createElement('div');
    Object.assign(modal.style, {
      background: 'white', width: '800px', maxWidth: '90%',
      borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      position: 'relative', paddingBottom: '60px'
    });

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: '#006EB6', color: 'white',
      padding: '10px 20px',
      borderTopLeftRadius: '8px', borderTopRightRadius: '8px'
    });
    const title = document.createElement('h2');
    title.textContent = 'Set Up Course Dates';
    Object.assign(title.style, { margin: '0', fontSize: '1.5em' });
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    Object.assign(closeBtn.style, {
      background: 'none', border: 'none', color: 'white',
      fontSize: '1.8em', cursor: 'pointer', padding: '0 10px'
    });
    closeBtn.onclick = () => overlay.remove();
    header.append(title, closeBtn);

    // Content
    const content = document.createElement('div');
    Object.assign(content.style, { padding: '20px' });

    // Term selector
    const termLabel = document.createElement('label');
    termLabel.textContent = 'Select Term: ';
    termLabel.style.fontWeight = 'bold';
    const termSelect = document.createElement('select');
    ['Spring 2024','Summer 2024','Fall 2024'].forEach(term => {
      const opt = document.createElement('option');
      opt.value = term; opt.textContent = term;
      termSelect.append(opt);
    });
    termLabel.append(termSelect);

    // Week structure radios
    const structDiv = document.createElement('div');
    structDiv.style.margin = '15px 0';
    ['7','14'].forEach(n => {
      const r = document.createElement('input');
      r.type = 'radio'; r.name = 'weeks'; r.value = n;
      if (n==='7') r.checked = true;
      const lbl = document.createElement('label');
      lbl.textContent = ` ${n}-Week`;
      lbl.style.marginRight = '15px';
      lbl.prepend(r);
      structDiv.append(lbl);
    });

    // Two-panel layout
    const panels = document.createElement('div');
    Object.assign(panels.style, { display: 'flex', gap: '20px', height: '400px' });
    // Left: filter + list
    const left = document.createElement('div');
    Object.assign(left.style, {
      flex: '1', border: '1px solid #ccc',
      borderRadius: '4px', overflowY: 'auto', padding: '10px'
    });
    // Filter placeholder
    const filterLabel = document.createElement('label');
    filterLabel.textContent = 'Filter: ';
    const filterSelect = document.createElement('select');
    ['All Types','Assignment','Quiz','Discussion'].forEach(t => {
      const o = document.createElement('option'); o.value = t; o.textContent = t;
      filterSelect.append(o);
    });
    filterLabel.append(filterSelect);
    left.append(filterLabel);

    // Left panel placeholder
    const unassignedList = document.createElement('ul');
    unassignedList.id = 'unassigned-list';
    Object.assign(unassignedList.style, {
      listStyle: 'none', padding: '0', marginTop: '10px'
    });
    left.append(unassignedList);

    // ADD LOADING INDICATOR
    const loadingItem = document.createElement('li');
    loadingItem.textContent = 'Loading unassigned items from API…';
    loadingItem.style.fontStyle = 'italic';
    loadingItem.style.padding = '6px 8px';
    unassignedList.append(loadingItem);

    // ------------------------------------------------------------------------
    // Load real items
    // ------------------------------------------------------------------------
    (async function loadUnassigned() {
      const cid = getCourseID();
      if (!cid) return;
      try {
        // clear the loading placeholder
        unassignedList.innerHTML = '';

        const [assn, quiz, disc] = await Promise.all([
          getAssignments(cid),
          getQuizzes(cid),
          getDiscussions(cid)
        ]);
        const items = [...assn, ...quiz, ...disc];
        items.forEach(item => {
          // Optionally filter by type radio or term here
          const li = document.createElement('li');
          li.textContent = `${item.type.charAt(0).toUpperCase() + item.type.slice(1)}: ${item.title}`;
          li.title = `Type: ${item.type}\nDue: ${item.due_at || 'None'}`;
          li.dataset.itemId = item.id;
          li.draggable = true;
          Object.assign(li.style, {
            padding: '6px 8px', marginBottom: '6px',
            border: '1px solid #ddd', borderRadius: '4px',
            background: '#f8f9fa', cursor: 'grab'
          });
          li.addEventListener('dragstart', e => {
            e.dataTransfer.setData('application/json', JSON.stringify(item));
            e.dataTransfer.effectAllowed = 'move';
          });
          unassignedList.append(li);
        });
      } catch (err) {
        console.error('Error loading unassigned items:', err);
        // optionally replace loading with an error message
        unassignedList.innerHTML = '';
        const errLi = document.createElement('li');
        errLi.textContent = 'Failed to load items.';
        errLi.style.color = 'red';
        unassignedList.append(errLi);
      }
    })();

    // Right: week grid
    const right = document.createElement('div');
    Object.assign(right.style, {
      flex: '2', display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))',
      gap: '10px', overflowY: 'auto'
    });
    function renderWeeks(count) {
      right.innerHTML = '';
      for (let i = 1; i <= count; i++) {
        const wk = document.createElement('div');
        wk.dataset.week = i;
        Object.assign(wk.style, {
          minHeight: '100px', padding: '5px',
          border: '1px dashed #aaa', borderRadius: '4px',
          display: 'flex', flexDirection: 'column'
        });
        const hdr = document.createElement('strong');
        hdr.textContent = `Week ${i}`;
        const drop = document.createElement('div');
        drop.className = 'drop-zone';
        Object.assign(drop.style, {
          flex: '1', marginTop: '5px', padding: '4px',
          border: '1px solid #eee', borderRadius: '4px',
          overflowY: 'auto'
        });
        // drag events
        drop.addEventListener('dragover', e => e.preventDefault());
        drop.addEventListener('drop', e => {
          e.preventDefault();
          // grab the JSON from whichever channel it ended up in
          const raw = e.dataTransfer.getData('application/json') ||
                      e.dataTransfer.getData('text/plain');
          if (!raw) return;
          let dropped;
          try { dropped = JSON.parse(raw); } catch { return; }
          // find the exact li by its data-item-id
          const node = unassignedList.querySelector(`li[data-item-id="${dropped.id}"]`);
          if (node) {
            drop.append(node);
            updateCounts();
          }
        });
        const cnt = document.createElement('div');
        cnt.className = 'count';
        cnt.style.textAlign = 'right';
        cnt.textContent = '0';
        wk.append(hdr, drop, cnt);
        right.append(wk);
      }
      updateCounts();
    }
    structDiv.querySelectorAll('input[name="weeks"]').forEach(r => {
      r.onchange = () => renderWeeks(parseInt(r.value,10));
    });
    renderWeeks(7);

    panels.append(left, right);
    content.append(termLabel, structDiv, panels);

    // Footer buttons
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      position: 'absolute', bottom: '10px',
      left: '20px', right: '20px', textAlign: 'right'
    });
    ['Cancel','Save Draft','Apply Dates'].forEach(txt => {
      const btn = document.createElement('button');
      btn.textContent = txt;
      Object.assign(btn.style, {
        marginLeft: '10px', padding: '8px 16px',
        border: 'none', borderRadius: '4px',
        backgroundColor: txt==='Cancel' ? '#6c757d'
          : txt==='Apply Dates' ? '#007bff' : '#ffc107',
        color: 'white', cursor: 'pointer'
      });
      if (txt==='Cancel') btn.onclick = () => overlay.remove();
      if (txt==='Save Draft') btn.onclick = saveDraft;
      if (txt==='Apply Dates') btn.onclick = applyDates;
      footer.append(btn);
    });

    modal.append(header, content, footer);
    overlay.append(modal);
    document.body.append(overlay);

    // Helper: update week counts
    function updateCounts() {
      Array.from(right.children).forEach(wk => {
        const count = wk.querySelector('.drop-zone').children.length;
        wk.querySelector('.count').textContent = count;
      });
    }

    // Placeholder save/apply
    function saveDraft() {
      const draft = {};
      Array.from(right.children).forEach(wk => {
        draft[wk.dataset.week] = Array.from(
          wk.querySelector('.drop-zone').children
        ).map(li => li.textContent);
      });
      localStorage.setItem('setupDatesDraft', JSON.stringify(draft));
      alert('Draft saved.');
    }
    function applyDates() {
      // TODO: compute & send dates via Canvas API
      alert('Apply Dates clicked. Implement API calls here.');
    }
  }

  buildSetupDatesModal();
}
SetupDates();