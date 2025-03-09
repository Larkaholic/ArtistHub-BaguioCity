document.addEventListener("DOMContentLoaded", function() {
    const header = document.getElementById('main-header');
    
    if (!header) {
        console.error("ERROR: #main-header not found in the DOM!");
        return;
    }

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('solid-header');
            header.classList.remove('transparent-header');
        } else {
            header.classList.add('transparent-header');
            header.classList.remove('solid-header');
        }
    });
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


// Start the typing effect

function typeWriter(element, text, speed, callback) {
    let i = 0;
    function typing() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typing, speed);
        } else {
            if (callback) {
                setTimeout(callback, 1000); 
            }
        }
    }
    element.innerHTML = ""; 
    typing();
}

function eraseText(element, speed, callback) {
    let text = element.innerHTML;
    let i = text.length;
    function erasing() {
        if (i > 0) {
            element.innerHTML = text.substring(0, i - 1);
            i--;
            setTimeout(erasing, speed);
        } else {
            if (callback) {
                setTimeout(callback, 500); 
            }
        }
    }
    erasing();
}

function startTypingSequence() {
    typeWriter(document.getElementById("typing-h1"), "ArtistHub", 150, function() {
        document.getElementById("typing-h1").innerHTML += "";
        typeWriter(document.getElementById("typing-h2"), "Cordillera Administrative Region", 100, function() {
            setTimeout(() => {
                eraseText(document.getElementById("typing-h2"), 50, function() {
                    eraseText(document.getElementById("typing-h1"), 50, function() {
                        setTimeout(startTypingSequence, 500); 
                    });
                });
            }, 3000); 
        });
    });
}

startTypingSequence();

/* End of Typing Loop */