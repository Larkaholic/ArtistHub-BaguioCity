import { db } from '../js/firebase-config.js';
import { 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDocs, 
    query, 
    orderBy, 
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Cloudinary widget setup
const storage = getStorage();
const myWidget = cloudinary.createUploadWidget(
    {
        cloudName: 'dxeyr4pvf', 
        uploadPreset: 'artist_profiles',
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        maxFileSize: 5000000,
        folder: 'events'
    },
    (error, result) => {
        if (!error && result && result.event === "success") {
            console.log('Upload successful:', result.info);
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            const imageUrlInput = document.getElementById('eventImageUrl');
            imageUrlInput.value = result.info.secure_url;
            previewImg.src = result.info.secure_url;
            preview.classList.remove('hidden');
        } else if (error) {
            console.error('Upload error:', error);
        }
    }
);

// Upload button click handler
document.getElementById('upload_widget').addEventListener('click', () => myWidget.open(), false);

// Load events
export async function loadEvents() {
    try {
        const eventsRef = collection(db, "events");
        // Modified query - don't filter by createdAt since some events might not have it
        const querySnapshot = await getDocs(eventsRef);
        
        const eventsContainer = document.getElementById('eventsList');
        eventsContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            eventsContainer.innerHTML = `
                <div class="bg-gray-800 rounded-lg p-4 text-center">
                    <p class="text-gray-400">No events found. Add some events to get started.</p>
                </div>
            `;
            return;
        }
        
        // Debug: Count how many events we're processing
        console.log(`Loading ${querySnapshot.size} events`);
        
        // Sort manually - events with createdAt first, then others
        const eventsWithTimestamp = [];
        const eventsWithoutTimestamp = [];
        
        querySnapshot.forEach(doc => {
            const event = doc.data();
            if (event.createdAt) {
                eventsWithTimestamp.push({ id: doc.id, data: event });
            } else {
                eventsWithoutTimestamp.push({ id: doc.id, data: event });
            }
        });
        
        // Sort events with timestamp by timestamp descending
        eventsWithTimestamp.sort((a, b) => {
            const timeA = a.data.createdAt?.toMillis?.() || 0;
            const timeB = b.data.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });
        
        // Combine sorted lists
        const allEvents = [...eventsWithTimestamp, ...eventsWithoutTimestamp];
        
        // Debug: Log final event count
        console.log(`Displaying ${allEvents.length} events`);
        
        // Handle empty results after filtering
        if (allEvents.length === 0) {
            eventsContainer.innerHTML = `
                <div class="bg-gray-800 rounded-lg p-4 text-center">
                    <p class="text-gray-400">No events found. Add some events to get started.</p>
                </div>
            `;
            return;
        }
        
        // Render all events
        allEvents.forEach(({ id: eventId, data: event }) => {
            try {
                // Handle different date field names and formats
                let displayDate = 'No date specified';
                if (event.date) {
                    displayDate = new Date(event.date).toLocaleDateString();
                } else if (event.startDate) {
                    displayDate = new Date(event.startDate).toLocaleDateString();
                }
                
                // Improved image handling
                const hasImage = event.imageUrl && typeof event.imageUrl === 'string' && event.imageUrl.trim() !== '';
                // Add a default image when none exists
                const imageThumbnail = hasImage ? `
                    <div class="mt-2">
                        <img src="${event.imageUrl}" alt="${event.title}" class="w-20 h-20 object-cover rounded-md" 
                             onerror="this.onerror=null; this.src='https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/ibagiw.jpg';">
                    </div>
                ` : `
                    <div class="mt-2">
                        <img src="https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/ibagiw.jpg" 
                             alt="No image available" class="w-20 h-20 object-cover rounded-md opacity-50">
                        <p class="text-xs text-gray-500 mt-1">No image available</p>
                    </div>
                `;
                
                // Check for featured status - handle both isFeatured and featured
                const isFeatured = event.featured || event.isFeatured;
                
                eventsContainer.innerHTML += `
                    <div class="bg-gray-800 rounded-lg p-4 event-item" data-id="${eventId}">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-semibold text-white">${event.title || 'Untitled Event'}</h3>
                                <p class="text-sm text-gray-300 mt-2"><strong>Date:</strong> ${displayDate}</p>
                                <p class="text-sm text-gray-300"><strong>Location:</strong> ${event.location || 'Not specified'}</p>
                                <div class="mt-2">
                                    <p class="text-sm text-gray-300"><strong>Description:</strong></p>
                                    <p class="text-sm text-gray-400">${event.description || 'No description provided'}</p>
                                </div>
                                ${imageThumbnail}
                            </div>
                            ${isFeatured ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-800 text-yellow-300">Featured</span>' : ''}
                        </div>
                        
                        <div class="flex mt-4 space-x-2 justify-end">
                            <button onclick="editEvent('${eventId}')" 
                                    class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Edit
                            </button>
                            <button onclick="deleteEvent('${eventId}')" 
                                    class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error("Error rendering event:", error, eventId);
            }
        });
        
    } catch (error) {
        console.error("Error loading events:", error);
        const eventsContainer = document.getElementById('eventsList');
        eventsContainer.innerHTML = `
            <div class="bg-red-800 rounded-lg p-4 text-center">
                <p class="text-white">Error loading events. Please try again.</p>
            </div>
        `;
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
        featured: document.getElementById('eventFeatured').checked, // Use 'featured' consistently
        isFeatured: document.getElementById('eventFeatured').checked, // Keep for backward compatibility
        imageUrl: document.getElementById('eventImageUrl').value || '', // Ensure imageUrl is never undefined
        updatedAt: new Date().toISOString(),
        date: document.getElementById('eventStartDate').value, // Add 'date' for compatibility
    };

    const eventId = document.getElementById('eventId').value;
    if (eventId) {
        updateEvent(eventId, eventData);
    } else {
        createEvent(eventData);
    }
}

// Add/Edit event modals
function openAddEventModal() {
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Event';
    document.getElementById('eventModal').classList.remove('hidden');
    document.getElementById('eventModal').classList.add('flex');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
    document.getElementById('eventModal').classList.remove('flex');
}

// Create, update, delete, and edit event functions
async function createEvent(eventData) {
    try {
        // Add necessary fields if missing
        if (!eventData.imageUrl) {
            eventData.imageUrl = '';
        }
        
        // Add timestamp for sorting
        eventData.createdAt = serverTimestamp();
        
        // Ensure date field is set for compatibility with older code
        if (eventData.startDate && !eventData.date) {
            eventData.date = eventData.startDate;
        }
        
        await addDoc(collection(db, "events"), eventData);
        alert("Event created successfully!");
        closeEventModal();
        loadEvents();
    } catch (error) {
        console.error("Error creating event:", error);
        alert("Failed to create event");
    }
}

async function updateEvent(eventId, eventData) {
    try {
        await updateDoc(doc(db, "events", eventId), eventData);
        alert("Event updated successfully!");
        closeEventModal();
        loadEvents();
    } catch (error) {
        console.error("Error updating event:", error);
        alert("Failed to update event");
    }
}

// Update the edit function to handle different event structures
async function editEvent(eventId) {
    try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
            const event = eventDoc.data();
            document.getElementById('eventId').value = eventId;
            document.getElementById('eventTitle').value = event.title || '';
            
            // Handle different date field structures
            if (event.startDate) {
                document.getElementById('eventStartDate').value = event.startDate;
            } else if (event.date) {
                document.getElementById('eventStartDate').value = event.date;
            }
            
            document.getElementById('eventEndDate').value = event.endDate || '';
            document.getElementById('eventLocation').value = event.location || '';
            document.getElementById('eventDescription').value = event.description || '';
            
            // Handle different featured field names
            document.getElementById('eventFeatured').checked = event.featured || event.isFeatured || false;
            
            // Handle image URL
            const imageUrlInput = document.getElementById('eventImageUrl');
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            
            if (event.imageUrl) {
                imageUrlInput.value = event.imageUrl;
                previewImg.src = event.imageUrl;
                preview.classList.remove('hidden');
            } else {
                imageUrlInput.value = '';
                preview.classList.add('hidden');
            }
            
            document.getElementById('modalTitle').textContent = 'Edit Event';
            document.getElementById('eventModal').classList.remove('hidden');
            document.getElementById('eventModal').classList.add('flex');
        }
    } catch (error) {
        console.error("Error editing event:", error);
        alert("Failed to load event data: " + error.message);
    }
}

async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            await deleteDoc(doc(db, "events", eventId));
            alert("Event deleted successfully");
            loadEvents();
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event");
        }
    }
}

// Add function to remove image
function removeImage() {
    const preview = document.getElementById('imagePreview');
    const imageUrlInput = document.getElementById('eventImageUrl');
    imageUrlInput.value = '';
    preview.classList.add('hidden');
}

// Initialize page
window.onload = function() {
    loadEvents(); // Now this reference will be valid
    document.getElementById('eventForm').addEventListener('submit', handleFormSubmit);
};

// Make the function globally accessible
window.loadEvents = loadEvents;

window.openAddEventModal = openAddEventModal;
window.closeEventModal = closeEventModal;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.removeImage = removeImage;
