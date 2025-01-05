import { db } from './firebase-config.js';
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

$(function(){
    $().timelinr({
        orientation: 	'vertical',
        issuesSpeed: 	300,
        datesSpeed: 	100,
        arrowKeys: 		'true',
        startAt:		3
    })
});

function loadEvents() {
    db.ref('events').once('value', (snapshot) => {
        const data = snapshot.val();
        const datesList = document.getElementById('dates');
        const issuesList = document.getElementById('issues');
        datesList.innerHTML = '';
        issuesList.innerHTML = '';

        for (const year in data) {
            const yearItem = document.createElement('li');
            yearItem.textContent = year;
            datesList.appendChild(yearItem);

            const eventsItem = document.createElement('li');
            eventsItem.textContent = data[year].event;
            issuesList.appendChild(eventsItem);
        }
    });
}

// Function to add event to Firebase
document.getElementById('add-event').addEventListener('click', () => {
    const year = document.getElementById('year').value;
    const event = document.getElementById('event').value;

    if (year && event) {
        db.ref('events/' + year).set({ event: event })
            .then(() => {
                loadEvents(); // Reload events after adding
                document.getElementById('year').value = '';
                document.getElementById('event').value = '';
            })
            .catch((error) => {
                console.error("Error adding event: ", error);
            });
    } else {
        alert("Please enter both year and event.");
    }
});

// Load events on page load
window.onload = loadEvents;