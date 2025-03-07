import { auth } from './firebase-config.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { handleEditProfile } from './profile-navigation.js';

function initProfileDropdown() {
    const db = getFirestore();
    const profileDropdown = document.querySelector('.profile-dropdown-container');
    const userProfilePic = document.getElementById('userProfilePic');
    const overlay = document.getElementById('profileDropdownOverlay');
    const loginButton = document.querySelector('.login-button');
    const logoutButton = document.querySelector('.logout-button');
    const mobileLoginButton = document.querySelector('#flyout-menu .login-button');
    const mobileLogoutButton = document.querySelector('#flyout-menu .logout-button');
    
    function toggleProfileDropdown(event) {
        if (event) event.preventDefault();
        const dropdown = document.getElementById('profileDropdown');
        const isHidden = dropdown.classList.toggle('hidden');
        
        // Handle overlay for mobile
        if (window.innerWidth <= 768) {
            if (isHidden) {
                overlay.classList.remove('visible');
                document.body.style.overflow = '';
            } else {
                overlay.classList.add('visible');
                document.body.style.overflow = 'hidden';
            }
        }
    }

    // Close dropdown when clicking overlay
    if (overlay) {
        overlay.addEventListener('click', function() {
            document.getElementById('profileDropdown').classList.add('hidden');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('profileDropdown');
        const profileButton = document.querySelector('.profile-button');
        
        if (profileButton && !profileButton.contains(event.target) && 
            !dropdown.contains(event.target) && 
            !event.target.closest('.profile-dropdown-overlay')) {
            dropdown.classList.add('hidden');
            if (overlay) overlay.classList.remove('visible');
            document.body.style.overflow = '';
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

    // Handle mobile profile navigation in the flyout menu
    const mobileProfileLink = document.getElementById('profileLinkMobile');
    if (mobileProfileLink) {
        mobileProfileLink.addEventListener('click', function(event) {
            event.preventDefault();
            navigateToUserProfile();
        });
    }

    // Update profile UI based on auth state
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            // User is logged in
            profileDropdown.style.display = 'block';
            if (loginButton) loginButton.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'block';
            if (mobileLoginButton) mobileLoginButton.style.display = 'none';
            if (mobileLogoutButton) mobileLogoutButton.style.display = 'block';
            
            try {
                // Fetch user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Update profile picture
                    if (userData.photoURL) {
                        userProfilePic.src = userData.photoURL;
                        
                        // Update mobile flyout menu profile image if it exists
                        const mobileProfileImg = document.querySelector('#profileLinkMobile img');
                        if (mobileProfileImg) {
                            mobileProfileImg.src = userData.photoURL;
                        }
                        
                        // Create mobile profile image if it doesn't exist
                        if (!mobileProfileImg && mobileProfileLink) {
                            const imgElement = document.createElement('img');
                            imgElement.src = userData.photoURL;
                            imgElement.alt = "Profile";
                            imgElement.classList.add('w-6', 'h-6', 'rounded-full', 'mr-2');
                            mobileProfileLink.prepend(imgElement);
                            mobileProfileLink.classList.add('flex', 'items-center');
                        }
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
            // User is logged out
            profileDropdown.style.display = 'none';
            if (loginButton) loginButton.style.display = 'block';
            if (logoutButton) logoutButton.style.display = 'none';
            if (mobileLoginButton) mobileLoginButton.style.display = 'block';
            if (mobileLogoutButton) mobileLogoutButton.style.display = 'none';
            
            // Reset mobile profile link if needed
            if (mobileProfileLink) {
                const mobileProfileImg = mobileProfileLink.querySelector('img');
                if (mobileProfileImg) {
                    mobileProfileImg.remove();
                }
            }
        }
    });
    
    // Handle window resize to ensure proper display
    window.addEventListener('resize', function() {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown && !dropdown.classList.contains('hidden') && window.innerWidth > 768) {
            if (overlay) overlay.classList.remove('visible');
            document.body.style.overflow = '';
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
    const overlay = document.getElementById('profileDropdownOverlay');
    const isHidden = dropdown.classList.toggle('hidden');
    
    // Handle overlay for mobile
    if (window.innerWidth <= 768) {
        if (isHidden) {
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        } else {
            overlay.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }
    }
};

window.navigateToUserProfile = navigateToUserProfile;

// Export the initialization function
export { initProfileDropdown, navigateToUserProfile };
