import { auth } from '../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { isUserAdmin, setupAdminUI, navToEvent } from '../js/utils.js';

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

// Make functions globally available
window.toggleNav = toggleNav;
window.navToEvent = navToEvent;
window.toggleLoginFlyout = toggleLoginFlyout;
window.toggleForms = toggleForms;

// add admin action handler
export async function handleAdminAction() {
    const user = auth.currentUser;
    if (!user) return;

    const isAdmin = await isUserAdmin(user.uid);
    if (!isAdmin) {
        alert('you do not have admin privileges');
        return;
    }

    const action = prompt('enter admin action: \n1. manage users\n2. manage content\n3. view reports');
    
    switch(action) {
        case '1':
            navToEvent('admin/manage-users.html');
            break;
        case '2':
            navToEvent('admin/manage-content.html');
            break;
        case '3':
            navToEvent('admin/view-reports.html');
            break;
        default:
            alert('invalid action');
    }
}

// update your existing code
document.addEventListener('DOMContentLoaded', async () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('User is logged in:', user.uid);
            const isAdmin = await isUserAdmin(user.uid);
            console.log('is admin:', isAdmin); // check if user is admin
            
            const adminButton = document.querySelector('.admin-only');
            console.log('admin button element:', adminButton); // check if button exists
            
            if (isAdmin) {
                console.log('showing admin controls');
                if (adminButton) {
                    adminButton.style.display = 'flex';
                }
            }
        }
    });
});

// make sure handleAdminAction is globally available
window.handleAdminAction = handleAdminAction;

