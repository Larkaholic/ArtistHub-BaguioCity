import { getBasePath } from '../js/utils.js';

export function toggleLoginFlyout(event) {
    if (event) event.preventDefault();
    const flyout = document.getElementById('LoginFlyout');
    flyout.classList.toggle('active');
}

export function submitLogin() {
    alert('Login submitted!');
    toggleLoginFlyout();
}

export function toggleNav() {
    const menu = document.getElementById('flyout-menu');
    const body = document.body;
    
    // Toggle the menu
    menu.classList.toggle('translate-x-full');
    
    // Create or get overlay
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.onclick = toggleNav;
        document.body.appendChild(overlay);
    }
    
    // Toggle overlay
    overlay.classList.toggle('active');
    
    // Toggle body scroll
    body.style.overflow = menu.classList.contains('translate-x-full') ? '' : 'hidden';
}

export function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.classList.contains('hidden')) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

export function navToEvent(url) {
    // remove any leading slashes
    url = url.replace(/^\//, '');
    
    // get the repository name from the current path
    const repoName = 'ArtistHub-BaguioCity'; // hardcode the repo name
    
    // construct the correct github pages url
    const baseUrl = `/${repoName}`;
    
    // combine the base url with the target path
    const fullUrl = `${baseUrl}/${url}`;
    
    window.location.href = fullUrl;
}

// Make functions globally available
window.toggleNav = toggleNav;
window.navToEvent = navToEvent;
window.toggleLoginFlyout = toggleLoginFlyout;
window.toggleForms = toggleForms;

