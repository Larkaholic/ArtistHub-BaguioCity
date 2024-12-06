// UI event handlers
export function toggleLoginFlyout(event) {
    if (event) event.preventDefault();
    const flyout = document.getElementById('LoginFlyout');
    if (flyout) {
        flyout.classList.toggle('hidden');
    }
}

export function toggleNav() {
    const menu = document.getElementById('flyout-menu');
    if (menu) {
        menu.classList.toggle('translate-x-full');
    }
}

export function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && registerForm) {
        if (loginForm.classList.contains('hidden')) {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    }
}

// Make functions globally available
window.toggleLoginFlyout = toggleLoginFlyout;
window.toggleNav = toggleNav;
window.toggleForms = toggleForms; 