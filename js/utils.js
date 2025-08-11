import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Ensures that all required stylesheets are loaded
export function ensureStylesLoaded(stylesheetUrls) {
    const loadedStylesheets = Array.from(document.styleSheets).map(sheet => {
        try {
            return sheet.href;
        } catch (e) {
            return null;
        }
    }).filter(Boolean);
    
    stylesheetUrls.forEach(url => {
        // Get just the filename for local styles
        const fileName = url.includes('/') ? url.split('/').pop() : url;
        
        // Check if this style is already loaded
        const isLoaded = loadedStylesheets.some(href => 
            href && (href.includes(url) || href.includes(fileName))
        );
        
        if (!isLoaded) {
            console.warn(`Style not loaded: ${url}. Attempting to load it now.`);
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url.startsWith('http') ? url : `./css/${url}`;
            document.head.appendChild(link);
        }
    });
}

// function to check if user is admin
export async function isUserAdmin(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Check both isAdmin flag and admin email
            return userData.isAdmin === true || 
                   userData.email === 'admin@artisthub.com' ||
                   userData.email === 'developer@artisthub.com';
        }
        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// function to show/hide admin elements
export async function setupAdminUI() {
    const user = auth.currentUser;
    if (!user) return;

    const isAdmin = await isUserAdmin(user.uid);
    const adminElements = document.querySelectorAll('.admin-only');
    
    adminElements.forEach(element => {
        element.style.display = isAdmin ? 'block' : 'none';
    });
}

// add this function
export async function checkProfileAccess(profileId) {
    try {
        const profileDoc = await getDoc(doc(db, "users", profileId));
        if (!profileDoc.exists()) return false;

        const profileData = profileDoc.data();
        const currentUser = auth.currentUser;

        // allow if profile is approved
        if (profileData.status === 'approved') return true;

        // allow if user is viewing their own profile
        if (currentUser && currentUser.uid === profileId) return true;

        // allow if user is admin
        if (currentUser) {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists() && userDoc.data().isAdmin) return true;
        }

        return false;
    } catch (error) {
        console.error("Error checking profile access:", error);
        return false;
    }
}

// Add admin control function
export async function handleAdminAction(profileId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please login first');
            return;
        }

        const isAdmin = await isUserAdmin(user.uid);
        if (!isAdmin) {
            alert('You do not have admin privileges');
            return;
        }

        const action = prompt(
            'Admin Controls:\n\n' +
            '1. Approve Profile\n' +
            '2. Reject Profile\n' +
            '3. Ban User\n' +
            '4. View Reports\n' +
            '5. Delete Profile\n\n' +
            'Enter number (1-5):'
        );

        const userRef = doc(db, "users", profileId);
        
        switch(action) {
            case '1':
                await updateDoc(userRef, {
                    status: 'approved',
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid
                });
                alert('Profile approved');
                window.location.reload();
                break;

            case '2':
                const reason = prompt('Enter rejection reason:');
                await updateDoc(userRef, {
                    status: 'rejected',
                    rejectionReason: reason || 'No reason provided',
                    updatedAt: serverTimestamp(),
                    updatedBy: user.uid
                });
                alert('Profile rejected');
                window.location.reload();
                break;

            case '3':
                const banReason = prompt('Enter ban reason:');
                await updateDoc(userRef, {
                    status: 'banned',
                    banReason: banReason || 'No reason provided',
                    bannedAt: serverTimestamp(),
                    bannedBy: user.uid
                });
                alert('User banned');
                window.location.reload();
                break;

            case '4':
                window.location.href = `/admin/reports.html?userId=${profileId}`;
                break;

            case '5':
                // Delete profile confirmation
                const confirmDelete = confirm('Are you sure you want to delete this profile? This action cannot be undone.');
                if (confirmDelete) {
                    const finalConfirm = confirm('This will permanently delete all user data, images, and account information. Continue?');
                    if (finalConfirm) {
                        try {
                            // Get user data before deletion
                            const userDoc = await getDoc(userRef);
                            const userData = userDoc.data();

                            // Delete user document from Firestore
                            await deleteDoc(userRef);

                            alert('Profile deleted successfully');
                            window.location.href = `/index.html`;
                        } catch (deleteError) {
                            console.error('Error during deletion:', deleteError);
                            alert('Error deleting profile. Please try again.');
                        }
                    }
                }
                break;

            default:
                if (action !== null) {
                    alert('Invalid option');
                }
        }
    } catch (error) {
        console.error('Error in admin action:', error);
        alert('Error performing admin action');
    }
}

export function navToEvent(url) {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id') || urlParams.get('artistId');

    // Special handling for gallery navigation
    if (url.includes('gallery')) {
        if (userId) {
            const fullPath = `/Gallery/gallery.html?artistId=${userId}`;
            console.log('Gallery navigation:', { userId, fullPath });
            window.location.href = fullPath;
            return;
        }
    }

    if (url.startsWith('/')) {
        window.location.href = url;
    } else {
        window.location.href = `/${url}`;
    }
}

export function getBasePath() {
    return '';
}

// Add a navigation helper that uses the base path
export function navigateTo(path) {
    window.location.href = path;
}

/**
 * Safely parses JSON with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed object or fallback value
 */
export function safeJsonParse(jsonString, fallback = {}) {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('JSON parse error:', e);
        return fallback;
    }
}

/**
 * Creates a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Formats a date string to a readable format
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, options = {}) {
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        
        const defaultOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
    } catch (e) {
        console.warn('Date formatting error:', e);
        return dateString || 'Invalid date';
    }
}

// Export other common utility functions as needed