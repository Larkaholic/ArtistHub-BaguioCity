import { db } from '../js/firebase-config.js';
import { auth } from '../js/firebase-config.js';
import { 
    getFirestore,
    collection, 
    getDoc,
    getDocs, 
    query, 
    where, 
    orderBy, 
    doc, 
    updateDoc, 
    deleteDoc, 
    addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ImageCrawler } from '../Gallery/imageCrawler.js';
import { removeFeaturedArtist, displayCurrentlyFeaturedArtists } from './featuredArtists.js';
import { loadPendingArtists, approveArtist, rejectArtist } from './artistRequest.js';
import { loadEvents } from './eventManagement.js';
import { loadPendingIdVerifications } from './idVerification.js'; 
import { loadEventRequests } from './eventRequests.js';
import { loadFeaturedArtists } from './featuredArtists.js';

// Initialize the image crawler
const crawler = new ImageCrawler();

// Modal functions
function openAddEventModal() {
    const form = document.getElementById('eventForm');
    if (form) {
        form.reset();
    }
    document.getElementById('modalTitle').textContent = 'Add New Event';
    document.getElementById('eventId').value = '';
    document.getElementById('eventModal').classList.remove('hidden');
    document.getElementById('eventModal').classList.add('flex');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
    document.getElementById('eventModal').classList.remove('flex');
}

// Format date for display
function formatEventDate(date) {
    if (!date) return 'Not specified';
    const eventDate = new Date(date.seconds * 1000);
    return eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        startDate: new Date(document.getElementById('eventStartDate').value),
        endDate: new Date(document.getElementById('eventEndDate').value),
        location: document.getElementById('eventLocation').value,
        description: document.getElementById('eventDescription').value,
        isFeatured: document.getElementById('eventFeatured').checked,
        imageUrl: document.getElementById('eventImageUrl').value,
        updatedAt: new Date().toISOString()
    };

    const eventId = document.getElementById('eventId').value;

    if (eventId) {
        updateDoc(doc(db, "events", eventId), eventData)
            .then(() => {
                alert('Event updated successfully!');
                closeEventModal();
                loadEvents();
            })
            .catch((error) => {
                console.error('Error updating event:', error);
                alert('Failed to update event');
            });
    } else {
        eventData.createdAt = new Date().toISOString();
        addDoc(collection(db, "events"), eventData)
            .then(() => {
                alert('Event added successfully!');
                closeEventModal();
                loadEvents();
            })
            .catch((error) => {
                console.error('Error adding event:', error);
                alert('Failed to add event');
            });
    }
}

// Edit event function
async function editEvent(eventId) {
    try {
        const eventDoc = await getDoc(doc(getFirestore(), "events", eventId));
        if (eventDoc.exists()) {
            const event = eventDoc.data();
            
            // Fill the form with event data
            document.getElementById('eventId').value = eventId;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventStartDate').value = event.startDate;
            document.getElementById('eventEndDate').value = event.endDate;
            document.getElementById('eventLocation').value = event.location;
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventFeatured').checked = event.isFeatured || false;
            
            // Update modal title and show modal
            document.getElementById('modalTitle').textContent = 'Edit Event';
            document.getElementById('eventModal').classList.remove('hidden');
            document.getElementById('eventModal').classList.add('flex');
        }
    } catch (error) {
        console.error("Error editing event:", error);
        alert("Failed to load event data");
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            await deleteDoc(doc(db, "events", eventId));
            alert('Event deleted successfully!');
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event');
        }
    }
}

// Get status class
function getStatusClass(status) {
    switch(status?.toLowerCase()) {
        case 'approved':
            return 'bg-green-100 text-green-800';
        case 'rejected':
            return 'bg-red-100 text-red-800';
        case 'pending':
        default:
            return 'bg-yellow-100 text-yellow-800';
    }
}

// Combine all initialization into a single loadAllData function
async function loadAllData() {
    console.log("Loading all dashboard data...");
    await loadEvents(); // Load events only once
    await loadPendingIdVerifications();
    await loadEventRequests();
    await loadFeaturedArtists();
    displayCurrentlyFeaturedArtists();
}

// Initialize event listeners after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard initializing...");
    initializeImageCrawler();
    initializeArtList();
    loadEvents();
    displayCurrentlyFeaturedArtists();
    document.getElementById('eventForm').addEventListener('submit', handleFormSubmit);
    addRemoveButtonToFeaturedArtists();
    
    // Load pending artists
    console.log("Loading pending artists...");
    loadPendingArtists();
    
    console.log("Loading ID verifications...");
    loadPendingIdVerifications();
    
    loadEventRequests();
    loadFeaturedArtists();
    
    // Make functions available globally
    window.loadPendingArtists = loadPendingArtists;
    window.approveArtist = approveArtist;
    window.rejectArtist = rejectArtist;
    
    // Fix the querySelector to use a valid selector
    const idVerificationSection = document.querySelector('.bg-gray-800 h2[data-section="pending-verifications"]');
    if (idVerificationSection && idVerificationSection.parentNode) {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'ml-2 text-sm text-blue-500 hover:text-blue-700';
        refreshButton.textContent = 'Refresh';
        refreshButton.onclick = loadPendingIdVerifications;
        idVerificationSection.appendChild(refreshButton);
    }
    
    // Add refresh button for pending artists
    const pendingArtistsSection = document.querySelector('h2:contains("Pending Artist Registrations")') || 
                                 Array.from(document.querySelectorAll('h2')).find(h2 => h2.textContent.includes('Pending Artist Registrations'));
    if (pendingArtistsSection) {
        const refreshButton = document.createElement('button');
        refreshButton.className = 'ml-2 text-sm text-blue-500 hover:text-blue-700';
        refreshButton.textContent = 'Refresh';
        refreshButton.onclick = () => {
            console.log("Refreshing pending artists...");
            loadPendingArtists();
        };
        pendingArtistsSection.appendChild(refreshButton);
    }
});

function initializeImageCrawler() {
    const checkImageButton = document.getElementById('checkImage');
    if (checkImageButton) {
        checkImageButton.addEventListener('click', async () => {
            const imageId = document.getElementById('imageId').value;
            if (!imageId) {
                showCrawlerError('Please enter an image ID');
                return;
            }

            try {
                const result = await crawler.checkImage(imageId);
                showCrawlerResults(result);
            } catch (error) {
                showCrawlerError(error.message);
            }
        });
    }
}

function initializeArtList() {
    const showArtListButton = document.getElementById('showArtList');
    const refreshArtListButton = document.getElementById('refreshArtList');
    
    if (showArtListButton) {
        showArtListButton.addEventListener('click', loadArtList);
    }
    
    if (refreshArtListButton) {
        refreshArtListButton.addEventListener('click', loadArtList);
    }
}

async function loadArtList() {
    const artListContainer = document.getElementById('artList');
    if (!artListContainer) return;

    try {
        // Show loading state
        artListContainer.innerHTML = '<div class="text-gray-400 text-center">Loading art list...</div>';

        const db = getFirestore();
        const artworksRef = collection(db, 'gallery_images');
        const q = query(artworksRef);  // Remove orderBy for now since we'll sort in JS
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            artListContainer.innerHTML = '<div class="text-gray-400 text-center">No artworks found</div>';
            return;
        }

        // Convert to array for sorting
        const artworks = [];
        querySnapshot.forEach((doc) => {
            artworks.push({ id: doc.id, ...doc.data() });
        });

        // Sort by date (handling both timestamp and ISO string)
        artworks.sort((a, b) => {
            const dateA = a.uploadDate?.seconds ? new Date(a.uploadDate.seconds * 1000) :
                         a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.uploadDate?.seconds ? new Date(b.uploadDate.seconds * 1000) :
                         b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;  // Most recent first
        });

        let artListHTML = '';
        artworks.forEach((art) => {
            const timestamp = art.uploadDate?.seconds ? new Date(art.uploadDate.seconds * 1000) :
                            art.createdAt ? new Date(art.createdAt) : new Date();
            const imageId = art.imageId || 'N/A';
            
            artListHTML += `
                <div class="bg-gray-800 p-3 rounded-lg mb-3 hover:bg-gray-700 transition-colors">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-gray-300"><strong>Artist:</strong> ${art.artistEmail || 'Unknown'}</p>
                            <p class="text-gray-400 text-sm"><strong>ID:</strong> ${imageId}</p>
                            <p class="text-gray-400 text-sm"><strong>Date:</strong> ${timestamp.toLocaleString()}</p>
                        </div>
                        <button onclick="copyToImageId('${imageId}')" 
                                class="text-blue-400 hover:text-blue-300 text-sm"
                                title="Copy to Image ID field">
                            Copy ID
                        </button>
                    </div>
                    ${art.title ? `<p class="text-gray-400 mt-1 text-sm"><strong>Title:</strong> ${art.title}</p>` : ''}
                    ${art.imageUrl ? `
                        <img src="${art.imageUrl}" alt="${art.title || 'Artwork'}" 
                             class="mt-2 w-full h-32 object-cover rounded">
                    ` : ''}
                </div>
            `;
        });

        artListContainer.innerHTML = artListHTML;
    } catch (error) {
        console.error("Error loading art list:", error);
        artListContainer.innerHTML = '<div class="text-red-400 text-center">Error loading art list</div>';
    }
}

function copyToImageId(imageId) {
    const imageIdInput = document.getElementById('imageId');
    if (imageIdInput) {
        imageIdInput.value = imageId;
        // Optional: Automatically trigger the check
        document.getElementById('checkImage')?.click();
    }
}

function showCrawlerResults(result) {
    const resultsDiv = document.getElementById('crawlerResults');
    const databaseResult = document.getElementById('databaseResult');
    const searchLinks = document.getElementById('searchLinks');
    
    resultsDiv.classList.remove('hidden');
    
    if (result.exists) {
        databaseResult.innerHTML = `
            <div class="text-green-400">✓ Image found in database</div>
            <div class="mt-2 text-gray-300">
                <p><strong>Uploaded by:</strong> ${result.uploader}</p>
                <p><strong>Upload date:</strong> ${result.uploadDate}</p>
                <p><strong>Title:</strong> ${result.title}</p>
            </div>
        `;
    } else {
        databaseResult.innerHTML = `
            <div class="text-red-400">✗ Image not found in database</div>
        `;
    }

    // Generate search links
    const searchUrls = crawler.generateSearchUrls(result.imageUrl || '');
    searchLinks.innerHTML = `
        <div class="font-medium text-gray-300">Search for this image:</div>
        <div class="flex gap-4 mt-2">
            ${Object.entries(searchUrls).map(([name, url]) => `
                <a href="${url}" target="_blank" class="hover:text-blue-400">
                    ${name}
                </a>
            `).join('')}
        </div>
    `;
}

function showCrawlerError(message) {
    const resultsDiv = document.getElementById('crawlerResults');
    resultsDiv.classList.remove('hidden');
    document.getElementById('databaseResult').innerHTML = `
        <div class="text-red-400">${message}</div>
    `;
    document.getElementById('searchLinks').innerHTML = '';
}

function addRemoveButtonToFeaturedArtists() {
    const featuredArtistsList = document.getElementById("featuredArtistsList");
    const artistCards = featuredArtistsList.querySelectorAll("div[data-artist-id]");

    artistCards.forEach(card => {
        const artistId = card.dataset.artistId;
        const removeButton = document.createElement("button");
        removeButton.className = "bg-red-500 text-white py-1 px-4 rounded-md hover:bg-red-600 transition duration-300 font-semibold border-2 border-black mt-2";
        removeButton.innerText = "Remove";
        removeButton.onclick = () => {
            removeFeaturedArtist(artistId);
            card.remove();
        };
        card.appendChild(removeButton);
    });
}

// Update the date formatting function to include time
function formatEventDateTime(date) {
    if (!date) return 'Not specified';
    const eventDate = new Date(date.seconds ? date.seconds * 1000 : date);
    return eventDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Export functions
export {
    openAddEventModal,
    closeEventModal,
    loadEvents,
    handleFormSubmit,
    deleteEvent,
    getStatusClass,
    loadPendingArtists,
    approveArtist,
    rejectArtist
};
