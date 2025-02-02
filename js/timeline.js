const timelineData = [
    {
        year: 2018,
        title: "Launching of Creative Baguio, February 6, 2018",
        details: "Creative Baguio, an exhibit hub showcase of Crafts and Folk Arts",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/Feb%206%20Press%20Con.jpg?raw=true"
    },
    {
        year: 2019,
        title: "LuzViMinda Tapestry 2019",
        details: "An exposition of ancestry, traditions, creativity and innovation. An event at the Forest Lodge in Baguio this August 2019 proves our Filipino distinction among Asians",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/LuzViMinda%20Tapestry.jpg?raw=true"
    },
    {
        year: 2020,
        title: "Ibagiw 2020 Opening",
        details: "Ibagiw 2020 opens with a big splash",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/Ibagiw%202020%20SPLash.jpg?raw=true"
    },
    {
        year: 2021,
        title: "Ibagiw 2021",
        details: "Cultural and creative activities begin with prayers and rituals seeking the Almighty Kabunyan’s blessings.",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/ibagiw%202021.jpg?raw=true"
    },
    {
        year: 2022,
        title: "Ibagiw 2022",
        details: "Session Road became a fashion runway for CULTURE COUTURE: a showcase of fashion pieces to celebrate our stories, heritage and culture toward a greener future, featuring new weaving techniques and patterns by local weavers mentored at the HARVEST creative commUNITY hub",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/Ibagiw%202022.jpg?raw=true"
    },
    {
        year: 2023,
        title: "Arts and Crafts at Mandeko Kito 2023",
        details: "",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/Arts%20and%20Crafts%20at%20Mandeko%20Kito%202023.jpg?raw=true"
    },
    {
        year: 2024,
        title: "“Breathe Love” Alliance Building: a Partnership beyond borders.",
        details: "Baguio City Mayor Benjamin Magalong, members of the Creative Baguio City Council, Baguio Tourism Council and the city’s Tourism Office motored the San Fernando City for a joint signing of MOU with LGU La Union led by Gov. Raphaelle Victoria Ortega-David. ",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/Ceremonial.jpg?raw=true"
    },
    {
        year: 2025,
        title: "Panagbenga February 1, 2025",
        details: "Grand Opening Parade",
        background: "https://github.com/Larkaholic/ArtistHub-BaguioCity/blob/Kyle-New-Branch/images/timeline/Panagbenga%202025.jpg?raw=true"
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