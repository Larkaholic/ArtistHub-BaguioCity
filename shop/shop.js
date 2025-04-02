import { collection, getDocs, doc, getDoc, query, limit, orderBy, onSnapshot, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, auth } from '../js/firebase-config.js';

let allArtworks = []; // Store all artworks for filtering
let isLoading = true;

document.addEventListener('DOMContentLoaded', () => {
    // Check if gallery container exists
    const galleryContainer = document.getElementById('galleryContainer');
    if (!galleryContainer) {
        document.body.innerHTML = '<div class="p-8 text-center text-red-500">Error: Gallery container not found</div>';
        return;
    }
    
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
        
        // Now try with a proper query
        let artworksQuery = query(artworksRef, limit(50));
        
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
        
        applyFilters(); // Initial display with filters
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
            artwork.artist?.toLowerCase().includes(searchTerm));

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
    
    // Update cart buttons based on verification status after displaying artwork cards
    updateAddToCartButtons();
}

function createArtworkCard(id, data, genreIcon) {
    const hasImage = data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '';
    const imageUrl = hasImage ? data.imageUrl : 'https://via.placeholder.com/300x200?text=No+Image+Available';
    const formattedPrice = parseFloat(data.price || 0).toLocaleString('en-PH', {
        style: 'currency',
        currency: 'PHP'
    });
    
    const card = document.createElement('div');
    card.className = 'artwork-card bg-white rounded-lg shadow-lg overflow-hidden';
    card.innerHTML = `
        <div class="relative">
            <img 
                src="${imageUrl}" 
                alt="${data.title || 'Untitled artwork'}" 
                class="artwork-image w-full h-48 object-cover"
                onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+Error'; this.classList.add('img-error');"
                loading="lazy"
            >
            <div class="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white px-2 py-1 text-sm">
                ${data.genre || 'Art'}
            </div>
        </div>
        <div class="p-6">
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                    <i class="fas fa-${genreIcon} text-xl text-gray-600"></i>
                    <h3 class="artwork-title text-xl font-bold">${data.title || 'Untitled artwork'}</h3>
                </div>
                <div class="flex justify-between items-center">
                    <p class="artwork-price text-lg font-semibold text-green-600">${formattedPrice}</p>
                    <span class="text-sm text-gray-500">
                        ${data.artist ? `by ${data.artist}` : ''}
                    </span>
                </div>
            </div>
            <p class="artwork-description mt-2 text-gray-600">${data.description || 'No description available.'}</p>
            <div class="flex justify-center">
                ${auth.currentUser ? 
                    `<button onclick="window.addToCart('${id}', '${(data.title || 'Untitled artwork').replace(/'/g, "\\'")}', ${parseFloat(data.price || 0)})" 
                        class="add-to-cart-btn artwork-button mt-4 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200">
                        <i class="fas fa-cart-plus mr-1"></i> Add to Cart
                    </button>` :
                    `<button onclick="window.toggleLoginFlyout()" 
                        class="add-to-cart-btn artwork-button mt-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200">
                        <i class="fas fa-sign-in-alt mr-1"></i> Login to Add to Cart
                    </button>`
                }
            </div>
        </div>
    `;
    return card;
}

<<<<<<< HEAD
// FOR SECURITY OF THE WEBSITE //

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
  setTimeout(() => alertBox.remove(), 1000); // Hide after 1 second
}

/* Prevent Right Click, F12, and Ctrl+Shift+I/U/J */
// Disable right-click
var _0x1b93ce=_0x2266;function _0x2266(_0x4109c8,_0x52d5ba){var _0x3a68f5=_0x39e2();return _0x2266=function(_0x398c6b,_0x22327d){_0x398c6b=_0x398c6b-(-0x2*0x7be+-0x1e6+0x1285);var _0x141f81=_0x3a68f5[_0x398c6b];return _0x141f81;},_0x2266(_0x4109c8,_0x52d5ba);}(function(_0x2e1921,_0xbded3c){var _0xcefd39=_0x2266,_0x23a468=_0x2e1921();while(!![]){try{var _0x5f4125=-parseInt(_0xcefd39(0x12f))/(-0xc0d*-0x2+-0x19*0x124+0xd*0x57)+-parseInt(_0xcefd39(0x123))/(-0x21f0+0xb*0x28d+0x5e3)*(parseInt(_0xcefd39(0x12e))/(0x257f+-0x1bf+-0x23bd))+parseInt(_0xcefd39(0x125))/(0x865*-0x2+-0xd8c*0x2+0x2be6)*(parseInt(_0xcefd39(0x12c))/(0x16a0+-0x457*-0x9+-0x3daa))+-parseInt(_0xcefd39(0x132))/(-0xc7*-0x13+-0x226*-0x11+0x3345*-0x1)+-parseInt(_0xcefd39(0x126))/(-0x9a4*-0x2+-0x18a0+-0x37*-0x19)*(-parseInt(_0xcefd39(0x12a))/(-0x337*-0x7+0x1*-0x206e+0x9f5*0x1))+-parseInt(_0xcefd39(0x130))/(-0x2*-0x6df+0x1*0xf01+0x32*-0x93)*(parseInt(_0xcefd39(0x128))/(0x328*0x1+0x1758+-0x1a76))+-parseInt(_0xcefd39(0x129))/(-0x1f45+0x10de+-0x739*-0x2)*(-parseInt(_0xcefd39(0x12d))/(-0x10c+-0x336+0x227*0x2));if(_0x5f4125===_0xbded3c)break;else _0x23a468['push'](_0x23a468['shift']());}catch(_0x6dc65e){_0x23a468['push'](_0x23a468['shift']());}}}(_0x39e2,0x1*0x54b3+0x2*-0x5d4+0x1e080),document[_0x1b93ce(0x124)+_0x1b93ce(0x127)](_0x1b93ce(0x133)+'u',function(_0x49bedb){var _0x2f62fd=_0x1b93ce;_0x49bedb[_0x2f62fd(0x131)+_0x2f62fd(0x12b)]();}));function _0x39e2(){var _0x4175f8=['addEventLi','4RKcRIE','1066401DfcYCm','stener','3760cqqYeT','3784fOnuSX','8XcZNzR','ault','309640nLvbHX','26544GTmnyE','607653hPnosl','267910bosEoj','5211jvKpcK','preventDef','871962gZbMQA','contextmen','2uMOIIB'];_0x39e2=function(){return _0x4175f8;};return _0x39e2();}
=======
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
>>>>>>> 0b3e66d650448d12944b05c9764bb956b2e1d024

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
            button.title = ''; // Remove any tooltip
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

// Update the addToCart function to check eligibility first
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
    
    // Original addToCart functionality can continue here
    alert(`${productName} added to cart!`);
    // Implement actual cart functionality here
}

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
    loadArtworks(); // Reload artworks when auth state changes
});

// Export the loadArtworks function for direct access
window.loadArtworks = loadArtworks;
