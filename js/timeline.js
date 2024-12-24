const timelineEvents = [
    { title: "Event Title 1", description: "Description of the event that took place." },
    { title: "Event Title 2", description: "Description of the event that took place." },
    // Add more events as needed
];

function renderTimeline() {
    const timelineContainer = document.getElementById('timeline');
    timelineContainer.innerHTML = ''; // Clear existing content

    timelineEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'mb-6 ml-6';
        eventElement.innerHTML = `
            <div class="flex items-center mb-2">
                <div class="bg-green-500 w-4 h-4 rounded-full"></div>
                <h3 class="text-lg font-semibold ml-2">${event.title}</h3>
            </div>
            <p class="text-gray-600">${event.description}</p>
        `;
        timelineContainer.appendChild(eventElement);
    });
}

// Call the function to render the timeline when the document is ready
document.addEventListener('DOMContentLoaded', renderTimeline);