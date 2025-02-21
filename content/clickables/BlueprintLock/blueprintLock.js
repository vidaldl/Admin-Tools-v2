function lockElements() {
    console.log('running');
    let elms = document.querySelectorAll('.lock-icon.btn-unlocked');
    if (elms.length === 0) {
        console.log('There is nothing to lock.');
        return;
    }
    elms.forEach(el => {
        el.click();
    })
    console.log('Locked');
}

lockElements();