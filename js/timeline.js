import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let backgrounds, yearElement, titleElement, detailsElement, navigation;

async function fetchTimelineData() {
    const querySnapshot = await getDocs(collection(db, "timelineEvents"));
    const data = [];
    querySnapshot.forEach((doc) => {
        data.push(doc.data());
    });
    return data.sort((a, b) => a.year - b.year);
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

        const timelineData = await fetchTimelineData();

        backgrounds.innerHTML = '';
        navigation.innerHTML = '';

        timelineData.forEach(data => {
            const bgDiv = document.createElement('div');
            bgDiv.classList.add('baguio-timeline-bg-image');
            bgDiv.style.backgroundImage = `url(${data.background})`;
            bgDiv.dataset.year = data.year;
            backgrounds.appendChild(bgDiv);
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
        console.error("Error loading timeline data: ", error);
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
        if (bg.dataset.year === data.year.toString()) {
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
}

document.addEventListener('DOMContentLoaded', initializeTimeline);