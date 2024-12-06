import { db, auth } from '../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getBasePath } from '../js/utils.js';

// at the start of the file
console.log('artistProfile.js loaded');

// get profile id from url
const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id');

async function isUserAdmin(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            return userDoc.data().isAdmin === true;
        }
        return false;
    } catch (error) {
        console.error("error checking admin status:", error);
        return false;
    }
}

// Add the navigation function
function goToEditProfile() {
    const basePath = getBasePath();
    window.location.href = `${basePath}/profile/edit-profile.html?id=${profileId}`;
}

// Make it available globally
window.goToEditProfile = goToEditProfile;

// load profile data immediately without auth check
async function loadProfile() {
    console.log('loadProfile called');
    try {
        if (!profileId) {
            console.log('no profileId found');
            window.location.href = '../index.html';
            return;
        }

        const userDoc = await getDoc(doc(db, "users", profileId));
        console.log('userDoc:', userDoc.exists(), userDoc.data());
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('userData:', userData);

            // Update profile image
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                profileImage.src = userData.photoURL || 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
                profileImage.onerror = () => {
                    profileImage.src = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
                };
            }

            // Update display name
            const displayName = document.getElementById('displayName');
            if (displayName) {
                displayName.textContent = userData.displayName || 'Unnamed Artist';
            }

            // Update artist bio
            const artistBio = document.getElementById('artistBio');
            if (artistBio) {
                artistBio.textContent = userData.artistDetails?.bio || 'No bio available';
            }

            // Update specialization
            const specialization = document.getElementById('specialization');
            if (specialization) {
                specialization.textContent = userData.artistDetails?.specialization || 'Artist';
            }

            // Update social links
            const socialLinks = {
                facebook: document.getElementById('facebookLink'),
                instagram: document.getElementById('instagramLink'),
                youtube: document.getElementById('youtubeLink'),
                google: document.getElementById('googleLink')
            };

            // Show/hide social links based on availability
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

            // Check if current user is admin or profile owner
            onAuthStateChanged(auth, async (user) => {
                const editButton = document.getElementById('editProfileButton');
                const buttonContainer = document.querySelector('.fixed.bottom-8.right-8');
                
                if (!editButton || !buttonContainer) return;
                
                if (!user) {
                    buttonContainer.style.display = 'none';
                    return;
                }

                try {
                    const currentUserDoc = await getDoc(doc(db, "users", user.uid));
                    const isAdmin = currentUserDoc.exists() && currentUserDoc.data().isAdmin === true;

                    if (isAdmin) {
                        // Show admin controls
                        buttonContainer.style.display = 'block';
                        editButton.innerHTML = `
                            <div class="flex items-center space-x-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                <span>Admin Controls</span>
                            </div>
                        `;
                        editButton.onclick = () => handleAdminAction(profileId);
                        editButton.style.display = 'flex';
                    } else if (user.uid === profileId) {
                        // Show edit profile for profile owner
                        buttonContainer.style.display = 'block';
                        editButton.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Edit Profile</span>
                        `;
                        editButton.onclick = goToEditProfile;
                        editButton.style.display = 'flex';
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

// make sure the script is loaded and running
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, calling loadProfile');
    loadProfile();
});
  
window.handleAdminAction = async function() {
    const user = auth.currentUser;
    if (!user) return;

    const isAdmin = await isUserAdmin(user.uid);
    if (!isAdmin) {
        alert('you do not have admin privileges');
        return;
    }

    const action = prompt('admin controls: \n1. manage user profile\n2. manage content\n3. view reports');
    
    switch(action) {
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
                alert('invalid option');
            }
    }
}
  