document.addEventListener("DOMContentLoaded", function() {
    const header = document.getElementById('main-header');
    
    if (!header) {
        console.error("ERROR: #main-header not found in the DOM!");
        return;
    }

    console.log("Header found:", header);

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('solid-header');
            header.classList.remove('transparent-header');
            console.log("Header changed to solid");
        } else {
            header.classList.add('transparent-header');
            header.classList.remove('solid-header');
            console.log("Header changed to transparent");
        }
    });

    console.log("Scroll event listener added.");
});

// Auto-hide announcement after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const announcement = document.getElementById('announcement');
    if (announcement) {
        setTimeout(() => {
            announcement.style.transition = 'opacity 0.5s ease-out';
            announcement.style.opacity = '0';
            setTimeout(() => {
                announcement.style.display = 'none';
            }, 500);
        }, 5000);
    }
});

// Function to close announcement
function closeAnnouncement() {
    const announcement = document.getElementById('announcement');
    if (announcement) {
        announcement.style.transition = 'opacity 0.5s ease-out';
        announcement.style.opacity = '0';
        setTimeout(() => {
            announcement.style.display = 'none';
        }, 500);
    }
}

// Make closeAnnouncement available globally
window.closeAnnouncement = closeAnnouncement;
