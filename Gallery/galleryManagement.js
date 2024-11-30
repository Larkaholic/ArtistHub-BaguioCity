import { db, auth } from '../js/firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    deleteDoc,
    doc,
    getDoc,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
        centeredSlides: true, // Center the active slide
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
        on: {
            slideChange: function () {
                // Remove opacity from all slides
                document.querySelectorAll('.swiper-slide').forEach(slide => {
                    slide.style.opacity = '0.5';
                });
                // Make active slide fully opaque
                const activeSlide = document.querySelector('.swiper-slide-active');
                if (activeSlide) {
                    activeSlide.style.opacity = '1';
                }
            },
            init: function() {
                // Set initial opacity
                document.querySelectorAll('.swiper-slide').forEach(slide => {
                    slide.style.opacity = '0.5';
                });
                const activeSlide = document.querySelector('.swiper-slide-active');
                if (activeSlide) {
                    activeSlide.style.opacity = '1';
                }
            }
        }
    });
}

// Load gallery images for specific artist
async function loadGallery() {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    if (!swiperWrapper) {
        console.error('Swiper wrapper not found');
        return;
    }

    try {
        // Get artist email from URL
        const params = new URLSearchParams(window.location.search);
        let artistEmail = params.get('email');
        
        // Get current user (might be null if logged out)
        const currentUser = auth.currentUser;
        console.log('Load Gallery Status:', {
            currentUser: currentUser?.email,
            urlArtistEmail: artistEmail,
            isLoggedIn: !!currentUser
        });

        // If no artist email in URL, show message
        if (!artistEmail) {
            console.log('No artist email in URL');
            swiperWrapper.innerHTML = `
                <div class="swiper-slide">
                    <p class="text-center text-gray-500">Please select an artist to view their gallery</p>
                </div>`;
            return;
        }

        // Hide upload section if not logged in or not viewing own gallery
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            const isOwner = currentUser && currentUser.email === artistEmail;
            uploadSection.style.display = isOwner ? 'block' : 'none';
        }

        console.log('Querying images for artist:', artistEmail);

        // Query images for specific artist
        const galleryRef = collection(db, "gallery_images");
        const q = query(
            galleryRef, 
            where("artistEmail", "==", artistEmail),
            orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.size} images for artist ${artistEmail}`);

        if (querySnapshot.empty) {
            swiperWrapper.innerHTML = `
                <div class="swiper-slide">
                    <p class="text-center text-gray-500">No images available for this artist</p>
                </div>`;
            return;
        }

        // Clear the wrapper
        swiperWrapper.innerHTML = '';
        
        // Create slides
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Processing image:', {
                artistEmail: data.artistEmail,
                imageUrl: data.imageUrl,
                timestamp: data.timestamp
            });
            
            const isOwner = currentUser && currentUser.email === artistEmail;
            
            const swiperSlide = document.createElement('div');
            swiperSlide.className = 'swiper-slide';
            swiperSlide.style.opacity = '0.5';
            swiperSlide.style.transition = 'opacity 0.3s ease';
            swiperSlide.style.width = '300px';
            swiperSlide.innerHTML = `
                <div class="relative w-[300px] h-[300px] rounded-lg overflow-hidden bg-gray-100">
                    <div class="w-full h-full">
                        <img src="${data.imageUrl}" 
                             alt="${data.title || 'Gallery Image'}" 
                             class="w-full h-full object-cover rounded-lg cursor-pointer" 
                             style="object-position: center"
                             onclick="openImageModal('${data.imageUrl}', '${data.title || 'Gallery Image'}')">
                        <div class="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white">
                            <p class="text-xs">${new Date(data.timestamp).toLocaleDateString()}</p>
                        </div>
                        ${isOwner ? `
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
                            <button onclick="deleteImage('${doc.id}')" 
                                    class="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            swiperWrapper.appendChild(swiperSlide);
        });

        // Initialize Swiper
        setTimeout(() => {
            initSwiper(querySnapshot.size);
        }, 0);

    } catch (error) {
        console.error("Error loading gallery:", error);
        console.log('Full error details:', error);
        swiperWrapper.innerHTML = `
            <div class="swiper-slide">
                <p class="text-center text-red-500">Error loading gallery: ${error.message}</p>
            </div>`;
    }
}

// Initialize gallery on page load (don't wait for auth state)
document.addEventListener('DOMContentLoaded', loadGallery);

// Also update gallery when auth state changes
auth.onAuthStateChanged((user) => {
    console.log('Auth state changed. User:', user?.email);
    loadGallery();
});

// Add the deleteImage function
async function deleteImage(docId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert("Please login to delete images");
            return;
        }

        // Get the image document
        const imageRef = doc(db, "gallery_images", docId);
        const imageDoc = await getDoc(imageRef);

        if (!imageDoc.exists()) {
            alert("Image not found");
            return;
        }

        // Check if user owns this image
        if (imageDoc.data().artistEmail !== user.email) {
            alert("You can only delete your own images");
            return;
        }

        // Confirm deletion
        if (!confirm("Are you sure you want to delete this image?")) {
            return;
        }

        // Delete the document
        await deleteDoc(imageRef);
        
        // Reload gallery
        loadGallery();
        
        alert("Image deleted successfully");
    } catch (error) {
        console.error("Error deleting image:", error);
        alert("Failed to delete image");
    }
}

// Add the Cloudinary widget configuration
var myWidget = cloudinary.createUploadWidget(
    {
        cloudName: 'dxeyr4pvf',
        uploadPreset: 'artist_profiles',
        folder: 'user_galleries',
        sources: ['local', 'url', 'camera'],
        maxFiles: 10,
    },
    async (error, result) => {
        if (!error && result && result.event === "success") {
            try {
                const user = auth.currentUser;
                if (!user) {
                    alert("Please login to upload images");
                    return;
                }

                console.log("Upload success. Current user:", user.email);

                // Save image details to Firestore
                await addDoc(collection(db, "gallery_images"), {
                    artistEmail: user.email,
                    imageUrl: result.info.secure_url,
                    title: result.info.original_filename,
                    timestamp: new Date().toISOString(),
                    public_id: result.info.public_id
                });

                console.log("Image saved to Firestore");
                
                // Reload gallery
                loadGallery();
                
                alert('Image uploaded successfully!');
            } catch (error) {
                console.error("Error saving image:", error);
                alert("Failed to save image");
            }
        }
    }
);

// Add upload button click handler
document.getElementById('upload_widget')?.addEventListener('click', function() {
    myWidget.open();
}, false);

// Make functions globally available
window.deleteImage = deleteImage;
window.myWidget = myWidget;

// Example of how to create a link to an artist's gallery
function createArtistGalleryLink(artistEmail) {
    return `<a href="gallery.html?email=${encodeURIComponent(artistEmail)}">View Gallery</a>`;
}