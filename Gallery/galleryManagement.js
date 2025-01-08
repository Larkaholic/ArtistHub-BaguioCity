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

// Upload form handling
document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
        alert('Please login to upload images');
        return;
    }

    const file = document.getElementById('imageFile')?.files[0];
    const title = document.getElementById('title')?.value;
    const description = document.getElementById('description')?.value;
    const price = parseFloat(document.getElementById('price')?.value);

    if (!file || !title || !description || isNaN(price)) {
        alert('Please fill in all fields, including a valid price.');
        return;
    }

    try {
        // Add watermark to image before uploading
        const { file: watermarkedFile, imageId } = await addWatermark(file);
        
        const formData = new FormData();
        formData.append('file', watermarkedFile);
        formData.append('upload_preset', 'artist_profiles');

        const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/dxeyr4pvf/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
            
        if (!cloudinaryResponse.ok) {
            throw new Error('Upload failed');
        }
            
        const cloudinaryData = await cloudinaryResponse.json();

        const galleryCollection = collection(db, 'gallery_images');
        await addDoc(galleryCollection, {
            artistEmail: auth.currentUser.email,
            artistId: auth.currentUser.uid,
            profileId: artistId,
            imageId: imageId,
            title,
            description,
            price,
            imageUrl: cloudinaryData.secure_url,
            uploadDate: serverTimestamp(),
            isPublic: true
        });

        const uploadForm = document.getElementById('uploadForm');
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
    height: 16rem;
    object-fit: cover;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.art-gallery-card-image:hover {
    transform: scale(1.02);
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
    const card = document.createElement('div');
    card.className = 'art-gallery-item';
    card.innerHTML = `
        <div class="art-gallery-item-content glass-header2">
            <img src="${data.imageUrl}" alt="${data.title}" class="art-gallery-card-image">
            <div class="p-4">
                <h3 class="text-xl font-bold mb-2 text-black">${data.title}</h3>
                <p class="text-sm mb-2 text-white">${data.description || ''}</p>
                <p class="text-lg font-semibold mb-4 text-white">₱${data.price || '0.00'}</p>
                <div class="art-gallery-item-actions">
                    ${auth.currentUser ? 
                        `<button onclick="window.addToCart('${docId}', '${data.title}', ${data.price || 0})" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full">
                            Add to Cart
                        </button>` : ''
                    }
                    ${auth.currentUser && auth.currentUser.uid === artistId ?
                        `<button onclick="deleteImage('${docId}')" class="text-red-500 hover:text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </button>` : ''}
                </div>
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
    console.log('User is admin:', userIsAdmin);
    
    // Check if user is owner
    const userIsOwner = artistId === user.uid;
    console.log('Current user:', user.email);
    console.log('Artist ID:', artistId);
    console.log('Is owner:', userIsOwner);

    // Show cart for regular users (not admin and not artist)
    if (!userIsAdmin && !userIsOwner) {
        console.log('Showing cart for regular user');
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
        console.log('Hiding upload controls for non-owners.');
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
    
    const item = { artworkId, title, price };
    cart.push(item);
    
    const cartRef = collection(db, 'carts');
    const q = query(cartRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
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
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center p-2 bg-white bg-opacity-10 rounded-lg';
            itemElement.innerHTML = `
                <div>
                    <h3 class="font-semibold">${item.title}</h3>
                    <p class="text-sm">₱${item.price.toFixed(2)}</p>
                </div>
                <button onclick="window.removeFromCart(${index})" class="text-red-500 hover:text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            `;
            cartItems.appendChild(itemElement);
            total += item.price;
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