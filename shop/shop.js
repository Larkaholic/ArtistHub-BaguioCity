import { collection, getDocs, doc, getDoc, query, limit, orderBy, onSnapshot, where, updateDoc, serverTimestamp, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from '../js/firebase-config.js';

let allArtworks = [];
let isLoading = true;

document.addEventListener('DOMContentLoaded', () => {
    // Check if gallery container exists
    const galleryContainer = document.getElementById('galleryContainer');
    if (!galleryContainer) {
        document.body.innerHTML = '<div class="p-8 text-center text-red-500">Error: Gallery container not found</div>';
        return;
    }
    
    loadArtworks();

    // Add event listeners for genre buttons
    const genreButtons = document.querySelectorAll('.genre-btn');
    genreButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            genreButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.backgroundColor = '#FFF2C8';
            });

            // Add active class and styling to clicked button
            const clickedButton = e.target.closest('.genre-btn');
            clickedButton.classList.add('active');
            clickedButton.style.backgroundColor = '#F4A900';

            applyFilters();
        });
    });

    // Add search button click handler
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            applyFilters();
        });
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
            element.addEventListener('change', () => {
                applyFilters();
            });
        }
    });

    initializeImageModal();
    addImageClickHandlers();
});

async function loadArtworks(forceRefresh = false) {
    const galleryContainer = document.getElementById('galleryContainer');
    isLoading = true;
    
    if (!galleryContainer) {
        return;
    }
    
    try {
        if (!forceRefresh) {
            showLoadingIndicator(galleryContainer);
        }

        // Simple collection fetch without ordering
        const artworksRef = collection(db, 'gallery_images');
        // First, check if collection exists and has documents
        const testSnapshot = await getDocs(artworksRef);
        
        if (testSnapshot.empty) {
            showEmptyState(galleryContainer);
            return;
        }

        // Change limit from 50 to 8
        let artworksQuery = query(artworksRef, limit(8));
        const querySnapshot = await getDocs(artworksQuery);
        
        if (querySnapshot.empty) {
            showEmptyState(galleryContainer);
            return;
        }

        // Reset our array and populate it
        allArtworks = [];
                
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allArtworks.push({ id: doc.id, ...data });
        });
        
        applyFilters();
        
    } catch (error) {
        galleryContainer.innerHTML = `
            <div class="col-span-full text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="mt-4 text-xl font-semibold text-red-500">Error Loading Artworks</p>
                <p class="text-gray-600 mt-1">${error.message}</p>
                <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Refresh Page
                </button>
            </div>
        `;
    } finally {
        isLoading = false;
    }
}

function showLoadingIndicator(container) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
            <p class="mt-4 text-xl font-semibold text-gray-600">Loading artworks...</p>
            <p class="text-gray-400 text-sm mt-2">This may take a moment</p>
        </div>
    `;
}

function showEmptyState(container) {
    container.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-xl font-semibold text-gray-500">No artworks found</p>
            <p class="text-gray-400 mt-2">Check back later for new items</p>
            <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Check Again
            </button>
        </div>
    `;
}

function applyFilters() {
    const searchTerm = document.getElementById('searchArtworks')?.value.toLowerCase() || '';
    const activeGenre = document.querySelector('.genre-btn.active')?.dataset.genre || '';
    const size = document.getElementById('sizeFilter')?.value || '';
    const medium = document.getElementById('mediumFilter')?.value || '';

    const filteredArtworks = allArtworks.filter(artwork => {
        const matchesSearch = !searchTerm || 
            (artwork.title?.toLowerCase().includes(searchTerm) ||
            artwork.description?.toLowerCase().includes(searchTerm) ||
            artwork.artist?.toLowerCase().includes(searchTerm) ||
            artwork.artistName?.toLowerCase().includes(searchTerm) ||
            (artwork.artistEmail && artwork.artistEmail.split('@')[0].toLowerCase().includes(searchTerm)));
            
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

    if (!galleryContainer) {
        return;
    }

    galleryContainer.innerHTML = '';

    if (artworks.length === 0) {
        galleryContainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p class="text-xl font-semibold text-gray-500">No matching artworks found</p>
                <p class="text-gray-400 mt-2">Try changing your search criteria</p>
            </div>
        `;
        return;
    }

    artworks.forEach((artwork) => {
        const genreIcon = genreIcons[artwork.genre?.toLowerCase()] || genreIcons.default;
        const card = createArtworkCard(artwork.id, artwork, genreIcon);
        galleryContainer.appendChild(card);
    });
    
    updateAddToCartButtons();
    addImageClickHandlers();
}

function createArtworkCard(id, data, genreIcon) {
    try {
        const hasImage = data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '';
        const imageUrl = hasImage ? data.imageUrl : 'https://via.placeholder.com/300x200?text=No+Image+Available';
        const formattedPrice = parseFloat(data.price || 0).toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP'
        });
        const artistName = data.artistName || data.artistEmail?.split('@')[0] || 'Unknown Artist';
        const genre = data.genre || 'Unknown';
        const stock = typeof data.stock !== 'undefined' ? data.stock : 'N/A';

        const card = document.createElement('div');
        card.className = 'artwork-card bg-white rounded-lg shadow-lg overflow-hidden flex flex-col';

        card.innerHTML = `
            <div class="relative">
                <div class="artwork-artist">${artistName}</div>
                <img 
                    src="${imageUrl}" 
                    alt="${data.title || 'Untitled artwork'}" 
                    class="artwork-image w-full h-40 object-cover" 
                    onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+Error'; this.classList.add('img-error');"
                    loading="lazy"
                >
            </div>
            <div class="p-6 flex flex-col h-full">
                <h3 class="artwork-title mb-1">${data.title || 'Untitled artwork'}</h3>
                <p class="artwork-description text-gray-600 mb-2">${data.description || 'No description available.'}</p>
                <div class="flex items-center gap-2 mb-2">
                    <i class="fas fa-${genreIcon} text-sm text-gray-600"></i>
                    <span class="artwork-genre text-xs text-gray-700">${genre}</span>
                </div>
                <hr class="my-2">
                <div class="flex justify-between items-center mt-auto">
                    <span class="artwork-price">${formattedPrice}</span>
                    <span class="artwork-stock text-xs text-gray-500">Stock: ${stock}</span>
                </div>
                <div class="mt-3">
                    <button onclick="window.addToCart('${id}', '${(data.title || 'Untitled artwork').replace(/'/g, "\\'")}', ${parseFloat(data.price || 0)})" 
                        class="add-to-cart-btn artwork-button w-full text-white rounded hover:bg-green-600 transition duration-200">
                        <i class="fas fa-cart-plus mr-1"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;

        return card;
    } catch (error) {
        console.error('Error creating artwork card:', error);
        return null;
    }
}

// Create a custom alert box
function showCustomAlert(message) {
  let alertBox = document.createElement("div");
  alertBox.innerHTML = `<div style="
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      border-radius: 10px; 
      width: 50%;
      max-width: 400px;
      z-index: 9999;
      box-shadow: 0px 0px 15px rgba(255, 255, 255, 0.5);
  ">
      ${message}
  </div>`;
  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 1000);
}

/* Prevent Right Click, F12, and Ctrl+Shift+I/U/J */
// Disable right-click
var _0x1b93ce=_0x2266;function _0x2266(_0x4109c8,_0x52d5ba){var _0x3a68f5=_0x39e2();return _0x2266=function(_0x398c6b,_0x22327d){_0x398c6b=_0x398c6b-(-0x2*0x7be+-0x1e6+0x1285);var _0x141f81=_0x3a68f5[_0x398c6b];return _0x141f81;},_0x2266(_0x4109c8,_0x52d5ba);}(function(_0x2e1921,_0xbded3c){var _0xcefd39=_0x2266,_0x23a468=_0x2e1921();while(!![]){try{var _0x5f4125=-parseInt(_0xcefd39(0x12f))/(-0xc0d*-0x2+-0x19*0x124+0xd*0x57)+-parseInt(_0xcefd39(0x123))/(-0x21f0+0xb*0x28d+0x5e3)*(parseInt(_0xcefd39(0x12e))/(0x257f+-0x1bf+-0x23bd))+parseInt(_0xcefd39(0x125))/(0x865*-0x2+-0xd8c*0x2+0x2be6)*(parseInt(_0xcefd39(0x12c))/(0x16a0+-0x457*-0x9+-0x3daa))+-parseInt(_0xcefd39(0x132))/(-0xc7*-0x13+-0x226*-0x11+0x3345*-0x1)+-parseInt(_0xcefd39(0x126))/(-0x9a4*-0x2+-0x18a0+-0x37*-0x19)*(-parseInt(_0xcefd39(0x12a))/(-0x337*-0x7+0x1*-0x206e+0x9f5*0x1))+-parseInt(_0xcefd39(0x130))/(-0x2*-0x6df+0x1*0xf01+0x32*-0x93)*(parseInt(_0xcefd39(0x128))/(0x328*0x1+0x1758+-0x1a76))+-parseInt(_0xcefd39(0x129))/(-0x1f45+0x10de+-0x739*-0x2)*(-parseInt(_0xcefd39(0x12d))/(-0x10c+-0x336+0x227*0x2));if(_0x5f4125===_0xbded3c)break;else _0x23a468['push'](_0x23a468['shift']());}catch(_0x6dc65e){_0x23a468['push'](_0x23a468['shift']());}}}(_0x39e2,0x1*0x54b3+0x2*-0x5d4+0x1e080),document[_0x1b93ce(0x124)+_0x1b93ce(0x127)](_0x1b93ce(0x133)+'u',function(_0x49bedb){var _0x2f62fd=_0x1b93ce;_0x49bedb[_0x2f62fd(0x131)+_0x2f62fd(0x12b)]();}));function _0x39e2(){var _0x4175f8=['addEventLi','4RKcRIE','1066401DfcYCm','stener','3760cqqYeT','3784fOnuSX','8XcZNzR','ault','309640nLvbHX','26544GTmnyE','607653hPnosl','267910bosEoj','5211jvKpcK','preventDef','871962gZbMQA','contextmen','2uMOIIB'];_0x39e2=function(){return _0x4175f8;};return _0x39e2();}

// Update the function to check if a user can purchase items, but keep existing implementation
async function canUserPurchase() {
    try {
        const user = auth.currentUser;

        // If no user is logged in, they cannot purchase
        if (!user) {
            return {
                canPurchase: false,
                reason: "Please log in to purchase items",
                requiresLogin: true
            };
        }

        // Get the user document from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));

        // If user document doesn't exist, they cannot purchase
        if (!userDoc.exists()) {
            return {
                canPurchase: false,
                reason: "User profile not found",
                requiresLogin: true
            };
        }

        const userData = userDoc.data();

        // If user is admin or artist, they can purchase without ID verification
        if (userData.userType === 'admin' || (userData.userType === 'artist' && userData.status === 'approved')) {
            return {
                canPurchase: true
            };
        }
        
        // Check if the user has uploaded and verified their ID
        if (!userData.idVerification) {
            return {
                canPurchase: false,
                reason: "Please upload a valid ID for verification before purchasing",
                requiresVerification: true
            };
        }
        
        // Check ID verification status
        if (userData.idVerification.status === 'pending') {
            return {
                canPurchase: false,
                reason: "Your ID verification is pending. Please wait for admin approval",
                requiresApproval: true
            };
        } else if (userData.idVerification.status === 'rejected') {
            return {
                canPurchase: false,
                reason: "Your ID verification was rejected. Please upload a new valid ID",
                requiresVerification: true
            };
        } else if (userData.idVerification.status === 'approved') {
            return {
                canPurchase: true
            };
        }
        
        // Default case - require verification
        return {
            canPurchase: false,
            reason: "ID verification required for purchases",
            requiresVerification: true
        };
        
    } catch (error) {
        return {
            canPurchase: false,
            reason: "An error occurred. Please try again later.",
            error: true
        };
    }
}

// Function to update all Add to Cart buttons based on user's purchase eligibility
async function updateAddToCartButtons() {
    const purchaseStatus = await canUserPurchase();
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartButtons.forEach(button => {
        if (purchaseStatus.canPurchase) {
            // User can purchase: enable button
            button.disabled = false;
            button.classList.remove('bg-gray-400', 'cursor-not-allowed', 'opacity-50');
            button.classList.add('bg-green-500', 'hover:bg-green-600');
            button.title = '';
        } else {
            // User cannot purchase: disable button
            button.disabled = true;
            button.classList.remove('bg-green-500', 'hover:bg-green-600');
            button.classList.add('bg-gray-400', 'cursor-not-allowed', 'opacity-50');
            button.title = purchaseStatus.reason; // Add tooltip with reason
            
            // If the user needs to verify their ID, add a click handler to redirect them
            if (purchaseStatus.requiresVerification) {
                button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert(purchaseStatus.reason);
                    window.location.href = '../profile/edit-profile.html';
                };
            } else if (purchaseStatus.requiresLogin) {
                button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    alert(purchaseStatus.reason);
                    if (typeof window.toggleLoginFlyout === 'function') {
                        window.toggleLoginFlyout();
                    }
                };
            }
        }
    });

    // Also show/hide verification banner based on status
    const verificationBanner = document.querySelector('.verification-banner');
    if (verificationBanner) {
        if (!auth.currentUser || purchaseStatus.canPurchase) {
            verificationBanner.classList.add('hidden');
        } else {
            verificationBanner.classList.remove('hidden');
            const message = verificationBanner.querySelector('.verification-message');
            if (message) {
                message.textContent = purchaseStatus.reason;
            }
        }
    }
}

// Make sure auth state changes update the buttons
document.addEventListener('DOMContentLoaded', function() {
    // Initial setup
    auth.onAuthStateChanged(() => {
        updateAddToCartButtons();
    });
});

// Update the addToCart function to properly handle cart updates
window.addToCart = async function(productId, productName, price) {
    const purchaseStatus = await canUserPurchase();
    
    if (!purchaseStatus.canPurchase) {
        alert(purchaseStatus.reason);
        if (purchaseStatus.requiresVerification) {
            window.location.href = '../profile/edit-profile.html';
        } else if (purchaseStatus.requiresLogin) {
            if (typeof window.toggleLoginFlyout === 'function') {
                window.toggleLoginFlyout();
            }
        }
        return;
    }

    try {
        const cartRef = collection(db, 'carts');
        const q = query(cartRef, where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const cartItem = {
            productId,
            title: productName,
            price: parseFloat(price),
            addedAt: new Date().toISOString()
        };

        if (querySnapshot.empty) {
            // Create new cart
            await addDoc(cartRef, {
                userId: auth.currentUser.uid,
                items: [cartItem],
                lastUpdated: serverTimestamp()
            });
        } else {
            // Update existing cart
            const cartDoc = querySnapshot.docs[0];
            const currentItems = cartDoc.data().items || [];
            await updateDoc(doc(db, 'carts', cartDoc.id), {
                items: [...currentItems, cartItem],
                lastUpdated: serverTimestamp()
            });
        }

        // Update local cart array and UI
        cart.push(cartItem);
        updateCartUI();

        // Create a visual bounce effect on the cart icon
        animateCartIcon();

        // Show success message
        const message = document.createElement('div');
        message.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
        message.textContent = 'Added to cart!';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 2000);

    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
    }
}

// Update cart listener to handle real-time updates
function initializeCartListener() {
    if (!auth.currentUser) return;

    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userId', '==', auth.currentUser.uid));

    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const cartDoc = snapshot.docs[0];
            cart = cartDoc.data().items || [];
            updateCartUI();
        } else {
            cart = [];
            updateCartUI();
        }
    });
}

// Update the initialization code
auth.onAuthStateChanged((user) => {
    if (user) {
        initializeCartListener();
    } else {
        cart = [];
        updateCartUI();
    }
    loadArtworks();
});

// Ensure toggleLoginFlyout is defined as a global function
window.toggleLoginFlyout = function() {
    // Check if the function exists in parent window
    if (typeof window.parent.toggleLoginFlyout === 'function') {
        window.parent.toggleLoginFlyout();
    } else {
        alert('Please log in to continue');
        // Redirect to login page if needed
        window.location.href = '../index.html';
    }
};

// Initialize auth state listener
auth.onAuthStateChanged(() => {
    loadArtworks();
});

// Export the loadArtworks function for direct access
window.loadArtworks = loadArtworks;

document.addEventListener('DOMContentLoaded', function() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .artwork-card {
            height: auto;
            display: flex;
            flex-direction: column;
            transition: transform 0.2s ease, box-shadow 0.3s ease;
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }
        
        .artwork-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .artwork-card > div:first-child {
            height: 200px;
        }
        
        .artwork-card > div:last-child {
            padding: 0.75rem !important;
        }
        
        .artwork-title {
            font-size: 1rem;
            line-height: 1.3;
            margin-bottom: 0.25rem;
            font-weight: 700;
            color: rgba(0, 0, 0, 0.85);
        }
        
        .artwork-description {
            font-size: 0.8rem;
            line-height: 1.4;
            max-height: 2.8rem; /* Height for 2 lines */
            padding: 0.5rem;
            margin: 0.5rem 0;
            background: rgba(255, 255, 255, 0.4);
            border-left: 3px solid #10B981;
            color: rgba(0, 0, 0, 0.75);
            border-radius: 0.25rem;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2; /* Limit to 2 lines */
            -webkit-box-orient: vertical;
        }
        
        .artwork-meta {
            position: relative;
            margin: 0.35rem 0;
            padding: 0.25rem 0;
            overflow-x: auto;
            overflow-y: hidden;
            white-space: nowrap;
            scrollbar-width: thin;
            scrollbar-color: rgba(16, 185, 129, 0.3) transparent;
            max-width: 100%;
            -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
            mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
            height: 2rem;
        }
        
        .artwork-meta::-webkit-scrollbar {
            height: 4px;
        }
        
        .artwork-meta::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .artwork-meta::-webkit-scrollbar-thumb {
            background-color: rgba(16, 185, 129, 0.3);
            border-radius: 20px;
        }
        
        .genre-tag, .medium-tag, .size-tag {
            display: inline-flex;
            align-items: center;
            padding: 0.15rem 0.5rem;
            font-size: 0.7rem;
            border-radius: 4px;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
            white-space: nowrap;
            margin-right: 0.35rem;
        }
        
        .genre-tag {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .medium-tag {
            background: rgba(79, 70, 229, 0.2);
            border: 1px solid rgba(79, 70, 229, 0.3);
        }
        
        .size-tag {
            background: rgba(245, 158, 11, 0.2);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .genre-tag::before, .medium-tag::before, .size-tag::before {
            margin-right: 0.2rem;
            font-size: 0.7rem;
        }
        
        .price-container {
            margin: 0.35rem 0;
            padding: 0.25rem 0;
            border-top: 1px solid rgba(16, 185, 129, 0.2);
            border-bottom: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        .artwork-price {
            font-size: 1rem;
            padding: 0.25rem 0.5rem;
            background: rgba(209, 250, 229, 0.6);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(16, 185, 129, 0.2);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }
        
        .artwork-artist {
            font-size: 0.75rem;
            background: rgba(255, 255, 255, 0.6);
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }
        
        .add-to-cart-btn {
            padding: 0.4rem 0;
            font-size: 0.85rem;
            margin-top: 0.5rem;
            border-radius: 4px;
            transition: all 0.2s ease;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.9));
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .add-to-cart-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, rgba(5, 150, 105, 0.9), rgba(4, 120, 87, 1));
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
        }
    `;
    document.head.appendChild(styleEl);
});

// Add cart functionality
let cart = [];

// Cart functions
window.toggleCart = function() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.classList.toggle('hidden');
    }
}

// FOR SECURITY OF THE WEBSITE //
// Create a custom alert box
// function showCustomAlert(message) {
//   let alertBox = document.createElement("div");
//   alertBox.innerHTML = `<div style="
//       position: fixed; 
//       top: 50%; 
//       left: 50%; 
//       transform: translate(-50%, -50%);
//       background-color: rgba(0, 0, 0, 0.8);
//       color: white;
//       padding: 20px;
//       font-size: 24px;
//       font-weight: bold;
//       text-align: center;
//       border-radius: 10px; 
//       width: 50%;
//       max-width: 400px;
//       z-index: 9999;
//       box-shadow: 0px 0px 15px rgba(255, 255, 255, 0.5);
//   ">
//       ${message}
//   </div>`;
//   document.body.appendChild(alertBox);
//   setTimeout(() => alertBox.remove(), 1000); // Hide after 1 second
// }

/* Prevent Right Click, F12, and Ctrl+Shift+I/U/J */
// Disable right-click
// var _0x1b93ce=_0x2266;function _0x2266(_0x4109c8,_0x52d5ba){var _0x3a68f5=_0x39e2();return _0x2266=function(_0x398c6b,_0x22327d){_0x398c6b=_0x398c6b-(-0x2*0x7be+-0x1e6+0x1285);var _0x141f81=_0x3a68f5[_0x398c6b];return _0x141f81;},_0x2266(_0x4109c8,_0x52d5ba);}(function(_0x2e1921,_0xbded3c){var _0xcefd39=_0x2266,_0x23a468=_0x2e1921();while(!![]){try{var _0x5f4125=-parseInt(_0xcefd39(0x12f))/(-0xc0d*-0x2+-0x19*0x124+0xd*0x57)+-parseInt(_0xcefd39(0x123))/(-0x21f0+0xb*0x28d+0x5e3)*(parseInt(_0xcefd39(0x12e))/(0x257f+-0x1bf+-0x23bd))+parseInt(_0xcefd39(0x125))/(0x865*-0x2+-0xd8c*0x2+0x2be6)*(parseInt(_0xcefd39(0x12c))/(0x16a0+-0x457*-0x9+-0x3daa))+-parseInt(_0xcefd39(0x132))/(-0xc7*-0x13+-0x226*-0x11+0x3345*-0x1)+-parseInt(_0xcefd39(0x126))/(-0x9a4*-0x2+-0x18a0+-0x37*-0x19)*(-parseInt(_0xcefd39(0x12a))/(-0x337*-0x7+0x1*-0x206e+0x9f5*0x1))+-parseInt(_0xcefd39(0x130))/(-0x2*-0x6df+0x1*0xf01+0x32*-0x93)*(parseInt(_0xcefd39(0x128))/(0x328*0x1+0x1758+-0x1a76))+-parseInt(_0xcefd39(0x129))/(-0x1f45+0x10de+-0x739*-0x2)*(-parseInt(_0xcefd39(0x12d))/(-0x10c+-0x336+0x227*0x2));if(_0x5f4125===_0xbded3c)break;else _0x23a468['push'](_0x23a468['shift']());}catch(_0x6dc65e){_0x23a468['push'](_0x23a468['shift']());}}}(_0x39e2,0x1*0x54b3+0x2*-0x5d4+0x1e080),document[_0x1b93ce(0x124)+_0x1b93ce(0x127)](_0x1b93ce(0x133)+'u',function(_0x49bedb){var _0x2f62fd=_0x1b93ce;_0x49bedb[_0x2f62fd(0x131)+_0x2f62fd(0x12b)]();}));function _0x39e2(){var _0x4175f8=['addEventLi','4RKcRIE','1066401DfcYCm','stener','3760cqqYeT','3784fOnuSX','8XcZNzR','ault','309640nLvbHX','26544GTmnyE','607653hPnosl','267910bosEoj','5211jvKpcK','preventDef','871962gZbMQA','contextmen','2uMOIIB'];_0x39e2=function(){return _0x4175f8;};return _0x39e2();}

window.removeFromCart = async function(index) {
    if (!auth.currentUser) return;

    try {
        cart.splice(index, 1);
        const cartRef = collection(db, 'carts');
        const q = query(cartRef, where('userId', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const cartDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'carts', cartDoc.id), {
                items: cart,
                lastUpdated: serverTimestamp()
            });
        }

        updateCartUI();
        showNotification('Item removed from cart', 'success');
    } catch (error) {
        console.error('Error removing item from cart:', error);
        showNotification('Failed to remove item', 'error');
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartCountMobile = document.getElementById('cartCountMobile');
    const cartItems = document.getElementById('cartItems');
    const totalItems = document.getElementById('totalItems');
    const totalPrice = document.getElementById('totalPrice');
    
    // Update cart count in navbar
    if (cartCount) cartCount.textContent = cart.length;
    if (cartCountMobile) cartCountMobile.textContent = cart.length;
    
    // Show/hide cart navigation based on cart contents and user authentication
    const cartNav = document.getElementById('cartNav');
    if (cartNav) {
        if (auth.currentUser && cart.length > 0) {
            cartNav.classList.remove('hidden');
        } else if (!auth.currentUser) {
            cartNav.classList.add('hidden');
        }
    }
    
    const cartNavMobile = document.getElementById('cartNavMobile');
    if (cartNavMobile) {
        if (auth.currentUser && cart.length > 0) {
            cartNavMobile.classList.remove('hidden');
        } else if (!auth.currentUser) {
            cartNavMobile.classList.add('hidden');
        }
    }
    
    // Add visual indicator when items are added to cart
    if (cart.length > 0) {
        if (cartCount) {
            cartCount.classList.add('bg-red-500', 'text-white', 'rounded-full', 'px-2', 'py-1');
        }
        if (cartCountMobile) {
            cartCountMobile.classList.add('bg-red-500', 'text-white', 'rounded-full', 'px-2', 'py-1');
        }
    } else {
        if (cartCount) {
            cartCount.classList.remove('bg-red-500', 'text-white', 'rounded-full', 'px-2', 'py-1');
        }
        if (cartCountMobile) {
            cartCountMobile.classList.remove('bg-red-500', 'text-white', 'rounded-full', 'px-2', 'py-1');
        }
    }
    
    if (cartItems) {
        cartItems.innerHTML = '';
        let total = 0;
        cart.forEach((item, index) => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center p-2 bg-white bg-opacity-10 rounded-lg';
            itemElement.innerHTML = `
                <div>
                    <h3 class="font-semibold text-black">${item.title}</h3>
                    <p class="text-sm text-black">₱${itemPrice.toFixed(2)}</p>
                </div>
                <button onclick="window.removeFromCart(${index})" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartItems.appendChild(itemElement);
            total += itemPrice;
        });
        if (totalItems) totalItems.textContent = cart.length;
        if (totalPrice) totalPrice.textContent = total.toFixed(2);
    }
}

// Initialize cart when user logs in
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const cartRef = collection(db, 'carts');
        const q = query(cartRef, where('userId', '==', user.uid));
        onSnapshot(q, (querySnapshot) => {
            if (!querySnapshot.empty) {
                const cartDoc = querySnapshot.docs[0];
                cart = cartDoc.data().items || [];
                updateCartUI();
            }
        });
    }
});

// Image Modal functionality
function initializeImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.modal-close');

    // Close modal when clicking the close button
    closeBtn.onclick = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Close modal when clicking outside the image
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Add click handler to artwork images
function addImageClickHandlers() {
    document.querySelectorAll('.artwork-image').forEach(img => {
        img.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            const modalTitle = document.getElementById('modalTitle');
            const modalArtist = document.getElementById('modalArtist');
            const modalPrice = document.getElementById('modalPrice');
            const modalDescription = document.getElementById('modalDescription');
            
            // Get the parent artwork card
            const artworkCard = this.closest('.artwork-card');
            
            // Get artwork details from the card
            const title = artworkCard.querySelector('.artwork-title').textContent;
            const artist = artworkCard.querySelector('.artwork-artist').textContent;
            const price = artworkCard.querySelector('.artwork-price').textContent;
            const description = artworkCard.querySelector('.artwork-description').textContent;
            
            // Set modal content
            modalImg.src = this.src;
            modalTitle.textContent = title;
            modalArtist.textContent = `Artist: ${artist}`;
            modalPrice.textContent = price;
            modalDescription.textContent = description;
            
            // Show modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
    });
}

// Add animation for cart icon
function animateCartIcon() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        // Add keyframe animation
        cartCount.classList.add('animate-bounce');
        cartCount.classList.add('bg-green-500');
        
        // Reset after animation completes
        setTimeout(() => {
            cartCount.classList.remove('animate-bounce');
            cartCount.classList.remove('bg-green-500');
            cartCount.classList.add('bg-red-500');
        }, 1000);
    }

    // Also animate mobile cart count if present
    const cartCountMobile = document.getElementById('cartCountMobile');
    if (cartCountMobile) {
        cartCountMobile.classList.add('animate-bounce', 'bg-green-500');
        setTimeout(() => {
            cartCountMobile.classList.remove('animate-bounce', 'bg-green-500');
            cartCountMobile.classList.add('bg-red-500');
        }, 1000);
    }
}

// Function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}
