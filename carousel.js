const carouselInner = document.querySelector('.carousel-inner');
const carouselImages = document.querySelectorAll('.carousel-image');
const carouselPrev = document.querySelector('.carousel-prev');
const carouselNext = document.querySelector('.carousel-next');

let currentSlide = 0;
const totalSlides = carouselImages.length;

// Event listeners for controls
carouselPrev.addEventListener('click', () => {
    currentSlide = (currentSlide === 0) ? totalSlides - 1 : currentSlide - 1;
    updateCarousel();
});

carouselNext.addEventListener('click', () => {
    currentSlide = (currentSlide === totalSlides - 1) ? 0 : currentSlide + 1;
    updateCarousel();
});

function updateCarousel() {
    const imageWidth = carouselInner.clientWidth;
    carouselInner.style.transform = `translateX(${-currentSlide * imageWidth}px)`;
}
