import { auth, db } from '../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Admin-only auth check
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || !userDoc.data().isAdmin) {
            window.location.href = '../index.html';
        }
    } catch (error) {
        window.location.href = '../index.html';
    }
});

// Logout handler
window.handleLogout = async function() {
    try {
        await auth.signOut();
        window.location.href = '../index.html';
    } catch (error) {
        alert('Error logging out');
    }
};

// Function to remove admin privileges
window.removeAdminUser = async function() {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('No user is currently logged in.');
            return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().isAdmin) {
            await updateDoc(userDocRef, { isAdmin: false });
            alert('Admin privileges removed successfully.');
            window.location.reload();
        } else {
            alert('User does not have admin privileges.');
        }
    } catch (error) {
        alert('Error removing admin privileges: ' + error.message);
    }
};

// Ensure this file is loaded in the HTML with a <script> tag
// and the function is accessible globally.