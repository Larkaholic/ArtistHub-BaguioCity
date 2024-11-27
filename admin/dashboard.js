import { auth, db } from '../js/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc,
    doc,
    getDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// protect admin route
function checkAdminAccess() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (!userData?.isAdmin) {
            window.location.href = '../index.html';
            return;
        }

        // if we get here, user is admin, load the dashboard
        loadEvents();
    });
}

// load existing events
async function loadEvents() {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '';

    try {
        const eventsQuery = query(collection(db, "events"), orderBy("date", "asc"));
        const querySnapshot = await getDocs(eventsQuery);

        if (querySnapshot.empty) {
            eventsList.innerHTML = `
                <div class="glass-header rounded-lg p-4 text-center text-white col-span-full">
                    no events yet
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
                        '<span class="bg-yellow-500 text-black px-2 py-1 rounded-md text-sm">featured</span>' 
                        : ''}
                </div>
                <p class="text-gray-200">date: ${formattedDate}</p>
                <p class="text-gray-200">location: ${event.location}</p>
                <p class="text-gray-200">${event.description}</p>
                <button onclick="deleteEvent('${doc.id}')" 
                    class="mt-4 bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 transition duration-300">
                    delete
                </button>
            `;
            eventsList.appendChild(eventEl);
        });
    } catch (error) {
        eventsList.innerHTML = `
            <div class="glass-header rounded-lg p-4 text-center text-white col-span-full">
                error loading events
            </div>
        `;
    }
}

// delete event
window.deleteEvent = async (eventId) => {
    if (confirm('are you sure you want to delete this event?')) {
        try {
            await deleteDoc(doc(db, "events", eventId));
            alert('event deleted successfully');
            loadEvents();
        } catch (error) {
            alert('error deleting event: ' + error.message);
        }
    }
};

// initialize only once
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
}); 