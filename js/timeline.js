import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let backgrounds, yearElement, titleElement, detailsElement, navigation;
let timelineData = [];
let backgroundIntervals = {};
let searchTimeout = null;

async function fetchTimelineData() {
    try {
        const querySnapshot = await getDocs(collection(db, "timelineEvents"));
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        // Sort by year and month in descending order (newest first)
        return data.sort((a, b) => {
            const yearA = parseInt(a.year.split('-')[1]);
            const yearB = parseInt(b.year.split('-')[1]);
            const monthA = parseInt(a.year.split('-')[0]);
            const monthB = parseInt(b.year.split('-')[0]);
            
            if (yearA !== yearB) {
                return yearB - yearA; // Reverse year sort
            }
            return monthB - monthA; // Reverse month sort
        });
    } catch (error) {
        console.error("Error fetching timeline data:", error);
        const timelineSection = document.querySelector('.baguio-timeline-section');
        if (timelineSection) {
            timelineSection.innerHTML = `
                <div class="error-message">
                    <p class="text-center text-gray-600">Timeline content is temporarily unavailable.</p>
                </div>`;
        }
        return [];
    }
}

function initializeElements() {
    backgrounds = document.querySelector('.baguio-timeline-backgrounds');
    yearElement = document.querySelector('.baguio-timeline-year');
    titleElement = document.querySelector('.baguio-timeline-title');
    detailsElement = document.querySelector('.baguio-timeline-details');
    navigation = document.querySelector('.baguio-timeline-navigation');

    // Check if all elements are found
    if (!backgrounds || !yearElement || !titleElement || !detailsElement || !navigation) {
        throw new Error('Required timeline elements not found in the DOM');
    }
}

async function initializeTimeline() {
    try {
        // Initialize elements first
        initializeElements();

        // Fetch data with error handling
        timelineData = await fetchTimelineData();
        if (timelineData.length === 0) {
            return; // Exit if no data
        }

        backgrounds.innerHTML = '';
        navigation.innerHTML = '';

        timelineData.forEach(data => {
            if (Array.isArray(data.backgrounds)) {
                data.backgrounds.forEach((background, index) => {
                    const bgDiv = document.createElement('div');
                    bgDiv.classList.add('baguio-timeline-bg-image');
                    bgDiv.style.backgroundImage = `url(${background})`;
                    bgDiv.dataset.year = data.year;
                    bgDiv.dataset.index = index;
                    backgrounds.appendChild(bgDiv);
                });
            } else {
                console.warn(`No backgrounds found for year ${data.year}`);
            }
        });

        timelineData.forEach(data => {
            const button = document.createElement('button');
            button.classList.add('baguio-timeline-nav-btn');
            button.textContent = data.year;
            button.dataset.year = data.year;
            button.addEventListener('click', () => updateContent(data));
            navigation.appendChild(button);
        });

        // Setup search functionality
        setupTimelineSearch();

        if (timelineData.length > 0) {
            updateContent(timelineData[0]);
        } else {
            updateContent(null);
        }
    } catch (error) {
        console.error("Error initializing timeline:", error);
        const timelineSection = document.querySelector('.baguio-timeline-section');
        if (timelineSection) {
            timelineSection.innerHTML = `
                <div class="error-message">
                    <p class="text-center text-gray-600">Timeline content is temporarily unavailable.</p>
                </div>`;
        }
    }
}

function updateContent(data) {
    // Check if elements exist before using them
    if (!yearElement || !titleElement || !detailsElement) {
        console.error('Timeline elements not initialized');
        return;
    }

    if (!data) {
        yearElement.textContent = '';
        titleElement.textContent = '';
        detailsElement.textContent = '';
        return;
    }

    document.querySelectorAll('.baguio-timeline-bg-image').forEach(bg => {
        bg.classList.remove('baguio-timeline-active');
        if (bg.dataset.year === data.year && bg.dataset.index === '0') {
            bg.classList.add('baguio-timeline-active');
        }
    });

    yearElement.classList.remove('baguio-timeline-fade-in');
    titleElement.classList.remove('baguio-timeline-fade-in');
    detailsElement.classList.remove('baguio-timeline-fade-up');
    
    void yearElement.offsetWidth;
    
    yearElement.classList.add('baguio-timeline-fade-in');
    titleElement.classList.add('baguio-timeline-fade-in');
    detailsElement.classList.add('baguio-timeline-fade-up');

    // Format the date display
    const [month, year] = data.year.split('-');
    const formattedDate = `${month.padStart(2, '0')}-${year}`;
    yearElement.textContent = formattedDate;
    titleElement.textContent = data.title;
    detailsElement.textContent = data.details;

    document.querySelectorAll('.baguio-timeline-nav-btn').forEach(btn => {
        btn.classList.remove('baguio-timeline-active');
        if (btn.dataset.year === data.year) {
            btn.classList.add('baguio-timeline-active');
        }
    });

    // Start carousel for the selected year
    if (Array.isArray(data.backgrounds)) {
        startBackgroundCarousel(data.year, data.backgrounds);
    } else {
        console.warn(`No backgrounds found for year ${data.year}`);
    }
}

function startBackgroundCarousel(year, backgrounds) {
    if (backgroundIntervals[year]) {
        clearInterval(backgroundIntervals[year]);
    }

    let currentBackgroundIndex = 0;
    backgroundIntervals[year] = setInterval(() => {
        if (backgrounds.length === 0) {
            console.warn(`No backgrounds to cycle for year ${year}`);
            return;
        }
        currentBackgroundIndex = (currentBackgroundIndex + 1) % backgrounds.length;
        document.querySelectorAll(`.baguio-timeline-bg-image[data-year="${year}"]`).forEach(bg => {
            bg.classList.remove('baguio-timeline-active');
            if (bg.dataset.index === currentBackgroundIndex.toString()) {
                bg.classList.add('baguio-timeline-active');
            }
        });
    }, 5000); // Change background every 5 seconds
}

function setupTimelineSearch() {
    const searchInput = document.getElementById('timelineSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Set new timeout to debounce search
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            filterTimelineEvents(searchTerm);
        }, 300);
    });
}

function filterTimelineEvents(searchTerm) {
    const navigationButtons = document.querySelectorAll('.baguio-timeline-nav-btn');
    
    if (!searchTerm) {
        // Show all events if search is empty
        navigationButtons.forEach(btn => {
            btn.style.display = 'block';
        });
        // Show first event
        if (timelineData.length > 0) {
            updateContent(timelineData[0]);
        }
        return;
    }

    let firstMatch = null;

    timelineData.forEach(data => {
        const [month, year] = data.year.split('-');
        const formattedDate = `${month.padStart(2, '0')}-${year}`;
        const title = data.title.toLowerCase();
        const details = data.details.toLowerCase();
        const matches = formattedDate.includes(searchTerm) || 
                       title.includes(searchTerm) || 
                       details.includes(searchTerm);

        // Find corresponding button
        const button = Array.from(navigationButtons).find(
            btn => btn.dataset.year === data.year
        );

        if (button) {
            button.style.display = matches ? 'block' : 'none';
        }

        // Store first matching event for display
        if (matches && !firstMatch) {
            firstMatch = data;
        }
    });

    // Show first matching event
    if (firstMatch) {
        updateContent(firstMatch);
    }
}

document.addEventListener('DOMContentLoaded', initializeTimeline);