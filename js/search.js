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

    // Event listeners
    searchBtn.addEventListener('click', searchArtists);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchArtists();
        }
    });