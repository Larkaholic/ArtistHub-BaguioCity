import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "./firebase-config.js";

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('featuredArtistsGrid');

const db = getFirestore(app);

async function fetchArtistsFromDatabase() {
    try {
        console.log('Fetching artists from Firestore...'); // Debug log
        const querySnapshot = await getDocs(collection(db, "users"));
        const artists = [];
        querySnapshot.forEach((doc) => {
            console.log('Fetched artist:', doc.data()); // Debug log
            artists.push({ id: doc.id, ...doc.data() });
        });
        console.log('Fetched Artists:', artists); // Debug log
        return artists;
    } catch (error) {
        console.error('Error fetching artists:', error);
        return [];
    }
}

async function searchArtistsInDatabase() {
    const searchTerm = searchInput.value.toLowerCase();
    console.log('Search Term:', searchTerm); // Debug log
    const artists = await fetchArtistsFromDatabase();
    
    // Clear previous results
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
    } else {
        console.error('resultsContainer is null');
        return;
    }

    // Display search results
    artists.forEach(artist => {
        if (artist.displayName && artist.displayName.toLowerCase().includes(searchTerm)) {
            console.log('Matching Artist:', artist); // Debug log
            const artistCard = document.createElement('div');
            artistCard.className = `
                rounded-lg p-6 flex flex-col items-center border-2 border-gray-700
                min-w-[200px] transform transition-transform duration-200 hover:-translate-y-1 border-4 border-black
            `;
            
            const specialization = artist.artistDetails?.specialization ?? 'artist';
            
            artistCard.innerHTML = `
                <img src="${artist.photoURL}" alt="${artist.displayName}" 
                    class="w-32 h-32 rounded-full object-cover mb-4 border-4 border-black text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <h3 class="text-3xl font-bold mb-2 text-black">${artist.displayName}</h3>
                <p class="text-center mb-4 text-black text-lg">${specialization}</p>
                <button class="bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2 border-black">
                    View Profile
                </button>
            `;

            artistCard.querySelector('button').onclick = () => {
                window.location.href = `./profile/profile.html?id=${artist.id}`;
            };

            resultsContainer.appendChild(artistCard);
        }
    });
}

// Event listeners
searchBtn.addEventListener('click', searchArtistsInDatabase);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchArtistsInDatabase();
    }
});