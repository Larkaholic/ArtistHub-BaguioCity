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

// When creating the artist profile view
function createProfileView(artistData) {
    return `
        <div class="profile-info">
            <!-- Other profile information -->
            
            <!-- Gallery link with email parameter -->
            <a href="../Gallery/gallery.html?email=${artistData.email}" 
               class="gallery-link">
                View Gallery
            </a>
        </div>
    `;
}

function displayProfile(userData) {
    const profileContainer = document.getElementById('profileContainer');
    if (!profileContainer) return;

    profileContainer.innerHTML = `
        <div class="max-w-4xl mx-auto p-4">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <!-- Profile Image -->
                <div class="flex justify-center mb-4">
                    <img src="${userData.profileImage || '../assets/default-profile.png'}" 
                         alt="Profile" 
                         class="w-32 h-32 rounded-full object-cover">
                </div>

                <!-- Profile Info -->
                <div class="text-center mb-6">
                    <h2 class="text-2xl font-bold mb-2">${userData.name || 'Name not set'}</h2>
                    <p class="text-gray-600">${userData.email}</p>
                    <p class="text-gray-700 mt-2">${userData.bio || 'No bio available'}</p>
                </div>

                <!-- Gallery Link -->
                <div class="text-center mt-4">
                    <a href="../Gallery/gallery.html?email=${userData.email}" 
                       class="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        View Gallery
                    </a>
                </div>

                <!-- Other profile sections -->
                <div class="mt-6">
                    <h3 class="text-xl font-semibold mb-3">Contact Information</h3>
                    <p class="text-gray-700">Location: ${userData.location || 'Not specified'}</p>
                    <p class="text-gray-700">Phone: ${userData.phone || 'Not specified'}</p>
                </div>
            </div>
        </div>
    `;
}

