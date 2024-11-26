import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc,
    collection,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getBasePath } from './utils.js';

// predefined admin emails (store these securely in production)
const ADMIN_EMAILS = [
    'admin@artisthub.com',
    'developer@artisthub.com'
    // Add other admin emails
];

// add the navigation helper at the top of the file
function goToProfile() {
    window.location.href = './profile/profile.html';
}

// get base url for both environments
const baseUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? '' 
    : '/ArtistHub-BaguioCity';

// registration handler
window.handleRegister = async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const userType = document.getElementById('userType').value;

    try {
        // Check if email is in admin list
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
        if (userType === 'admin' && !isAdmin) {
            alert('Unauthorized to register as admin');
            return;
        }

        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create initial user document
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            userType: userType,
            createdAt: new Date().toISOString(),
            displayName: email.split('@')[0],
            photoURL: 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true',
            artistDetails: userType === 'artist' ? {
                bio: 'no bio yet',
                specialization: 'artist'
            } : null
        });

        // Hide registration flyout
        const loginFlyout = document.getElementById('LoginFlyout');
        if (loginFlyout) {
            loginFlyout.classList.add('hidden');
        }

        // Redirect to profile edit page
        window.location.href = `${baseUrl}/profile/edit-profile.html`;

    } catch (error) {
        alert('registration failed: ' + error.message);
    }
};

// Login handler
window.handleLogin = async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        const userData = userDoc.data();

        // hide login flyout
        const loginFlyout = document.getElementById('LoginFlyout');
        if (loginFlyout) {
            loginFlyout.classList.add('hidden');
        }

        // clear form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';

        // redirect admin to dashboard
        if (userData?.isAdmin) {
            window.location.href = `${baseUrl}/admin/dashboard.html`;
        }

    } catch (error) {
        alert('login failed: ' + error.message);
    }
};

// Update UI based on role
function updateUIForRole(role, userData) {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;

    let menuContent = '';
    switch(role) {
        case 'admins':
            menuContent = `
                <div class="glass-header rounded-lg p-4">
                    <nav>
                        <ul>
                            <li><a href="/admin/dashboard.html">Admin Dashboard</a></li>
                            <li><a href="/admin/manage-users.html">Manage Users</a></li>
                            <li><a href="/admin/manage-events.html">Manage Events</a></li>
                            <li><a href="/admin/verify-artists.html">Verify Artists</a></li>
                        </ul>
                    </nav>
                </div>
            `;
            break;

        case 'artists':
            menuContent = `
                <div class="glass-header rounded-lg p-4">
                    <nav>
                        <ul>
                            <li><a href="/profile/artist-profile.html">Artist Profile</a></li>
                            <li><a href="/portfolio/manage.html">Manage Portfolio</a></li>
                            <li><a href="/events/my-events.html">My Events</a></li>
                            ${userData.artistProfile.verified ? 
                                '<li><span class="text-green-500">✓ Verified Artist</span></li>' : 
                                '<li><span class="text-yellow-500">Pending Verification</span></li>'
                            }
                        </ul>
                    </nav>
                </div>
            `;
            break;

        case 'users':
            menuContent = `
                <div class="glass-header rounded-lg p-4">
                    <nav>
                        <ul>
                            <li><a href="/profile/profile.html">My Profile</a></li>
                            <li><a href="/events/saved-events.html">Saved Events</a></li>
                            <li><a href="/purchases/history.html">Purchase History</a></li>
                        </ul>
                    </nav>
                </div>
            `;
            break;
    }
    
    userMenu.innerHTML = menuContent;
    userMenu.classList.remove('hidden');
}

// Auth state observer
onAuthStateChanged(auth, async (user) => {
    const loginButtons = document.querySelectorAll('.login-button');
    
    if (user) {
        console.log('User is signed in:', user.email);
        // Get user role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const userRole = userData?.role || 'user';

        // Update login buttons
        loginButtons.forEach(button => {
            button.innerHTML = `
                <button onclick="handleLogout()" class="nav-item hover:bg-green-500 p-1 rounded-lg">
                    Logout (${userRole})
                </button>
            `;
        });

        // Show appropriate menu based on role
        updateUIForRole(userRole, userData);

        // Check admin status
        const adminBadge = document.getElementById('adminBadge');
        const adminDashboard = document.getElementById('adminDashboard');
        
        if (userData?.isAdmin) {
            // Show admin indicators
            adminBadge.classList.remove('hidden');
            adminDashboard.classList.remove('hidden');
            
            // Optional: Add to console for verification
            console.log('logged in as admin');
        } else {
            // Hide admin indicators
            adminBadge.classList.add('hidden');
            adminDashboard.classList.add('hidden');
        }

    } else {
        console.log('User is signed out');
        // Reset login buttons
        loginButtons.forEach(button => {
            button.innerHTML = `
                <button onclick="toggleLoginFlyout(event)" class="nav-item hover:bg-green-500 p-1 rounded-lg">
                    Login
                </button>
            `;
        });

        // Hide user menu
        const userMenu = document.getElementById('userMenu');
        if (userMenu) userMenu.classList.add('hidden');

        // Hide admin indicators when logged out
        const adminBadge = document.getElementById('adminBadge');
        const adminDashboard = document.getElementById('adminDashboard');
        
        adminBadge.classList.add('hidden');
        adminDashboard.classList.add('hidden');
    }

    // get current page
    const isAdminDashboard = window.location.pathname.includes('/admin/');
    
    if (!isAdminDashboard) {
        // only try to update UI elements on main page
        const adminBadge = document.getElementById('adminBadge');
        const adminDashboard = document.getElementById('adminDashboard');
        
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const isAdmin = userDoc.data()?.isAdmin;
                
                if (isAdmin && adminBadge && adminDashboard) {
                    adminBadge.classList.remove('hidden');
                    adminDashboard.classList.remove('hidden');
                }
            } catch (error) {
                console.error('error checking admin status');
            }
        } else if (adminBadge && adminDashboard) {
            adminBadge.classList.add('hidden');
            adminDashboard.classList.add('hidden');
        }
    }
});

// Logout handler
window.handleLogout = async function() {
    try {
        await signOut(auth);
        const loginFlyout = document.getElementById('LoginFlyout');
        const userMenu = document.getElementById('userMenu');
        
        if (loginFlyout) loginFlyout.classList.add('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    } catch (error) {
        alert('error logging out: ' + error.message);
    }
};

// Toggle login flyout
window.toggleLoginFlyout = function(event) {
    if (event) event.preventDefault();
    const flyout = document.getElementById('LoginFlyout');
    if (flyout) {
        flyout.classList.toggle('hidden');
    }
};

// Toggle forms
window.toggleForms = function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm && registerForm) {
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
    }
};

// Make it available globally if needed
window.goToProfile = goToProfile;

// Add this near your other window functions
window.toggleNav = function() {
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
}; 