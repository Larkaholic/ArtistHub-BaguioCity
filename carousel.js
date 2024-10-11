const track = document.querySelector('.carousel-track');
const prevButton = document.querySelector('.prev-btn');
const nextButton = document.querySelector('.next-btn');
const images = Array.from(track.children);
const dots = document.querySelectorAll('.dot');

// Clone the first image and append it to the end
const firstImage = images[0].cloneNode(true);
track.appendChild(firstImage);

// Adjust the total images count after cloning
const totalImages = images.length + 1; // +1 for the cloned image
const imageWidth = track.children[0].getBoundingClientRect().width; // Get the width of one image

let currentIndex = 0;
const visibleImages = 3; // How many images you want visible at once

// Set the track width based on the total number of images
track.style.width = `${totalImages * imageWidth}px`;

// Function to move the carousel
function moveToImage(index) {
    const amountToMove = -index * imageWidth;
    track.style.transform = `translateX(${amountToMove}px)`;

    // Reset the index if we reach the cloned first image
    if (index >= totalImages - 1) {
        currentIndex = 0;
        track.style.transition = 'none'; // Disable transition for instant jump
        track.style.transform = `translateX(0px)`; // Jump back to the first image
        setTimeout(() => {
            track.style.transition = 'transform 0.4s ease-in-out'; // Re-enable transition
        }, 20); // Small delay to allow for transition reset
    }
    updateDots(currentIndex);
}

// Update dot indicators
function updateDots(index) {
    dots.forEach(dot => dot.classList.remove('active'));
    dots[index % (totalImages - 1)].classList.add('active'); // Adjust dots accordingly
}

// Move to the next set of images
nextButton.addEventListener('click', () => {
    currentIndex++;
    if (currentIndex >= totalImages) {
        currentIndex = totalImages - 1; // Prevent going past the last image
    }
    moveToImage(currentIndex);
});

// Move to the previous set of images
prevButton.addEventListener('click', () => {
    if (currentIndex === 0) {
        currentIndex = totalImages - 1; // Loop to the last image if currently at the first
    } else {
        currentIndex--;
    }
    moveToImage(currentIndex);
});

// Move to specific image via dot click
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentIndex = index;
        moveToImage(currentIndex);
    });
});
