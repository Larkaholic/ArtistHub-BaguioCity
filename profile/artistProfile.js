import { db, auth } from '../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getBasePath } from '../js/utils.js';

// Extract profile ID from the URL or use current user's ID if not specified
const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id');

// Load artist profile data
async function loadProfile() {
    try {
        let userIdToLoad = profileId;
        
        // If no profile ID is specified, use the current logged-in user's ID
        if (!userIdToLoad) {
            const currentUser = auth.currentUser;
            if (currentUser) {
                userIdToLoad = currentUser.uid;
            } else {
                return;
            }
        }

        const userDoc = await getDoc(doc(db, "users", userIdToLoad));
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

            // Email
            const emailText = document.getElementById('emailText');
            if (emailText) {
                // Prefer userData.email, fallback to userData.artistDetails?.email
                const email = userData.email || userData.artistDetails?.email || '';
                emailText.textContent = email ? email : 'No email provided';
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

            // Fix social media icons
            ensureSocialIcons();
        } else {
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

// Ensure social media icons have the correct classes
function ensureSocialIcons() {
    const socialIcons = {
        'facebook': 'fa fa-facebook',
        'instagram': 'fa fa-instagram',
        'twitter': 'fa fa-twitter'
    };
    
    Object.entries(socialIcons).forEach(([platform, iconClass]) => {
        const link = document.getElementById(`${platform}Link`);
        if (link && link.querySelector('i')) {
            link.querySelector('i').className = iconClass;
        }
    });
}

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
    loadProfile();
});

// Add image load event listener
document.addEventListener('DOMContentLoaded', () => {
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        profileImage.addEventListener('load', () => {
            profileImage.style.visibility = 'visible';
        });
        profileImage.addEventListener('error', () => {
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

// Initialize profile when auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        if (!profileId) {
            loadProfile();
        }
    } else {
    }
});
//             break;
//         case '2':
//             navToEvent('admin/manage-content.html');
//             break;
//         case '3':
//             navToEvent('admin/view-reports.html');
//             break;
//         default:
//             if (action !== null) {
//                 alert('Invalid option');
//             }
//     }
// };

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
            profileImage.style.visibility = 'visible';
        });
        profileImage.addEventListener('error', () => {
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
