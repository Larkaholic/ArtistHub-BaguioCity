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

    // If search is empty, reset to featured artists
    if (!searchTerm || searchTerm.trim() === '') {
        loadArtists();
        return;
    }

    // Convert search term to lowercase for case-insensitive comparison
    const searchLower = searchTerm.toLowerCase();

    // Filter artists based on search term and filters
    const filteredArtists = cachedArtists.filter(artist => {
        // Basic search criteria
        const matchesSearch = !searchTerm || (
            // Check basic fields
            (artist.displayName && artist.displayName.toLowerCase().includes(searchLower)) ||
            (artist.artistDetails?.specialization && artist.artistDetails.specialization.toLowerCase().includes(searchLower)) ||
            (artist.artistDetails?.bio && artist.artistDetails.bio.toLowerCase().includes(searchLower)) ||
            // Check genres - handle both array and string cases
            (artist.artistDetails?.genre && (
                Array.isArray(artist.artistDetails.genre) 
                    ? artist.artistDetails.genre.some(g => g.toLowerCase().includes(searchLower))
                    : artist.artistDetails.genre.toLowerCase().includes(searchLower)
            ))
        );

        // Get filter values
        const genreFilter = document.getElementById('genreFilter')?.value || 'All';
        const locationFilter = document.getElementById('locationFilter')?.value || 'All';

        // Filter by genre
        const matchesGenre = genreFilter === 'All' || (
            artist.artistDetails?.genre && (
                Array.isArray(artist.artistDetails.genre)
                    ? artist.artistDetails.genre.some(g => g.toLowerCase() === genreFilter.toLowerCase())
                    : artist.artistDetails.genre.toLowerCase() === genreFilter.toLowerCase()
            )
        );

        // Filter by location
        const matchesLocation = locationFilter === 'All' || (
            artist.location && artist.location === locationFilter
        );

        return matchesSearch && matchesGenre && matchesLocation;
    });

    // Display results
    displayFilteredResults(filteredArtists);
}

function displayArtists(artists) {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = '';

    const defaultImage = 'https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/defaultProfile.png';

    artists.forEach(artist => {
        const card = document.createElement('div');
        card.className = `rounded-lg p-6 flex flex-col items-center border-2 border-gray-700
            min-w-[200px] transform transition-transform duration-200 hover:-translate-y-1`;
        
        const specialization = artist.artistDetails?.specialization ?? 'Artist';
        
        // Create image element separately for better control
        const img = new Image();
        img.className = 'w-32 h-32 rounded-full object-cover mb-4 border-4 border-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]';
        img.alt = artist.displayName || 'Artist';
        img.src = defaultImage;

        // Only try to load the actual image if it exists
        if (artist.photoURL && artist.photoURL.trim()) {
            const tempImg = new Image();
            tempImg.onload = () => {
                img.src = artist.photoURL;
            };
            tempImg.onerror = () => {
                console.log('Artist image failed to load:', artist.displayName);
                img.src = defaultImage;
            };
            tempImg.src = artist.photoURL;
        }

        card.innerHTML = `
            <h3 class="text-3xl font-bold mb-2 text-black">${artist.displayName || 'Unnamed Artist'}</h3>
            <p class="text-center mb-4 text-black text-lg">${specialization}</p>
            <button class="bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2 border-black">
                View Profile
            </button>
        `;

        // Insert the image at the beginning of the card
        card.insertBefore(img, card.firstChild);

        card.querySelector('button').onclick = () => {
            window.location.href = `./profile/profile.html?id=${artist.id}`;
        };

        resultsContainer.appendChild(card);
    });
}

// Add the missing displayFilteredResults function
function displayFilteredResults(artists) {
    if (!resultsContainer) return;
    
    if (artists.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center p-4">
                <p class="text-gray-600">No artists found matching your search.</p>
            </div>
        `;
        return;
    }

    displayArtists(artists);
}

function resetSearch() {
    if (!searchInput || !resultsContainer) return;
    
    searchInput.value = '';
    
    const searchBtn = document.querySelector('.artist-search-btn');
    const searchContainer = document.querySelector('.artist-search-container');
    
    if (searchContainer && searchBtn) {
        searchContainer.classList.remove('expanded');
        searchBtn.style.opacity = '1';
    }

    // Always load featured artists when resetting
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
                if (!searchTerm || searchTerm.trim() === '') {
                    loadArtists();
                } else {
                    performSearch(searchTerm);
                }
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

window.displayFilteredResults = displayFilteredResults;

document.addEventListener('DOMContentLoaded', initializeSearch);