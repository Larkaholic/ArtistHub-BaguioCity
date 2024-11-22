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

// Predefined admin emails (store these securely in production)
const ADMIN_EMAILS = [
    'admin@artisthub.com',
    'developer@artisthub.com'
    // Add other admin emails
];

// Registration handler
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
            displayName: '',
            photoURL: '',
            createdAt: serverTimestamp(),
            artistDetails: userType === 'artist' ? {
                bio: '',
                specialization: ''
            } : null,
            socialLinks: {}
        });
        
        alert('Registration successful!');
        toggleLoginFlyout();
        
    } catch (error) {
        console.error('Registration error:', error);
        alert(`Registration failed: ${error.message}`);
    }
};

// Login handler
window.handleLogin = async function(e) {
    e.preventDefault();
    console.log('Login attempt started');

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        // First authenticate the user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Authentication successful:', userCredential.user.email);

        // Then check all possible role collections
        const uid = userCredential.user.uid;
        let userRole = null;
        let userData = null;

        // Try admin first
        try {
            const adminDoc = await getDoc(doc(db, "admins", uid));
            if (adminDoc.exists()) {
                userRole = 'admin';
                userData = adminDoc.data();
            }
        } catch (error) {
            console.log('Not an admin, checking artist role...');
        }

        // If not admin, try artist
        if (!userRole) {
            try {
                const artistDoc = await getDoc(doc(db, "artists", uid));
                if (artistDoc.exists()) {
                    userRole = 'artist';
                    userData = artistDoc.data();
                }
            } catch (error) {
                console.log('Not an artist, checking user role...');
            }
        }

        // If not admin or artist, try regular user
        if (!userRole) {
            try {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists()) {
                    userRole = 'user';
                    userData = userDoc.data();
                }
            } catch (error) {
                console.log('No user data found, creating new user...');
            }
        }

        // If no role found, create as regular user
        if (!userRole) {
            userData = {
                email: userCredential.user.email,
                createdAt: new Date(),
                role: 'user'
            };
            await setDoc(doc(db, "users", uid), userData);
            userRole = 'user';
        }

        console.log('Login successful with role:', userRole);
        
        // Update UI based on role
        updateUIForRole(userRole, userData);
        
        // Clear form and close flyout
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('LoginFlyout').classList.add('hidden');

    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
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
    }
});

// Logout handler
window.handleLogout = async function() {
    try {
        await signOut(auth);
        console.log('Logged out successfully');
        
        // Hide login flyout and user menu
        const loginFlyout = document.getElementById('LoginFlyout');
        if (loginFlyout) loginFlyout.classList.add('hidden');
        
        const userMenu = document.getElementById('userMenu');
        if (userMenu) userMenu.classList.add('hidden');
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
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