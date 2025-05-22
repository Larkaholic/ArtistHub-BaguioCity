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

        // Load floating events first
        loadFloatingEvents(events);

        const currentDate = new Date();

        // Split events into featured and non-featured
        const featuredEvents = events.filter(event => event.isFeatured);
        const nonFeaturedEvents = events.filter(event => !event.isFeatured);

        // Separate finished and upcoming featured events
        const finishedFeaturedEvents = featuredEvents.filter(event => new Date(event.endDate) < currentDate);
        const upcomingFeaturedEvents = featuredEvents.filter(event => new Date(event.endDate) >= currentDate);

        // Combine non-featured events with finished featured events
        const updatedNonFeaturedEvents = [...nonFeaturedEvents, ...finishedFeaturedEvents];

        // Display upcoming featured events in landing page
        const importantEventsContainer = document.querySelector('.important-events');
        if (importantEventsContainer) {
            if (upcomingFeaturedEvents.length === 0) {
                importantEventsContainer.innerHTML = `
                    <div class="glass-header2 rounded-lg p-4 m-4" data-aos="fade-left" style="cursor: pointer;">
                        <h3 class="text-xl font-bold mb-2">No Featured Events</h3>
                        <p class="text-sm">Check back later for featured events!</p>
                    </div>
                `;
            } else {
                importantEventsContainer.innerHTML = upcomingFeaturedEvents.map(event => `
                    <div class="glass-header2 rounded-lg p-4 m-4 event-card relative" 
                        data-id="${event.id}" data-aos="fade-left" style="cursor: pointer; display: flex; flex-direction: column; min-height: 280px;">
                        <div class="event-content flex-grow">
                            <h3 class="rubik-dirt-regular font-custom text-2xl font-bold mb-2">${event.title}</h3>
                            <p class="text-sm font-bold">Start: ${event.startDate}</p>
                            <p class="text-sm font-bold">Location: ${event.location}</p>
                            ${event.description ? `<p class="mt-2">${event.description.substring(0, 100)}...</p>` : ''}
                            ${event.imageUrl ? `
                                <img src="${event.imageUrl}" alt="${event.title}" 
                                    class="mt-4 w-full h-48 object-cover rounded">
                            ` : ''}
                        </div>
                        <div class="mt-auto text-right">
                            <button class="view-event-btn mt-4 p-2 text-black rounded" style="background: #F4A900;">View Event</button>
                        </div>
                    </div>
                `).join('');
            }
        }
        // Display non-featured events in upcoming events section
        const eventsContainer = document.querySelector('.EvntContainer');
        if (eventsContainer) {
            if (updatedNonFeaturedEvents.length === 0) {
                eventsContainer.innerHTML = `
                    <div class="glass-header2 rounded-lg p-4 m-4" style="cursor: pointer;">
                        <h3 class="text-xl font-bold mb-2">No Upcoming Events</h3>
                        <p class="text-sm">Check back later for upcoming events!</p>
                    </div>
                `;
            } else {
                // Limit to 6 events
                const limitedEvents = updatedNonFeaturedEvents.slice(0, 6);
                eventsContainer.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 overscroll-y-auto" style="max-height: 100%;">
                        ${limitedEvents.map(event => `
                            <div class="artist-card border-2 border-black rounded-lg p-4 mb-4 event-card relative"
                            style="cursor: pointer; display: flex; flex-direction: column; min-height: 280px;" data-id="${event.id}">
                                <div class="event-content flex-grow" style="position: relative; z-index: 12;">
                                    <h3 class="rubik-dirt-regular text-2xl font-bold mb-2 text-black">${event.title}</h3>
                                    <p class="text-sm text-black">Start: ${event.startDate}</p>
                                    <p class="text-sm text-black">End: ${event.endDate}</p>
                                    <p class="text-sm text-black">Location: ${event.location}</p>
                                    ${event.description ? `<p class="mt-2 text-black">${event.description.substring(0, 100)}...</p>` : ''}
                                    ${event.imageUrl ? `
                                        <img src="${event.imageUrl}" alt="${event.title}" 
                                            class="mt-4 w-full h-48 object-cover rounded">
                                    ` : ''}
                                </div>
                                <div class="mt-auto text-right">
                                    <button class="view-event-btn mt-4 p-2 text-black rounded" style="background: #F4A900;">View Event</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${updatedNonFeaturedEvents.length > 6 ? `
                        <div class="text-center mt-4">
                            <a href="./events/all-events.html" class="inline-block px-6 py-2 text-black rounded" style="background: #F4A900;">
                                View All Events
                            </a>
                        </div>
                    ` : ''}
                `;
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

function loadFloatingEvents(events, limit = 3) {
    const floatingEventContainer = document.querySelector('.dataDiv');
    if (!floatingEventContainer) return;

    // Get the most recent events
    const recentEvents = events.slice(0, limit);

    floatingEventContainer.innerHTML = recentEvents.map(event => `
        <div class="event-preview-card overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer" data-id="${event.id}">
            <img src="${event.imageUrl || 'images/events/default-event.jpg'}" 
                 alt="${event.title}" 
                 class="w-full h-48 object-cover">
            <div class="p-4 bg-white">
                <h3 class="text-lg font-semibold text-gray-800">${event.title}</h3>
                <p class="text-sm text-gray-600">${event.location}</p>
            </div>
        </div>
    `).join('');

    // Add click handlers for the preview cards
    const previewCards = floatingEventContainer.querySelectorAll('.event-preview-card');
    previewCards.forEach(card => {
        card.addEventListener('click', () => {
            const eventId = card.getAttribute('data-id');
            if (eventId) {
                const basePath = getBasePath();
                window.location.href = `${basePath}/events/events.html?id=${eventId}`;
            }
        });
    });
}

function getBasePath() {
    const isGitHubPages = window.location.hostname.includes('github.io');
    const repoName = 'ArtistHub-BaguioCity';
    return isGitHubPages ? `/${repoName}` : '';
}

function addEventClickHandlers() {
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        card.addEventListener('click', () => {
            const eventId = card.getAttribute('data-id');
            if (eventId) {
                const basePath = getBasePath();
                window.location.href = `${basePath}/events/events.html?id=${eventId}`;
            }
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadEvents);

export { loadEvents };