import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadEvents() {
    try {
        // Get containers
        const importantEventsSection = document.querySelector('#landingPage .important-events');
        const eventsContainer = document.querySelector('#events .EvntContainer');

        // Clear and initialize featured events section
        if (importantEventsSection) {
            importantEventsSection.innerHTML = `
                <div class="glass-header rounded-lg p-4 h-auto">
                    <h2 class="text-2xl font-bold mb-6">Featured Events</h2>
                    <div class="featured-events-container space-y-4"></div>
                </div>
            `;
        }

        // Initialize events container with title
        if (eventsContainer) {
            eventsContainer.innerHTML = `
                <div class="mt-12">
                    <h2 class="text-2xl font-bold text-center glass-header rounded-full p-4 mb-6">
                        UPCOMING EVENTS
                    </h2>
                    <div id="upcomingEventsList" class="space-y-4"></div>
                </div>
            `;
        }

        const featuredEventsContainer = importantEventsSection?.querySelector('.featured-events-container');
        const upcomingEventsList = document.querySelector('#upcomingEventsList');

        // Get events
        const eventsQuery = query(collection(db, "events"), orderBy("date", "asc"));
        const querySnapshot = await getDocs(eventsQuery);

        // Process events
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            
            // Featured events
            if (event.isFeatured && featuredEventsContainer) {
                const featuredEvent = document.createElement('div');
                featuredEvent.className = 'mb-4 p-6 glass-header rounded-lg cursor-pointer hover:bg-white/20 transition-all';
                featuredEvent.onclick = () => window.location.href = `events/events.html?id=${doc.id}`;
                
                featuredEvent.innerHTML = `
                    <div class="flex items-center gap-6">
                        <div class="flex-shrink-0">
                            <img src="${event.imageUrl || 'https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/ibagiw.jpg'}" 
                                alt="${event.title}" 
                                class="w-24 h-24 rounded-full object-cover">
                        </div>
                        <div class="flex-grow min-w-0">
                            <h3 class="text-2xl font-bold text-black truncate mb-2">${event.title}</h3>
                            <p class="text-lg text-black mb-2">${new Date(event.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                            <p class="text-lg text-black truncate">${event.location}</p>
                        </div>
                    </div>
                `;
                featuredEventsContainer.appendChild(featuredEvent);
            }
            
            // Upcoming events
            if (!event.isFeatured && upcomingEventsList) {
                const eventElement = document.createElement('div');
                eventElement.className = 'glass-header rounded-lg p-5 w-full mb-4 cursor-pointer hover:bg-white/20 transition-all';
                eventElement.onclick = () => window.location.href = `events/events.html?id=${doc.id}`;
                
                eventElement.innerHTML = `
                    <div class="flex flex-col md:flex-row items-center gap-4 w-full">
                        <img src="${event.imageUrl || 'https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/ibagiw.jpg'}" 
                             alt="${event.title}" 
                             class="w-24 h-24 rounded-lg object-cover">
                        <div class="flex flex-col items-center md:items-start w-full">
                            <h3 class="text-2xl font-bold text-center md:text-left mb-2">${event.title}</h3>
                            <p class="text-lg text-gray-300 mb-1">${new Date(event.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                            <p class="text-lg text-gray-300">${event.location}</p>
                        </div>
                    </div>
                `;
                upcomingEventsList.appendChild(eventElement);
            }
        });

    } catch (error) {
        console.error("Error loading events:", error);
    }
}

// Load events when DOM is ready
document.addEventListener('DOMContentLoaded', loadEvents);

export { loadEvents }; 