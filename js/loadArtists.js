import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const baseUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? '' 
    : '/ArtistHub-BaguioCity';

async function loadArtists() {
    const artistsGrid = document.getElementById('artistsGrid');
    if (!artistsGrid) return;
    
    try {
        artistsGrid.innerHTML = '';
        const artistsQuery = query(collection(db, "users"), where("userType", "==", "artist"));
        const querySnapshot = await getDocs(artistsQuery);
        const artists = [];

        querySnapshot.forEach((doc) => {
            const artistData = {
                ...doc.data(),
                uid: doc.id
            };
            if (artistData.displayName && artistData.photoURL) {
                artists.push(artistData);
            }
        });

        artists.slice(0, 15).forEach((artist) => {
            const card = document.createElement('div');
            card.className = `
                glass-header rounded-lg p-6 flex flex-col items-center border-2 border-gray-700
                min-w-[200px] transform transition-transform duration-200 hover:-translate-y-1
            `;
            
            const specialization = artist.artistDetails?.specialization ?? 'artist';
            
            card.innerHTML = `
                <img src="${artist.photoURL}" alt="${artist.displayName}" 
                    class="w-32 h-32 rounded-full object-cover mb-4 border-4 border-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <h3 class="text-3xl font-bold mb-2 text-black">${artist.displayName}</h3>
                <p class="text-center mb-4 text-black text-lg">${specialization}</p>
                <button class="bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2 border-black">
                    View Profile
                </button>
            `;

            card.querySelector('button').onclick = () => {
                window.location.href = `${baseUrl}/profile/profile.html?id=${artist.uid}`;
            };

            artistsGrid.appendChild(card);
        });

    } catch (error) {
        artistsGrid.innerHTML = '<div class="text-white text-center">error loading artists</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadArtists); 