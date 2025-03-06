import { auth } from './firebase-config.js';

function initProfileDropdown() {
    const profileDropdown = document.querySelector('.profile-dropdown-container');
    const userProfilePic = document.getElementById('userProfilePic');

    function toggleProfileDropdown(event) {
        if (event) event.preventDefault();
        const dropdown = document.getElementById('profileDropdown');
        dropdown.classList.toggle('hidden');
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('profileDropdown');
        const profileButton = document.querySelector('.profile-button');
        
        if (profileButton && !profileButton.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Add click event listener to profile button
    const profileButton = document.querySelector('.profile-button');
    if (profileButton) {
        profileButton.addEventListener('click', toggleProfileDropdown);
    }

    // Update profile UI based on auth state
    auth.onAuthStateChanged(function(user) {
        if (user) {
            profileDropdown.style.display = 'block';
            
            // Update profile picture if available
            if (user.photoURL) {
                userProfilePic.src = user.photoURL;
            }
        } else {
            profileDropdown.style.display = 'none';
        }
    });
}

// Export the initialization function
export { initProfileDropdown };
