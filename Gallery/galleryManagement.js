import { db, auth } from '../js/firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getBasePath } from '../js/utils.js';

// Function to fetch images for a specific artist based on their userId
async function fetchImagesForArtist(userId) {
    try {
        const imagesRef = collection(db, "images"); // Assuming images are stored in 'images' collection
        const q = query(imagesRef, where("userId", "==", userId)); // Filter by userId
        const querySnapshot = await getDocs(q);
        const images = [];

        querySnapshot.forEach((doc) => {
            images.push(doc.data()); // Push each image data to the array
        });

        return images;
    } catch (error) {
        console.error("Error fetching images for artist:", error);
        return [];
    }
}

// Function to create the gallery slides for the artist
async function loadGallery() {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    if (!swiperWrapper) return;

    // Get the userId from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id'); // Assuming the artist's userId is passed in the URL as 'id'
    console.log('Full URL:', window.location.href); // Logs the full URL
    console.log('User ID:', userId);

    if (!userId) {
        console.log("User ID not found in the URL.");
        return;
    }

    // Fetch images for the artist from Firestore
    const images = await fetchImagesForArtist(userId);

    if (images.length === 0) {
        swiperWrapper.innerHTML = `
            <div class="swiper-slide">
                <p class="text-center text-gray-500">No images available</p>
            </div>`;
        return;
    }

    // Clear the wrapper
    swiperWrapper.innerHTML = '';

    // Create slides for each image
    images.forEach((imageData) => {
        const swiperSlide = document.createElement('div');
        swiperSlide.className = 'swiper-slide';
        swiperSlide.innerHTML = `
            <div class="relative w-[300px] h-[300px] rounded-lg overflow-hidden bg-gray-100">
                <div class="w-full h-full">
                    <img src="${imageData.imageUrl}" 
                         alt="${imageData.title}" 
                         class="w-full h-full rounded-lg cursor-pointer" 
                         onclick="openImageModal('${imageData.imageUrl}', '${imageData.title}')">
                    <div class="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white">
                        <p class="text-xs">${new Date(imageData.timestamp).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        `;
        swiperWrapper.appendChild(swiperSlide);
    });

    // Initialize Swiper
    setTimeout(() => {
        initSwiper(images.length);
    }, 0);
}

// Initialize Swiper
function initSwiper(slideCount) {
    if (typeof Swiper === 'undefined') {
        console.error('Swiper is not loaded');
        return;
    }

    // Destroy existing swiper instance if it exists
    if (window.swiper) {
        window.swiper.destroy(true, true);
    }

    // Initialize new Swiper with centered slides
    window.swiper = new Swiper('.swiper-container', {
        slidesPerView: 3,
        slidesPerGroup: 1,
        spaceBetween: 30,
        centeredSlides: true,
        loop: slideCount > 3,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            type: 'bullets',
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        keyboard: {
            enabled: true,
        },
        breakpoints: {
            320: {
                slidesPerView: 1,
                spaceBetween: 10
            },
            640: {
                slidesPerView: 2,
                spaceBetween: 20
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 30
            }
        }
    });
}

// Add modal functions
function openImageModal(imageUrl, title) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');

    if (modal && modalImage) {
        modalImage.src = imageUrl;
        if (modalCaption) {
            modalCaption.textContent = title;
        }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Initialize gallery on page load
document.addEventListener('DOMContentLoaded', loadGallery);

// Add upload button click handler
document.getElementById('upload_widget')?.addEventListener('click', function() {
    myWidget.open();
}, false);

// Initialize Cloudinary Upload Widget
var myWidget = cloudinary.createUploadWidget(
    {
        cloudName: 'dxeyr4pvf',
        uploadPreset: 'artist_profiles',
        folder: 'user_galleries',
        sources: ['local', 'url', 'camera'],
        maxFiles: 10,
    },
    (error, result) => {
        if (!error && result && result.event === "success") {
            // Store the uploaded image data in Firestore under the artist's userId
            const imageData = {
                imageUrl: result.info.secure_url,
                title: result.info.original_filename,
                timestamp: new Date().toISOString(),
                userId: getUserIdFromAuth(), // Store userId from the authenticated user
                public_id: result.info.public_id
            };

            // Add image data to Firestore
            addImageToFirestore(imageData);

            // Update gallery display
            loadGallery();
            alert('Image uploaded successfully!');
        }
    }
);

// Function to get current authenticated user's ID
function getUserIdFromAuth() {
    const user = auth.currentUser;
    return user ? user.uid : null; // Return the userId if authenticated
}

// Function to add image data to Firestore
async function addImageToFirestore(imageData) {
    try {
        const imagesRef = collection(db, "images");
        await imagesRef.add(imageData); // Add the image data to Firestore
    } catch (error) {
        console.error("Error adding image to Firestore:", error);
    }
}

// Make functions globally available
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.myWidget = myWidget;
