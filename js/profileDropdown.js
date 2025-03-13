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
        event.preventDefault();
        const dropdown = document.getElementById('profileDropdown');
        const overlay = document.getElementById('profileDropdownOverlay');
        const isHidden = dropdown.classList.toggle('hidden');
        
        if (window.innerWidth <= 768) {
            overlay.classList.toggle('visible');
            document.body.style.overflow = isHidden ? '' : 'hidden';
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
        let isDropdownVisible = false;
        mobileProfileLink.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            const mobileDropdown = document.getElementById('mobileProfileDropdown');
            if (mobileDropdown) {
                if (!isDropdownVisible) {
                    // Show dropdown
                    mobileDropdown.style.display = 'block';
                    mobileDropdown.classList.remove('hidden');
                } else {
                    // Hide dropdown
                    mobileDropdown.classList.add('hidden');
                    setTimeout(() => {
                        if (mobileDropdown.classList.contains('hidden')) {
                            mobileDropdown.style.display = 'none';
                        }
                    }, 150); // Match transition duration
                }
                isDropdownVisible = !isDropdownVisible;
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const mobileDropdown = document.getElementById('mobileProfileDropdown');
            if (mobileDropdown && !mobileProfileLink.contains(event.target) && !mobileDropdown.contains(event.target)) {
                mobileDropdown.classList.add('hidden');
                isDropdownVisible = false;
                setTimeout(() => {
                    if (mobileDropdown.classList.contains('hidden')) {
                        mobileDropdown.style.display = 'none';
                    }
                }, 150);
            }
        });

        // Update mobile dropdown info when user data changes
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    document.getElementById('mobileProfileName').textContent = userData.displayName || 'User';
                    document.getElementById('mobileProfileEmail').textContent = user.email;
                }
            }
        });
    }

    // Remove the setupSettingsMenu function call since we're using a modal now
    // setupSettingsMenu(); - removing this line

    // Update mobile flyout menu profile
    const updateFlyoutProfile = (userData) => {
        const flyoutProfileLink = document.getElementById('profileLinkMobile');
        if (!flyoutProfileLink) return;

        // Create the profile image button
        if (!flyoutProfileLink.querySelector('img')) {
            const imgElement = document.createElement('img');
            imgElement.src = userData.photoURL || 'https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/defaultProfile.png';
            imgElement.alt = "Profile";
            imgElement.classList.add('w-10', 'h-10', 'rounded-full', 'object-cover', 'border-2', 'border-green-500');
            flyoutProfileLink.innerHTML = ''; // Clear existing content
            flyoutProfileLink.appendChild(imgElement);
        }

        // Add click event to profile link to toggle regular profile dropdown
        flyoutProfileLink.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const profileDropdown = document.getElementById('profileDropdown');
            const overlay = document.getElementById('profileDropdownOverlay');
            
            profileDropdown.classList.toggle('hidden');
            if (overlay) {
                overlay.classList.toggle('visible');
            }
        };
    };

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
                    
                    // Update admin button visibility based on isAdmin property
                    const adminButtons = document.querySelectorAll('.admin-button');
                    adminButtons.forEach(button => {
                        button.style.display = userData.isAdmin === true ? 'block' : 'none';
                    });

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

                    // Update both desktop and mobile dropdowns
                    updateFlyoutProfile({ ...userData, email: user.email });
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
            
            // Hide admin button when logged out
            const adminButtons = document.querySelectorAll('.admin-button');
            adminButtons.forEach(button => {
                button.style.display = 'none';
            });
            
            // Reset mobile profile link if needed
            if (mobileProfileLink) {
                const mobileProfileImg = mobileProfileLink.querySelector('img');
                if (mobileProfileImg) {
                    mobileProfileImg.remove();
                }
            }

            // Remove flyout dropdown when logged out
            const flyoutDropdown = document.getElementById('flyoutProfileDropdown');
            if (flyoutDropdown) {
                flyoutDropdown.remove();
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

// Set up settings menu hover and click behavior
function setupSettingsMenu() {
    document.addEventListener('DOMContentLoaded', () => {
        const settingsMenu = document.querySelector('.settings-menu');
        const settingsTrigger = document.querySelector('.settings-trigger');
        const settingsSubmenu = document.querySelector('.settings-submenu');
        
        if (settingsMenu && settingsSubmenu) {
            // For touch devices
            settingsTrigger.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                settingsSubmenu.classList.toggle('hidden');
            });
            
            // Close submenu when clicking outside
            document.addEventListener('click', function(event) {
                if (!settingsMenu.contains(event.target)) {
                    settingsSubmenu.classList.add('hidden');
                }
            });
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
    // Navigate to profile page
    window.location.href = `${baseUrl}/profile/profile.html?id=${auth.currentUser.uid}`;
}

// Make these functions available globally
window.toggleProfileDropdown = function(event) {
    event.preventDefault();
    const dropdown = document.getElementById('profileDropdown');
    const overlay = document.getElementById('profileDropdownOverlay');
    const isHidden = dropdown.classList.toggle('hidden');
    
    if (window.innerWidth <= 768) {
        overlay.classList.toggle('visible');
        document.body.style.overflow = isHidden ? '' : 'hidden';
    }
};

window.navigateToUserProfile = navigateToUserProfile;

// Export the initialization function
export { initProfileDropdown, navigateToUserProfile };
