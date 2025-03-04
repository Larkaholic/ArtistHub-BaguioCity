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
    serverTimestamp,
    deleteDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getBasePath, isUserAdmin, navToEvent } from './utils.js';

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
window.handleRegister = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const userType = document.getElementById('userType').value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore with proper status
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            userType: userType,
            name: user.displayName || '',
            status: userType === 'artist' ? 'pending' : 'approved', // Set initial status
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        if (userType === 'artist') {
            alert('Your artist registration is pending approval. We will review your application shortly.');
        }
        
        toggleLoginFlyout();
        
        if (typeof updateLoginState === 'function') {
            updateLoginState(user);
        }
        
        return false;
    } catch (error) {
        console.error('Error registering user:', error);
        alert(error.message);
        return false;
    }
}

// login handler
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

// update UI based on role
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

// add this function to check user status
export async function checkUserStatus(user) {
    if (!user) return false;
    
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData.status === 'approved';
}

// use this function when checking user access
onAuthStateChanged(auth, async (user) => {
    const loginButtons = document.querySelectorAll('.login-button');
    const logoutButtons = document.querySelectorAll('.logout-button');
    const adminButtons = document.querySelectorAll('.admin-button');
    const profileLinks = document.querySelectorAll('#profileLink');

    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        
        // Check if user is admin
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const isAdmin = userDoc.exists() && userDoc.data().isAdmin;
            
            // Show/hide admin button based on role
            adminButtons.forEach(btn => {
                btn.style.display = isAdmin ? 'block' : 'none';
            });
        } catch (error) {
            console.error('Error checking admin status:', error);
            adminButtons.forEach(btn => btn.style.display = 'none');
        }

        // Update other UI elements
        loginButtons.forEach(btn => btn.style.display = 'none');
        logoutButtons.forEach(btn => btn.style.display = 'block');
        profileLinks.forEach(link => link.style.display = 'block');
    } else {
        // User is signed out
        console.log('User is signed out');
        loginButtons.forEach(btn => btn.style.display = 'block');
        logoutButtons.forEach(btn => btn.style.display = 'none');
        adminButtons.forEach(btn => btn.style.display = 'none');
        profileLinks.forEach(link => link.style.display = 'none');
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

// Update the logout handler
export async function handleLogout() {
    try {
        await signOut(auth);
        const basePath = getBasePath();
        window.location.href = `${basePath}/index.html`;
    } catch (error) {
        console.error("Error signing out:", error);
        alert("Error signing out");
    }
}

// Make it available to window object
window.handleLogout = handleLogout;

// toggle login flyout
window.toggleLoginFlyout = function(event) {
    if (event) event.preventDefault();
    const flyout = document.getElementById('LoginFlyout');
    if (flyout) {
        flyout.classList.toggle('hidden');
    }
};

// toggle forms
window.toggleForms = function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm && registerForm) {
        loginForm.classList.toggle('hidden');
        registerForm.classList.toggle('hidden');
    }
};

// make it available globally if needed
window.goToProfile = goToProfile;

// add this near your other window functions
window.toggleNav = function() {
    const menu = document.getElementById('flyout-menu');
    const body = document.body;
    
    // toggle the menu
    menu.classList.toggle('translate-x-full');
    
    // create or get overlay
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.onclick = toggleNav;
        document.body.appendChild(overlay);
    }
    
    // toggle overlay
    overlay.classList.toggle('active');
    
    // toggle body scroll
    body.style.overflow = menu.classList.contains('translate-x-full') ? '' : 'hidden';
};

// Update UI based on auth state
async function updateUIForUser(user) {
    const profileLink = document.getElementById('profileLink');
    
    if (user && profileLink) {
        // Set the href directly to the edit profile page with the user's ID
        profileLink.href = `profile/edit-profile.html?uid=${user.uid}`;
    } else if (profileLink) {
        // If not logged in, keep the link but maybe show a login prompt
        profileLink.href = '#';
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLoginModal();
        });
    }
}

function updateUIForNoUser() {
    try {
        // Get all nav elements if they exist
        const elements = {
            loginButtons: document.querySelectorAll('.login-button'),
            logoutButtons: document.querySelectorAll('.logout-button'),
            adminElements: document.querySelectorAll('.admin-only'),
            userElements: document.querySelectorAll('.user-only'),
            guestElements: document.querySelectorAll('.guest-only')
        };

        // Only update elements if they exist
        if (elements.loginButtons?.length) {
            elements.loginButtons.forEach(btn => btn.style.display = 'block');
        }
        if (elements.logoutButtons?.length) {
            elements.logoutButtons.forEach(btn => btn.style.display = 'none');
        }
        if (elements.userElements?.length) {
            elements.userElements.forEach(elem => elem.style.display = 'none');
        }
        if (elements.guestElements?.length) {
            elements.guestElements.forEach(elem => elem.style.display = 'block');
        }
        if (elements.adminElements?.length) {
            elements.adminElements.forEach(elem => elem.style.display = 'none');
        }
    } catch (error) {
        console.warn('Error updating UI for no user:', error);
    }
}

// Update auth state observer
auth.onAuthStateChanged((user) => {
    try {
        const loginButton = document.querySelector('.login-button');
        const logoutButton = document.querySelector('.logout-button');
        const uploadSection = document.getElementById('uploadSection');

        if (user) {
            if (loginButton) loginButton.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'block';
            if (uploadSection) uploadSection.classList.remove('hidden');
        } else {
            if (loginButton) loginButton.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'none';
            if (uploadSection) uploadSection.classList.add('hidden');
        }
    } catch (error) {
        console.warn('Error in auth state change:', error);
    }
});

window.handleAdminAction = async function() {
    const user = auth.currentUser;
    if (!user) return;

    const isAdmin = await isUserAdmin(user.uid);
    if (!isAdmin) {
        alert('You do not have admin privileges');
        return;
    }

    const action = prompt('Admin Controls: \n1. Manage User Profile\n2. Manage Content\n3. View Reports\n4. Delete Profile');
    
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
        case '4':
            const userEmail = prompt('Enter the user\'s email address to delete:');
            if (userEmail) {
                try {
                    // First verify admin status again
                    const adminStatus = await isUserAdmin(user.uid);
                    if (!adminStatus) {
                        alert('You do not have permission to delete profiles');
                        return;
                    }

                    // Query to find user by email
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("email", "==", userEmail));
                    const querySnapshot = await getDocs(q);

                    if (querySnapshot.empty) {
                        alert('No user found with that email address');
                        return;
                    }

                    const userDoc = querySnapshot.docs[0];
                    const confirmDelete = confirm(`Are you sure you want to delete the profile for ${userEmail}? This action cannot be undone.`);
                    if (confirmDelete) {
                        const finalConfirm = confirm('This will permanently delete all user data, images, and account information. Continue?');
                        if (finalConfirm) {
                            await deleteDoc(doc(db, "users", userDoc.id));
                            alert('Profile deleted successfully');
                            window.location.href = `${getBasePath()}/index.html`;
                        }
                    }
                } catch (error) {
                    console.error('Error deleting profile:', error);
                    alert(`Error deleting profile: ${error.message}`);
                }
            }
            break;
        default:
            if (action !== null) {
                alert('Invalid option');
            }
    }
}

// Add this if not already present
async function registerUser(email, password, userType) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document with pending status for artists
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            userType: userType,
            status: userType === 'artist' ? 'pending' : 'approved',
            createdAt: serverTimestamp(),
            displayName: '',
            artistDetails: {}
        });

        // Redirect to profile edit for artists
        if (userType === 'artist') {
            window.location.href = `${getBasePath()}/profile/edit-profile.html`;
        } else {
            window.location.href = `${getBasePath()}/index.html`;
        }
    } catch (error) {
        console.error("Error registering user:", error);
        alert(error.message);
    }
}

// Check admin status
async function checkAdminStatus(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        return userDoc.exists() && userDoc.data().isAdmin === true;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Initialize auth state observer
auth.onAuthStateChanged((user) => {
    updateUIForUser(user);
});

// Update the profile navigation logic
export function navigateToProfile(userId) {
    if (userId) {
        window.location.href = `/profile/profile.html?id=${userId}`;
    } else {
        console.error('No user ID provided for profile navigation');
    }
}

function closeAnnouncement() {
    const announcement = document.getElementById('announcement');
    announcement.style.display = 'none';
    localStorage.setItem('announcement-closed', 'true');
}

// Check if announcement was previously closed
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('announcement-closed')) {
        const announcement = document.getElementById('announcement');
        if (announcement) {
            announcement.style.display = 'none';
        }
    }
});

