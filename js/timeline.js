document.addEventListener('DOMContentLoaded', function() {
    const histBackgrounds = document.getElementById('histBackgrounds');
    const histYear = document.getElementById('histYear');
    const histTitle = document.getElementById('histTitle');
    const histDetails = document.getElementById('histDetails');
    const histTimeline = document.getElementById('histTimeline');

    const timelineData = [
        {
            year: 2001,
            title: "PANAGBENGA 2001",
            details: "Apollo 11 becomes the first crewed mission to land on the Moon, marking one of humanity's greatest achievements. This historic moment united the world in celebration of human ingenuity and courage.",
            imageUrl: "https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/timeline/179e161304fd380a55e08f73f300064e.jpg"
        },
        {
            year: 2002,
            title: "PANAGBENGA 2002",
            details: "The Berlin Wall falls, symbolizing the end of the Cold War and the reunification of East and West Germany. This momentous event marked the beginning of a new era of freedom and democracy in Europe.",
            imageUrl: "https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/timeline/madeko-kito-baguio-festival-1024x576.jpg"
        },
        {
            year: 2003,
            title: "PANAGBENGA 2003",
            details: "The rise of the internet and digital technology transforms global communication and commerce. This unprecedented technological advancement changed how we live, work, and connect with each other.",
            imageUrl: "https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/timeline/panagbenga-festival-1024x683.jpg"
        },
        {
            year: 2004,
            title: "PANAGBENGA 2004",
            details: "COVID-19 pandemic leads to unprecedented global changes in how we live, work, and interact. This global crisis reshaped society and accelerated digital transformation across all sectors.",
            imageUrl: "https://raw.githubusercontent.com/Larkaholic/ArtistHub-BaguioCity/master/images/timeline/179e161304fd380a55e08f73f300064e.jpg"
        }
    ];

    async function preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }

    async function createBackgrounds() {
        const container = document.getElementById('histBackgrounds');
        if (!container) return;

        // Show loading state
        const loader = document.createElement('div');
        loader.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            z-index: 3;
        `;
        loader.textContent = 'Loading...';
        container.appendChild(loader);

        try {
            // Preload all images first
            const preloadedImages = await Promise.all(
                timelineData.map(event => preloadImage(event.imageUrl))
            );

            // Remove loader
            loader.remove();

            // Add images to container
            preloadedImages.forEach((img, index) => {
                img.className = `hist-bg-img ${index === 0 ? 'hist-bg-img--active' : ''}`;
                img.alt = `${timelineData[index].title} background`;
                container.appendChild(img);
            });
        } catch (error) {
            console.error('Error loading images:', error);
            loader.textContent = 'Error loading images. Please refresh the page.';
        }
    }

    function createTimeline() {
        const timeline = document.getElementById('histTimeline');
        if (!timeline) return;
        
        timelineData.forEach((event, index) => {
            const item = document.createElement('div');
            item.className = `hist-item ${index === 0 ? 'hist-item--active' : ''}`;
            
            const dot = document.createElement('div');
            dot.className = 'hist-dot';
            
            const yearLabel = document.createElement('div');
            yearLabel.className = 'hist-year-label';
            yearLabel.textContent = event.year;

            const image = document.createElement('img');
            image.className = 'hist-image';
            image.src = event.imageUrl;
            
            item.appendChild(dot);
            item.appendChild(yearLabel);
            
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
        document.querySelectorAll('.hist-item')[index]?.classList.add('hist-item--active');
    }

    function updateBackground(index) {
        document.querySelectorAll('.hist-bg-img').forEach(img => {
            img.classList.remove('hist-bg-img--active');
        });
        document.querySelectorAll('.hist-bg-img')[index]?.classList.add('hist-bg-img--active');
    }

    function updateContent(event) {
        const year = document.getElementById('histYear');
        const title = document.getElementById('histTitle');
        const details = document.getElementById('histDetails');

        // Reset animations
        title?.classList.remove('hist-fade-in');
        details?.classList.remove('hist-fade-up');
        
        // Force reflow
        void title?.offsetWidth;
        void details?.offsetWidth;

        // Update content
        if (year) year.textContent = event.year;
        if (title) title.textContent = event.title;
        if (details) details.textContent = event.details;

        // Add animations back
        requestAnimationFrame(() => {
            title?.classList.add('hist-fade-in');
            details?.classList.add('hist-fade-up');
        });
    }

    // Initialize everything
    async function initialize() {
        try {
            await createBackgrounds();
            createTimeline();
            updateContent(timelineData[0]);
        } catch (error) {
            console.error('Error initializing timeline:', error);
        }
    }

    // Add wheel event listener with debounce
    let wheelTimeout;
    document.addEventListener('wheel', (e) => {
        if (wheelTimeout) return;
        
        wheelTimeout = setTimeout(() => {
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
            
            wheelTimeout = null;
        }, 100); // Debounce time in milliseconds
    });

    // Start initialization when DOM is ready
    document.addEventListener('DOMContentLoaded', initialize);
});