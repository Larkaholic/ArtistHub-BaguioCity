import { db } from '../js/firebase-config.js';
import cloudinaryConfig from '../cloudinary-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function fetchTimelineEvents() {
    const querySnapshot = await getDocs(collection(db, "timelineEvents"));
    const events = [];
    querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
    });
    return events;
}

async function loadTimelineEvents() {
    const timelineEvents = await fetchTimelineEvents();
    const timelineEventsList = document.getElementById('timelineEventsList');
    timelineEventsList.innerHTML = '';

    timelineEvents.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('bg-gray-800', 'p-4', 'rounded-lg', 'flex', 'justify-between', 'items-center');
        eventDiv.innerHTML = `
            <div>
                <h3 class="text-lg font-semibold">${event.year}</h3>
                <p>${event.title}</p>
                <p>${event.details}</p>
            </div>
            <div class="flex space-x-2">
                <button onclick="editTimelineEvent('${event.id}')" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Edit</button>
                <button onclick="deleteTimelineEvent('${event.id}')" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Delete</button>
            </div>
        `;
        timelineEventsList.appendChild(eventDiv);
    });
}

export function openAddTimelineEventModal() {
    document.getElementById('timelineEventForm').reset();
    document.getElementById('timelineEventId').value = '';
    document.getElementById('timelineModalTitle').textContent = 'Add New Timeline Event';
    document.getElementById('timelineEventModal').classList.remove('hidden');
}

function closeTimelineEventModal() {
    document.getElementById('timelineEventModal').classList.add('hidden');
}

function removeTimelineImage() {
    document.getElementById('timelineEventImageUrl').value = '';
    document.getElementById('timelineImagePreview').classList.add('hidden');
}

document.getElementById('timelineEventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('timelineEventId').value;
    const year = document.getElementById('timelineEventYear').value;
    const title = document.getElementById('timelineEventTitle').value;
    const details = document.getElementById('timelineEventDetails').value;
    const imageUrl = document.getElementById('timelineEventImageUrl').value;

    const event = { year, title, details, background: imageUrl };

    if (id) {
        await updateDoc(doc(db, "timelineEvents", id), event);
    } else {
        await addDoc(collection(db, "timelineEvents"), event);
    }

    closeTimelineEventModal();
    loadTimelineEvents();
});

async function editTimelineEvent(id) {
    const docRef = doc(db, "timelineEvents", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const event = docSnap.data();
        document.getElementById('timelineEventId').value = id;
        document.getElementById('timelineEventYear').value = event.year;
        document.getElementById('timelineEventTitle').value = event.title;
        document.getElementById('timelineEventDetails').value = event.details;
        document.getElementById('timelineEventImageUrl').value = event.background;

        if (event.background) {
            document.getElementById('timelinePreviewImg').src = event.background;
            document.getElementById('timelineImagePreview').classList.remove('hidden');
        } else {
            document.getElementById('timelineImagePreview').classList.add('hidden');
        }

        document.getElementById('timelineModalTitle').textContent = 'Edit Timeline Event';
        document.getElementById('timelineEventModal').classList.remove('hidden');
    }
}

async function deleteTimelineEvent(id) {
    await deleteDoc(doc(db, "timelineEvents", id));
    loadTimelineEvents();
}

document.getElementById('upload_timeline_widget').addEventListener('click', () => {
    const widget = cloudinary.createUploadWidget({
        cloudName: cloudinaryConfig.cloudName,
        uploadPreset: cloudinaryConfig.uploadPreset
    }, (error, result) => {
        if (!error && result && result.event === "success") {
            const imageUrl = result.info.secure_url;
            document.getElementById('timelineEventImageUrl').value = imageUrl;
            document.getElementById('timelinePreviewImg').src = imageUrl;
            document.getElementById('timelineImagePreview').classList.remove('hidden');
        }
    });
    widget.open();
});

window.editTimelineEvent = editTimelineEvent;
window.deleteTimelineEvent = deleteTimelineEvent;

loadTimelineEvents();
