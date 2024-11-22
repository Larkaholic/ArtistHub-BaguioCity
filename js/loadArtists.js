import { db } from '../firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function createArtistCard(userData, userId) {
    const defaultImage = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
    
    const card = document.createElement('div');
    card.className = 'glass-header rounded-lg p-6 text-center transform transition duration-300 hover:scale-105 h-full flex flex-col justify-between';
    
    const displayName = userData?.displayName ?? 'Unnamed Artist';
    const specialization = userData?.artistDetails?.specialization ?? 'Artist';
    const bio = userData?.artistDetails?.bio ?? 'No bio available';
    const photoURL = userData?.photoURL ?? defaultImage;
    
    card.innerHTML = `
        <div class="flex flex-col items-center">
            <div class="relative mb-4">
                <img src="${photoURL}" 
                     alt="${displayName}"
                     class="w-32 h-32 rounded-full object-cover"
                     onerror="this.src='${defaultImage}'">
            </div>
            <h3 class="text-xl font-semibold mb-2">${displayName}</h3>
            <p class="text-gray-600 mb-3">${specialization}</p>
            <p class="text-sm mb-4 line-clamp-3">${bio}</p>
        </div>
        <div class="mt-auto">
            <div class="flex justify-center space-x-4 mb-4">
                ${createSocialLinks(userData?.socialLinks)}
            </div>
            <button onclick="viewArtistProfile('${userId}')" 
                    class="glass-header text-white py-2 px-4 rounded-md hover:bg-gray-300 hover:text-black">
                View Profile
            </button>
        </div>
    `;

    return card;
}

function createSocialLinks(socialLinks = {}) {
    const links = [];
    
    if (socialLinks?.facebook) {
        links.push(`<a href="${socialLinks.facebook}" target="_blank" class="text-blue-600 hover:text-blue-800">
            <i class="fa fa-facebook"></i>
        </a>`);
    }
    
    if (socialLinks?.instagram) {
        links.push(`<a href="${socialLinks.instagram}" target="_blank" class="text-pink-600 hover:text-pink-800">
            <i class="fa fa-instagram"></i>
        </a>`);
    }
    
    if (socialLinks?.youtube) {
        links.push(`<a href="${socialLinks.youtube}" target="_blank" class="text-red-600 hover:text-red-800">
            <i class="fa fa-youtube"></i>
        </a>`);
    }
    
    if (socialLinks?.google) {
        links.push(`<a href="${socialLinks.google}" target="_blank" class="text-yellow-600 hover:text-yellow-800">
            <i class="fa fa-google"></i>
        </a>`);
    }
    
    return links.join('');
}

// Update the viewArtistProfile function
window.viewArtistProfile = function(userId) {
    // Use the correct relative path from index.html to profile.html
    window.location.href = `profile/profile.html?id=${userId}`;
};

// Load artists immediately when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const artistsGrid = document.getElementById('artistsGrid');
    
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        artistsGrid.innerHTML = ''; // Clear any loading state
        
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.userType === 'artist') {
                const artistCard = createArtistCard(userData, doc.id);
                artistsGrid.appendChild(artistCard);
            }
        });
    } catch (error) {
        console.error("Error loading artists:", error);
    }
}); 