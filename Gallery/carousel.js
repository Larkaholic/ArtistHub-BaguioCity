function toggleLoginFlyout(event) {
    if (event) event.preventDefault();
    const flyout = document.getElementById('LoginFlyout');
    flyout.classList.toggle('hidden');
}

function toggleNav() {
    const menu = document.getElementById('flyout-menu');
    const body = document.body;
    
    menu.classList.toggle('translate-x-full');
    
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.onclick = toggleNav;
        document.body.appendChild(overlay);
    }
    
    overlay.classList.toggle('active');
    body.style.overflow = menu.classList.contains('translate-x-full') ? '' : 'hidden';
}

function navToEvent(url) {
    window.location.href = url;
}

// Make functions globally available
window.toggleNav = toggleNav;
window.navToEvent = navToEvent;
window.toggleLoginFlyout = toggleLoginFlyout;
