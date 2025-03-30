import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    serverTimestamp,
    updateDoc,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, db } from '../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getBasePath } from '../js/utils.js';

// Get profile ID from URL
const urlParams = new URLSearchParams(window.location.search);
const profileId = urlParams.get('profileId') || 'default';
const artistId = urlParams.get('artistId') || profileId;

// Check if user is admin
async function isAdmin(email) {
    if (!email) return false;
    const adminEmails = ['admin@artisthub.com', 'developer@artisthub.com'];
    return adminEmails.includes(email);
}

// Show/hide upload form
document.getElementById('showUploadForm')?.addEventListener('click', () => {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.style.display = uploadForm.style.display === 'none' ? 'block' : 'none';
    }
});

// Define toggleUploadForm before attaching to window
function toggleUploadForm() {
    console.log('Toggle upload form called');
    const modal = document.getElementById('uploadModal');
    const button = document.getElementById('toggleUploadForm');
    
    if (!modal || !button) {
        console.error('Missing modal or button elements');
        return;
    }

    const isHidden = modal.classList.contains('hidden');
    console.log('Is form hidden:', isHidden);
    
    if (isHidden) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        button.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Close</span>
        `;
        button.classList.remove('bg-green-500', 'hover:bg-green-600');
        button.classList.add('bg-red-500', 'hover:bg-red-600');
        
        // Reset form when opening
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.reset();
            const imagePreviewContainer = document.getElementById('imagePreviewContainer');
            const uploadPlaceholder = document.getElementById('uploadPlaceholder');
            if (imagePreviewContainer && uploadPlaceholder) {
                imagePreviewContainer.classList.add('hidden');
                uploadPlaceholder.classList.remove('hidden');
            }
        }
    } else {
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore background scrolling
        button.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Artwork</span>
        `;
        button.classList.remove('bg-red-500', 'hover:bg-red-600');
        button.classList.add('bg-green-500', 'hover:bg-green-600');
    }
}

// Make toggleUploadForm globally available
window.toggleUploadForm = toggleUploadForm;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Setting up upload form toggle');
    const toggleButton = document.getElementById('toggleUploadForm');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleUploadForm);
    }
});

// Add input validation for numeric fields
document.getElementById('price')?.addEventListener('input', (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0) {
        e.target.value = '';
    }
});

// Add stock validation
document.getElementById('stock')?.addEventListener('input', (e) => {
    let value = parseInt(e.target.value);
    if (isNaN(value) || value < 0) {
        e.target.value = '';
    }
});

// Initialize Cloudinary widget at the top level
const myWidget = cloudinary.createUploadWidget(
    {
        cloudName: 'dxeyr4pvf', 
        uploadPreset: 'artist_profiles',
        maxFiles: 1,
        sources: ['local', 'camera', 'url'],
        showAdvancedOptions: false,
        multiple: false,
        defaultSource: 'local',
        styles: {
            palette: {
                window: "#FFFFFF",
                windowBorder: "#90A0B3",
                tabIcon: "#0078FF",
                menuIcons: "#5A616A",
                textDark: "#000000",
                textLight: "#FFFFFF",
                link: "#0078FF",
                action: "#FF620C",
                inactiveTabIcon: "#0E2F5A",
                error: "#F44235",
                inProgress: "#0078FF",
                complete: "#20B832",
                sourceBg: "#E4EBF1"
            }
        }
    },
    (error, result) => {
        if (error) {
            console.error('Cloudinary upload error:', error);
            showNotification('Upload failed', 'error');
            return;
        }
        
        if (result.event === "success") {
            console.log('Upload successful:', result.info);
            const success = updateUploadPreview(result.info);
            if (!success) {
                showNotification('Failed to update preview', 'error');
            } else {
                showNotification('Image uploaded successfully!', 'success');
            }
        }
    }
);

// Add function to update preview
function updateUploadPreview(result) {
    try {
        const elements = {
            preview: document.getElementById('imagePreview'),
            previewContainer: document.getElementById('imagePreviewContainer'),
            placeholder: document.getElementById('uploadPlaceholder'),
            removeButton: document.getElementById('removeImage'),
            imageUrlInput: document.getElementById('imageUrlInput')
        };

        // Validate all required elements exist
        const missingElements = Object.entries(elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);

        if (missingElements.length > 0) {
            console.error('Missing elements:', missingElements.join(', '));
            return false;
        }

        // Get the image URL from the Cloudinary response
        const imageUrl = result.secure_url || result;
        
        // Update preview image
        elements.preview.src = imageUrl;
        elements.preview.onload = () => {
            elements.previewContainer.classList.remove('hidden');
            elements.placeholder.classList.add('hidden');
            elements.removeButton.classList.remove('hidden');
        };

        // Store URL in hidden input
        elements.imageUrlInput.value = imageUrl;

        // Show success notification
        showNotification('Image uploaded successfully!', 'success');

        return true;
    } catch (error) {
        console.error('Error updating preview:', error);
        showNotification('Failed to update image preview', 'error');
        return false;
    }
}

// Update click handlers
document.addEventListener('DOMContentLoaded', () => {
    console.log('Setting up upload handlers');

    // Setup upload placeholder click
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    if (uploadPlaceholder) {
        console.log('Adding click handler to uploadPlaceholder');
        uploadPlaceholder.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Opening Cloudinary widget');
            myWidget.open();
        });
    }

    // Add form submission handler
    const uploadFormContainer = document.getElementById('uploadFormContainer');
    const submitButton = uploadFormContainer?.querySelector('button[type="submit"]');
    
    if (uploadFormContainer && submitButton) {
        console.log('Setting up form submission');
        
        // Add click handler to submit button
        submitButton.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('Submit button clicked');

            if (!auth.currentUser) {
                showNotification('Please login to upload images', 'error');
                return;
            }

            const imageUrl = document.getElementById('imageUrlInput')?.value;
            if (!imageUrl) {
                showNotification('Please upload an image first', 'error');
                return;
            }

            try {
                const formData = {
                    title: document.getElementById('title')?.value,
                    description: document.getElementById('description')?.value,
                    price: parseFloat(document.getElementById('price')?.value || 0),
                    stock: parseInt(document.getElementById('stock')?.value || 0),
                    genre: document.getElementById('genre')?.value,
                    canvasSize: document.getElementById('canvasSize')?.value,
                    medium: document.getElementById('medium')?.value
                };

                if (!formData.title || !formData.description || isNaN(formData.price) || isNaN(formData.stock)) {
                    showNotification('Please fill in all required fields', 'error');
                    return;
                }

                const galleryCollection = collection(db, 'gallery_images');
                await addDoc(galleryCollection, {
                    artistEmail: auth.currentUser.email,
                    artistId: auth.currentUser.uid,
                    profileId: artistId,
                    imageId: generateImageId(),
                    imageUrl,
                    uploadDate: serverTimestamp(),
                    isPublic: true,
                    ...formData
                });

                // Reset form fields individually
                document.getElementById('title').value = '';
                document.getElementById('description').value = '';
                document.getElementById('price').value = '';
                document.getElementById('stock').value = '';
                document.getElementById('genre').value = '';
                document.getElementById('canvasSize').value = '';
                document.getElementById('medium').value = '';
                
                // Reset image preview
                document.getElementById('imagePreviewContainer')?.classList.add('hidden');
                document.getElementById('uploadPlaceholder')?.classList.remove('hidden');
                document.getElementById('removeImage')?.classList.add('hidden');
                document.getElementById('imageUrlInput').value = '';
                
                // Close modal
                toggleUploadForm();
                
                // Reload images and show success message
                await loadImages();
                showNotification('Artwork uploaded successfully!', 'success');
                
            } catch (error) {
                console.error('Error uploading artwork:', error);
                showNotification('Failed to upload artwork', 'error');
            }
        });
    } else {
        console.error('Upload form or submit button not found');
    }

    // Setup drag and drop
    const uploadArea = document.querySelector('.border-dashed');
    if (uploadArea) {
        console.log('Setting up drag and drop handlers');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('border-blue-500');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('border-blue-500');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('border-blue-500');
            myWidget.open();
        });
    }
});

// Remove image preview
document.getElementById('removeImage')?.addEventListener('click', () => {
    const previewContainer = document.getElementById('imagePreviewContainer');
    const placeholder = document.getElementById('uploadPlaceholder');
    const removeButton = document.getElementById('removeImage');
    const imageUrlInput = document.getElementById('imageUrlInput');

    if (previewContainer && placeholder && removeButton && imageUrlInput) {
        previewContainer.classList.add('hidden');
        placeholder.classList.remove('hidden');
        removeButton.classList.add('hidden');
        imageUrlInput.value = '';
    }
});

// Function to generate unique image ID
function generateImageId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `AHB-${timestamp}-${random}`;
}

// Function to add watermark to image
async function addWatermark(imageFile) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw original image
            ctx.drawImage(img, 0, 0);
            
            // Configure watermark text
            const imageId = generateImageId();
            const watermarkText = `ArtistHub Baguio | ${imageId}`;
            
            // Set watermark style
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = `${img.width * 0.05}px Arial`;
            ctx.rotate(-Math.PI / 6); // Rotate text diagonally
            
            // Calculate text metrics for spacing
            const textMetrics = ctx.measureText(watermarkText);
            const textWidth = textMetrics.width;
            const spacing = textWidth * 2;
            
            // Add multiple watermarks across the image
            for (let y = -img.height; y < img.height * 2; y += spacing) {
                for (let x = -img.width; x < img.width * 2; x += spacing) {
                    ctx.fillText(watermarkText, x, y);
                }
            }
            
            // Reset rotation
            ctx.rotate(Math.PI / 6);
            
            // Convert canvas to blob
            canvas.toBlob((blob) => {
                resolve({
                    file: new File([blob], imageFile.name, {
                        type: 'image/jpeg',
                        lastModified: new Date().getTime()
                    }),
                    imageId: imageId
                });
            }, 'image/jpeg', 0.9);
        };
        
        // Load image from file
        img.src = URL.createObjectURL(imageFile);
    });
}

// Load images
async function loadImages() {
    const container = document.getElementById('galleryContainer');
    if (!container) {
        console.error('Gallery container not found');
        return;
    }
    
    container.innerHTML = '<p class="text-center text-gray-500">Loading gallery...</p>';

    try {
        const galleryCollection = collection(db, 'gallery_images');
        let q = query(galleryCollection, where('profileId', '==', artistId));

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-center text-gray-500">No images found in the gallery.</p>';
            return;
        }

        container.innerHTML = ''; // Clear loading message
        
        // Use Promise.all to handle async card creation
        const cards = await Promise.all(
            querySnapshot.docs.map(doc => createImageCard(doc.id, doc.data()))
        );
        
        cards.forEach(card => container.appendChild(card));
        
    } catch (error) {
        console.error('Error loading images:', error);
        container.innerHTML = '<p class="text-center text-red-500">Error loading gallery images. Please try again later.</p>';
    }
}

// Create image card
const styles = `
.art-gallery-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.art-gallery-item {
    margin-bottom: 2rem;
    position: relative;
    z-index: 1;
}

.art-gallery-protective-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 20rem;
    z-index: 1;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    border-radius: 0.75rem 0 0 0;
}

.art-gallery-modal.art-modal-active {
    opacity: 1;
    pointer-events: auto;
}

.art-gallery-modal-content {
    max-width: 90%;
    max-height: 90vh;
    object-fit: contain;
    cursor: pointer;
}

.art-gallery-modal-close {
    position: absolute;
    top: 15px;
    right: 35px;
    color: #f1f1f1;
    font-size: 40px;
    font-weight: bold;
    cursor: pointer;
}

.art-gallery-card-image {
    width: 100%;
    height: 20rem;
    object-fit: cover;
    border-radius: 0.75rem 0.75rem 0 0;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.art-gallery-card-image:hover {
    transform: scale(1.03);
}

.art-gallery-item-content {
    position: relative;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.art-gallery-item-content:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.art-gallery-item {
    margin-bottom: 2rem;
}

.art-gallery-price {
    color: #10B981;
    font-weight: 600;
    font-size: 1.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 0.5rem;
    background: rgba(16, 185, 129, 0.1);
    display: inline-block;
}

.art-gallery-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1F2937;
    line-height: 1.2;
    margin-bottom: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.art-gallery-description {
    color: black;
    font-size: 1rem;
    line-height: 1.6;
    margin: 1.5rem 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    border-left: 4px solid #10B981;
    min-height: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
}

.art-gallery-button {
    background: #10B981;
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: all 0.3s ease;
    width: 100%;
    text-align: center;
    display: inline-block;
}

.art-gallery-button:hover {
    background: #059669;
    transform: translateY(-2px);
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Create modal container
const modal = document.createElement('div');
modal.className = 'art-gallery-modal';
modal.innerHTML = `
    <span class="art-gallery-modal-close">&times;</span>
    <img class="art-gallery-modal-content" id="art-gallery-modal-img">
`;
document.body.appendChild(modal);

// Add isInCart check function
function isItemInCart(artworkId) {
    return cart.some(item => item.artworkId === artworkId);
}

// Add function to check if item is in anyone's cart
async function isItemInAnyCart(artworkId) {
    const cartRef = collection(db, 'carts');
    const snapshot = await getDocs(cartRef);
    return snapshot.docs.some(doc => 
        doc.data().items?.some(item => item.artworkId === artworkId)
    );
}

// Add genre icons mapping to match shop.html
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

// Helper function to format genre tags
function formatGenreTags(genreString) {
    if (!genreString) return '<span class="genre-tag">Art</span>';
    
    if (genreString.includes(',')) {
        const genres = genreString.split(',').map(g => g.trim());
        return genres.map(g => 
            `<span class="genre-tag">${g.charAt(0).toUpperCase() + g.slice(1)}</span>`
        ).join('');
    }
    
    return `<span class="genre-tag">${genreString.charAt(0).toUpperCase() + genreString.slice(1)}</span>`;
}

// Modified createImageCard function to handle async properly
async function createImageCard(docId, data) {
    try {
        if (!data || !docId) {
            console.error('Missing data or docId for card creation');
            return null;
        }

        const hasImage = data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '';
        const imageUrl = hasImage ? data.imageUrl : 'https://via.placeholder.com/300x200?text=No+Image+Available';
        const formattedPrice = parseFloat(data.price || 0).toLocaleString('en-PH', {
            style: 'currency',
            currency: 'PHP'
        });
        
        // Format genre and other metadata for display with uppercase first letter
        const genre = data.genre ? data.genre.charAt(0).toUpperCase() + data.genre.slice(1) : 'Art';
        const medium = data.medium ? data.medium.charAt(0).toUpperCase() + data.medium.slice(1) : '';
        const size = data.canvasSize || '';
        const genreIcon = genreIcons[genre.toLowerCase()] || genreIcons.default;
        
        const card = document.createElement('div');
        card.className = 'artwork-card bg-white rounded-lg shadow-lg overflow-hidden';
        card.innerHTML = `
            <div class="relative">
                <img 
                    src="${imageUrl}" 
                    alt="${data.title || 'Untitled artwork'}" 
                    class="artwork-image w-full h-40 object-cover"
                    onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+Error'; this.classList.add('img-error');"
                    loading="lazy"
                >
                <div class="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white px-1 py-0.5 text-xs">
                    <i class="fas fa-${genreIcon} mr-1"></i>${genre}
                </div>
            </div>
            <div class="p-3 flex flex-col h-[300px]">
                <div class="flex items-center gap-1 mb-1">
                    <i class="fas fa-${genreIcon} text-sm text-gray-600"></i>
                    <h3 class="artwork-title">${data.title || 'Untitled artwork'}</h3>
                </div>
                <div class="price-container mb-1">
                    <p class="artwork-price">${formattedPrice}</p>
                    <span class="artwork-artist">
                        ${data.artist ? `by ${data.artist}` : ''}
                    </span>
                </div>
                
                <div class="artwork-meta flex flex-wrap gap-1">
                    <span class="genre-tag">
                        <i class="fas fa-${genreIcon} mr-1"></i>${genre}
                    </span>
                    ${medium ? `<span class="medium-tag"><i class="fas fa-pencil-alt mr-1"></i>${medium}</span>` : ''}
                    ${size ? `<span class="size-tag"><i class="fas fa-ruler mr-1"></i>${size}</span>` : ''}
                </div>
                
                <p class="artwork-description text-gray-600 h-20 overflow-y-auto mb-auto">${data.description || 'No description available.'}</p>
                
                <div class="mt-auto pt-1">
                    ${auth.currentUser ? 
                        `<button onclick="window.addToCart('${docId}', '${(data.title || 'Untitled artwork').replace(/'/g, "\\'")}', ${parseFloat(data.price || 0)})" 
                            class="add-to-cart-btn artwork-button w-full text-white rounded hover:bg-green-600 transition duration-200">
                            <i class="fas fa-cart-plus mr-1"></i> Add to Cart
                        </button>` :
                        `<button onclick="window.toggleLoginFlyout()" 
                            class="add-to-cart-btn artwork-button w-full bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200">
                            <i class="fas fa-sign-in-alt mr-1"></i> Login to Add to Cart
                        </button>`
                    }
                </div>
            </div>
        `;

        // Add image modal functionality
        const img = card.querySelector('.artwork-image');
        if (img) {
            img.addEventListener('click', () => {
                const modalImg = document.querySelector('#art-gallery-modal-img');
                if (modalImg) {
                    modalImg.src = imageUrl;
                    modal.classList.add('art-modal-active');
                }
            });
        }

        return card;
    } catch (error) {
        console.error('Error creating image card:', error);
        return null;
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchArtworks')?.value.toLowerCase() || '';
    const activeGenre = document.querySelector('.genre-btn.active')?.dataset.genre || '';
    const size = document.getElementById('sizeFilter')?.value || '';
    const medium = document.getElementById('mediumFilter')?.value || '';

    const filteredArtworks = allArtworks.filter(artwork => {
        // Search in all relevant fields
        const searchableText = [
            artwork.title,
            artwork.description,
            artwork.artist,
            artwork.genre,
            artwork.canvasSize,
            artwork.medium
        ].map(text => text?.toLowerCase() || '').join(' ');

        const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
        const matchesGenre = !activeGenre || artwork.genre?.toLowerCase() === activeGenre.toLowerCase();
        const matchesSize = !size || artwork.canvasSize?.toLowerCase().includes(size.toLowerCase());
        const matchesMedium = !medium || artwork.medium?.toLowerCase() === medium.toLowerCase();

        return matchesSearch && matchesGenre && matchesSize && matchesMedium;
    });

    displayArtworks(filteredArtworks);
}

// Add modal close functionality
const closeBtn = modal.querySelector('.art-gallery-modal-close');
closeBtn.addEventListener('click', () => {
    modal.classList.remove('art-modal-active');
});

// Close modal when clicking outside the image
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('art-modal-active');
    }
});

// Close modal with escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('art-modal-active')) {
        modal.classList.remove('art-modal-active');
    }
});

// Delete image
window.deleteImage = async (docId) => {
    if (!auth.currentUser) return;
    
    if (confirm('Are you sure you want to delete this image?')) {
        try {
            const docRef = doc(db, 'gallery_images', docId);
            await deleteDoc(docRef);
            loadImages();
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image. Please try again.');
        }
    }
};

// Update UI based on user role
async function updateUIForUserRole(user) {
    const uploadControls = document.getElementById('uploadControls');
    const uploadForm = document.getElementById('uploadForm');
    const uploadButtonContainer = document.getElementById('uploadButtonContainer');
    const cartNav = document.getElementById('cartNav');
    const cartNavMobile = document.getElementById('cartNavMobile');

    // Hide all controls by default
    if (uploadControls) uploadControls.style.display = 'none';
    if (uploadButtonContainer) uploadButtonContainer.style.display = 'none';
    if (cartNav) cartNav.classList.add('hidden');
    if (cartNavMobile) cartNavMobile.classList.add('hidden');

    // If user is not logged in, keep the form hidden
    if (!user) {
        console.log('No user is logged in.');
        if (uploadForm) uploadForm.classList.add('hidden');
        return; // Not logged in
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(user.email);
    
    // Check if user is owner
    const userIsOwner = artistId === user.uid;

    // Show cart for regular users (not admin and not artist)
    if (!userIsAdmin && !userIsOwner) {
        if (cartNav) cartNav.classList.remove('hidden');
        if (cartNavMobile) cartNavMobile.classList.remove('hidden');
    }

    // Show upload controls for owner
    if (userIsOwner) {
        console.log('Displaying upload controls for owner.');
        if (uploadControls) uploadControls.style.display = 'block';
        if (uploadButtonContainer) uploadButtonContainer.style.display = 'block';
        if (uploadForm) {
            uploadForm.classList.remove('hidden'); // Show the upload form
        }
    } else {
        // Ensure upload form stays hidden for non-owners
        if (uploadForm) uploadForm.classList.add('hidden');
    }

    // Admin can see all images and delete buttons but not the upload form
    if (userIsAdmin) {
        console.log('Admin logged in, showing upload button container.');
        if (uploadButtonContainer) uploadButtonContainer.style.display = 'block';
    }
}

// Cart Management
let cart = [];

// Updated cart initialization
function initializeCart(userId) {
    if (!userId) return;
    
    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userId', '==', userId));
    
    // Listen for real-time updates to cart
    onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
            const cartDoc = querySnapshot.docs[0];
            cart = cartDoc.data().items || [];
            
            // Show cart navigation if user is not admin or artist
            const cartNav = document.getElementById('cartNav');
            const cartNavMobile = document.getElementById('cartNavMobile');
            
            if (auth.currentUser && auth.currentUser.uid !== artistId) {
                cartNav?.classList.remove('hidden');
                cartNavMobile?.classList.remove('hidden');
            }
            
            updateCartUI();
        }
    });
}

// Make cart functions globally accessible
window.toggleCart = function() {
    console.log('Toggle cart called');
    const cartModal = document.getElementById('cartModal');
    console.log('Cart modal element:', cartModal);
    if (cartModal) {
        console.log('Current hidden state:', cartModal.classList.contains('hidden'));
        cartModal.classList.toggle('hidden');
        console.log('New hidden state:', cartModal.classList.contains('hidden'));
    } else {
        console.error('Cart modal not found');
    }
}

window.addToCart = async function(artworkId, title, price, stock) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please login to add items to cart');
        return;
    }
    
    // Ensure price is a number
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
        console.error('Invalid price:', price);
        alert('Invalid price. Please try again.');
        return;
    }
    
    // Check if last item and if it's in anyone's cart
    if (stock === 1) {
        const isReserved = await isItemInAnyCart(artworkId);
        if (isReserved) {
            showNotification('This item is already reserved', 'error');
            return;
        }
    }

    const item = { 
        artworkId, 
        title, 
        price: numericPrice,
        addedAt: serverTimestamp() // Add timestamp
    };
    cart.push(item);
    
    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    try {
        if (querySnapshot.empty) {
            await addDoc(cartRef, {
                userId: user.uid,
                items: cart,
                lastUpdated: serverTimestamp()
            });
        } else {
            const cartDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'carts', cartDoc.id), {
                items: cart,
                lastUpdated: serverTimestamp()
            });
        }
        
        // Update button text and style
        const cartButton = document.getElementById(`cartButton-${artworkId}`);
        if (cartButton && stock === 1) {
            cartButton.textContent = 'Item Reserved';
            cartButton.classList.add('bg-gray-500', 'hover:bg-gray-500', 'cursor-not-allowed');
            cartButton.disabled = true;
        }
        
        updateCartUI();
        showNotification('Item added to cart!', 'success');
        animateCartIcon();
        
    } catch (error) {
        console.error('Error updating cart:', error);
        showNotification('Failed to add item to cart', 'error');
    }
}

// Add notification functionality
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white transform transition-transform duration-300 translate-y-full`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${type === 'success' ? '✓' : '✕'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateY(full)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

window.checkout = async function() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    // Here you would implement the checkout process
    alert('Checkout functionality will be implemented soon!');
}

// Updated cart UI update function
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartCountMobile = document.getElementById('cartCountMobile');
    const cartItems = document.getElementById('cartItems');
    const totalItems = document.getElementById('totalItems');
    const totalPrice = document.getElementById('totalPrice');
    
    if (cartCount) cartCount.textContent = cart.length;
    if (cartCountMobile) cartCountMobile.textContent = cart.length;
    
    if (cartItems) {
        cartItems.innerHTML = '';
        let total = 0;
        
        cart.forEach((item, index) => {
            // Ensure price is a number
            const itemPrice = parseFloat(item.price) || 0;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center p-2 bg-white bg-opacity-10 rounded-lg';
            itemElement.innerHTML = `
                <div>
                    <h3 class="font-semibold">${item.title}</h3>
                    <p class="text-sm">₱${itemPrice.toFixed(2)}</p>
                </div>
                <button onclick="window.removeFromCart(${index})" class="text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            `;
            cartItems.appendChild(itemElement);
            total += itemPrice;
        });
        
        if (totalItems) totalItems.textContent = cart.length;
        if (totalPrice) totalPrice.textContent = total.toFixed(2);
    }
    
    // Make the cart nav visible if there are items
    const cartNav = document.getElementById('cartNav');
    const cartNavMobile = document.getElementById('cartNavMobile');
    
    if (cart.length > 0) {
        cartNav?.classList.remove('hidden');
        cartNavMobile?.classList.remove('hidden');
    }
}

// Add real-time updates for cart status
function initializeCartTracking() {
    const cartsRef = collection(db, 'carts');
    onSnapshot(cartsRef, async (snapshot) => {
        const galleryItems = document.querySelectorAll('.art-gallery-item');
        for (const item of galleryItems) {
            const button = item.querySelector('[id^="cartButton-"]');
            if (button) {
                const artworkId = button.id.replace('cartButton-', '');
                const stockText = item.querySelector('.text-sm.text-white').textContent;
                const stock = parseInt(stockText.replace('Stock: ', ''));
                
                if (stock === 1) {
                    const isReserved = await isItemInAnyCart(artworkId);
                    if (isReserved && !button.disabled) {
                        button.textContent = 'Item Reserved';
                        button.classList.add('bg-gray-500', 'hover:bg-gray-500', 'cursor-not-allowed');
                        button.disabled = true;
                    }
                }
            }
        }
    });
}

// Initialize gallery
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('User logged in:', user.email);
        const admin = await isAdmin(user.email);
        updateUIForUserRole(user);
        loadImages();
        initializeCart(user.uid);
        initializeCartTracking();
    } else {
        console.log('No user logged in');
        updateUIForUserRole(null);
        loadImages();
    }
});

function onSignIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider).then((result) => {
        // Handle the signed-in user information
        var user = result.user;
        console.log('User signed in: ', user);
    }).catch((error) => {
        console.error('Error during sign-in: ', error);
    });
}

// Function to handle navigation events
window.navToEvent = function(url) {
    window.location.href = url;
}

// Security measures - Keep the code clean and readable
const security = {
    disableRightClick: () => {
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO') {
                e.preventDefault();
            }
        });
    },

    disableKeyboardShortcuts: () => {
        document.addEventListener('keydown', (e) => {
            // Prevent Ctrl + Shift + I/J/C/U
            if ((e.ctrlKey && e.shiftKey) && 
                (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'U')) {
                e.preventDefault();
                return false;
            }
            // Prevent F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
            // Prevent PrintScreen
            if (e.key === 'PrintScreen') {
                navigator.clipboard.writeText('');
                return false;
            }
        });
    },

    init: function() {
        this.disableRightClick();
        this.disableKeyboardShortcuts();
    }
};

// Initialize security measures
document.addEventListener('DOMContentLoaded', () => {
    security.init();
    const uploadFormContainer = document.getElementById('uploadFormContainer');
    if (uploadFormContainer) {
        uploadFormContainer.style.position = 'relative';
        uploadFormContainer.style.zIndex = '10000';
    }
});