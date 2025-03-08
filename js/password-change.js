import { auth } from './firebase-config.js';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

export async function handlePasswordChange(currentPassword, newPassword) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is currently logged in');
        }

        // First, re-authenticate the user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Then update the password
        await updatePassword(user, newPassword);
        
        alert('Password updated successfully!');
        window.closeSettingsModal();
    } catch (error) {
        console.error('Password change error:', error);
        if (error.code === 'auth/wrong-password') {
            alert('Current password is incorrect. Please try again.');
        } else {
            alert('Error changing password. Please try again.');
        }
        throw error;
    }
}

// Make function globally available
window.handlePasswordChange = handlePasswordChange;
