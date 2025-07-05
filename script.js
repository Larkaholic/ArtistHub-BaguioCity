document.addEventListener("DOMContentLoaded", function() {
    const header = document.getElementById('main-header');
    
    if (!header) {
        console.error("ERROR: #main-header not found in the DOM!");
        return;
    }

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('solid-header');
            header.classList.remove('transparent-header');
        } else {
            header.classList.add('transparent-header');
            header.classList.remove('solid-header');
        }
    });
});

// Auto-hide announcement after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const announcement = document.getElementById('announcement');
    if (announcement) {
        setTimeout(() => {
            announcement.style.transition = 'opacity 0.5s ease-out';
            announcement.style.opacity = '0';
            setTimeout(() => {
                announcement.style.display = 'none';
            }, 500);
        }, 5000);
    }
});

// Function to close announcement
function closeAnnouncement() {
    const announcement = document.getElementById('announcement');
    if (announcement) {
        announcement.style.transition = 'opacity 0.5s ease-out';
        announcement.style.opacity = '0';
        setTimeout(() => {
            announcement.style.display = 'none';
        }, 500);
    }
}

// Make closeAnnouncement available globally
window.closeAnnouncement = closeAnnouncement;

// Dropdown functionality for Explore section
function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    const icon = document.getElementById('dropdownIcon');
    
    if (dropdown && icon) {
        dropdown.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    }
}

function selectCategory(category) {
    const dropdownText = document.getElementById('dropdownText');
    const dropdown = document.getElementById('dropdownMenu');
    const icon = document.getElementById('dropdownIcon');
    const items = document.querySelectorAll('.dropdown-item');
    
    // Update text based on category
    const categoryNames = {
        'artworks': 'Artworks',
        'artists': 'Artists', 
        'events': 'Events'
    };
    
    if (dropdownText) {
        dropdownText.textContent = categoryNames[category] || 'Artworks';
    }
    
    // Update active state
    items.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.category === category) {
            item.classList.add('active');
        }
    });
    
    // Close dropdown
    if (dropdown && icon) {
        dropdown.classList.add('hidden');
        icon.classList.remove('rotate-180');
    }
    
    // Handle category switching logic - show/hide containers
    const artworksContainer = document.getElementById('artworksContainer');
    const artistsContainer = document.getElementById('artistsContainer');
    const eventsContainer = document.getElementById('eventsContainer');
    
    // Hide all containers
    if (artworksContainer) artworksContainer.classList.add('hidden');
    if (artistsContainer) artistsContainer.classList.add('hidden');
    if (eventsContainer) eventsContainer.classList.add('hidden');
    
    // Show selected container and load appropriate content
    switch(category) {
        case 'artworks':
            if (artworksContainer) artworksContainer.classList.remove('hidden');
            // Load artworks functionality can be added here
            break;
        case 'artists':
            if (artistsContainer) artistsContainer.classList.remove('hidden');
            // Load artists using the loadAllArtists function
            loadAllArtistsFromModule();
            break;
        case 'events':
            if (eventsContainer) eventsContainer.classList.remove('hidden');
            // Load events using the loadAllEvents function
            loadAllEventsFromModule();
            break;
    }
    
    console.log('Selected category:', category);
}

// Function to load all artists - will be connected to loadArtists.js
async function loadAllArtistsFromModule() {
    try {
        // Dynamic import to avoid module loading issues
        const { loadAllArtists } = await import('./js/loadArtists.js');
        await loadAllArtists();
    } catch (error) {
        console.error('Error loading artists:', error);
    }
}

// Function to load all events - will be connected to loadEvents.js
async function loadAllEventsFromModule() {
    try {
        // Dynamic import to avoid module loading issues
        const { loadAllEvents } = await import('./js/loadEvents.js');
        await loadAllEvents();
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('dropdownMenu');
    const button = document.getElementById('dropdownButton');
    
    if (dropdown && button && !button.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.add('hidden');
        const icon = document.getElementById('dropdownIcon');
        if (icon) {
            icon.classList.remove('rotate-180');
        }
    }
});

// Make dropdown functions available globally
window.toggleDropdown = toggleDropdown;
window.selectCategory = selectCategory;
