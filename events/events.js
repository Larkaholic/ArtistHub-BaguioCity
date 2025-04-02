import { db, auth } from '../js/firebase-config.js';
import { 
    collection, getDocs, addDoc, getDoc, doc, query, where, 
    orderBy, limit, deleteDoc, updateDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Check if we're on the event details page
const isEventDetailsPage = document.getElementById('eventDetails') !== null;
// Check if we're on the add event page
const isAddEventPage = document.getElementById('eventForm') !== null;
// Check if we're on the events listing page
const isEventsListingPage = document.getElementById('eventsContainer') !== null;

// When DOM is loaded, initialize the appropriate functions based on page
document.addEventListener('DOMContentLoaded', () => {
    if (isEventDetailsPage) {
        loadEventDetails();
    } else if (isAddEventPage) {
        initializeAddEventForm();
    } else if (isEventsListingPage) {
        loadEvents();
    }
});

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

        // Format dates for display
        const startDate = event.startDate ? new Date(event.startDate.seconds * 1000) : null;
        const endDate = event.endDate ? new Date(event.endDate.seconds * 1000) : null;
        
        const startDateFormatted = startDate ? startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Date not specified';
        
        const endDateFormatted = endDate ? endDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : '';

        // display event details
        eventDetails.innerHTML = `
            <div class="flex flex-col md:flex-row gap-8">
                <!-- event image -->
                <div class="w-full md:w-1/2">
                    <img src="${event.imageUrl || 'https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/ibagiw.jpg'}"
                        alt="${event.title}"
                        class="w-full h-[300px] object-cover rounded-lg border-2 border-black">
                </div>

                <!-- event information -->
                <div class="w-full md:w-1/2">
                    <h1 class="rubik-dirt-regular text-4xl text-center font-bold mb-4 text-black">${event.title}</h1>
                    
                    <div class="space-y-4">
                        <div>
                            <h2 class="text-xl font-semibold text-black">Date & Time</h2>
                            <p class="text-black"><strong>Starts:</strong> ${startDateFormatted}</p>
                            ${endDate ? `<p class="text-black"><strong>Ends:</strong> ${endDateFormatted}</p>` : ''}
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

async function loadEvents() {
    try {
        const eventsContainer = document.getElementById('eventsContainer');
        if (!eventsContainer) {
            console.error('Events container not found');
            return;
        }

        eventsContainer.innerHTML = '<div class="text-center py-12"><div class="spinner"></div><p class="mt-4 text-gray-600">Loading events...</p></div>';
        
        const eventsCollection = collection(db, "events");
        // Order by startDate instead of date
        const q = query(eventsCollection, orderBy("startDate", "desc"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            eventsContainer.innerHTML = '<div class="text-center py-12"><p class="text-gray-600">No events found</p></div>';
            return;
        }
        
        eventsContainer.innerHTML = '';
        const currentDate = new Date();
        
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const id = doc.id;
            
            // Extract startDate and endDate from event
            const startDate = event.startDate ? new Date(event.startDate.seconds * 1000) : null;
            const endDate = event.endDate ? new Date(event.endDate.seconds * 1000) : null;
            
            // Format dates for display
            const startDateFormatted = startDate ? startDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Date not specified';
            
            const endDateFormatted = endDate ? endDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '';
            
            // Determine if event is upcoming, ongoing or past
            let status = '';
            let statusClass = '';
            
            if (startDate && endDate) {
                if (currentDate < startDate) {
                    status = 'Upcoming';
                    statusClass = 'bg-blue-100 text-blue-800';
                } else if (currentDate >= startDate && currentDate <= endDate) {
                    status = 'Happening Now';
                    statusClass = 'bg-green-100 text-green-800';
                } else {
                    status = 'Past';
                    statusClass = 'bg-gray-100 text-gray-800';
                }
            } else if (startDate) {
                if (currentDate < startDate) {
                    status = 'Upcoming';
                    statusClass = 'bg-blue-100 text-blue-800';
                } else {
                    status = 'Past';
                    statusClass = 'bg-gray-100 text-gray-800';
                }
            }
            
            const eventCard = document.createElement('div');
            eventCard.className = 'glass-header2 rounded-lg overflow-hidden shadow-lg mb-6';
            eventCard.innerHTML = `
                <div class="md:flex">
                    <div class="md:flex-shrink-0">
                        <img class="h-48 w-full object-cover md:w-48" src="${event.imageUrl || 'https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/ibagiw.jpg'}" alt="${event.title}">
                    </div>
                    <div class="p-8">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-bold text-gray-900 mb-2">${event.title}</h2>
                            <span class="${statusClass} text-xs font-medium mr-2 px-2.5 py-0.5 rounded">${status}</span>
                        </div>
                        <p class="text-gray-700 text-sm mb-3">${event.description ? (event.description.length > 150 ? event.description.substring(0, 150) + '...' : event.description) : 'No description available'}</p>
                        <div class="mb-3">
                            <p class="text-sm text-gray-700"><strong>Location:</strong> ${event.location}</p>
                            <p class="text-sm text-gray-700"><strong>Starts:</strong> ${startDateFormatted}</p>
                            ${endDate ? `<p class="text-sm text-gray-700"><strong>Ends:</strong> ${endDateFormatted}</p>` : ''}
                        </div>
                        <a href="event-details.html?id=${id}" class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-green-700 rounded-lg hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300">
                            View Details
                            <svg class="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                            </svg>
                        </a>
                    </div>
                </div>
            `;
            
            eventsContainer.appendChild(eventCard);
        });
    } catch (error) {
        console.error("Error loading events:", error);
        const eventsContainer = document.getElementById('eventsContainer');
        if (eventsContainer) {
            eventsContainer.innerHTML = '<div class="text-center py-12"><p class="text-red-600">Failed to load events. Please try again later.</p></div>';
        }
    }
}

// Function to handle featured events on homepage
async function loadFeaturedEvents() {
    try {
        const featuredEventsContainer = document.getElementById('featuredEvents');
        if (!featuredEventsContainer) return;
        
        // Get current date to filter upcoming events
        const currentDate = new Date();
        
        const eventsCollection = collection(db, "events");
        // Query featured events
        const q = query(
            eventsCollection,
            where("isFeatured", "==", true),
            orderBy("startDate", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            featuredEventsContainer.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">No featured events</p></div>';
            return;
        }
        
        // Clear and prepare container
        featuredEventsContainer.innerHTML = '';
        
        let upcomingEventsCount = 0;
        
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            const id = doc.id;
            
            // Get start date
            const startDate = event.startDate ? new Date(event.startDate.seconds * 1000) : null;
            
            // Only show upcoming events (with some buffer for events happening today)
            if (startDate && startDate >= currentDate.setHours(0, 0, 0, 0)) {
                upcomingEventsCount++;
                
                const startDateFormatted = startDate ? startDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }) : '';
                
                const endDate = event.endDate ? new Date(event.endDate.seconds * 1000) : null;
                const endDateFormatted = endDate ? endDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }) : '';
                
                const eventCard = document.createElement('div');
                eventCard.className = 'featured-event glass-header2 rounded-lg overflow-hidden shadow-lg';
                eventCard.innerHTML = `
                    <div class="relative">
                        <img class="w-full h-40 object-cover" src="${event.imageUrl || 'https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/ibagiw.jpg'}" alt="${event.title}">
                        <div class="absolute bottom-0 left-0 bg-black bg-opacity-60 w-full p-2">
                            <h3 class="text-white text-lg font-bold">${event.title}</h3>
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="text-sm text-gray-600 mb-2">
                            <span><i class="fas fa-calendar mr-1"></i> ${startDateFormatted}</span>
                            ${endDate ? ` - ${endDateFormatted}` : ''}
                        </div>
                        <div class="text-sm text-gray-600 mb-3">
                            <i class="fas fa-map-marker-alt mr-1"></i> ${event.location}
                        </div>
                        <a href="events/event-details.html?id=${id}" class="inline-flex items-center text-sm text-green-700 hover:text-green-800">
                            Learn more 
                            <svg class="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                            </svg>
                        </a>
                    </div>
                `;
                
                featuredEventsContainer.appendChild(eventCard);
            }
        });
        
        if (upcomingEventsCount === 0) {
            featuredEventsContainer.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">No upcoming featured events</p></div>';
        }
    } catch (error) {
        console.error("Error loading featured events:", error);
        const featuredEventsContainer = document.getElementById('featuredEvents');
        if (featuredEventsContainer) {
            featuredEventsContainer.innerHTML = '<div class="text-center py-8"><p class="text-red-600">Failed to load featured events</p></div>';
        }
    }
}

// Initialize the add event form
function initializeAddEventForm() {
    const eventForm = document.getElementById('eventForm');
    
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Check if user is logged in
                if (!auth.currentUser) {
                    alert("You must be logged in to add an event");
                    window.location.href = "../index.html";
                    return;
                }
                
                // Collect form data
                const title = document.getElementById('eventTitle').value;
                const startDate = document.getElementById('eventStartDate').value;
                const endDate = document.getElementById('eventEndDate').value;
                const location = document.getElementById('eventLocation').value;
                const description = document.getElementById('eventDescription').value;
                const category = document.getElementById('eventCategory').value;
                const featured = document.getElementById('eventFeatured').checked;
                
                // Image handling (URL or file upload)
                const imageFile = document.getElementById('eventImage').files[0];
                let imageUrl = document.getElementById('eventImageUrl').value;
                
                // Validate required fields
                if (!title || !startDate || !endDate || !location || !category) {
                    alert("Please fill in all required fields");
                    return;
                }
                
                // Validate dates
                const startDateTime = new Date(startDate);
                const endDateTime = new Date(endDate);
                const now = new Date();
                
                if (isNaN(startDateTime) || isNaN(endDateTime)) {
                    alert("Please enter valid dates");
                    return;
                }
                
                if (endDateTime < startDateTime) {
                    alert("End date cannot be earlier than start date");
                    return;
                }
                
                // Handle file upload if exists
                if (imageFile) {
                    const storageRef = ref(storage, 'events/' + Date.now() + '_' + imageFile.name);
                    const snapshot = await uploadBytes(storageRef, imageFile);
                    imageUrl = await getDownloadURL(snapshot.ref);
                }
                
                // Create event object
                const eventData = {
                    title,
                    startDate: startDateTime,
                    endDate: endDateTime,
                    location,
                    description,
                    category,
                    isFeatured: featured,
                    imageUrl,
                    createdBy: auth.currentUser.uid,
                    createdByEmail: auth.currentUser.email,
                    createdAt: serverTimestamp(),
                    status: 'pending' // Default status
                };
                
                // Add to Firestore
                await addDoc(collection(db, 'events'), eventData);
                
                // Show success message and redirect
                alert('Event added successfully! It will be reviewed by an admin before publishing.');
                window.location.href = 'events.html';
                
            } catch (error) {
                console.error("Error adding event:", error);
                alert('Failed to add event. Please try again.');
            }
        });
    }
}

// Add utility functions for future use
function formatDateRange(startDate, endDate) {
    if (!startDate) return 'Date not specified';
    
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const start = startDate.toLocaleDateString('en-US', options);
    
    if (!endDate) return start;
    
    // If the dates are the same day, only show time for end date
    if (startDate.toDateString() === endDate.toDateString()) {
        return `${start} - ${endDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    } else {
        return `${start} - ${endDate.toLocaleDateString('en-US', options)}`;
    }
}

// Determine which function to run based on current page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the event details page
    if (document.getElementById('eventDetails')) {
        loadEventDetails();
    } 
    // Check if we're on the events list page
    else if (document.getElementById('eventsContainer')) {
        loadEvents();
    }
    // Check if we're on the home page with featured events
    else if (document.getElementById('featuredEvents')) {
        loadFeaturedEvents();
    }
});

// For exporting functions to be used in other modules
export {
    loadEvents,
    loadEventDetails,
    initializeAddEventForm,
    loadFeaturedEvents
};