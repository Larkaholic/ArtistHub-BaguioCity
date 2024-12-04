import { db } from '../js/firebase-config.js';
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
        const q = query(collection(db, "events"), orderBy("startDate", "desc"));
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
        updateDoc(doc(db, "events", eventId), eventData)
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
        addDoc(collection(db, "events"), eventData)
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
        const eventDoc = await getDoc(doc(db, "events", eventId));
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
            await deleteDoc(doc(db, "events", eventId));
            alert('Event deleted successfully');
            loadEvents();
        } catch (error) {
            console.error("Error deleting event:", error);
            alert("Failed to delete event");
        }
    }
}

// Initialize page
window.onload = function() {
    loadEvents();
    document.getElementById('eventForm').addEventListener('submit', handleFormSubmit);
};
