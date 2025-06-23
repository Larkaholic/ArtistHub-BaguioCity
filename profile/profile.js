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
        modal.className = 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-8 relative min-w-[900px] min-h-[400px] max-w-5xl w-full flex flex-col items-center justify-center max-h-[90vh] overflow-y-auto">
                <button onclick="closeFeatureArtworkModal()" class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                <h1 class="mb-4 text-2xl font-bold">Feature an Artwork</h1>
                <form id="featureArtworkForm" class="w-full">
                    <div id="featureArtworkList" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"></div>
                    <div class="flex justify-end mt-6">
                        <button type="submit" class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded font-semibold shadow">Save Featured Artworks</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.style.display = '';
    }
    modal.classList.remove('hidden');

    // Fetch and display artworks for the logged-in artist
    const listContainer = document.getElementById('featureArtworkList');
    if (listContainer) {
        listContainer.innerHTML = '<div class="text-gray-500 text-center w-full">Loading artworks...</div>';
    }

    // Get current user
    const user = auth.currentUser;
    if (!user) {
        if (listContainer) listContainer.innerHTML = '<div class="text-red-500 text-center w-full">Not logged in.</div>';
        return;
    }

    try {
        // Query artworks where artistId == user.uid
        const q = query(collection(db, "artworks"), where("artistId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            if (listContainer) listContainer.innerHTML = '<div class="text-gray-500 text-center w-full">No artworks found.</div>';
            return;
        }

        let html = '';
        querySnapshot.forEach(docSnap => {
            const art = docSnap.data();
            const artId = docSnap.id;
            html += `
                <label class="relative flex flex-col items-center border rounded-lg p-3 cursor-pointer hover:shadow-lg transition group">
                    <input type="checkbox" name="featuredArtworks" value="${artId}" class="absolute top-2 left-2 w-5 h-5 accent-orange-500 rounded border-gray-300 focus:ring-2 focus:ring-orange-400" />
                    <div class="w-32 h-32 mb-2 rounded-full overflow-hidden border flex items-center justify-center bg-gray-100">
                        <img src="${art.imageUrl || ''}" alt="${art.title || 'Artwork'}" class="w-full h-full object-cover" />
                    </div>
                    <div class="font-semibold text-center">${art.title || 'Untitled'}</div>
                    <div class="text-xs text-gray-500 text-center">${art.medium || ''}</div>
                </label>
            `;
        });
        if (listContainer) listContainer.innerHTML = html;
    } catch (err) {
        if (listContainer) listContainer.innerHTML = '<div class="text-red-500 text-center w-full">Failed to load artworks.</div>';
    }

    // Optionally, handle form submission for saving featured artworks
    const form = document.getElementById('featureArtworkForm');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            // Collect checked artwork IDs
            const checked = Array.from(form.elements['featuredArtworks'])
                .filter(input => input.checked)
                .map(input => input.value);
            // TODO: Save the checked artwork IDs as featured (implement as needed)
            alert('Selected featured artworks: ' + checked.join(', '));
            closeFeatureArtworkModal();
        };
    }
}

// Close the "Feature Artwork" modal
export function closeFeatureArtworkModal() {
    const modal = document.getElementById('featureArtworkModal');
    if (modal) {
        modal.style.display = 'none';
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
                    found = true;
                    html += `
                        <div class="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
                            <div class="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                                <img src="${art.imageUrl || ''}" alt="${art.title || 'Artwork'}" class="w-full h-full object-cover" />
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

// Make available globally
window.showEmptyModal = showEmptyModal;
window.closeEmptyModal = closeEmptyModal;
window.showFeatureArtworkModal = showFeatureArtworkModal;
window.closeFeatureArtworkModal = closeFeatureArtworkModal;
window.closeEmptyModal = closeEmptyModal;
window.showFeatureArtworkModal = showFeatureArtworkModal;
window.closeFeatureArtworkModal = closeFeatureArtworkModal;
