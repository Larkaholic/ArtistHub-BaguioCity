import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from '../js/firebase-config.js';

let allArtworks = []; // Store all artworks for filtering

document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    loadArtworks();

    // Add event listeners to all filter inputs
    const filterInputs = [
        'artworkSearch',
        'genreFilter',
        'categoryFilter',
        'sizeFilter',
        'mediumFilter'
    ];

    filterInputs.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('input', applyFilters);
            element.addEventListener('change', applyFilters);
        }
    });
});

async function loadArtworks() {
    const galleryContainer = document.getElementById('galleryContainer');
    
    try {
        galleryContainer.innerHTML = '<p class="text-center col-span-full">Loading artworks...</p>';

        const querySnapshot = await getDocs(collection(db, 'gallery_images'));
        
        if (querySnapshot.empty) {
            galleryContainer.innerHTML = '<p class="text-center col-span-full">No artworks found.</p>';
            return;
        }

        allArtworks = []; // Reset the array
        querySnapshot.forEach((doc) => {
            allArtworks.push({ id: doc.id, ...doc.data() });
        });

        applyFilters(); // Initial display with filters
    } catch (error) {
        console.error('Error loading artworks:', error);
        galleryContainer.innerHTML = '<p class="text-center col-span-full text-red-500">Error loading artworks.</p>';
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('artworkSearch')?.value.toLowerCase() || '';
    const genre = document.getElementById('genreFilter')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const size = document.getElementById('sizeFilter')?.value || '';
    const medium = document.getElementById('mediumFilter')?.value || '';

    const filteredArtworks = allArtworks.filter(artwork => {
        const matchesSearch = !searchTerm || 
            artwork.title?.toLowerCase().includes(searchTerm) ||
            artwork.description?.toLowerCase().includes(searchTerm) ||
            artwork.artist?.toLowerCase().includes(searchTerm);

        const matchesGenre = !genre || artwork.genre === genre;
        const matchesCategory = !category || artwork.category === category;
        const matchesSize = !size || artwork.size === size;
        const matchesMedium = !medium || artwork.medium === medium;

        return matchesSearch && matchesGenre && matchesCategory && matchesSize && matchesMedium;
    });

    displayArtworks(filteredArtworks);
}

function displayArtworks(artworks) {
    const galleryContainer = document.getElementById('galleryContainer');
    
    if (artworks.length === 0) {
        galleryContainer.innerHTML = '<p class="text-center col-span-full">No artworks found matching your criteria.</p>';
        return;
    }

    galleryContainer.innerHTML = '';
    artworks.forEach(artwork => {
        const card = createArtworkCard(artwork.id, artwork);
        galleryContainer.appendChild(card);
    });
}

function createArtworkCard(id, data) {
    const card = document.createElement('div');
    card.className = 'artwork-card';
    card.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.title}" class="artwork-image">
        <div class="p-6">
            <div class="flex flex-col gap-2">
                <h3 class="artwork-title">${data.title}</h3>
                <div class="flex justify-between items-center">
                    <p class="artwork-price">₱${parseFloat(data.price || 0).toFixed(2)}</p>
                </div>
            </div>
            <p class="artwork-description">${data.description || 'No description available.'}</p>
            ${auth.currentUser ? 
                `<button onclick="window.addToCart('${id}', '${data.title}', ${parseFloat(data.price)})" 
                    class="artwork-button">
                    Add this to Cart
                </button>` :
                `<button onclick="window.toggleLoginFlyout()" 
                    class="artwork-button">
                    Login to Add to Cart
                </button>`
            }
        </div>
    `;
    return card;
}
