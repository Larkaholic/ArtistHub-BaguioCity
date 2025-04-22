import { auth } from './firebase-config.js';

window.firebaseAuth = auth;

/**
 * Navigate to a user's profile
 * @returns {Promise<void>}
 */
export async function handleProfileNavigation() {
    try {
        // Wait for auth state to be determined
        const user = auth.currentUser;
        if (!user) {
            // If no user is signed in, first check if auth is still initializing
            const authCheck = new Promise((resolve) => {
                const unsubscribe = auth.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });
            const finalUser = await authCheck;
            if (!finalUser) {
                alert('Please login to view your profile');
                window.toggleLoginFlyout();
                return;
            }
        }
        
        // Get the base URL for GitHub Pages
        const baseUrl = window.location.hostname === 'larkaholic.github.io' 
            ? '/ArtistHub-BaguioCity'
            : '';
            
        // Construct the profile URL
        const profileUrl = `${baseUrl}/profile/profile.html?id=${auth.currentUser.uid}`;
        window.location.href = profileUrl;
    } catch (error) {
        console.error('Profile navigation error:', error);
        alert('There was an error accessing your profile. Please try again.');
    }
}

/**
 * Navigate to edit profile page
 * @returns {Promise<void>}
 */
export async function handleEditProfile() {
    try {
        const user = auth.currentUser;
        if (!user) {
            const authCheck = new Promise((resolve) => {
                const unsubscribe = auth.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });
            const finalUser = await authCheck;
            if (!finalUser) {
                alert('Please login to edit your profile');
                window.toggleLoginFlyout();
                return;
            }
        }
        
        // Get the base URL for GitHub Pages
        const baseUrl = window.location.hostname === 'larkaholic.github.io' 
            ? '/ArtistHub-BaguioCity'
            : '';
            
        // Go directly to edit profile page
        const editProfileUrl = `${baseUrl}/profile/edit-profile.html?id=${auth.currentUser.uid}`;
        window.location.href = editProfileUrl;
    } catch (error) {
        console.error('Profile navigation error:', error);
        alert('There was an error accessing your profile. Please try again.');
    }
}

/**
 * Navigate to change password page or show password change UI
 * @returns {Promise<void>}
 */
export async function handleChangePassword() {
    try {
        const user = auth.currentUser;
        if (!user) {
            const authCheck = new Promise((resolve) => {
                const unsubscribe = auth.onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });
            const finalUser = await authCheck;
            if (!finalUser) {
                alert('Please login to change your password');
                window.toggleLoginFlyout();
                return;
            }
        }
        
        // If user logged in with email/password
        if (user.providerData.some(provider => provider.providerId === 'password')) {
            // Show password change form in settings modal
            const modal = document.getElementById('settingsModal');
            if (modal) {
                modal.classList.remove('hidden');
                showPasswordChangeForm();
            }
        } else {
            // User logged in with OAuth provider
            alert('You are signed in with an external provider (like Google). Password change is managed through that provider.');
        }
    } catch (error) {
        console.error('Password change error:', error);
        alert('There was an error accessing password change. Please try again.');
    }
}

// Make showPasswordChangeForm globally available
window.showPasswordChangeForm = function() {
    const mainView = document.getElementById('settingsMainView');
    const passwordForm = document.getElementById('passwordChangeForm');
    if (mainView && passwordForm) {
        mainView.classList.add('hidden');
        passwordForm.classList.remove('hidden');
    }
};

/**
 * Handle user logout
 * @returns {Promise<void>}
 */
export async function handleLogout() {
    try {
        await auth.signOut();
        alert('You have been logged out successfully.');
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
        alert('There was an error during logout. Please try again.');
    }
}

/**
 * Open settings modal
 */
export function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    // Close the profile dropdown when opening settings
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}


// Close settings modal
export function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}


// Initialize profile navigation functionality
export function initProfileNavigation() {
    // Make functions available globally
    window.handleProfileNavigation = handleProfileNavigation;
    window.handleEditProfile = handleEditProfile;
    window.handleLogout = handleLogout;
    window.handleChangePassword = handleChangePassword;
    window.openSettingsModal = openSettingsModal;
    window.closeSettingsModal = closeSettingsModal;
    
    // Update mobile profile link behavior
    document.addEventListener('DOMContentLoaded', () => {
        const mobileProfileLink = document.querySelector('#flyout-menu [onclick*="profile"]');
        if (mobileProfileLink) {
            mobileProfileLink.onclick = (e) => {
                e.preventDefault();
                handleProfileNavigation();
            };
        }
    });
}

initProfileNavigation();

// Export functions for external use
export default {
    handleProfileNavigation,
    handleEditProfile,
    handleLogout,
    handleChangePassword,
    openSettingsModal,
    closeSettingsModal,
    initProfileNavigation
};
