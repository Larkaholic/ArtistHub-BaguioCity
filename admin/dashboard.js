import { auth, db } from '../js/firebase-config.js';
import { 
    collection, 
    addDoc,
    getDocs, 
    deleteDoc, 
    doc, 
    query, 
    orderBy,
    where,
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// cloudinary widget configuration
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
            // Update preview
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

// click handler for upload button
document.getElementById('upload_widget').addEventListener('click', function() {
    myWidget.open();
}, false);

// load pending registrations
async function loadPendingRegistrations() {
    const pendingList = document.getElementById('pendingList');
    pendingList.innerHTML = '';

    try {
        const usersQuery = query(
            collection(db, "users"), 
            where("userType", "==", "artist"),
            where("status", "==", "pending")
        );
        const querySnapshot = await getDocs(usersQuery);

        if (querySnapshot.empty) {
            pendingList.innerHTML = `
                <div class="glass-header rounded-lg p-4 text-center text-white">
                    No pending registrations
                </div>
            `;
            return;
        }

        querySnapshot.forEach((doc) => {
            const user = doc.data();
            const registrationEl = document.createElement('div');
            registrationEl.className = 'glass-header rounded-lg p-4 space-y-2';
            registrationEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-bold text-white">${user.email}</h3>
                        <p class="text-gray-200">Registration Date: ${new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="approveRegistration('${doc.id}')" 
                            class="bg-green-500 text-white px-4 py-1 rounded-md hover:bg-green-600 transition duration-300">
                            Approve
                        </button>
                        <button onclick="rejectRegistration('${doc.id}')" 
                            class="bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 transition duration-300">
                            Reject
                        </button>
                    </div>
                </div>
            `;
            pendingList.appendChild(registrationEl);
        });
    } catch (error) {
        pendingList.innerHTML = `
            <div class="glass-header rounded-lg p-4 text-center text-white">
                Error loading registrations
            </div>
        `;
    }
}

// Approve registration handler
window.approveRegistration = async (userId) => {
    try {
        await updateDoc(doc(db, "users", userId), {
            status: 'approved'
        });
        alert('Registration approved');
        loadPendingRegistrations();
    } catch (error) {
        alert('Error approving registration: ' + error.message);
    }
};

// Reject registration handler
window.rejectRegistration = async (userId) => {
    if (confirm('Are you sure you want to reject this registration?')) {
        try {
            await updateDoc(doc(db, "users", userId), {
                status: 'rejected'
            });
            alert('Registration rejected');
            loadPendingRegistrations();
        } catch (error) {
            alert('Error rejecting registration: ' + error.message);
        }
    }
};

// Event Modal Functions
window.openAddEventModal = function() {
    document.getElementById('modalTitle').textContent = 'Add New Event';
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    document.getElementById('eventModal').classList.remove('hidden');
};

window.closeEventModal = function() {
    document.getElementById('eventModal').classList.add('hidden');
};

// Handle Event Form Submission
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const imageUrl = document.getElementById('eventImageUrl').value;
    if (!imageUrl) {
        alert('Please upload an image for the event');
        return;
    }

    const eventData = {
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        location: document.getElementById('eventLocation').value,
        description: document.getElementById('eventDescription').value,
        isFeatured: document.getElementById('eventFeatured').checked,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "events"), eventData);
        alert('Event created successfully!');
        closeEventModal();
        loadEvents();
    } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to create event: ' + error.message);
    }
});

// Load existing events
async function loadEvents() {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    try {
        const eventsQuery = query(collection(db, "events"), orderBy("date", "asc"));
        const querySnapshot = await getDocs(eventsQuery);

        if (querySnapshot.empty) {
            eventsList.innerHTML = `
                <div class="glass-header rounded-lg p-4 text-center text-white col-span-full">
                    No events yet
                </div>
            `;
            return;
        }

        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const eventEl = document.createElement('div');
            eventEl.className = 'glass-header rounded-lg p-4 space-y-2';
            eventEl.innerHTML = `
                <div class="flex justify-between items-start">
                    <h3 class="text-lg font-bold text-white">${event.title}</h3>
                    ${event.isFeatured ? 
                        '<span class="bg-yellow-500 text-black px-2 py-1 rounded-md text-sm">Featured</span>' 
                        : ''}
                </div>
                ${event.imageUrl ? `
                    <img src="${event.imageUrl}" alt="${event.title}" 
                         class="w-full h-48 object-cover rounded-lg">
                ` : ''}
                <p class="text-gray-200">Date: ${formattedDate}</p>
                <p class="text-gray-200">Location: ${event.location}</p>
                <p class="text-gray-200">${event.description}</p>
                <button onclick="deleteEvent('${doc.id}')" 
                    class="mt-4 bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 transition duration-300">
                    Delete
                </button>
            `;
            eventsList.appendChild(eventEl);
        });
    } catch (error) {
        eventsList.innerHTML = `
            <div class="glass-header rounded-lg p-4 text-center text-white col-span-full">
                Error loading events
            </div>
        `;
    }
}

// Delete event handler
window.deleteEvent = async (eventId) => {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            await deleteDoc(doc(db, "events", eventId));
            alert('Event deleted successfully');
            loadEvents();
        } catch (error) {
            alert('Error deleting event: ' + error.message);
        }
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPendingRegistrations();
    loadEvents();
}); 