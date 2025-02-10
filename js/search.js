const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const artistCards = document.querySelectorAll('.artist-card'); // Add class 'artist-card' to your artist elements

function searchArtists() {
    const searchTerm = searchInput.value.toLowerCase();
    
    artistCards.forEach(card => {
        const artistText = card.textContent.toLowerCase();
        if (artistText.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

async function fetchArtistsFromDatabase() {
    try {
        const response = await fetch('http://your-api-endpoint.com/api/artists'); // Replace with your actual API endpoint
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const artists = await response.json();
        return artists;
    } catch (error) {
        console.error('Error fetching artists:', error);
        return [];
    }
}

async function searchArtistsInDatabase() {
    const searchTerm = searchInput.value.toLowerCase();
    const artists = await fetchArtistsFromDatabase();
    
    artistCards.forEach(card => {
        const artistId = card.dataset.artistId;
        const artist = artists.find(artist => artist.id === artistId);
        if (artist && artist.name.toLowerCase().includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
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