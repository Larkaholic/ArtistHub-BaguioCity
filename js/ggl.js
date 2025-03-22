import { signInWithPopup, createUserWithEmailAndPassword, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db, provider } from './firebase-config.js';

let pendingGoogleUser = null;

// Export these functions so they're available in other modules
export function showUserTypeModal() {
    const modal = document.getElementById('userTypeModal');
    modal.classList.remove('hidden');
}

export function hideUserTypeModal() {
    const modal = document.getElementById('userTypeModal');
    modal.classList.add('hidden');
}

// Also make them globally accessible via window
window.showUserTypeModal = showUserTypeModal;
window.hideUserTypeModal = hideUserTypeModal;

// Update the signInWithGoogle function for login form
export async function signInWithGoogle(isRegistration = false) {
    try {
        if (isRegistration) {
            // If this is registration, show user type modal first
            const loginFlyout = document.getElementById('LoginFlyout');
            if (loginFlyout) loginFlyout.classList.add('hidden');
            const userTypeModal = document.getElementById('userTypeModal');
            if (userTypeModal) userTypeModal.classList.remove('hidden');
        } else {
            // If this is login, directly proceed with Google sign in
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Check if user exists and update last login
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                await updateDoc(doc(db, 'users', user.uid), {
                    lastLogin: new Date()
                });
                toggleLoginFlyout();
                if (typeof updateLoginState === 'function') {
                    updateLoginState(user);
                }
                // Reload page to update UI state
                window.location.reload();
            } else {
                // If user doesn't exist, they need to register first
                alert('No account found. Please register first.');
                toggleLoginFlyout();
                toggleForms(); // Switch to registration form
            }
        }
    } catch (error) {
        console.error('Error in Google sign-in flow:', error);
        alert('Failed to sign in with Google. Please try again.');
    }
}

// Make this function globally accessible
window.signInWithGoogle = signInWithGoogle;

// Update the selectUserType function
export async function selectUserType(userType) {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            name: user.displayName,
            userType: userType,
            status: userType === 'artist' ? 'pending' : 'approved',
            createdAt: new Date(),
            lastLogin: new Date()
        });

        // Hide modals
        hideUserTypeModal();
        
        if (typeof updateLoginState === 'function') {
            updateLoginState(user);
        }

        if (userType === 'artist') {
            alert('Your artist registration is pending approval. We will review your application shortly.');
        }
        
        // Reload page to update UI state
        window.location.reload();
        
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Failed to complete registration. Please try again.');
    }
}

// Make this function globally accessible
window.selectUserType = selectUserType;

// Add cancel button handler
export function cancelUserTypeSelection() {
    hideUserTypeModal();
    toggleLoginFlyout();
}

// Make this function globally accessible
window.cancelUserTypeSelection = cancelUserTypeSelection;

// Registration
export async function handleRegister(event) {
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
        
        // Reload page to update UI state
        window.location.reload();
        
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

// Make this function globally accessible
window.handleRegister = handleRegister;

// Helper functions remain the same but also make them exportable
export function toggleForms() {
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

// Make this function globally accessible
window.toggleForms = toggleForms;

export function toggleLoginFlyout() {
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

// Make this function globally accessible
window.toggleLoginFlyout = toggleLoginFlyout;