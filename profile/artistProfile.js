import { auth, db } from '../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// At the top of your file
console.log('artistProfile.js loaded');

// Get profile ID from URL or use current user's ID
const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('id') || auth.currentUser?.uid;

// Load profile data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            console.log('Loading profile for ID:', user.uid);
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                loadArtistData(userData);
                
                // Debug edit button
                const editButton = document.getElementById('editProfileButton');
                console.log('Edit button element:', editButton);
                if (editButton) {
                    console.log('Setting edit button display to flex');
                    editButton.style.display = 'flex';
                    editButton.style.visibility = 'visible';
                    editButton.style.opacity = '1';
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    } else {
        console.log('No user logged in');
    }
});

async function loadArtistData(userData) {
    console.log('Loading artist data:', userData); // Debug log

    // Update profile image
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        if (userData.photoURL && userData.photoURL !== '') {
            profileImage.src = userData.photoURL;
            console.log('Setting profile image to:', userData.photoURL);
        } else {
            profileImage.src = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
            console.log('Using default profile image');
        }
    }

    // Update display name
    const displayName = document.getElementById('displayName');
    if (displayName) {
        displayName.textContent = userData.displayName || 'Unnamed Artist';
    }

    // Update bio
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

// Make functions available globally
window.goToEditProfile = function() {
    window.location.href = 'edit-profile.html';
}; 