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
    const artistId = getArtistIdFromProfile();

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

            // Profile Image
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                const defaultImage = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
                profileImage.src = userData.photoURL || defaultImage;
                profileImage.onerror = () => { profileImage.src = defaultImage; };
            }

            // Display Name
            const displayName = document.getElementById('displayName');
            if (displayName) {
                displayName.textContent = userData.displayName || 'Unnamed Artist';
            }

            // Specialization
            const specialization = document.getElementById('specialization');
            if (specialization) {
                const specs = userData.artistDetails?.specialization || ['Artist'];
                specialization.textContent = Array.isArray(specs) ? specs.join(' | ') : specs;
            }

            // Years (Artisan for X years)
            const yearsText = document.getElementById('yearsText');
            if (yearsText) {
                const years = userData.artistDetails?.years || 0;
                yearsText.textContent = years ? `Artisan for ${years} year${years > 1 ? 's' : ''}` : '';
            }

            // Location
            const locationText = document.getElementById('locationText');
            if (locationText) {
                locationText.textContent = userData.location || 'Baguio City, Philippines';
            }

            // Artist Bio
            const artistBio = document.getElementById('artistBio');
            if (artistBio) {
                const bio = userData.artistDetails?.bio || 'No bio available';
                artistBio.textContent = bio;
            }

            // Social Links
            updateSocialLink('facebook', userData.socialLinks?.facebook);
            updateSocialLink('instagram', userData.socialLinks?.instagram);
            updateSocialLink('twitter', userData.socialLinks?.twitter);

            // Check if user has proper icons
            const instagramLink = document.getElementById('instagramLink');
            const twitterLink = document.getElementById('twitterLink');
            
            if (instagramLink && instagramLink.querySelector('i')) {
                instagramLink.querySelector('i').className = 'fa fa-instagram';
            }
            
            if (twitterLink && twitterLink.querySelector('i')) {
                twitterLink.querySelector('i').className = 'fa fa-twitter';
            }
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
