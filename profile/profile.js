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
    const flyoutMenu = document.getElementById('flyout-menu');
    flyoutMenu.classList.toggle('hidden');
    flyoutMenu.classList.toggle('translate-x-full');
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
    const basePath = getBasePath();
    url = url.replace(/^\//, '');
    window.location.href = `${basePath}/${url}`;
}

