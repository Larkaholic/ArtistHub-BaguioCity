const timelineData = [
    {
        year: 2018,
        title: "Opening of CBCC",
        details: "The emergence of Baguio as a cultural and artistic hub in the Philippines.",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/master/images/timeline/madeko-kito-baguio-festival-1024x576.jpg?raw=true"
    },
    {
        year: 2018,
        title: "Unveiling Creative Baguio Logo by BenCab February 11, 2018",
        details: "Official logo designed by National Artist for Painting Benedicto Cabrera has been revealed in the presence of #UNESCO, #NCCA, Department of Tourism and local officials from Baguio and Benguet.",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/CBCC%20Logo.jpg?raw=true"
    },
    {
        year: 2018,
        title: "The Banga February 11, 2018",
        details: "Banga Dance is a dance interpretation of the Kalinga women's daily routine of carrying clay pots on their heads to fetch water from the mountains.",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/Banga.jpg?raw=true"
    },
    {
        year: 1990,
        title: "Cultural Renaissance",
        details: "The emergence of Baguio as a cultural and artistic hub in the Philippines.",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/master/images/timeline/madeko-kito-baguio-festival-1024x576.jpg?raw=true"
    },
    {
        year: 2020,
        title: "Modern Baguio",
        details: "Baguio City's transformation into a modern cultural and tourist destination.",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/master/images/timeline/panagbenga-festival-1024x683.jpg?raw=true"
    }
];

const backgrounds = document.querySelector('.baguio-timeline-backgrounds');
const yearElement = document.querySelector('.baguio-timeline-year');
const titleElement = document.querySelector('.baguio-timeline-title');
const detailsElement = document.querySelector('.baguio-timeline-details');
const navigation = document.querySelector('.baguio-timeline-navigation');

timelineData.forEach(data => {
    const bgDiv = document.createElement('div');
    bgDiv.classList.add('baguio-timeline-bg-image');
    bgDiv.style.backgroundImage = `url(${data.background})`;
    bgDiv.dataset.year = data.year;
    backgrounds.appendChild(bgDiv);
});

function updateContent(data) {
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

timelineData.forEach(data => {
    const button = document.createElement('button');
    button.classList.add('baguio-timeline-nav-btn');
    button.textContent = data.year;
    button.dataset.year = data.year;
    button.addEventListener('click', () => updateContent(data));
    navigation.appendChild(button);
});

updateContent(timelineData[0]);