import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-config.js";
import { loadArtists } from './loadArtists.js';

const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('featuredArtistsGrid');
const db = getFirestore(app);
let searchTimeout = null;
let cachedArtists = [];
let featuredArtists = [];

// Updated fetch function to match loadArtists.js query
async function fetchArtistsFromDatabase() {
    try {
        // Get all artists for search
        const allArtistsSnapshot = await getDocs(collection(db, "users"));
        cachedArtists = [];
        allArtistsSnapshot.forEach((doc) => {
            const artist = { id: doc.id, ...doc.data() };
            if (artist.displayName && artist.photoURL) {
                cachedArtists.push(artist);
            }
        });

        // Get featured artists specifically
        const featuredQuery = query(
            collection(db, "users"),
            where("userType", "==", "artist"),
            where("isFeatured", "==", true)
        );
        const featuredSnapshot = await getDocs(featuredQuery);
        featuredArtists = [];
        featuredSnapshot.forEach((doc) => {
            const artist = { id: doc.id, ...doc.data() };
            if (artist.displayName && artist.photoURL) {
                featuredArtists.push(artist);
            }
        });

        return { cachedArtists, featuredArtists };
    } catch (error) {
        console.error('Error fetching artists:', error);
        return { cachedArtists: [], featuredArtists: [] };
    }
}

// Real-time search function
function performSearch(searchTerm) {
    if (!resultsContainer) {
        console.error('resultsContainer is null');
        return;
    }

    // Reset to featured artists when empty
    if (!searchTerm || !searchTerm.trim()) {
        console.log('Search term is empty, resetting to featured artists');
        resetSearch();
        return;
    }

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Filter artists based on search term
    const filteredArtists = cachedArtists.filter(artist => 
        artist.displayName && 
        artist.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredArtists.length > 0) {
        displayArtists(filteredArtists);
    } else {
        resultsContainer.innerHTML = '<p class="text-center text-gray-600">No artists found</p>';
    }
}

function displayArtists(artists) {
    resultsContainer.innerHTML = ''; // Clear existing content
    artists.forEach(artist => {
        const card = document.createElement('div');
        card.className = `
            rounded-lg p-6 flex flex-col items-center border-2 border-gray-700
            min-w-[200px] transform transition-transform duration-200 hover:-translate-y-1
        `;
        
        const specialization = artist.artistDetails?.specialization ?? 'artist';
        
        // Create a default avatar if image is missing
        const defaultAvatar = 'https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/default-profile.png';
        const initial = artist.displayName ? artist.displayName.charAt(0).toUpperCase() : 'A';
        
        card.innerHTML = `
            <img src="${artist.photoURL || defaultAvatar}" 
                alt="${artist.displayName}" 
                class="w-32 h-32 rounded-full object-cover mb-4 border-4 border-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                onerror="this.src='${defaultAvatar}';">
            <h3 class="text-3xl font-bold mb-2 text-black">${artist.displayName}</h3>
            <p class="text-center mb-4 text-black text-lg">${specialization}</p>
            <button class="bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2 border-black">
                View Profile
            </button>
        `;

        card.querySelector('button').onclick = () => {
            window.location.href = `./profile/profile.html?id=${artist.id}`;
        };

        resultsContainer.appendChild(card);
    });
}

function resetSearch() {
    const searchBtn = document.querySelector('.artist-search-btn');
    const searchContainer = document.querySelector('.artist-search-container');
    
    // Reset UI elements
    if (searchContainer && searchBtn) {
        searchContainer.classList.remove('expanded');
        searchBtn.style.opacity = '1';
    }
    
    // Clear search input
    if (searchInput) {
        searchInput.value = '';
    }

    console.log('Resetting search to load featured artists');
    loadArtists();
}

window.filterArtistSearch = (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
        resetSearch();
        return;
    }
    performSearch(searchTerm);
};

async function initializeSearch() {
    await fetchArtistsFromDatabase();
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            searchTimeout = setTimeout(() => {
                const searchTerm = e.target.value;
                performSearch(searchTerm);
            }, 300);
        });
    }

    const closeBtn = document.querySelector('.artist-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            resetSearch();
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeSearch);