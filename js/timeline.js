import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const backgrounds = document.querySelector('.baguio-timeline-backgrounds');
const yearElement = document.querySelector('.baguio-timeline-year');
const titleElement = document.querySelector('.baguio-timeline-title');
const detailsElement = document.querySelector('.baguio-timeline-details');
const navigation = document.querySelector('.baguio-timeline-navigation');

async function fetchTimelineData() {
    const querySnapshot = await getDocs(collection(db, "timelineEvents"));
    const data = [];
    querySnapshot.forEach((doc) => {
        data.push(doc.data());
    });
    return data;
}

async function initializeTimeline() {
    try {
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
            yearElement.textContent = '';
            titleElement.textContent = '';
            detailsElement.textContent = '';
        }
    } catch (error) {
        console.error("Error loading timeline data: ", error);
    }
}

function updateContent(data) {
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

initializeTimeline();