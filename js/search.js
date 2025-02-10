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
        const response = await fetch('../artists.json');
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
    
    // Display close or exact search results
    const resultsContainer = document.getElementById('artistsGrid');
    resultsContainer.innerHTML = ''; // Clear previous results

    artists.forEach(artist => {
        if (artist.name.toLowerCase().includes(searchTerm)) {
            const artistCard = document.createElement('div');
            artistCard.classList.add('artist-card');
            artistCard.dataset.artistId = artist.id;
            artistCard.innerHTML = `
                <h3>${artist.name}</h3>
                <p>Artist ID: ${artist.id}</p>
            `;
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