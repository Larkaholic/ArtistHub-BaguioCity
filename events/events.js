import { db } from '../js/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadEventDetails() {
    try {
        // get event id from url
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (!eventId) {
            throw new Error('No event ID provided');
        }

        console.log('loading event with id:', eventId); // debug log

        // get event details
        const eventRef = doc(db, "events", eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (!eventDoc.exists()) {
            throw new Error('Event not found');
        }

        const event = eventDoc.data();
        console.log('event data:', event); // debug log

        const eventDetails = document.getElementById('eventDetails');

        // update page title
        document.title = `${event.title} - Artist Hub`;

        // display event details
        eventDetails.innerHTML = `
            <div class="flex flex-col md:flex-row gap-8">
                <!-- event image -->
                <div class="w-full md:w-1/2">
                    <img src="${event.imageUrl || 'https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/ibagiw.jpg'}" 
                         alt="${event.title}" 
                         class="w-full h-[300px] object-cover rounded-lg">
                </div>

                <!-- event information -->
                <div class="w-full md:w-1/2">
                    <h1 class="text-3xl font-bold mb-4 text-black">${event.title}</h1>
                    
                    <div class="space-y-4">
                        <div>
                            <h2 class="text-xl font-semibold text-black">Date & Time</h2>
                            <p class="text-black">${new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>

                        <div>
                            <h2 class="text-xl font-semibold text-black">Location</h2>
                            <p class="text-black">${event.location}</p>
                        </div>

                        ${event.description ? `
                            <div>
                                <h2 class="text-xl font-semibold text-black">Description</h2>
                                <p class="text-black">${event.description}</p>
                            </div>
                        ` : ''}

                        ${event.organizer ? `
                            <div>
                                <h2 class="text-xl font-semibold text-black">Organizer</h2>
                                <p class="text-black">${event.organizer}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("error loading event details:", error);
        const eventDetails = document.getElementById('eventDetails');
        eventDetails.innerHTML = `
            <div class="text-center text-black">
                <h2 class="text-2xl font-bold mb-4">Event Not Found</h2>
                <p>The event you're looking for could not be found.</p>
                <a href="../index.html" class="inline-block mt-4 px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                    Return to Home
                </a>
            </div>
        `;
    }
}

// load event details when dom is ready
document.addEventListener('DOMContentLoaded', loadEventDetails);

