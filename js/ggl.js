import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db, provider } from './firebase-config.js';

window.signInWithGoogle = async function() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create new user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                name: user.displayName,
                userType: 'user',
                createdAt: new Date(),
                lastLogin: new Date()
            });
        } else {
            // Update last login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogin: new Date()
            });
        }

        // Close the login modal
        if (typeof toggleLoginFlyout === 'function') {
            toggleLoginFlyout();
        }
        
        // Update UI to show user is logged in
        if (typeof updateLoginState === 'function') {
            updateLoginState(user);
        }
        
        console.log('Successfully signed in with Google');
        return user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        alert('Failed to sign in with Google. Please try again.');
        throw error;
    }
}