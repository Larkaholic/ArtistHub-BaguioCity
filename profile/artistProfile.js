import { db, auth } from '../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// get profile id from url
const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id');

// load profile data immediately without auth check
async function loadProfile() {
    try {
        if (!profileId) {
            window.location.href = '../index.html';
            return;
        }

        const userDoc = await getDoc(doc(db, "users", profileId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            loadArtistData(userData);

            // check if current user is the profile owner
            onAuthStateChanged(auth, (user) => {
                const editButton = document.getElementById('editProfileButton');
                if (editButton) {
                    // completely remove the button if not the profile owner
                    if (user && user.email === userData.email) {
                        editButton.style.display = 'block';
                    } else {
                        editButton.remove(); // removes the button from DOM
                    }
                }
            });
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

function loadArtistData(userData) {
    // update profile image
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        profileImage.src = userData.photoURL || 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
    }

    // update display name
    const displayName = document.getElementById('displayName');
    if (displayName) {
        displayName.textContent = userData.displayName || 'unnamed artist';
    }

    // update bio
    const artistBio = document.getElementById('artistBio');
    if (artistBio) {
        artistBio.textContent = userData.artistDetails?.bio || 'no bio available';
    }

    // update specialization
    const specialization = document.getElementById('specialization');
    if (specialization) {
        specialization.textContent = userData.artistDetails?.specialization || 'artist';
    }

    // update social links
    const socialLinks = userData.socialLinks || {};
    updateSocialLink('facebook', socialLinks.facebook);
    updateSocialLink('instagram', socialLinks.instagram);
    updateSocialLink('youtube', socialLinks.youtube);
    updateSocialLink('google', socialLinks.google);
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

// load profile when page loads
document.addEventListener('DOMContentLoaded', loadProfile);
  