import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let backgrounds, yearElement, titleElement, detailsElement, navigation;
let timelineData = [];
let backgroundIntervals = {};

async function fetchTimelineData() {
    try {
        const querySnapshot = await getDocs(collection(db, "timelineEvents"));
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data.sort((a, b) => a.year - b.year);
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
        if (bg.dataset.year === data.year.toString() && bg.dataset.index === '0') {
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

    yearElement.textContent = data.year;
    titleElement.textContent = data.title;
    detailsElement.textContent = data.details;

    document.querySelectorAll('.baguio-timeline-nav-btn').forEach(btn => {
        btn.classList.remove('baguio-timeline-active');
        if (btn.dataset.year === data.year.toString()) {
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

document.addEventListener('DOMContentLoaded', initializeTimeline);