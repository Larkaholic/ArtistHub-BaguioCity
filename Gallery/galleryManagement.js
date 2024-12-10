import { db, auth } from '../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getBasePath } from '../js/utils.js';

// async function navToGallery() {
//     const artistId = getArtistIdFromProfile();

//     if (!artistId) {
//         console.log("artist not found");
//         return;
//     }

//     try {
//         // reference to the artist document in firestore
//         const artistDocRef = doc(firestore, "artists", artistId);
//         const artistDoc = await getDoc(artistDocRef);

//         if (artistDoc.exists()) {
//             // open the gallery page for the artist
//             const galleryUrl = 'Gallery/gallery-${artistId}.html'; // make the gallery URL
//             window.location.href = galleryUrl;
//         } else {
//             console.error("artist documents not found");
//         }
//     } catch (error){
//         console.error("error fetching artist data:", error);
//     }
// }

// Function to delete image from Cloudinary and localStorage
async function deleteImageFromCloudinary(publicId) {
    const url = "https://<your-firebase-function-url>/deleteImageFromCloudinary"; // Replace with your function URL
  
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });
  
    if (response.ok) {
      alert('Image deleted successfully.');
    } else {
      alert('Failed to delete image.');
    }
  }

let swiper;

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

// Add Swiper initialization function
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
            // Store the uploaded image data in localStorage
            const imageData = {
                imageUrl: result.info.secure_url,
                title: result.info.original_filename,
                timestamp: new Date().toISOString(),
                public_id: result.info.public_id
            };

            // Get existing images from localStorage
            const existingImages = JSON.parse(localStorage.getItem('galleryImages') || '[]');
            existingImages.unshift(imageData); // Add new image at the beginning
            localStorage.setItem('galleryImages', JSON.stringify(existingImages));

            // Update gallery display
            loadGallery();
            alert('Image uploaded successfully!');
        }
    }
);

// Load gallery images
function loadGallery() {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    if (!swiperWrapper) return;

    // Get images from localStorage
    const images = JSON.parse(localStorage.getItem('galleryImages') || '[]');

    if (images.length === 0) {
        swiperWrapper.innerHTML = `
            <div class="swiper-slide">
                <p class="text-center text-gray-500">No images available</p>
            </div>`;
        return;
    }

    // Clear the wrapper
    swiperWrapper.innerHTML = '';

    // Create slides with delete button
    images.forEach((imageData, index) => {
        const swiperSlide = document.createElement('div');
        swiperSlide.className = 'swiper-slide';
        swiperSlide.innerHTML = `
            <div class="relative w-[300px] h-[300px] rounded-lg overflow-hidden bg-gray-100">
                <div class="w-full h-full ">
                    <img src="${imageData.imageUrl}" 
                         alt="${imageData.title}" 
                         class="w-full h-full rounded-lg cursor-pointer" 
                         onclick="openImageModal('${imageData.imageUrl}', '${imageData.title}')">
                    <div class="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white">
                        <p class="text-xs">${new Date(imageData.timestamp).toLocaleDateString()}</p>
                        <button class="text-xs text-red-500 mt-2" onclick="deleteImage(${index})">Delete</button>
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

// Initialize gallery on page load
document.addEventListener('DOMContentLoaded', loadGallery);

// Add upload button click handler
document.getElementById('upload_widget')?.addEventListener('click', function() {
    myWidget.open();
}, false);

// Make functions globally available
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.myWidget = myWidget;
