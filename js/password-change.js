import { auth } from './firebase-config.js';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Password change attempt tracking for rate limiting
const passwordChangeAttempts = {
    count: 0,
    lastAttempt: 0,
    maxAttempts: 3,
    resetTimeInMs: 300000 // 5 minutes?
};

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (password.length < minLength) {
        throw new Error('Password must be at least 8 characters long');
    }
    if (!hasUpperCase) {
        throw new Error('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        throw new Error('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        throw new Error('Password must contain at least one number');
    }
}

function checkRateLimit() {
    const now = Date.now();
    if (now - passwordChangeAttempts.lastAttempt > passwordChangeAttempts.resetTimeInMs) {
        // Reset attempts after timeout period
        passwordChangeAttempts.count = 0;
    }
    
    if (passwordChangeAttempts.count >= passwordChangeAttempts.maxAttempts) {
        const waitTimeInMinutes = Math.ceil((passwordChangeAttempts.resetTimeInMs - (now - passwordChangeAttempts.lastAttempt)) / 60000);
        throw new Error(`Too many attempts. Please try again in ${waitTimeInMinutes} minutes.`);
    }
    
    passwordChangeAttempts.count++;
    passwordChangeAttempts.lastAttempt = now;
}

function sanitizeErrorMessage(message) {
    return message.replace(/[<>&"']/g, '');
}

export async function handlePasswordChange(currentPassword, newPassword) {
    const errorMessageElement = document.getElementById('passwordChangeError');
    const successMessageElement = document.getElementById('passwordChangeSuccess');
    
    try {
        // Check rate limiting
        checkRateLimit();

        // Validate new password
        validatePassword(newPassword);

        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user is currently logged in');
        }

        // Prevent using the same password
        if (currentPassword === newPassword) {
            throw new Error('New password must be different from current password');
        }

        // Re authenticate user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);
        
        // Reset attempt counter on success
        passwordChangeAttempts.count = 0;
        
        // Show success message in modal
        if (successMessageElement) {
            successMessageElement.textContent = 'Password updated successfully!';
            successMessageElement.classList.remove('hidden');
            // Hide success message after 3 seconds
            setTimeout(() => {
                successMessageElement.classList.add('hidden');
                window.closeSettingsModal();
            }, 3000);
        }

    } catch (error) {
        console.error('Password change error:', error);
        const errorMessage = error.code === 'auth/wrong-password' 
            ? 'Current password is incorrect. Please try again.'
            : error.message || 'Error changing password. Please try again.';
            
        // Show error message in modal
        if (errorMessageElement) {
            errorMessageElement.textContent = sanitizeErrorMessage(errorMessage);
            errorMessageElement.classList.remove('hidden');
            // Hide error after 3 seconds
            setTimeout(() => errorMessageElement.classList.add('hidden'), 3000);
        }
        throw error;
    }
}

// with rate limiting protection
window.handlePasswordChange = handlePasswordChange;
