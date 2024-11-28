import { auth, db } from '../js/firebase-config.js';
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function setupAdminUser() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in');
            return;
        }

        // Set admin privileges
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            isAdmin: true,
            userType: 'admin',
            status: 'approved',
            createdAt: new Date().toISOString()
        }, { merge: true });

        console.log('Admin privileges set successfully for:', user.email);
        alert('Admin privileges have been set. Please refresh the page.');
    } catch (error) {
        console.error('Error setting admin privileges:', error);
        alert('Error setting admin privileges: ' + error.message);
    }
}

window.setupAdminUser = setupAdminUser; 