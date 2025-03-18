import { db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const baseUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
    ? '' 
    : '/ArtistHub-BaguioCity';

let allArtists = [];

export async function loadArtists() {
    const artistsGrid = document.getElementById('featuredArtistsGrid');
    if (!artistsGrid) {
        console.error('featuredArtistsGrid is null');
        return;
    }
    
    try {
        artistsGrid.innerHTML = '';
        
        // Get featured artists list from the featured collection
        const featuredArtistsRef = doc(db, "featured", "artists");
        const featuredSnap = await getDoc(featuredArtistsRef);
        
        if (!featuredSnap.exists()) {
            console.log('No featured artists document found');
            artistsGrid.innerHTML = '<p class="text-center text-gray-600">No featured artists selected by admin yet</p>';
            return;
        }

        const featuredArtists = featuredSnap.data().artists || [];

        if (featuredArtists.length === 0) {
            artistsGrid.innerHTML = '<p class="text-center text-gray-600">No featured artists selected by admin yet</p>';
            return;
        }

        // Load all artists
        const querySnapshot = await getDocs(collection(db, "artists"));
        allArtists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Display each featured artist
        for (const artist of featuredArtists) {
            const artistDoc = await getDoc(doc(db, "users", artist.id));
            if (!artistDoc.exists()) continue;

            const artistData = artistDoc.data();
            const card = document.createElement('div');
            card.className = `
                 rounded-lg p-6 flex flex-col items-center border-4 border-black
                min-w-[200px] transform transition-transform duration-200 hover:-translate-y-1
            `;
            
            const specialization = artistData.artistDetails?.specialization ?? 'artist';
            
            card.innerHTML = `
                <img src="${artistData.photoURL}" alt="${artistData.displayName}" 
                    class="w-32 h-32 rounded-full object-cover mb-4 border-4 border-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <h3 class="text-3xl font-bold mb-2 text-black">${artistData.displayName}</h3>
                <p class="text-center mb-4 text-black text-lg">${specialization}</p>
                <button class="bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2 border-black">
                    View Profile
                </button>
                
            `;

            card.querySelector('button').onclick = () => {
                window.location.href = `${baseUrl}/profile/profile.html?id=${artist.id}`;
            };

            artistsGrid.appendChild(card);
        }

    } catch (error) {
        console.error("Error loading featured artists:", error);
        artistsGrid.innerHTML = '<div class="text-center text-gray-600">Error loading featured artists</div>';
    }
}

function displayArtists(artists) {
    const grid = document.querySelector('#featuredArtistsGrid');
    grid.innerHTML = artists.map(artist => `
        <div class="artist-card border-2 border-black rounded-lg p-4 mb-4">
            <h3 class="text-2xl font-bold mb-2">${artist.name}</h3>
            <p class="text-sm">Specialization: ${artist.specialization}</p>
            <p class="text-sm">Location: ${artist.location}</p>
            <p class="text-sm">Genre: ${artist.genre}</p>
            <p class="text-sm">${artist.bio.substring(0, 100)}...</p>
        </div>
    `).join('');
}

// Debounced search function
let debounceTimeout;
function debouncedSearch() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(applyFilters, 300);
}

// Apply search and filters
function applyFilters() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const locationFilter = document.getElementById('locationFilter').value;
    const genreFilter = document.getElementById('genreFilter').value;
    const specializationFilter = document.getElementById('specializationFilter').value;

    const filteredArtists = allArtists.filter(artist => {
        const matchesSearch = artist.name.toLowerCase().includes(searchInput) ||
                              artist.specialization.toLowerCase().includes(searchInput) ||
                              artist.genre.toLowerCase().includes(searchInput) ||
                              artist.bio.toLowerCase().includes(searchInput);
        const matchesLocation = locationFilter === 'All' || artist.location === locationFilter;
        const matchesGenre = genreFilter === 'All' || artist.genre === genreFilter;
        const matchesSpecialization = specializationFilter === 'All' || artist.specialization === specializationFilter;

        return matchesSearch && matchesLocation && matchesGenre && matchesSpecialization;
    });

    displayArtists(filteredArtists);
}

// Add event listeners for search and filter inputs
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').addEventListener('input', debouncedSearch);
    document.getElementById('locationFilter').addEventListener('change', applyFilters);
    document.getElementById('genreFilter').addEventListener('change', applyFilters);
    document.getElementById('specializationFilter').addEventListener('change', applyFilters);
    loadArtists();
});