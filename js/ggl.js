import { signInWithPopup, createUserWithEmailAndPassword, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db, provider } from './firebase-config.js';

let pendingGoogleUser = null;

window.showUserTypeModal = function() {
    const modal = document.getElementById('userTypeModal');
    modal.classList.remove('hidden');
}

window.hideUserTypeModal = function() {
    const modal = document.getElementById('userTypeModal');
    modal.classList.add('hidden');
}

// Update the selectUserType function
window.selectUserType = async function(userType) {
    // Hide the modal first
    const userTypeModal = document.getElementById('userTypeModal');
    if (userTypeModal) userTypeModal.classList.add('hidden');
    
    // Complete Google sign in with selected user type
    await completeGoogleSignIn(userType);
}

// Add new function to handle Google sign in after user type selection
window.completeGoogleSignIn = async function(userType) {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create new user document
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                name: user.displayName,
                userType: userType,
                status: userType === 'artist' ? 'pending' : 'approved',
                createdAt: new Date(),
                lastLogin: new Date()
            });

            if (userType === 'artist') {
                alert('Your artist registration is pending approval. We will review your application shortly.');
            }
        } else {
            // Existing user - just update last login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogin: new Date()
            });
        }

        // Hide user type modal
        const userTypeModal = document.getElementById('userTypeModal');
        if (userTypeModal) userTypeModal.classList.add('hidden');
        
        if (typeof updateLoginState === 'function') {
            updateLoginState(user);
        }
        
        return user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        alert('Failed to sign in with Google. Please try again.');
        throw error;
    }
}

// Update the signInWithGoogle function
window.signInWithGoogle = async function() {
    try {
        // Show user type selection modal first
        const userTypeModal = document.getElementById('userTypeModal');
        if (userTypeModal) {
            // Hide login flyout
            const loginFlyout = document.getElementById('LoginFlyout');
            if (loginFlyout) loginFlyout.classList.add('hidden');
            // Show user type modal
            userTypeModal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error in Google sign-in flow:', error);
        alert('Failed to initialize sign in. Please try again.');
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