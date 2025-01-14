import { 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.signInWithGoogle = async function() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create new user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                name: user.displayName,
                userType: 'user', // default to regular user
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
        toggleLoginFlyout();
        
        // Update UI to show user is logged in
        updateLoginState(user);
        
        console.log('Successfully signed in with Google');
    } catch (error) {
        console.error('Error signing in with Google:', error);
        alert('Failed to sign in with Google. Please try again.');
    }
}