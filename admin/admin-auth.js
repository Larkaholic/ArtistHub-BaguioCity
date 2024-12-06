import { auth, db } from '../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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