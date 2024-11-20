import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add form submit event listener
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// Authentication state observer
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    const loginButtons = document.querySelectorAll('.login-button');
    const userMenus = document.querySelectorAll('#userMenu');
    
    loginButtons.forEach(button => {
        if (user) {
            // User is logged in - show logout button
            button.innerHTML = `
                <button onclick="handleLogout()" class="nav-item hover:bg-green-500 p-1 rounded-lg">
                    Logout (${user.email})
                </button>
            `;
            // Hide the login flyout if it's open
            const loginFlyout = document.getElementById('LoginFlyout');
            if (loginFlyout) {
                loginFlyout.classList.add('hidden');
            }
        } else {
            // User is logged out - show login button
            button.innerHTML = `
                <button onclick="toggleLoginFlyout(event)" class="nav-item hover:bg-green-500 p-1 rounded-lg">
                    Login
                </button>
            `;
        }
    });

    // Show/hide user menu
    userMenus.forEach(menu => {
        if (user) {
            menu.classList.remove('hidden');
        } else {
            menu.classList.add('hidden');
        }
    });
});

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    console.log('Login attempt...');
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        console.log('Attempting login with:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful:', userCredential.user.email);
        
        // Clear form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        
        // Close login flyout
        const loginFlyout = document.getElementById('LoginFlyout');
        if (loginFlyout) {
            loginFlyout.classList.add('hidden');
        }

    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Logout handler
async function handleLogout() {
    try {
        await signOut(auth);
        console.log('Logged out successfully');
        
        // Additional cleanup if needed
        const loginFlyout = document.getElementById('LoginFlyout');
        if (loginFlyout) {
            loginFlyout.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
    }
}

// Toggle login flyout
function toggleLoginFlyout(event) {
    if (event) event.preventDefault();
    const flyout = document.getElementById('LoginFlyout');
    if (flyout) {
        flyout.classList.toggle('hidden');
    }
}

// Toggle forms
function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && registerForm) {
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
    }
}

// Make all functions available globally
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.toggleLoginFlyout = toggleLoginFlyout;
window.toggleForms = toggleForms; 