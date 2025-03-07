/**
 * Profile Navigation Module
 * Handles all profile-related navigation and authentication functionality
 */

import { auth } from './firebase-config.js';

/**
 * Make auth available globally
 */
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
            // Get the base URL for GitHub Pages
            const baseUrl = window.location.hostname === 'larkaholic.github.io' 
                ? '/ArtistHub-BaguioCity'
                : '';
                
            // Navigate to change password page
            const changePasswordUrl = `${baseUrl}/profile/change-password.html?id=${auth.currentUser.uid}`;
            window.location.href = changePasswordUrl;
        } else {
            // User logged in with OAuth provider
            alert('You are signed in with an external provider (like Google). Password change is managed through that provider.');
        }
    } catch (error) {
        console.error('Password change navigation error:', error);
        alert('There was an error accessing the password change page. Please try again.');
    }
}

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
 * Initialize profile navigation functionality
 */
export function initProfileNavigation() {
    // Make functions available globally
    window.handleProfileNavigation = handleProfileNavigation;
    window.handleEditProfile = handleEditProfile;
    window.handleLogout = handleLogout;
    window.handleChangePassword = handleChangePassword;
    
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

// Initialize the module
initProfileNavigation();

// Export functions for external use
export default {
    handleProfileNavigation,
    handleEditProfile,
    handleLogout,
    handleChangePassword,
    initProfileNavigation
};
