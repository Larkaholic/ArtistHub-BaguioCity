import { 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs,
    deleteDoc,
    doc,
    getDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, db } from '../js/firebase-config.js';

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

    if (!file || !title || !description) {
        alert('Please fill in all fields');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'artist_profiles');

    try {
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
            imageId: `img_${Date.now()}`,
            title,
            description,
            imageUrl: cloudinaryData.secure_url,
            createdAt: new Date().toISOString(),
            isPublic: true
        });

        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.style.display = 'none';
            uploadForm.reset();
        }
        loadImages();
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
            createImageCard(doc.id, data);
        });
    } catch (error) {
        console.error('Error loading images:', error);
        container.innerHTML = '<p class="text-center text-red-500">Error loading gallery images. Please try again later.</p>';
    }
}

// Create image card
function createImageCard(docId, data) {
    const container = document.getElementById('galleryContainer');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'gallery-item';
    
    const isOwner = auth.currentUser && auth.currentUser.email === data.artistEmail;
    const userIsAdmin = auth.currentUser && isAdmin(auth.currentUser.email);
    
    card.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.title}">
        <div class="gallery-item-content">
            <h3>${data.title}</h3>
            <p>${data.description}</p>
            ${isOwner || userIsAdmin ? `
                <div class="gallery-item-actions">
                    <button onclick="deleteImage('${docId}')" class="text-red-500 text-sm">Delete</button>
                </div>
            ` : ''}
        </div>
    `;
    container.appendChild(card);
}

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

    // Hide all controls by default
    if (uploadControls) uploadControls.style.display = 'none';
    if (uploadButtonContainer) uploadButtonContainer.style.display = 'none';

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

// Initialize gallery
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('User logged in:', user.email);
        await updateUIForUserRole(user);
    } else {
        console.log('No user logged in');
    }
    loadImages();
});