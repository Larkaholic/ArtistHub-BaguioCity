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
// async function loadEvents() {
//     const eventsList = document.getElementById('eventsList');
//     if (!eventsList) return;

//     eventsList.innerHTML = `
//         <div class="animate-pulse space-y-4">
//             <div class="h-20 bg-white/10 rounded-lg"></div>
//             <div class="h-20 bg-white/10 rounded-lg"></div>
//         </div>
//     `;

//     try {
//         const q = query(collection(db, "events"), orderBy("startDate", "desc"));
//         const querySnapshot = await getDocs(q);

//         if (querySnapshot.empty) {
//             eventsList.innerHTML = `<p class="text-white text-center">No events found</p>`;
//             return;
//         }

//         eventsList.innerHTML = '';
//         querySnapshot.forEach((doc) => {
//             const event = doc.data();
//             const startDate = event.startDate ? new Date(event.startDate.seconds * 1000).toLocaleDateString() : 'N/A';
//             const endDate = event.endDate ? new Date(event.endDate.seconds * 1000).toLocaleDateString() : 'N/A';
//             const imageUrl = event.imageUrl ? `<img src="${event.imageUrl}" alt="${event.title}" class="mt-4 w-full h-48 object-cover rounded">` : '';

//             eventsList.innerHTML += `
//                 <div class="bg-gray-800 rounded-lg p-4 mb-4">
//                     <div class="flex justify-between items-start">
//                         <div>
//                             <h3 class="text-xl font-bold text-white">${event.title}</h3>
//                             <p class="text-gray-300">Start: ${startDate}</p>
//                             <p class="text-gray-300">End: ${endDate}</p>
//                             <p class="text-gray-300">Location: ${event.location || 'N/A'}</p>
//                             ${event.description ? `<p class="text-gray-300 mt-2">${event.description}</p>` : ''}
//                             ${event.isFeatured ? '<span class="bg-yellow-500 text-black px-2 py-1 rounded text-sm">Featured</span>' : ''}
//                         </div>
//                         <div class="flex space-x-2">
//                             <button onclick="editEvent('${doc.id}')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Edit</button>
//                             <button onclick="deleteEvent('${doc.id}')" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete</button>
//                         </div>
//                     </div>
//                     ${imageUrl}
//                 </div>
//             `;
//         });
//     } catch (error) {
//         console.error("Error loading events:", error);
//         eventsList.innerHTML = `<p class="text-red-500 text-center">Error loading events</p>`;
//     }
// }

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
        updatedAt: new Date().toISOString(),
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

async function editEvent(eventId) {
    try {
        const eventDoc = await getDoc(doc(db, "events", eventId));
        if (eventDoc.exists()) {
            const event = eventDoc.data();
            document.getElementById('eventId').value = eventId;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventStartDate').value = event.startDate;
            document.getElementById('eventEndDate').value = event.endDate;
            document.getElementById('eventLocation').value = event.location;
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventFeatured').checked = event.isFeatured || false;
            document.getElementById('eventModal').classList.remove('hidden');
            document.getElementById('eventModal').classList.add('flex');
        }
    } catch (error) {
        console.error("Error editing event:", error);
        alert("Failed to load event data");
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

// Initialize page
window.onload = () => {
    loadEvents();
    document.getElementById('eventForm').addEventListener('submit', handleFormSubmit);
};
window.openAddEventModal = openAddEventModal;
window.closeEventModal = closeEventModal;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
