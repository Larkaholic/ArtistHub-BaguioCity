import { db, auth } from '../firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadArtists() {
    try {
        const artistsGrid = document.getElementById('artistsGrid');
        if (!artistsGrid) {
            console.error('Artists grid element not found');
            return;
        }

        artistsGrid.innerHTML = '<div class="text-center col-span-full">Loading artists...</div>';

        // Query users who are artists
        const q = query(collection(db, "users"), where("userType", "==", "artist"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            artistsGrid.innerHTML = '<div class="text-center col-span-full">No artists found</div>';
            return;
        }

        artistsGrid.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const artistData = doc.data();
            const artistCard = createArtistCard(artistData, doc.id);
            artistsGrid.appendChild(artistCard);
        });

    } catch (error) {
        console.error("Error loading artists:", error);
        const artistsGrid = document.getElementById('artistsGrid');
        if (artistsGrid) {
            artistsGrid.innerHTML = '<div class="text-center col-span-full">Error loading artists</div>';
        }
    }
}

function createArtistCard(artistData, artistId) {
    const defaultImage = 'https://github.com/ALmiiiii/ArtistHub-BaguioCity/blob/master/images/default-profile.png?raw=true';
    
    const card = document.createElement('div');
    card.className = 'glass-header rounded-lg p-6 text-center transform transition duration-300 hover:scale-105 h-full flex flex-col justify-between';
    
    // Use optional chaining and nullish coalescing for safer data access
    const displayName = artistData?.displayName ?? 'Unnamed Artist';
    const specialization = artistData?.artistDetails?.specialization ?? 'Artist';
    const bio = artistData?.artistDetails?.bio ?? 'No bio available';
    const photoURL = artistData?.photoURL ?? defaultImage;
    
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
                ${createSocialLinks(artistData?.socialLinks)}
            </div>
            <button onclick="viewArtistProfile('${artistId}')" 
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

// Make viewArtistProfile function global
window.viewArtistProfile = function(artistId) {
    window.location.href = `/profile/profile.html?id=${artistId}`;
};

// Load artists when the page loads
document.addEventListener('DOMContentLoaded', loadArtists); 