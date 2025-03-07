import { auth } from './firebase-config.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { handleEditProfile } from './profile-navigation.js';

function initProfileDropdown() {
    const db = getFirestore();
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
    
    // Add click event listener for the main profile nav link
    const profileNavLink = document.querySelector('.nav-item a[onclick*="handleEditProfile"]');
    if (profileNavLink) {
        profileNavLink.addEventListener('click', function(event) {
            event.preventDefault();
            navigateToUserProfile();
        });
        // Override the onclick attribute
        profileNavLink.setAttribute('onclick', 'event.preventDefault(); window.navigateToUserProfile();');
    }

    // Update profile UI based on auth state
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            profileDropdown.style.display = 'block';
            
            try {
                // Fetch user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Update profile picture
                    if (userData.photoURL) {
                        userProfilePic.src = userData.photoURL;
                    } else {
                        userProfilePic.src = "https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/defaultProfile.png";
                    }
                    
                    // Update dropdown user info
                    const nameElement = document.getElementById('profileDropdownName');
                    const emailElement = document.getElementById('profileDropdownEmail');
                    if (nameElement) nameElement.textContent = userData.displayName || 'User';
                    if (emailElement) emailElement.textContent = user.email;
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                userProfilePic.src = "https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/defaultProfile.png";
            }
        } else {
            profileDropdown.style.display = 'none';
        }
    });
}

// Navigate to user's profile
function navigateToUserProfile() {
    if (!auth.currentUser) {
        alert('Please login to view your profile');
        if (window.toggleLoginFlyout) {
            window.toggleLoginFlyout();
        }
        return;
    }
    
    // Get the base URL for GitHub Pages
    const baseUrl = window.location.hostname === 'larkaholic.github.io' 
        ? '/ArtistHub-BaguioCity'
        : '';
        
    // Construct the profile URL
    const profileUrl = `${baseUrl}/profile/profile.html?id=${auth.currentUser.uid}`;
    window.location.href = profileUrl;
}

// Make these functions available globally
window.toggleProfileDropdown = function(event) {
    if (event) event.preventDefault();
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('hidden');
};

window.navigateToUserProfile = navigateToUserProfile;

// Export the initialization function
export { initProfileDropdown, navigateToUserProfile };
