import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function getBasePath() {
    return window.location.hostname.includes('github.io') ? '/ArtistHub-BaguioCity' : '';
}

export function navToEvent(path) {
    const baseUrl = getBasePath();
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    window.location.href = `${baseUrl}/${cleanPath}`;
}

export function ensureStylesLoaded(requiredStyles) {
    requiredStyles.forEach(style => {
        const existingLink = document.querySelector(`link[href$="${style}"]`);
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = style;
            document.head.appendChild(link);
        }
    });
}

// export function navToEvent(url) {
//     const basePath = getBasePath();
//     // Remove leading slash if present
//     url = url.replace(/^\//, '');
//     window.location.href = `${basePath}/${url}`;
// }

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
                const basePath = getBasePath();
                window.location.href = `${basePath}/admin/reports.html?userId=${profileId}`;
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
                            window.location.href = `${getBasePath()}/index.html`;
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