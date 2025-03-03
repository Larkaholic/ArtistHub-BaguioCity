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
