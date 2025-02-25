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
                return str
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            };

            // Update profile image
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                profileImage.src = userData.photoURL || 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
                profileImage.onerror = () => {
                    profileImage.src = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
                };
            }

            // Update display name with enhanced visibility
            const displayName = document.getElementById('displayName');
            if (displayName) {
                displayName.textContent = capitalizeWords(userData.displayName || 'Unnamed Artist');
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

            // Check user permissions
            onAuthStateChanged(auth, async (user) => {
                const editButton = document.getElementById('editProfileButton');
                if (!editButton || !buttonContainer) return;

                if (!user) {
                    buttonContainer.style.display = 'none';
                    return;
                }

                try {
                    const currentUserDoc = await getDoc(doc(db, "users", user.uid));
                    const isAdmin = currentUserDoc.exists() && currentUserDoc.data().isAdmin === true;

                    if (isAdmin) {
                        buttonContainer.style.display = 'block';
                        editButton.innerHTML = `<span>Admin Controls</span>`;
                        editButton.onclick = () => handleAdminAction(profileId);
                    } else if (user.uid === profileId) {
                        buttonContainer.style.display = 'block';
                        editButton.innerHTML = `<span>Edit Profile</span>`;
                        editButton.onclick = goToEditProfile;
                    }
                } catch (error) {
                    console.error("Error checking user status:", error);
                    buttonContainer.style.display = 'none';
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
