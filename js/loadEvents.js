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
                        data-id="${event.id}" data-aos="fade-left" style="cursor: pointer; display: flex; flex-direction: column; min-height: 280px; border: 2px solid #f76400;">
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
                            <div class="artist-card rounded-lg p-4 mb-4 event-card relative bg-white shadow-lg"
                            style="cursor: pointer; display: flex; flex-direction: column; min-height: 280px;" data-id="${event.id}">
                                <div class="event-content flex-grow" style="position: relative; z-index: 12;">
                                    <h3 class="text-2xl font-bold mb-2 text-black">${event.title}</h3>
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
                                    <button class="view-event-btn mt-4 p-2 text-black rounded" style="background: #f76400; color: white;">View Event</button>
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

    // Determine how many events to show based on screen size
    const isMobile = window.innerWidth < 768; // md breakpoint in Tailwind
    const itemsToShow = isMobile ? 1 : (window.innerWidth < 1024 ? 2 : limit);
    
    // Get the most recent events limited by screen size
    const recentEvents = events.slice(0, itemsToShow);

    floatingEventContainer.innerHTML = recentEvents.map(event => `
        <div class="event-preview-card overflow-hidden rounded-lg  hover:shadow-xl transition-shadow duration-300 cursor-pointer" data-id="${event.id}" style="border: 2px solid #f76400;">
            <img src="${event.imageUrl || 'images/events/default-event.jpg'}" 
                 alt="${event.title}" 
                 class="w-full h-40 md:h-48 object-cover">
            <div class="p-4 bg-white">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${event.title}</h3>
                <div class="flex items-center text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p>${event.location}</p>
                </div>
                
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

    // Add resize event listener to handle responsiveness dynamically
    window.addEventListener('resize', debounce(() => {
        loadFloatingEvents(events, limit);
    }, 250));
}

// Helper function to format date
function formatDate(dateString) {
    try {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        return dateString;
    }
}

// Debounce function to prevent excessive function calls during resize
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
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

// New function to load all events for the shop section
export async function loadAllEvents() {
    const eventsGrid = document.getElementById('allEventsGrid');
    if (!eventsGrid) {
        console.error('allEventsGrid element not found');
        return;
    }
    
    try {
        eventsGrid.innerHTML = '<div class="loading-spinner my-10 flex justify-center col-span-full"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>';
        
        // Load all events from the events collection
        const q = query(collection(db, "events"), orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);
        const events = [];
        
        querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });

        if (events.length === 0) {
            eventsGrid.innerHTML = '<p class="text-center text-gray-600 col-span-full">No events found</p>';
            return;
        }

        // Clear loading spinner
        eventsGrid.innerHTML = '';

        // Display events in a grid (limit to 12 for consistent layout)
        const displayEvents = events.slice(0, 12);
        
        displayEvents.forEach(event => {
            const card = document.createElement('div');
            card.className = `bg-white rounded-lg border-2 shadow-lg overflow-hidden flex flex-col event-card h-full`;
            card.style.borderColor = '#f76400';

            const startDate = formatDate(event.startDate);
            const endDate = formatDate(event.endDate);
            const imageUrl = event.imageUrl || 'https://via.placeholder.com/300x200?text=Event+Image';

            card.innerHTML = `
                <div class="relative">
                    <img src="${imageUrl}" alt="${event.title}" 
                        class="w-full h-48 object-cover">
                    <div class="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded-full">
                        <p class="text-sm font-semibold text-gray-800">${startDate}</p>
                    </div>
                </div>
                <div class="p-6 flex flex-col flex-grow h-full">
                    <div class="flex-grow">
                        <h3 class="text-xl font-bold mb-2 text-black">${event.title}</h3>
                        <div class="flex items-center gap-1 mb-2">
                            <i class="fas fa-map-marker-alt text-sm text-gray-600"></i>
                            <p class="text-sm text-gray-600">${event.location}</p>
                        </div>
                        <div class="flex items-center gap-1 mb-3">
                            <i class="fas fa-calendar text-sm text-gray-600"></i>
                            <p class="text-sm text-gray-600">${startDate} - ${endDate}</p>
                        </div>
                    </div>
                    <div class="mt-auto flex bottom-0 flex-shrink-0">
                        <button class="bg-white text-black py-2 px-6 rounded-md hover:bg-gray-300 transition duration-300 font-semibold border-2"
                            style="background-color: #f76400; color: white;">
                            View Event
                        </button>
                    </div>
                </div>
            `;

            card.querySelector('button').onclick = () => {
                const basePath = getBasePath();
                window.location.href = `${basePath}/events/events.html?id=${event.id}`;
            };

            eventsGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading all events:", error);
        eventsGrid.innerHTML = '<div class="text-center text-gray-600 col-span-full">Error loading events</div>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadEvents);

export { loadEvents };