import { db } from './firebase-config.js';
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
                rounded-lg p-6 flex flex-col items-center bg-white shadow-lg
                min-w-[200px] transform transition-transform duration-200 hover:-translate-y-1
            `;
            card.style.borderColor = '#f76400';

            const specialization = artistData.artistDetails?.specialization ?? 'artist';

            card.innerHTML = `
            <img src="${artistData.photoURL}" alt="${artistData.displayName}" 
                class="w-32 h-32 rounded-full object-cover mb-4"
                style="border-color: #f76400;">
            <h3 class="text-3xl font-bold mb-2 text-black">${artistData.displayName}</h3>
            <p class="text-center mb-4 text-black text-lg">${specialization}</p>
            <div class="mt-auto w-full flex justify-center">
                <button class="bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2"
                    style="background-color: #f76400; color: white;">
                    View Profile
                </button>
            </div>
            `;

            card.querySelector('button').onclick = () => {
                window.location.href = `/profile/profile.html?id=${artist.id}`;
            };

            artistsGrid.appendChild(card);
        }

    } catch (error) {
        console.error("Error loading featured artists:", error);
        artistsGrid.innerHTML = '<div class="text-center text-gray-600">Error loading featured artists</div>';
    }
}

// New function to load all artists for the shop section
export async function loadAllArtists() {
    const artistsGrid = document.getElementById('allArtistsGrid');
    if (!artistsGrid) {
        console.error('allArtistsGrid element not found');
        return;
    }
    
    try {
        artistsGrid.innerHTML = '<div class="loading-spinner my-10 flex justify-center col-span-full"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>';
        
        // Load all artists from the users collection where userType is 'artist'
        const querySnapshot = await getDocs(collection(db, "users"));
        const artists = [];
        
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.userType === 'artist') {
                artists.push({ id: doc.id, ...userData });
            }
        });

        if (artists.length === 0) {
            artistsGrid.innerHTML = '<p class="text-center text-gray-600 col-span-full">No artists found</p>';
            return;
        }

        // Clear loading spinner
        artistsGrid.innerHTML = '';

        // Display artists in a grid (limit to 12 for 2x6 grid)
        const displayArtists = artists.slice(0, 6);
        
        displayArtists.forEach(artist => {
            const card = document.createElement('div');
            card.className = `bg-white rounded-lg border-2 shadow-lg overflow-hidden flex flex-col items-center p-6 artist-card`;
            card.style.borderColor = '#ffffff';

            const specialization = artist.artistDetails?.specialization || 'Artist';
            const photoURL = artist.photoURL || 'https://via.placeholder.com/150x150?text=No+Image';

            card.innerHTML = `
                <img src="${photoURL}" alt="${artist.displayName}" 
                    class="w-32 h-32 rounded-full object-cover mb-4 border-2"
                    style="border-color: #f76400;">
                <h3 class="text-3xl font-bold mb-2 text-black">${artist.displayName}</h3>
                <p class="text-center mb-4 text-black text-lg">${specialization}</p>
                <div class="mt-auto w-full flex justify-center">
                    <button class="bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2"
                        style="background-color: #f76400; color: white;">
                        View Profile
                    </button>
                </div>
            `;

            card.querySelector('button').onclick = () => {
                window.location.href = `${baseUrl}/profile/profile.html?id=${artist.id}`;
            };

            artistsGrid.appendChild(card);
        });

        // Store all artists for search functionality
        allArtists = artists;

    } catch (error) {
        console.error("Error loading all artists:", error);
        artistsGrid.innerHTML = '<div class="text-center text-gray-600 col-span-full">Error loading artists</div>';
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
    const searchInput = document.getElementById('searchInput');
    const locationFilter = document.getElementById('locationFilter');
    const genreFilter = document.getElementById('genreFilter');
    const specializationFilter = document.getElementById('specializationFilter');

    const searchValue = searchInput?.value?.toLowerCase() || '';
    const locationValue = locationFilter?.value || 'All';
    const genreValue = genreFilter?.value || 'All';
    const specializationValue = specializationFilter?.value || 'All';

    const filteredArtists = allArtists.filter(artist => {
        const matchesSearch = artist.name.toLowerCase().includes(searchValue) ||
                            artist.specialization.toLowerCase().includes(searchValue) ||
                            artist.genre.toLowerCase().includes(searchValue) ||
                            artist.bio.toLowerCase().includes(searchValue);
        const matchesLocation = locationValue === 'All' || artist.location === locationValue;
        const matchesGenre = genreValue === 'All' || artist.genre === genreValue;
        const matchesSpecialization = specializationValue === 'All' || artist.specialization === specializationValue;

        return matchesSearch && matchesLocation && matchesGenre && matchesSpecialization;
    });

    displayArtists(filteredArtists);
}

// Add event listeners for search and filter inputs with null checks
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const locationFilter = document.getElementById('locationFilter');
    const genreFilter = document.getElementById('genreFilter');
    const specializationFilter = document.getElementById('specializationFilter');

    // Only add event listeners if elements exist
    if (searchInput) {
        searchInput.addEventListener('input', debouncedSearch);
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', applyFilters);
    }
    
    if (genreFilter) {
        genreFilter.addEventListener('change', applyFilters);
    }
    
    if (specializationFilter) {
        specializationFilter.addEventListener('change', applyFilters);
    }

    loadArtists();
});