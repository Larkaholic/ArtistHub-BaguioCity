import { auth } from '../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { isUserAdmin, setupAdminUI, navToEvent } from '../js/utils.js';
import { db } from '../js/firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function toggleLoginFlyout(event) {
    if (event) event.preventDefault();
    const flyout = document.getElementById('LoginFlyout');
    flyout.classList.toggle('active');
}

export function submitLogin() {
    alert('Login submitted!');
    toggleLoginFlyout();
}

export function toggleNav() {
    const menu = document.getElementById('flyout-menu');
    const body = document.body;
    
    // Toggle the menu
    menu.classList.toggle('translate-x-full');
    
    // Create or get overlay
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.onclick = toggleNav;
        document.body.appendChild(overlay);
    }
    
    // Toggle overlay
    overlay.classList.toggle('active');
    
    // Toggle body scroll
    body.style.overflow = menu.classList.contains('translate-x-full') ? '' : 'hidden';
}

export function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.classList.contains('hidden')) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

// Make functions globally available
window.toggleNav = toggleNav;
window.navToEvent = navToEvent;
window.toggleLoginFlyout = toggleLoginFlyout;
window.toggleForms = toggleForms;

// add admin action handler
export async function handleAdminAction() {
    const user = auth.currentUser;
    if (!user) return;

    const isAdmin = await isUserAdmin(user.uid);
    if (!isAdmin) {
        alert('you do not have admin privileges');
        return;
    }

    const action = prompt('enter admin action: \n1. manage users\n2. manage content\n3. view reports');
    
    switch(action) {
        case '1':
            navToEvent('admin/manage-users.html');
            break;
        case '2':
            navToEvent('admin/manage-content.html');
            break;
        case '3':
            navToEvent('admin/view-reports.html');
            break;
        default:
            alert('invalid action');
    }
}

// update your existing code
document.addEventListener('DOMContentLoaded', async () => {
    // Check profile ownership for edit button visibility
    checkProfileOwnership();
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const isAdmin = await isUserAdmin(user.uid);
            
            const adminButton = document.querySelector('.admin-only');
            
            if (isAdmin) {
                if (adminButton) {
                    adminButton.style.display = 'flex';
                }
            }
        }
    });
});

// make sure handleAdminAction is globally available
window.handleAdminAction = handleAdminAction;

// When creating the artist profile view
function createProfileView(artistData) {
    return `
        <div class="profile-info">
            <!-- Other profile information -->
            
            <!-- Gallery link with email parameter -->
            <a href="../Gallery/gallery.html?email=${artistData.email}" 
               class="gallery-link">
                View Gallery
            </a>
        </div>
    `;
}

function displayProfile(userData) {
    const profileContainer = document.getElementById('profileContainer');
    if (!profileContainer) return;

    profileContainer.innerHTML = `
        <div class="max-w-4xl mx-auto p-4">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <!-- Profile Image -->
                <div class="flex justify-center mb-4">
                    <img src="${userData.profileImage || '../assets/default-profile.png'}" 
                         alt="Profile" 
                         class="w-32 h-32 rounded-full object-cover">
                </div>

                <!-- Profile Info -->
                <div class="text-center mb-6">
                    <h2 class="text-2xl font-bold mb-2">${userData.name || 'Name not set'}</h2>
                    <p class="text-gray-600">${userData.email}</p>
                    <p class="text-gray-700 mt-2">${userData.bio || 'No bio available'}</p>
                </div>

                <!-- Gallery Link -->
                <div class="text-center mt-4">
                    <a href="../Gallery/gallery.html?email=${userData.email}" 
                       class="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        View Gallery
                    </a>
                </div>

                <!-- Other profile sections -->
                <div class="mt-6">
                    <h3 class="text-xl font-semibold mb-3">Contact Information</h3>
                    <p class="text-gray-700">Location: ${userData.location || 'Not specified'}</p>
                    <p class="text-gray-700">Phone: ${userData.phone || 'Not specified'}</p>
                </div>
            </div>
        </div>
    `;
}

// Show an empty modal
export function showEmptyModal() {
    let modal = document.getElementById('emptyModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'emptyModal';
        modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-8 relative min-w-[300px] min-h-[150px] flex flex-col items-center justify-center">
                <button onclick="closeEmptyModal()" class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                <h1 class="">Feature an Artwork</h1>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.style.display = '';
    }
    // Ensure modal is visible (remove hidden if present)
    modal.classList.remove('hidden');
}

// Close the empty modal
export function closeEmptyModal() {
    const modal = document.getElementById('emptyModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Show the "Feature Artwork" modal with all artworks uploaded by the current artist
export async function showFeatureArtworkModal() {
    let modal = document.getElementById('featureArtworkModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'featureArtworkModal';
        modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="glass-header2 rounded-3xl shadow-2xl p-8 relative min-w-[900px] min-h-[500px] max-w-6xl w-full flex flex-col items-center justify-center max-h-[90vh] overflow-hidden border border-white border-opacity-20" style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px);">
                <!-- Close button -->
                <button onclick="closeFeatureArtworkModal()" class="absolute top-4 right-4 bg-[#f76400] bg-opacity-20 hover:bg-opacity-30 rounded-full p-3 text-[#fff8ec] hover:text-gray-800 text-xl transition-all hover:scale-110 backdrop-blur-sm border border-white border-opacity-30">
                    <i class="fa fa-times bg-transparent"></i>
                </button>
                
                <!-- Header Section -->
                <div class="text-center mb-8">
                    <div class="inline-block p-4 rounded-full mb-4" style="background: linear-gradient(135deg, #f76400, #ff8c42);">
                        <i class="fa fa-star text-white text-3xl bg-transparent "></i>
                    </div>
                    <h1 class="text-4xl font-bold mb-3" style="background: linear-gradient(135deg, #f76400, #ff8c42); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        Feature Your Artworks
                    </h1>
                    <p class="text-gray-600 text-lg">Select up to 4 artworks to showcase on your profile</p>
                </div>
                
                <!-- Content Container -->
                <div class="w-full flex-1 overflow-y-auto px-4" style="max-height: calc(90vh - 250px);">
                    <form id="featureArtworkForm" class="w-full">
                        <div id="featureArtworkList" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"></div>
                        
                        <!-- Action Buttons -->
                        <div class="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
                            <button type="button" onclick="closeFeatureArtworkModal()" class="px-8 py-3 rounded-xl font-semibold text-gray-600 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 transform hover:scale-105">
                                Cancel
                            </button>
                            <button type="submit" class="px-8 py-3 rounded-xl font-semibold text-white border-2 transition-all duration-300 transform hover:scale-105 shadow-lg" style="background: linear-gradient(135deg, #f76400, #ff8c42); border-color: #f76400; box-shadow: 0 4px 15px rgba(247, 100, 0, 0.3);">
                                <i class="fa fa-star mr-2 bg-transparent text-white"></i>Save Featured Artworks
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add entrance animation
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        requestAnimationFrame(() => {
            modal.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });
    } else {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    // Fetch and display artworks for the logged-in artist
    const listContainer = document.getElementById('featureArtworkList');
    if (listContainer) {
        listContainer.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2" style="border-color: #f76400;"></div>
                <p class="text-gray-500 mt-4 text-lg">Loading your artworks...</p>
            </div>
        `;
    }

    // Get current user
    const user = auth.currentUser;
    if (!user) {
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12">
                    <div class="p-4 rounded-full mb-4 bg-red-100">
                        <i class="fa fa-exclamation-triangle text-red-500 text-3xl"></i>
                    </div>
                    <p class="text-red-500 text-lg font-semibold">Not logged in</p>
                    <p class="text-gray-500">Please log in to feature your artworks</p>
                </div>
            `;
        }
        return;
    }

    try {
        // Query artworks where artistId == user.uid
        const q = query(collection(db, "artworks"), where("artistId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            if (listContainer) {
                listContainer.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-12">
                        <div class="p-4 rounded-full mb-4 bg-gray-100">
                            <i class="fa fa-image text-gray-400 text-3xl"></i>
                        </div>
                        <p class="text-gray-500 text-lg font-semibold">No artworks found</p>
                        <p class="text-gray-400">Upload some artworks to feature them on your profile</p>
                    </div>
                `;
            }
            return;
        }

        let html = '';
        querySnapshot.forEach(docSnap => {
            const art = docSnap.data();
            const artId = docSnap.id;
            html += `
                <label class="relative flex flex-col items-center p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 group">
                    <div class="artwork-card-container relative w-full">
                        <input type="checkbox" name="featuredArtworks" value="${artId}" class="absolute top-3 left-3 w-6 h-6 rounded-lg border-2 border-white shadow-lg transition-all duration-300 z-10" style="accent-color: #f76400;" />
                        
                        <!-- Artwork Image -->
                        <div class="w-full aspect-square rounded-2xl overflow-hidden border-3 border-white shadow-lg group-hover:shadow-xl transition-all duration-300 bg-white">
                            <img src="${art.imageUrl || ''}" alt="${art.title || 'Artwork'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        
                        <!-- Selection Overlay -->
                        <div class="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <div class="text-white">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2" style="background: #f76400;">
                                    <i class="fa fa-star text-sm bg-transparent"></i>
                                </div>
                                <p class="text-sm font-semibold">Click to feature</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Artwork Info -->
                    <div class="w-full text-center mt-4">
                        <h3 class="font-bold text-lg mb-1 text-gray-800 line-clamp-1">${art.title || 'Untitled'}</h3>
                        <p class="text-sm text-gray-500 line-clamp-1">${art.medium || ''}</p>
                    </div>
                </label>
            `;
        });
        if (listContainer) listContainer.innerHTML = html;
    } catch (err) {
        console.error('Error loading artworks:', err);
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-12">
                    <div class="p-4 rounded-full mb-4 bg-red-100">
                        <i class="fa fa-exclamation-circle text-red-500 text-3xl"></i>
                    </div>
                    <p class="text-red-500 text-lg font-semibold">Failed to load artworks</p>
                    <p class="text-gray-500">Please try again later</p>
                </div>
            `;
        }
    }

    // Handle form submission for saving featured artworks
    const form = document.getElementById('featureArtworkForm');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            // Collect checked artwork IDs
            const checked = Array.from(form.elements['featuredArtworks'])
                .filter(input => input.checked)
                .map(input => input.value);
            
            if (checked.length === 0) {
                alert('Please select at least one artwork to feature.');
                return;
            }
            
            if (checked.length > 4) {
                alert('You can only feature up to 4 artworks.');
                return;
            }
            
            // TODO: Save the checked artwork IDs as featured (implement as needed)
            alert(`Successfully featured ${checked.length} artwork${checked.length > 1 ? 's' : ''}!`);
            closeFeatureArtworkModal();
        };
    }
}

// Close the "Feature Artwork" modal
export function closeFeatureArtworkModal() {
    const modal = document.getElementById('featureArtworkModal');
    if (modal) {
        // Add exit animation
        modal.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }, 300);
    }
}

// change the name in profile rest of the artworks
document.addEventListener('DOMContentLoaded', () => {
    const displayName = document.getElementById('displayName');
    const artistNameArtworks = document.getElementById('artistNameArtworks');
    function updateArtistNameArtworks() {
        if (displayName && artistNameArtworks) {
            const name = displayName.textContent.trim();
            if (name && name.length > 0) {
                artistNameArtworks.textContent = name.endsWith('s') ? name + "'" : name + "'s";
            }
        }
    }
    setTimeout(updateArtistNameArtworks, 300);
    const observer = new MutationObserver(updateArtistNameArtworks);
    if (displayName) {
        observer.observe(displayName, { childList: true, subtree: true });
    }
});

// Populate the "rest of the artworks" section with the artist's artworks
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        const urlParams = new URLSearchParams(window.location.search);
        const artistId = urlParams.get('id') || urlParams.get('artistId') || (user && user.uid);
        if (!artistId) return;

        // Find the container for the artworks grid
        const parent = document.getElementById('allArtworksTitle');
        if (!parent) return;

        // Remove any previous grid
        let existingGrid = parent.parentElement.querySelector('#allArtworksGrid');
        if (existingGrid) existingGrid.remove();

        // Create the grid container and append it
        const artworksContainer = document.createElement('div');
        artworksContainer.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full";
        artworksContainer.id = "allArtworksGrid";
        parent.parentElement.appendChild(artworksContainer);

        artworksContainer.innerHTML = `<div class="col-span-full text-gray-500 text-center w-full">Loading artworks...</div>`;

        try {
            // Fetch from gallery_images instead of artworks
            const snapshot = await getDocs(collection(db, "gallery_images"));
            let found = false;
            let html = '';
            snapshot.forEach(docSnap => {
                const art = docSnap.data();
                if (
                    (art.artistId && (art.artistId === artistId || art.artistId === user?.uid)) ||
                    (art.userId && (art.userId === artistId || art.userId === user?.uid))
                ) {
                    found = true;                    html += `
                        <div class="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col artwork-item" data-artwork-id="${docSnap.id}">
                            <div class="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onclick="openImageModal('${art.imageUrl || ''}', '${(art.title || 'Untitled').replace(/'/g, "\\'")}', '${(art.medium || '').replace(/'/g, "\\'")}', '${(art.description || '').replace(/'/g, "\\'")}')">
                                <img src="${art.imageUrl || ''}" alt="${art.title || 'Artwork'}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div class="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 class="font-semibold text-lg mb-1">${art.title || 'Untitled'}</h3>
                                    <p class="text-gray-500 text-sm">${art.medium || ''}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            if (!found) {
                artworksContainer.innerHTML = `<div class="col-span-full text-gray-500 text-center w-full">No artworks found.</div>`;
            } else {
                artworksContainer.innerHTML = html;
            }
        } catch (err) {
            artworksContainer.innerHTML = `<div class="col-span-full text-red-500 text-center w-full">Failed to load artworks.</div>`;
        }
    });
});

// Image Modal Functions
export function openImageModal(imageUrl, title, medium, description) {
    let modal = document.getElementById('imageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="relative max-w-6xl max-h-[95vh] w-full h-full flex items-center justify-center p-4">
                <!-- Close button -->
                <button onclick="closeImageModal()" class="absolute top-4 right-4 z-60 bg-[#f76400] hover:bg-opacity-30 rounded-full p-3 text-[#fff8ec] text-2xl transition-all hover:scale-110 backdrop-blur-sm">
                    <i class="fa fa-times bg-transparent"></i>
                </button>
                
                <!-- Image container -->
                <div class="flex flex-col items-center justify-center w-full h-full">
                    <div class="flex-1 flex items-center justify-center w-full max-h-[75vh]">
                        <img id="modalImage" src="" alt="" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-fadeIn" />
                    </div>
                    
                    <!-- Image info -->
                    <div class="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 mt-6 max-w-2xl w-full text-center border border-white border-opacity-20">
                        <h3 id="modalTitle" class="text-white text-2xl font-bold mb-3"></h3>
                        <p id="modalMedium" class="text-orange-300 text-lg mb-2 font-medium"></p>
                        <p id="modalDescription" class="text-gray-200 text-sm leading-relaxed"></p>
                    </div>
                </div>
            </div>
            
            <!-- Animation styles -->
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            </style>
        `;
        document.body.appendChild(modal);
        
        // Close modal when clicking outside the image
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImageModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeImageModal();
            }
        });
    }
    
    // Update modal content
    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('modalImage').alt = title;
    document.getElementById('modalTitle').textContent = title || 'Untitled';
    document.getElementById('modalMedium').textContent = medium || '';
    document.getElementById('modalDescription').textContent = description || '';
    
    // Show modal with animation
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent body scroll
    
    // Add entrance animation
    requestAnimationFrame(() => {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        modal.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });
    });
}

export function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        // Add exit animation
        modal.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore body scroll
        }, 300);
    }
}

// Function to control edit button visibility based on profile ownership
export function checkProfileOwnership() {
    const urlParams = new URLSearchParams(window.location.search);
    const profileId = urlParams.get('id');
    
    onAuthStateChanged(auth, async (user) => {
        const editProfileBtn = document.getElementById('editProfileBtn');
        const editArtworksBtn = document.getElementById('editArtworksBtn');
        
        if (!user) {
            // User not logged in - hide edit buttons
            if (editProfileBtn) editProfileBtn.style.display = 'none';
            if (editArtworksBtn) editArtworksBtn.style.display = 'none';
            return;
        }
        
        // Check if user is the owner of the profile or an admin
        const isOwner = !profileId || profileId === user.uid;
        const isAdmin = await isUserAdmin(user.uid);
        const canEdit = isOwner || isAdmin;
        
        // Show/hide edit buttons based on ownership or admin status
        if (editProfileBtn) {
            editProfileBtn.style.display = canEdit ? 'flex' : 'none';
        }
        if (editArtworksBtn) {
            editArtworksBtn.style.display = canEdit ? 'flex' : 'none';
        }
    });
}

// Make available globally
window.showEmptyModal = showEmptyModal;
window.closeEmptyModal = closeEmptyModal;
window.showFeatureArtworkModal = showFeatureArtworkModal;
window.closeFeatureArtworkModal = closeFeatureArtworkModal;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.checkProfileOwnership = checkProfileOwnership;
