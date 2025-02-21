function unlockElements() {
    console.log('running');
    let elms = document.querySelectorAll('.lock-icon.lock-icon-locked');
    if (elms.length === 0) {
        console.log('There is nothing to unlock.');
        return;
    }
    elms.forEach(el => {
        el.click();
    })
    console.log('Unlocked');
}

unlockElements();