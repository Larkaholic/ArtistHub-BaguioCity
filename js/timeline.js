const timelineData = [
    {
        year: 2001,
        title: "PANAGBENGA 2001",
        details: "Apollo 11 becomes the first crewed mission to land on the Moon, marking one of humanity's greatest achievements. This historic moment united the world in celebration of human ingenuity and courage.",
        imageUrl: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/master/images/timeline/5678308583_9155e72a03_b.jpg?raw=true"
    },
    {
        year: 2002,
        title: "PANAGBENGA 2002",
        details: "The Berlin Wall falls, symbolizing the end of the Cold War and the reunification of East and West Germany. This momentous event marked the beginning of a new era of freedom and democracy in Europe.",
        imageUrl: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/master/images/timeline/madeko-kito-baguio-festival-1024x576.jpg?raw=true"
    },
    {
        year: 2003,
        title: "PANAGBENGA 2003",
        details: "The rise of the internet and digital technology transforms global communication and commerce. This unprecedented technological advancement changed how we live, work, and connect with each other.",
        imageUrl: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/master/images/timeline/panagbenga-festival-1024x683.jpg?raw=true"
    },
    {
        year: 204,
        title: "PANAGBENGA 2004",
        details: "COVID-19 pandemic leads to unprecedented global changes in how we live, work, and interact. This global crisis reshaped society and accelerated digital transformation across all sectors.",
        imageUrl: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/master/images/timeline/179e161304fd380a55e08f73f300064e.jpg?raw=true"
    }
];

function createBackgrounds() {
    const container = document.getElementById('histBackgrounds');
    timelineData.forEach((event, index) => {
        const img = document.createElement('img');
        img.src = event.imageUrl;
        img.className = `hist-bg-img ${index === 0 ? 'hist-bg-img--active' : ''}`;
        img.alt = '';
        container.appendChild(img);
    });
}

function createTimeline() {
    const timeline = document.getElementById('histTimeline');
    const itemHeight = 100 / timelineData.length;
    
    timelineData.forEach((event, index) => {
        const item = document.createElement('div');
        item.className = `hist-item ${index === 0 ? 'hist-item--active' : ''}`;
        item.style.height = `${itemHeight}%`;
        item.style.top = `${itemHeight * index}%`;
        
        const dot = document.createElement('div');
        dot.className = 'hist-dot';
        
        item.appendChild(dot);
        
        item.addEventListener('click', () => {
            updateActive(index);
            updateContent(event);
            updateBackground(index);
        });
        
        timeline.appendChild(item);
    });
}

function updateActive(index) {
    document.querySelectorAll('.hist-item').forEach(item => {
        item.classList.remove('hist-item--active');
    });
    document.querySelectorAll('.hist-item')[index].classList.add('hist-item--active');
}

function updateBackground(index) {
    document.querySelectorAll('.hist-bg-img').forEach(img => {
        img.classList.remove('hist-bg-img--active');
    });
    document.querySelectorAll('.hist-bg-img')[index].classList.add('hist-bg-img--active');
}

function updateContent(event) {
    const year = document.getElementById('histYear');
    const title = document.getElementById('histTitle');
    const details = document.getElementById('histDetails');

    // Reset animations
    title.classList.remove('hist-fade-in');
    details.classList.remove('hist-fade-up');
    void title.offsetWidth;
    void details.offsetWidth;

    // Update content
    year.textContent = event.year;
    title.textContent = event.title;
    details.textContent = event.details;

    // Restart animations
    title.classList.add('hist-fade-in');
    details.classList.add('hist-fade-up');
}

// Initialize
createBackgrounds();
createTimeline();
updateContent(timelineData[0]);

// Scroll handling
document.addEventListener('wheel', (e) => {
    const items = document.querySelectorAll('.hist-item');
    const currentIndex = Array.from(items).findIndex(item => 
        item.classList.contains('hist-item--active')
    );
    
    if (e.deltaY > 0 && currentIndex < items.length - 1) {
        updateActive(currentIndex + 1);
        updateContent(timelineData[currentIndex + 1]);
        updateBackground(currentIndex + 1);
    } else if (e.deltaY < 0 && currentIndex > 0) {
        updateActive(currentIndex - 1);
        updateContent(timelineData[currentIndex - 1]);
        updateBackground(currentIndex - 1);
    }
});