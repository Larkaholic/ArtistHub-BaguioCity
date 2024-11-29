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

// Cloudinary widget
var myWidget = cloudinary.createUploadWidget(
    {
        cloudName: 'dxeyr4pvf',
        uploadPreset: 'artist_profiles',
        folder: 'user_galleries',
        sources: ['local', 'url', 'camera'],  // specify allowed upload sources
        maxFiles: 10,  // limit number of files per upload
    },
    async (error, result) => {
        if (!error && result && result.event === "success") {
            try {
                const user = auth.currentUser;
                if (!user) {
                    alert("Please login to upload images");
                    return;
                }

                // save the cloudinary url to firebase
                await addDoc(collection(db, "gallery_images"), {
                    userId: user.uid,
                    imageUrl: result.info.secure_url,
                    caption: result.info.original_filename,
                    timestamp: new Date().toISOString(),
                    public_id: result.info.public_id  // store cloudinary's public_id
                });

                loadGallery();  // reload gallery after upload
            } catch (error) {
                console.error("Error saving image:", error);
                alert("Failed to save image");
            }
        }
    }
);

// auth state observer and gallery loader
auth.onAuthStateChanged(async (user) => {
    console.log('Auth state changed:', user?.email);
    
    // load gallery when auth state is confirmed
    if (user) {
        await loadGallery();
    }
});

// Load gallery images
async function loadGallery() {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    const uploadSection = document.getElementById('uploadSection');
    if (!swiperWrapper) {
        console.error('Swiper wrapper not found');
        return;
    }

    try {
        console.log('Loading gallery...');
        const currentUser = auth.currentUser;
        console.log('Current user in loadGallery:', currentUser?.email);

        if (!currentUser) {
            console.log('No user logged in');
            swiperWrapper.innerHTML = '<div class="swiper-slide"><p class="text-center">Please log in to view your gallery</p></div>';
            return;
        }

        // create query for current user's images
        const q = query(
            collection(db, "gallery_images"),
            where("userId", "==", currentUser.uid),
            orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        console.log('Found images for user:', currentUser.uid, querySnapshot.size);

        if (querySnapshot.empty) {
            swiperWrapper.innerHTML = '<div class="swiper-slide"><p class="text-center">No images uploaded yet</p></div>';
            return;
        }

        // show/hide upload section based on user status
        if (uploadSection) {
            if (auth.currentUser) {
                const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
                const isArtist = userDoc?.exists() && userDoc.data()?.userType === 'artist';
                uploadSection.style.display = isArtist ? 'block' : 'none';
            } else {
                uploadSection.style.display = 'none';
            }
        }

        swiperWrapper.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const isOwner = auth.currentUser && data.userId === auth.currentUser.uid;
            const swiperSlide = document.createElement('div');
            swiperSlide.className = 'swiper-slide';
            swiperSlide.innerHTML = `
                <div class="relative group w-full h-full">
                    <img src="${data.imageUrl}" 
                         alt="${data.caption}" 
                         class="w-full h-full object-cover rounded-lg cursor-pointer" 
                         onclick="openImageModal('${data.imageUrl}', '${data.caption}')">
                    ${isOwner ? `
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
                        <button onclick="deleteImage('${doc.id}')" 
                                class="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    ` : ''}
                </div>
            `;
            swiperWrapper.appendChild(swiperSlide);
        });

        initSwiper(querySnapshot.size);

    } catch (error) {
        console.error("Error loading gallery:", error);
        swiperWrapper.innerHTML = '<div class="swiper-slide"><p class="text-center text-red-500">Error loading gallery</p></div>';
    }
}

// Delete image function
async function deleteImage(docId) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('You must be logged in to delete images');
            return;
        }

        // Check if user is an artist
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.data()?.userType !== 'artist') {
            alert('Only artists can delete images');
            return;
        }

        // Check if the image belongs to the current user
        const imageDoc = await getDoc(doc(db, "gallery_images", docId));
        if (imageDoc.data().userId !== user.uid) {
            alert('You can only delete your own images');
            return;
        }

        if (!confirm('Are you sure you want to delete this image?')) {
            return;
        }

        // Delete from Firestore
        await deleteDoc(doc(db, "gallery_images", docId));
        
        // Destroy current Swiper instance
        if (swiper) {
            swiper.destroy();
        }
        
        // Reload gallery
        await loadGallery();
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-500';
        successMessage.textContent = 'Image deleted successfully';
        document.body.appendChild(successMessage);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            successMessage.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(successMessage);
            }, 500);
        }, 3000);

    } catch (error) {
        console.error("Error deleting image:", error);
        alert('Failed to delete image');
    }
}

// Modal functions
function openImageModal(imageUrl, caption) {
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    modalImage.src = imageUrl;
    modalCaption.textContent = caption;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Make functions globally available
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.deleteImage = deleteImage;

function initSwiper(slideCount) {
    const loopEnabled = slideCount > 3; // Only enable loop if there are more than 3 slides

    swiper = new Swiper('.swiper-container', {
        slidesPerView: 'auto',
        centeredSlides: true,
        spaceBetween: 40,
        initialSlide: 0,
        loop: loopEnabled,
        loopedSlides: loopEnabled ? slideCount : null,
        grabCursor: true,
        slideToClickedSlide: true,
        speed: 800,
        effect: 'slide',
        
        simulateTouch: true,
        touchRatio: 1,
        touchAngle: 45,
        
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
            disabledClass: 'swiper-button-disabled',
            hiddenClass: 'swiper-button-hidden',
        },
        
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            type: 'bullets',
            renderBullet: function (index, className) {
                return '<span class="' + className + '">' + (index + 1) + '</span>';
            },
        },

        breakpoints: {
            320: {
                slidesPerView: 1,
                spaceBetween: 20
            },
            768: {
                slidesPerView: loopEnabled ? 2 : 1,
                spaceBetween: 30
            },
            1024: {
                slidesPerView: loopEnabled ? 3 : 1,
                spaceBetween: 40
            }
        },

        on: {
            init: function() {
                console.log('Swiper initialized');
            },
            click: function(swiper, event) {
                console.log('Slide clicked');
            }
        }
    });

    // Add event listeners for navigation buttons
    document.querySelector('.swiper-button-next').addEventListener('click', function(e) {
        e.preventDefault();
        swiper.slideNext();
    });

    document.querySelector('.swiper-button-prev').addEventListener('click', function(e) {
        e.preventDefault();
        swiper.slidePrev();
    });
}

// initialize upload widget button when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const uploadButton = document.getElementById('upload_widget');
    if (uploadButton) {
        uploadButton.addEventListener('click', () => {
            if (!auth.currentUser) {
                alert("Please login to upload images");
                return;
            }
            myWidget.open();
        });
    }
}); 