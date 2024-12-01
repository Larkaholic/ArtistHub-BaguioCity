import { db } from '../js/firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    where
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
            const div = document.createElement('div');
            div.className = 'bg-gray-800 rounded-lg p-4 mb-4';
            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold text-white">${event.title}</h3>
                        <p class="text-gray-300">Start: ${event.startDate}</p>
                        <p class="text-gray-300">End: ${event.endDate}</p>
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

// Load pending registrations
async function loadPendingRegistrations() {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        const pendingList = document.getElementById('pendingArtists');
        
        if (pendingList) {
            if (querySnapshot.empty) {
                pendingList.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center py-4 text-gray-500">
                            No pending registrations found
                        </td>
                    </tr>`;
                return;
            }

            let pendingHTML = '';
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                pendingHTML += `
                    <tr class="hover:bg-gray-700">
                        <td class="px-6 py-4">${data.name || 'N/A'}</td>
                        <td class="px-6 py-4">${data.email || 'N/A'}</td>
                        <td class="px-6 py-4">${data.phone || 'N/A'}</td>
                        <td class="px-6 py-4">${data.address || 'N/A'}</td>
                        <td class="px-6 py-4">${new Date(data.registeredAt).toLocaleDateString()}</td>
                        <td class="px-6 py-4">
                            <button onclick="approveArtist('${doc.id}')"
                                    class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2">
                                Approve
                            </button>
                            <button onclick="rejectArtist('${doc.id}')"
                                    class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                                Reject
                            </button>
                        </td>
                    </tr>`;
            });
            pendingList.innerHTML = pendingHTML;
        }
    } catch (error) {
        console.error("Error loading pending registrations:", error);
    }
}

// Approve artist function
async function approveArtist(email) {
    try {
        const userRef = doc(db, "users", email);
        await updateDoc(userRef, {
            status: 'approved',
            approved: true,
            approvedAt: new Date().toISOString()
        });
        alert('Artist approved successfully');
        loadPendingRegistrations();
    } catch (error) {
        console.error("Error approving artist:", error);
        alert('Failed to approve artist');
    }
}

// Reject artist function
async function rejectArtist(email) {
    if (confirm('Are you sure you want to reject this registration?')) {
        try {
            const userRef = doc(db, "users", email);
            await updateDoc(userRef, {
                status: 'rejected',
                approved: false,
                rejectedAt: new Date().toISOString()
            });
            alert('Artist registration rejected');
            loadPendingRegistrations();
        } catch (error) {
            console.error("Error rejecting artist:", error);
            alert('Failed to reject artist');
        }
    }
}

// Make functions globally available
window.approveArtist = approveArtist;
window.rejectArtist = rejectArtist;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadPendingRegistrations();
    // ... existing initialization code ...
});

// Make functions globally available
window.openAddEventModal = openAddEventModal;
window.closeEventModal = closeEventModal;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent; 