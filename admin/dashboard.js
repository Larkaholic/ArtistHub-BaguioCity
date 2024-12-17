// import { db } from '../js/firebase-config.js';
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

// Initialize the image crawler
const crawler = new ImageCrawler();

// Modal functions
function openAddEventModal() {
    const form = document.getElementById('eventForm');
    if (form) {
        form.reset();
    }
    document.getElementById('modalTitle').textContent = 'Add New Event';
    document.getElementById('eventId').value = ''; // Clear any existing ID
    document.getElementById('eventModal').classList.remove('hidden');
    document.getElementById('eventModal').classList.add('flex');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
    document.getElementById('eventModal').classList.remove('flex');
}

// Load events function
async function loadEvents() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;

    try {
        const q = query(collection(getFirestore(), "events"), orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            eventsList.innerHTML = '<p class="text-white text-center">No events found</p>';
            return;
        }

        eventsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const startDate = event.startDate ? new Date(event.startDate.seconds * 1000) : null;
            const endDate = event.endDate ? new Date(event.endDate.seconds * 1000) : null;
            const div = document.createElement('div');
            div.className = 'bg-gray-800 rounded-lg p-4 mb-4';
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold text-white">${event.title}</h3>
                        <p class="text-gray-300">Start: ${startDate ? startDate.toLocaleDateString() : 'N/A'}</p>
                        <p class="text-gray-300">End: ${endDate ? endDate.toLocaleDateString() : 'N/A'}</p>
                        <p class="text-gray-300">Location: ${event.location}</p>
                        ${event.description ? `<p class="text-gray-300 mt-2">${event.description}</p>` : ''}
                        ${event.isFeatured ? '<span class="bg-yellow-500 text-black px-2 py-1 rounded text-sm">Featured</span>' : ''}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="editEvent('${doc.id}')" 
                            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Edit
                        </button>
                        <button onclick="deleteEvent('${doc.id}')" 
                            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                            Delete
                        </button>
                    </div>
                </div>
                ${event.imageUrl ? ` 
                    <img src="${event.imageUrl}" alt="${event.title}" 
                         class="mt-4 w-full h-48 object-cover rounded">
                ` : ''}
            `;
            eventsList.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading events:", error);
        eventsList.innerHTML = '<p class="text-red-500 text-center">Error loading events</p>';
    }
}

// Form submission handler
function handleFormSubmit(e) {
    e.preventDefault();
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        startDate: document.getElementById('eventStartDate').value,
        endDate: document.getElementById('eventEndDate').value,
        location: document.getElementById('eventLocation').value,
        description: document.getElementById('eventDescription').value,
        isFeatured: document.getElementById('eventFeatured').checked,
        imageUrl: document.getElementById('eventImageUrl').value,
        updatedAt: new Date().toISOString()
    };

    const eventId = document.getElementById('eventId').value;

    if (eventId) {
        // Update existing event
        updateDoc(doc(getFirestore(), "events", eventId), eventData)
            .then(() => {
                alert('Event updated successfully!');
                closeEventModal();
                loadEvents();
            })
            .catch((error) => {
                console.error('Error updating event:', error);
                alert('Failed to update event: ' + error.message);
            });
    } else {
        // Create new event
        eventData.createdAt = new Date().toISOString();
        addDoc(collection(getFirestore(), "events"), eventData)
            .then(() => {
                alert('Event created successfully!');
                closeEventModal();
                loadEvents();
            })
            .catch((error) => {
                console.error('Error creating event:', error);
                alert('Failed to create event: ' + error.message);
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

// Delete event function
async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            await deleteDoc(doc(getFirestore(), "events", eventId));
            alert('Event deleted successfully');
            loadEvents();
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event");
        }
    }
}

// Initialize event listeners after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeImageCrawler();
    initializeArtList();
    loadEvents();
    document.getElementById('eventForm').addEventListener('submit', handleFormSubmit);
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
