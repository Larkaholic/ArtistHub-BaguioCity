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
    updateDoc
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

// Add global toggle function for upload form
window.toggleUploadForm = function() {
    console.log('Toggle upload form called');
    const container = document.getElementById('uploadFormContainer');
    const button = document.getElementById('toggleUploadForm');
    console.log('Container:', container);
    console.log('Button:', button);
    
    if (!container || !button) {
        console.error('Missing container or button elements');
        return;
    }

    const isHidden = container.classList.contains('hidden');
    console.log('Is form hidden:', isHidden);
    container.classList.toggle('hidden');
    
    if (isHidden) {
        button.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Close</span>
        `;
        button.classList.remove('bg-green-500', 'hover:bg-green-600');
        button.classList.add('bg-red-500', 'hover:bg-red-600');
    } else {
        button.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Artwork</span>
        `;
        button.classList.remove('bg-red-500', 'hover:bg-red-600');
        button.classList.add('bg-green-500', 'hover:bg-green-600');
    }
};

// Add input validation for numeric fields
document.getElementById('price')?.addEventListener('input', (e) => {
    let value = parseFloat(e.target.value);
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
        defaultSource: 'local'
    },
    (error, result) => {
        console.log('Cloudinary callback triggered:', result?.event);
        if (error) {
            console.error('Cloudinary error:', error);
            return;
        }
        
        if (result.event === "success") {
            try {
                console.log('Upload successful:', result.info);
                
                // Get all required elements
                const elements = {
                    preview: document.getElementById('imagePreview'),
                    previewContainer: document.getElementById('imagePreviewContainer'),
                    placeholder: document.getElementById('uploadPlaceholder'),
                    removeButton: document.getElementById('removeImage'),
                    uploadForm: document.getElementById('uploadForm'),
                    imageUrlInput: document.getElementById('imageUrlInput')
                };

                // Check if all elements exist
                const missingElements = Object.entries(elements)
                    .filter(([key, element]) => !element)
                    .map(([key]) => key);

                if (missingElements.length > 0) {
                    console.error('Missing elements:', missingElements);
                    return;
                }

                // Update UI elements
                elements.preview.src = result.info.secure_url;
                elements.previewContainer.classList.remove('hidden');
                elements.placeholder.classList.add('hidden');
                elements.removeButton.classList.remove('hidden');
                elements.uploadForm.dataset.imageUrl = result.info.secure_url;
                elements.imageUrlInput.value = result.info.secure_url;

            } catch (error) {
                console.error('Error updating UI after upload:', error);
            }
        }
    }
);

// Update click handlers
document.addEventListener('DOMContentLoaded', () => {
    console.log('Setting up upload handlers');

    // Function to handle upload click
    const openCloudinaryWidget = (e) => {
        console.log('Opening Cloudinary widget');
        e.preventDefault();
        e.stopPropagation();
        myWidget.open();
    };

    // Add click handler only to the placeholder div
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    if (uploadPlaceholder) {
        console.log('Adding click handler to uploadPlaceholder');
        uploadPlaceholder.addEventListener('click', openCloudinaryWidget);
    }

    // Remove click handler from imageFile input
    const fileInput = document.getElementById('imageFile');
    if (fileInput) {
        fileInput.style.display = 'none'; // Hide the file input since we're using Cloudinary
    }

    // Handle drag and drop on the upload area
    const uploadArea = document.querySelector('.flex.flex-col.items-center.justify-center.border-2.border-dashed');
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

        // Prevent click propagation on the upload area
        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea || e.target === uploadPlaceholder) {
                openCloudinaryWidget(e);
            }
        });
    }
});

// Update form submission to use stored Cloudinary URL
document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
        alert('Please login to upload images');
        return;
    }

    const imageUrlInput = document.getElementById('imageUrlInput');
    if (!imageUrlInput?.value) {
        alert('Please upload an image first');
        return;
    }

    const title = document.getElementById('title')?.value;
    const description = document.getElementById('description')?.value;
    // Store price with two decimal places
    const rawPrice = document.getElementById('price')?.value || 0;
    const price = parseFloat(rawPrice).toFixed(2);

    if (!title || !description || isNaN(parseFloat(price))) {
        alert('Please fill in all fields, including a valid price.');
        return;
    }

    try {
        const galleryCollection = collection(db, 'gallery_images');
        await addDoc(galleryCollection, {
            artistEmail: auth.currentUser.email,
            artistId: auth.currentUser.uid,
            profileId: artistId,
            imageId: generateImageId(),
            title,
            description,
            price: parseFloat(price), // Store as number but formatted
            imageUrl: imageUrlInput.value,
            uploadDate: serverTimestamp(),
            isPublic: true
        });

        if (uploadForm) {
            uploadForm.reset();
        }
        loadImages();
        alert('Image uploaded successfully!');
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
    }
});

// Remove image preview
document.getElementById('removeImage')?.addEventListener('click', () => {
    const previewContainer = document.getElementById('imagePreviewContainer');
    const placeholder = document.getElementById('uploadPlaceholder');
    const removeButton = document.getElementById('removeImage');
    const uploadForm = document.getElementById('uploadForm');
    const imageUrlInput = document.getElementById('imageUrlInput');

    previewContainer.classList.add('hidden');
    placeholder.classList.remove('hidden');
    removeButton.classList.add('hidden');
    delete uploadForm.dataset.imageUrl;
    imageUrlInput.value = ''; // Clear hidden input value
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
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const card = createImageCard(doc.id, data);
            container.appendChild(card);
        });
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
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
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

.art-gallery-protective-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 20rem;
    z-index: 2;
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;
    border-radius: 0.75rem 0.75rem 0 0;
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

// Modified createImageCard function
function createImageCard(docId, data) {
    // Capitalize first letter of title and description
    const formattedTitle = data.title.charAt(0).toUpperCase() + data.title.slice(1);
    const formattedDescription = data.description.charAt(0).toUpperCase() + data.description.slice(1);
    
    const card = document.createElement('div');
    card.className = 'art-gallery-item';
    card.innerHTML = `
        <div class="art-gallery-item-content">
            <div class="art-gallery-protective-layer"></div>
            <img src="${data.imageUrl}" alt="${formattedTitle}" class="art-gallery-card-image">
            <div class="p-6">
                <div class="flex flex-col gap-2">
                    <h3 class="art-gallery-title">${formattedTitle}</h3>
                    <div class="flex justify-between items-center">
                        <p class="art-gallery-price">₱${parseFloat(data.price || 0).toFixed(2)}</p>
                        ${auth.currentUser && auth.currentUser.uid === artistId ?
                            `<button onclick="deleteImage('${docId}')" class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                            </button>` : ''}
                    </div>
                </div>
                <p class="art-gallery-description">${formattedDescription || 'No description available.'}</p>
                ${auth.currentUser ? 
                    `<button onclick="window.addToCart('${docId}', '${formattedTitle}', ${parseFloat(data.price)})" 
                        class="art-gallery-button">
                        Add this to Cart
                    </button>` : ''
                }
            </div>
        </div>
    `;
    
    // Add click event to image
    const img = card.querySelector('.art-gallery-card-image');
    img.addEventListener('click', () => {
        const modalImg = document.querySelector('#art-gallery-modal-img');
        modalImg.src = data.imageUrl;
        modal.classList.add('art-modal-active');
    });

    // Add event listeners to prevent right-click and drag
    const protectiveLayer = card.querySelector('.art-gallery-protective-layer');
    protectiveLayer.addEventListener('contextmenu', (e) => e.preventDefault());
    protectiveLayer.addEventListener('dragstart', (e) => e.preventDefault());
    
    // Maintain click functionality for modal
    protectiveLayer.addEventListener('click', () => {
        const modalImg = document.querySelector('#art-gallery-modal-img');
        modalImg.src = data.imageUrl;
        modal.classList.add('art-modal-active');
    });
    
    return card;
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

function initializeCart(userId) {
    if (!userId) return;
    
    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userId', '==', userId));
    
    getDocs(q).then((querySnapshot) => {
        if (!querySnapshot.empty) {
            const cartDoc = querySnapshot.docs[0];
            cart = cartDoc.data().items || [];
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

window.addToCart = async function(artworkId, title, price) {
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
    
    const item = { 
        artworkId, 
        title, 
        price: numericPrice // Store as number
    };
    cart.push(item);
    
    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    try {
        if (querySnapshot.empty) {
            await addDoc(cartRef, {
                userId: user.uid,
                items: cart
            });
        } else {
            const cartDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'carts', cartDoc.id), {
                items: cart
            });
        }
        
        updateCartUI();
    } catch (error) {
        console.error('Error updating cart:', error);
        alert('Failed to add item to cart. Please try again.');
    }
}

window.removeFromCart = async function(index) {
    const user = auth.currentUser;
    if (!user) return;
    
    cart.splice(index, 1);
    
    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        const cartDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'carts', cartDoc.id), {
            items: cart
        });
    }
    
    updateCartUI();
}

window.checkout = async function() {
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    // Here you would implement the checkout process
    alert('Checkout functionality will be implemented soon!');
}

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
}

// Initialize gallery
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('User logged in:', user.email);
        const admin = await isAdmin(user.email);
        updateUIForUserRole(user);
        loadImages();
        initializeCart(user.uid);
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