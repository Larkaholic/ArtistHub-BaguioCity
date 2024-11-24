import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    orderBy, 
    getDocs, 
    where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadEvents() {
    // get containers
    const upcomingEventsContainer = document.querySelector('.EvntContainer');
    if (!upcomingEventsContainer) return;

    try {
        // get events from firestore
        const eventsQuery = query(
            collection(db, "events"),
            orderBy("date", "asc")
        );
        
        const querySnapshot = await getDocs(eventsQuery);
        
        // clear existing "no event yet" buttons
        upcomingEventsContainer.innerHTML = `
            <h2 class="EvntTitle text-center glass-header rounded-full p-3 font-bold mb-4">
                UPCOMING EVENTS
            </h2>
        `;

        if (querySnapshot.empty) {
            // if no events, show default message
            upcomingEventsContainer.innerHTML += `
                <button class="EvntRow glass-header rounded-lg w-full p-3 mb-4">
                    No event yet
                </button>
            `;
            return;
        }

        // add each event to the container
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const eventButton = document.createElement('button');
            eventButton.className = 'EvntRow glass-header rounded-lg w-full p-3 mb-4';
            eventButton.innerHTML = `
                <div class="flex justify-between items-center">
                    <div class="text-left">
                        <h3 class="text-lg font-bold">${event.title}</h3>
                        <p class="text-sm">${formattedDate}</p>
                        <p class="text-sm">${event.location}</p>
                    </div>
                    ${event.isFeatured ? '<span class="bg-yellow-500 text-black px-2 py-1 rounded-md text-sm">featured</span>' : ''}
                </div>
            `;
            upcomingEventsContainer.appendChild(eventButton);
        });

    } catch (error) {
        console.error('error loading events:', error);
        upcomingEventsContainer.innerHTML = `
            <h2 class="EvntTitle text-center glass-header rounded-full p-3 font-bold mb-4">
                UPCOMING EVENTS
            </h2>
            <button class="EvntRow glass-header rounded-lg w-full p-3 mb-4">
                Error loading events
            </button>
        `;
    }
}

// load events when page loads
document.addEventListener('DOMContentLoaded', loadEvents); 