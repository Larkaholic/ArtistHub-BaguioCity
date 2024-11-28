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
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const storage = getStorage();

// add cloudinary widget configuration
var myWidget = cloudinary.createUploadWidget(
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
            // update preview
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            const imageUrlInput = document.getElementById('eventImageUrl');
            
            imageUrlInput.value = result.info.secure_url;
            previewImg.src = result.info.secure_url;
            preview.classList.remove('hidden');
        }
        if (error) {
            console.error('Upload error:', error);
        }
    }
);

// add click handler for upload button
document.getElementById('upload_widget').addEventListener('click', function() {
    myWidget.open();
}, false);

// create event
async function createEvent(eventData) {
    try {
        await addDoc(collection(db, "events"), eventData);
        loadEvents();
        closeEventModal();
    } catch (error) {
        console.error("error creating event:", error);
        alert("failed to create event");
    }
}

// read events
async function loadEvents() {
    const eventsList = document.getElementById('eventsList');
    
    if (!eventsList) {
        console.warn('Events list container not found - waiting for dashboard initialization');
        return;
    }

    try {
        // Show loading state
        eventsList.innerHTML = `
            <div class="animate-pulse space-y-4">
                <div class="h-20 bg-white/10 rounded-lg"></div>
                <div class="h-20 bg-white/10 rounded-lg"></div>
            </div>
        `;

        // Load events
        const q = query(collection(db, "events"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            eventsList.innerHTML = `
                <div class="text-center py-8 bg-white/5 rounded-lg">
                    <p class="text-gray-400">No events found</p>
                </div>
            `;
            return;
        }

        // Display events
        eventsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const date = event.date ? new Date(event.date).toLocaleDateString() : 'No date';
            
            eventsList.innerHTML += `
                <div class="glass-header p-4 rounded-lg mb-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-xl font-bold text-white">${event.title}</h3>
                            <p class="text-gray-300">${date}</p>
                            <p class="text-gray-300">${event.location || 'No location'}</p>
                        </div>
                        <div class="flex gap-2">
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
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading events:", error);
        eventsList.innerHTML = `
            <div class="text-center py-8 bg-red-500/10 rounded-lg">
                <p class="text-red-400">Error loading events</p>
            </div>
        `;
    }
}

// update event
async function updateEvent(eventId, eventData) {
    try {
        await updateDoc(doc(db, "events", eventId), eventData);
        loadEvents();
        closeEventModal();
    } catch (error) {
        console.error("error updating event:", error);
        alert("failed to update event");
    }
}

// delete event
async function deleteEvent(eventId) {
    if (confirm("are you sure you want to delete this event?")) {
        try {
            // Get event data to get image URL
            const eventDoc = await getDoc(doc(db, "events", eventId));
            if (eventDoc.exists() && eventDoc.data().imageUrl) {
                // Delete image from storage
                const imageRef = ref(storage, eventDoc.data().imageUrl);
                try {
                    await deleteObject(imageRef);
                } catch (error) {
                    console.warn("error deleting image:", error);
                }
            }
            
            // Delete event document
            await deleteDoc(doc(db, "events", eventId));
            loadEvents();
        } catch (error) {
            console.error("error deleting event:", error);
            alert("failed to delete event");
        }
    }
}

// modal functions
function openAddEventModal() {
    document.getElementById('modalTitle').textContent = 'Add New Event';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('eventModal').classList.remove('hidden');
    document.getElementById('eventModal').classList.add('flex');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.add('hidden');
    document.getElementById('eventModal').classList.remove('flex');
}

// form submission handler
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const eventId = document.getElementById('eventId').value;
        const imageUrl = document.getElementById('eventImageUrl').value;

        const eventData = {
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            location: document.getElementById('eventLocation').value,
            description: document.getElementById('eventDescription').value,
            isFeatured: document.getElementById('eventFeatured').checked,
            imageUrl: imageUrl
        };

        if (eventId) {
            await updateEvent(eventId, eventData);
        } else {
            await createEvent(eventData);
        }

        // reset form and close modal
        document.getElementById('eventForm').reset();
        document.getElementById('imagePreview').classList.add('hidden');
        closeEventModal();
        
    } catch (error) {
        console.error("error saving event:", error);
        alert("failed to save event");
    }
});

// add this function
async function editEvent(eventId) {
    try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
            const event = eventDoc.data();
            
            document.getElementById('eventId').value = eventId;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventLocation').value = event.location;
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventFeatured').checked = event.isFeatured || false;
            
            // Show existing image preview
            if (event.imageUrl) {
                const preview = document.getElementById('imagePreview');
                const previewImg = document.getElementById('previewImg');
                previewImg.src = event.imageUrl;
                preview.classList.remove('hidden');
            }
            
            document.getElementById('modalTitle').textContent = 'Edit Event';
            document.getElementById('eventModal').classList.remove('hidden');
            document.getElementById('eventModal').classList.add('flex');
        }
    } catch (error) {
        console.error("error editing event:", error);
        alert("failed to load event data");
    }
}

// make functions globally available
window.openAddEventModal = openAddEventModal;
window.closeEventModal = closeEventModal;
window.deleteEvent = deleteEvent;
window.editEvent = editEvent;

// load events when page loads
document.addEventListener('DOMContentLoaded', loadEvents); 