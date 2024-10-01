window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) { // You can adjust the scroll distance
        header.style.backgroundColor = 'rgba(217, 217, 217, 0.3)'; // More transparent
    } else {
        header.style.backgroundColor = 'rgba(217, 217, 217, 1)'; // Solid gray
    }
});
