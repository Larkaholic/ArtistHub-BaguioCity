import { db } from './firebase-config.js';
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Load and display events
async function loadEvents() {
    try {
        const q = query(collection(db, "events"), orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);
        const events = [];
        
        querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });

        // Split events into featured and non-featured
        const featuredEvents = events.filter(event => event.isFeatured);
        const nonFeaturedEvents = events.filter(event => !event.isFeatured);

        // Display featured events in landing page
        const importantEventsContainer = document.querySelector('.important-events');
        if (importantEventsContainer) {
            if (featuredEvents.length === 0) {
                importantEventsContainer.innerHTML = `
                    <div class="glass-header2 rounded-lg p-4 m-4" data-aos="fade-left" style="cursor: pointer;">
                        <h3 class="text-xl font-bold mb-2">No Featured Events</h3>
                        <p class="text-sm">Check back later for featured events!</p>
                    </div>
                `;
            } else {
                importantEventsContainer.innerHTML = featuredEvents.map(event => `
                    <div class="glass-header2 rounded-lg p-4 m-4 event-card" 
                        data-id="${event.id}" data-aos="fade-left" style="cursor: pointer;">
                        <h3 class="rubik-dirt-regular font-custom text-2xl font-bold mb-2">${event.title}</h3>
                        <p class="text-sm">Start: ${event.startDate}</p>
                        <p class="text-sm">End: ${event.endDate}</p>
                        <p class="text-sm">Location: ${event.location}</p>
                        ${event.description ? `<p class="mt-2">${event.description}</p>` : ''}
                        ${event.imageUrl ? `
                            <img src="${event.imageUrl}" alt="${event.title}" 
                                class="mt-4 w-full h-48 object-cover rounded">
                        ` : ''}
                    </div>
                `).join('');
            }
        }

        // Display non-featured events in upcoming events section
        const eventsContainer = document.querySelector('.EvntContainer');
        if (eventsContainer) {
            if (nonFeaturedEvents.length === 0) {
                eventsContainer.innerHTML = `
                    <div class="glass-header2 rounded-lg p-4 m-4" style="cursor: pointer;">
                        <h3 class="text-xl font-bold mb-2">No Featured Events</h3>
                        <p class="text-sm">Check back later for featured events!</p>
                    </div>
                `;
            } else {
                eventsContainer.innerHTML = nonFeaturedEvents.map(event => `
                        <div class="border-2 border-black rounded-lg p-4 mb-4 event-card"
                        style="cursor: pointer;" data-id="${event.id}">
                            <div class="event-content" style="position: relative; z-index: 12;">
                                <h3 class="rubik-dirt-regular text-2xl font-bold mb-2 text-black">${event.title}</h3>
                                <p class="text-sm text-black">Start: ${event.startDate}</p>
                                <p class="text-sm text-black">End: ${event.endDate}</p>
                                <p class="text-sm text-black">Location: ${event.location}</p>
                                ${event.description ? `<p class="mt-2 text-black">${event.description}</p>` : ''}
                                ${event.imageUrl ? `
                                    <img src="${event.imageUrl}" alt="${event.title}" 
                                        class="mt-4 w-full h-48 object-cover rounded">
                                ` : ''}
                            </div>
                        </div>
                `).join('');
                AOS.refresh();
            }
        }
        addEventClickHandlers();

    } catch (error) {
        console.error("Error loading events:", error);
        const containers = [
            document.querySelector('.important-events'),
            document.querySelector('.EvntContainer')
        ];
        
        containers.forEach(container => {
            if (container) {
                container.innerHTML = `
                    <div class="glass-header rounded-lg p-4 mb-4">
                        <h3 class="text-xl font-bold mb-2">Error Loading Events</h3>
                        <p class="text-sm">Please try again later.</p>
                    </div>
                `;
            }
        });
    }
}

function addEventClickHandlers() {
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        card.addEventListener('click', () => {
            const eventId = card.getAttribute('data-id');
            if (eventId) {
                window.location.href = `${baseUrl}/events/events.html?id=${eventId}`;
            }
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadEvents);

export { loadEvents };