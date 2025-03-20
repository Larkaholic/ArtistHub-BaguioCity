import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from '../js/firebase-config.js';

let allArtworks = []; // Store all artworks for filtering

document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    loadArtworks();

    // Add event listeners for genre buttons
    const genreButtons = document.querySelectorAll('.genre-btn');
    genreButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove active class from all buttons
            genreButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            e.target.closest('.genre-btn').classList.add('active');
            // Apply filters
            applyFilters();
        });
    });

    // Add search button click handler
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', applyFilters);
    }

    // Add search input handler for "Enter" key
    const searchInput = document.getElementById('searchArtworks');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    // Add filter change handlers
    const filters = ['genreFilter', 'categoryFilter', 'sizeFilter', 'mediumFilter'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
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
    const searchTerm = document.getElementById('searchArtworks')?.value.toLowerCase() || '';
    const activeGenre = document.querySelector('.genre-btn.active')?.dataset.genre || '';
    const size = document.getElementById('sizeFilter')?.value || '';
    const medium = document.getElementById('mediumFilter')?.value || '';

    const filteredArtworks = allArtworks.filter(artwork => {
        const matchesSearch = !searchTerm || 
            artwork.title?.toLowerCase().includes(searchTerm) ||
            artwork.description?.toLowerCase().includes(searchTerm) ||
            artwork.artist?.toLowerCase().includes(searchTerm);

        const matchesGenre = !activeGenre || artwork.genre === activeGenre;
        const matchesSize = !size || artwork.size === size;
        const matchesMedium = !medium || artwork.medium === medium;

        return matchesSearch && matchesGenre && matchesSize && matchesMedium;
    });

    displayArtworks(filteredArtworks);
}

// Add genre icons mapping
const genreIcons = {
    'traditional': 'paint-brush',
    'contemporary': 'shapes',
    'abstract': 'draw-polygon',
    'photography': 'camera',
    'digital': 'desktop',
    'sculpture': 'cube',
    'mixed-media': 'layer-group',
    'default': 'palette'
};

function displayArtworks(artworks) {
    const galleryContainer = document.getElementById('galleryContainer');
    galleryContainer.innerHTML = '';

    if (artworks.length === 0) {
        galleryContainer.innerHTML = '<p class="text-center col-span-full">No artworks found.</p>';
        return;
    }

    artworks.forEach((artwork) => {
        const genreIcon = genreIcons[artwork.genre?.toLowerCase()] || genreIcons.default;
        const card = createArtworkCard(artwork.id, artwork, genreIcon);
        galleryContainer.appendChild(card);
    });
}

function createArtworkCard(id, data, genreIcon) {
    const card = document.createElement('div');
    card.className = 'artwork-card bg-white rounded-lg shadow-lg overflow-hidden';
    card.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.title}" class="artwork-image w-full h-48 object-cover">
        <div class="p-6">
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                    <i class="fas fa-${genreIcon} text-xl text-gray-600"></i>
                    <h3 class="artwork-title text-xl font-bold">${data.title}</h3>
                </div>
                <div class="flex justify-between items-center">
                    <p class="artwork-price text-lg font-semibold text-green-600">₱${parseFloat(data.price || 0).toFixed(2)}</p>
                    <span class="text-sm text-gray-500"><i class="fas fa-${genreIcon}"></i> ${data.genre || 'Art'}</span>
                </div>
            </div>
            <p class="artwork-description mt-2 text-gray-600">${data.description || 'No description available.'}</p>
            ${auth.currentUser ? 
                `<button onclick="window.addToCart('${id}', '${data.title}', ${parseFloat(data.price)})" 
                    class="artwork-button mt-4 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-200">
                    <i class="fas fa-cart-plus mr-2"></i> Add to Cart
                </button>` :
                `<button onclick="window.toggleLoginFlyout()" 
                    class="artwork-button mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200">
                    <i class="fas fa-sign-in-alt mr-2"></i> Login to Add to Cart
                </button>`
            }
        </div>
    `;
    return card;
}
