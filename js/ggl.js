import { signInWithPopup, createUserWithEmailAndPassword, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db, provider } from './firebase-config.js';


// sign in
window.signInWithGoogle = async function(userType = 'user') {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create new user document if it doesn't exist
            // Use the provided userType if it's a registration, otherwise default to 'user'
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                name: user.displayName,
                userType: userType, // Use the passed userType
                createdAt: new Date(),
                lastLogin: new Date()
            });
        } else {
            // Update last login
            await setDoc(doc(db, 'users', user.uid), {
                lastLogin: new Date()
            }, { merge: true });
        }

        // Close the login modal
        toggleLoginFlyout();
        
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

// Registration
window.handleRegister = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const userType = document.getElementById('userType').value;
    
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            userType: userType,
            createdAt: new Date(),
            lastLogin: new Date()
        });
        
        // Close the login flyout
        toggleLoginFlyout();
        
        // Update UI to show user is logged in
        if (typeof updateLoginState === 'function') {
            updateLoginState(user);
        }
        
        console.log('Successfully registered user');
        return false; // Prevent form submission
    } catch (error) {
        console.error('Error registering user:', error);
        let errorMessage = 'Failed to register. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered. Please use a different email or try logging in.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters long.';
                break;
            default:
                errorMessage = error.message;
        }
        
        alert(errorMessage);
        return false;
    }
}

// Helper functions remain the same
window.toggleForms = function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.classList.contains('hidden')) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

window.toggleLoginFlyout = function() {
    const flyout = document.getElementById('LoginFlyout');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (flyout.classList.contains('hidden')) {
        flyout.classList.remove('hidden');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        flyout.classList.add('hidden');
    }
}