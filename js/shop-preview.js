import { collection, getDocs, query, limit, orderBy, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from './firebase-config.js';

// Set maximum number of artworks to show in preview
const MAX_PREVIEW_ARTWORKS = 6;

// Genre icons mapping
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

// Load artwork categories from Firestore
async function loadArtCategories() {
    try {
        console.log("Loading art categories...");
        const categoriesSet = new Set();
        // Use the correct collection name - gallery_images
        const artworksRef = collection(db, 'gallery_images');
        const snapshot = await getDocs(artworksRef);
        
        snapshot.forEach(doc => {
            const data = doc.data();
            // Add any categories found in the documents
            if (data.genre) categoriesSet.add(data.genre);
            
            // Also check other possible category fields if genre is not available
            if (data.category && !data.genre) categoriesSet.add(data.category);
            if (data.medium && !categoriesSet.has(data.medium)) categoriesSet.add(data.medium);
        });
        
        // Get categories dropdown element
        const categDropdown = document.getElementById('categ');
        if (categDropdown) {
            // Clear existing options except the first one
            while (categDropdown.options.length > 1) {
                categDropdown.remove(1);
            }
            
            // Add new options
            Array.from(categoriesSet).sort().forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categDropdown.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error loading art categories:", error);
    }
}

// Load artwork preview for homepage
async function loadArtworkPreview() {
    const sampleArtsContainer = document.querySelector('.sampleArts');
    if (!sampleArtsContainer) {
        console.error("Artwork container not found in the DOM!");
        return;
    }
    
    try {
        console.log("Loading artwork preview...");
        sampleArtsContainer.innerHTML = '<div class="loading-spinner my-10 flex justify-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>';
        
        // Use the correct collection name - gallery_images
        const artworksRef = collection(db, 'gallery_images');
        
        // First check if we can get any documents from this collection
        const testSnapshot = await getDocs(query(artworksRef, limit(1)));
        if (testSnapshot.empty) {
            console.error("No artwork documents found in gallery_images collection");
            sampleArtsContainer.innerHTML = '<p class="text-center text-gray-500 my-8">No artworks available at the moment.</p>';
            return;
        }
        
        // Try to order by uploadDate first, if that doesn't work, get them without sorting
        let artworksQuery;
        try {
            artworksQuery = query(
                artworksRef,
                orderBy('uploadDate', 'desc'),
                limit(MAX_PREVIEW_ARTWORKS)
            );
        } catch (error) {
            console.warn("Error ordering by uploadDate, retrieving documents without sorting:", error);
            artworksQuery = query(
                artworksRef,
                limit(MAX_PREVIEW_ARTWORKS)
            );
        }
        
        const querySnapshot = await getDocs(artworksQuery);
        
        if (querySnapshot.empty) {
            console.log("Query returned no documents");
            sampleArtsContainer.innerHTML = '<p class="text-center text-gray-500 my-8">No artworks available at the moment.</p>';
            return;
        }
        
        // Build HTML for artwork cards
        let artworksHTML = `
            <div class="sampleArts grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-h-full overflow-x-auto overflow-y-visible max-w-full w-full">
        `;
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const artwork = { id: doc.id, ...data };
            
            console.log(`Processing artwork: ${artwork.title || 'Untitled'}`);
            
            // Get appropriate icon for the genre
            const genre = artwork.genre || artwork.category || 'default';
            const genreIcon = genreIcons[genre.toLowerCase()] || genreIcons.default;
            
            const formattedPrice = parseFloat(artwork.price || 0).toLocaleString('en-PH', {
                style: 'currency',
                currency: 'PHP'
            });
            
            // Check if image URL exists
            const hasImage = artwork.imageUrl && typeof artwork.imageUrl === 'string' && artwork.imageUrl.trim() !== '';
            const imageUrl = hasImage ? artwork.imageUrl : 'https://via.placeholder.com/300x200?text=No+Image+Available';
            
            // Get artist info
            const artistName = artwork.artistName || 
                              (artwork.artistEmail ? artwork.artistEmail.split('@')[0] : 'Unknown Artist');
            
            // Create artwork card HTML
            artworksHTML += `
                <div class="artwork-card bg-white rounded-lg shadow-lg overflow-hidden">
                    <div class="relative">
                        <div class="artwork-artist">${artistName}</div>
                        <img 
                            src="${imageUrl}" 
                            alt="${artwork.title || 'Untitled artwork'}" 
                            class="artwork-image w-full h-40 object-cover" 
                            onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+Error'; this.classList.add('img-error');"
                            loading="lazy"
                        >
                    </div>
                    <div class="p-4 flex flex-col h-full">
                        <div class="flex-grow">
                            <div class="flex items-center gap-1 mb-1">
                                <i class="fas fa-${genreIcon} text-sm text-gray-600"></i>
                                <h3 class="artwork-title">${artwork.title || 'Untitled artwork'}</h3>
                            </div>
                            <div class="price-container mb-1">
                                <p class="artwork-price">${formattedPrice}</p>
                            </div>
                            <p class="artwork-description text-gray-600">${artwork.description || 'No description available.'}</p>
                        </div>
                        <a href="./shop/shop.html" class="mt-auto bg-[#f76400] text-white py-2 px-4 rounded text-center hover:bg-amber-600 transition duration-200">
                            <i class="fas fa-shopping-cart mr-1"></i> View in Shop
                        </a>
                    </div>
                </div>
            `;
        });
        
        artworksHTML += `</div>`;
                
        sampleArtsContainer.innerHTML = artworksHTML;
        console.log("Artwork preview loaded successfully!");
        
    } catch (error) {
        console.error("Error loading artwork preview:", error);
        sampleArtsContainer.innerHTML = `
            <div class="text-center text-red-500 my-8">
                <p>Error loading artworks: ${error.message}</p>
                <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Retry
                </button>
            </div>
        `;
    }
}

// Artwork filtering on the home page
function setupArtworkFiltering() {
    const searchInput = document.getElementById('generalSearch');
    const categoryDropdown = document.getElementById('categ');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                // Store search term in sessionStorage
                sessionStorage.setItem('artSearch', searchInput.value);
                // Redirect to shop page
                window.location.href = './shop/shop.html';
            }
        });
    }
    
    if (categoryDropdown) {
        categoryDropdown.addEventListener('change', () => {
            if (categoryDropdown.value) {
                // Store selected category in sessionStorage
                sessionStorage.setItem('artCategory', categoryDropdown.value);
                // Redirect to shop page
                window.location.href = './shop/shop.html';
            }
        });
    }
}

// Add artwork card styles to the document
function addArtworkCardStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .artwork-card {
            height: 100%;
            display: flex;
            flex-direction: column;
            transition: transform 0.2s ease, box-shadow 0.3s ease;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }
        
        .artwork-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
        }
        
        .artwork-image {
            height: 200px;
            object-fit: cover;
            width: 100%;
            border-radius: 0.5rem 0.5rem 0 0;
        }
        
        .artwork-title {
            font-size: 1rem;
            font-weight: 700;
            line-height: 1.3;
            color: #1F2937;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
        }
        
        .artwork-description {
            font-size: 0.85rem;
            line-height: 1.4;
            height: 3.4rem;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        
        .artwork-price {
            color: #065f46;
            font-weight: 700;
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            background: rgba(16, 185, 129, 0.1);
        }
        
        .price-container {
            margin: 0.5rem 0;
            padding: 0.25rem 0;
        }
        
        .artwork-artist {
            position: absolute;
            top: 0.5rem;
            left: 0.5rem;
            padding: 0.25rem 0.5rem;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: bold;
        }
    `;
    document.head.appendChild(styleEl);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing shop preview...");
    addArtworkCardStyles();
    loadArtCategories();
    loadArtworkPreview();
    setupArtworkFiltering();
    
    // Make the "Browse Artworks" button in the hero section redirect to the shop
    const browseButton = document.querySelector('.bannerbuttons .decline');
    if (browseButton) {
        browseButton.addEventListener('click', () => {
            window.location.href = './shop/shop.html';
        });
    }
});

// Make functions available globally for debugging
window.debugFirestore = async () => {
    try {
        console.log("Testing Firestore access...");
        
        // Check the gallery_images collection
        const colRef = collection(db, 'gallery_images');
        const snapshot = await getDocs(query(colRef, limit(5)));
        console.log(`Collection gallery_images: ${snapshot.size} documents found`);
        
        if (!snapshot.empty) {
            console.log("Sample document fields:");
            const sampleDoc = snapshot.docs[0].data();
            console.log(Object.keys(sampleDoc));
            console.log("Data:", sampleDoc);
            
            // Try reloading the artwork preview
            loadArtworkPreview();
        }
    } catch (error) {
        console.error("Firestore debug failed:", error);
    }
};

// Make functions available globally for debugging
window.loadArtworkPreview = loadArtworkPreview;
window.loadArtCategories = loadArtCategories;
