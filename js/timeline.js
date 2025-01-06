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

const cloudName = 'dxeyr4pvf';
const uploadPreset = 'ThroughTheYears';

document.getElementById('historyImage').addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${dxeyr4pvf}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );
            const data = await response.json();
            
            const year = document.getElementById('year').value;
            const event = document.getElementById('event').value;

            if (year && event) {
                db.ref('events/' + year).set({
                    event: event,
                    imageURL: data.secure_url
                })
                .then(loadEvents)
                .catch(error => console.error("Error adding event:", error));

                document.getElementById('year').value = '';
                document.getElementById('event').value = '';
            } else {
                alert("Please enter both year and event.");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading image");
        }
    };
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
            eventsItem.className = 'flex flex-col items-center space-y-4';

            const eventText = document.createElement('p');
            eventText.textContent = data[year].event;
            eventText.className = 'text-center';

            if (data[year].imageURL) {
                const eventImage = document.createElement('img');
                eventImage.src = data[year].imageURL;
                eventImage.className = 'rounded-lg max-w-md h-auto';
                eventImage.alt = `Event from ${year}`;
                eventsItem.appendChild(eventImage);
            }

            eventsItem.appendChild(eventText);
            issuesList.appendChild(eventsItem);
        }
    });
}

window.onload = loadEvents;