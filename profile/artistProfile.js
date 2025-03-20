import { db, auth } from '../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getBasePath } from '../js/utils.js';

// Debugging: Verify the script is loaded
console.log('artistProfile.js loaded');

// Extract profile ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id');

// Function to check if a user is an admin
async function isUserAdmin(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            return userDoc.data().isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// Dynamic gallery link update
document.addEventListener('DOMContentLoaded', () => {
    const artistId = getArtistIdFromProfile(); // Replace this with actual logic to fetch artist ID

    if (artistId) {
        const galleryButton = document.getElementById('dynamicGalleryButton');
        galleryButton.setAttribute('onclick', `navToEvent('Gallery/gallery.html?artistId=${artistId}')`);
    } else {
        console.error("Artist ID not found.");
    }
});

// Placeholder for getting artist ID
function getArtistIdFromProfile() {
    return profileId;
}

// Navigate to Edit Profile page
function goToEditProfile() {
    const basePath = getBasePath();
    window.location.href = `${basePath}/profile/edit-profile.html?id=${profileId}`;
}

// Make edit profile navigation globally accessible
window.goToEditProfile = goToEditProfile;

// Load artist profile data
async function loadProfile() {
    console.log('loadProfile called');
    try {
        if (!profileId) {
            console.log('No profile ID found');
            window.location.href = '../index.html';
            return;
        }

        const userDoc = await getDoc(doc(db, "users", profileId));
        if (userDoc.exists()) {
            const userData = userDoc.data();

            // Capitalize first letter of each word function
            const capitalizeWords = (str) => {
                if (!str) return ''; // Return empty string if input is null/undefined
                return String(str) // Convert to string in case of numbers
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            };

            // Update profile image with error handling and visibility forcing
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                const defaultImage = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
                
                // Force visibility
                profileImage.style.visibility = 'visible';
                profileImage.style.display = 'block';
                profileImage.style.opacity = '1';
                
                // Set image source with fallback
                if (userData.photoURL) {
                    profileImage.src = userData.photoURL;
                    profileImage.onerror = () => {
                        profileImage.src = defaultImage;
                    };
                } else {
                    profileImage.src = defaultImage;
                }
                
                // Force layout recalculation
                profileImage.offsetHeight;
            }

            // Update display name with enhanced visibility
            const displayName = document.getElementById('displayName');
            if (displayName) {
                displayName.textContent = capitalizeWords(userData.displayName) || 'Unnamed Artist';
                displayName.classList.add('text-shadow');
            }

            // Update artist bio with enhanced visibility
            const artistBio = document.getElementById('artistBio');
            if (artistBio) {
                const bio = userData.artistDetails?.bio || 'No bio available';
                artistBio.textContent = bio.charAt(0).toUpperCase() + bio.slice(1);
                artistBio.classList.add('enhanced-text');
            }

            // Update specialization with enhanced visibility
            const specialization = document.getElementById('specialization');
            if (specialization) {
                const spec = userData.artistDetails?.specialization || 'Artist';
                specialization.textContent = capitalizeWords(spec);
                specialization.classList.add('highlight-text');
            }

            // Update genre with enhanced visibility
            const genre = document.getElementById('genre');
            if (genre) {
                const genres = userData.artistDetails?.genre || ['No genre'];
                genre.innerHTML = genres.map(g => 
                    `<span class="px-2 py-1 bg-gray-600 text-white rounded-lg text-sm" style="background: rgba(75, 85, 99, 0.8); backdrop-filter: blur(4px);">
                        #${g.toLowerCase().replace(/\s+/g, '')}
                    </span>`
                ).join('');
            }

            // Update location with enhanced visibility
            const location = document.querySelector('.fa-map-marker + span');
            if (location) {
                location.textContent = capitalizeWords('Baguio City');
                location.classList.add('highlight-text');
            }

            // Update social links
            const socialLinks = {
                facebook: document.getElementById('facebookLink'),
                instagram: document.getElementById('instagramLink'),
                youtube: document.getElementById('youtubeLink'),
                google: document.getElementById('googleLink')
            };

            Object.entries(socialLinks).forEach(([platform, element]) => {
                if (element) {
                    if (userData.socialLinks?.[platform]) {
                        element.href = userData.socialLinks[platform];
                        element.classList.remove('hidden');
                    } else {
                        element.classList.add('hidden');
                    }
                }
            });

            // Handle edit button visibility
            const buttonContainer = document.querySelector('.fixed.bottom-8.right-8');
            if (buttonContainer) {
                buttonContainer.style.display = 'none';
            }

            // Check user permissions and handle button visibility
            onAuthStateChanged(auth, async (user) => {
                const editButton = document.getElementById('editProfileButton');
                const buttonContainer = document.querySelector('.fixed.bottom-8.right-8'); // Make sure this matches your HTML
            
                // Hide edit button by default
                if (editButton) editButton.style.display = 'none';
                if (buttonContainer) buttonContainer.style.display = 'none';
            
                // If no user is logged in, keep button hidden
                if (!user || !profileId) return;
            
                try {
                    // Show edit button only if user is viewing their own profile
                    if (user.uid === profileId) {
                        if (buttonContainer) buttonContainer.style.display = 'block';
                        if (editButton) {
                            editButton.style.display = 'block';
                            editButton.innerHTML = '<span>Edit Profile</span>';
                            editButton.onclick = goToEditProfile;
                        }
                    } else {
                        // Check if user is admin viewing someone else's profile
                        const currentUserDoc = await getDoc(doc(db, "users", user.uid));
                        const isAdmin = currentUserDoc.exists() && currentUserDoc.data().isAdmin === true;
            
                        if (isAdmin) {
                            if (buttonContainer) buttonContainer.style.display = 'block';
                            if (editButton) {
                                editButton.style.display = 'block';
                                editButton.innerHTML = '<span>Admin Controls</span>';
                                editButton.onclick = () => handleAdminAction(profileId);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error checking user status:", error);
                    if (editButton) editButton.style.display = 'none';
                    if (buttonContainer) buttonContainer.style.display = 'none';
                }
            });
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

// Update social links dynamically
function updateSocialLink(platform, url) {
    const link = document.getElementById(`${platform}Link`);
    if (link) {
        if (url && url.trim() !== '') {
            link.href = url;
            link.classList.remove('hidden');
        } else {
            link.classList.add('hidden');
        }
    }
}

// Handle admin actions
window.handleAdminAction = async function(profileId) {
    const user = auth.currentUser;
    if (!user) return;

    const isAdmin = await isUserAdmin(user.uid);
    if (!isAdmin) {
        alert('You do not have admin privileges');
        return;
    }

    const action = prompt('Admin controls: \n1. Manage User Profile\n2. Manage Content\n3. View Reports');
    switch (action) {
        case '1':
            navToEvent('admin/manage-users.html');
            break;
        case '2':
            navToEvent('admin/manage-content.html');
            break;
        case '3':
            navToEvent('admin/view-reports.html');
            break;
        default:
            if (action !== null) {
                alert('Invalid option');
            }
    }
};

// Ensure profile loads on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, calling loadProfile');
    loadProfile();
});

// Add image load event listener
document.addEventListener('DOMContentLoaded', () => {
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        profileImage.addEventListener('load', () => {
            console.log('Profile image loaded');
            profileImage.style.visibility = 'visible';
        });
        profileImage.addEventListener('error', () => {
            console.log('Profile image failed to load');
            profileImage.src = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
        });
    }
});

// Add click event listener for edit profile button
document.addEventListener('DOMContentLoaded', () => {
    const editProfileButton = document.getElementById('editProfileButton');
    if (editProfileButton) {
        editProfileButton.addEventListener('click', () => {
            window.location.href = `edit-profile.html?id=${profileId}`;
        });
    }
});

// Override any existing gallery navigation
window.navigateToGallery = function() {
    const userId = new URLSearchParams(window.location.search).get('id') || 
                  new URLSearchParams(window.location.search).get('artistId');
    
    if (userId) {
        // Force direct navigation to gallery
        document.location.href = `/gallery/gallery.html?artistId=${userId}`;
    }
};

// Remove the existing gallery navigation code
document.addEventListener('DOMContentLoaded', () => {
    const artistId = getArtistIdFromProfile();
    if (artistId) {
        const galleryButton = document.getElementById('dynamicGalleryButton');
        if (galleryButton) {
            galleryButton.setAttribute('onclick', `navToEvent('gallery/gallery.html')`);
        }
    }
});
