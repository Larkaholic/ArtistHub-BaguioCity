window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) { // You can adjust the scroll distance
        header.style.backgroundColor = 'rgba(217, 217, 217, 0.3)'; // More transparent
    } else {
        header.style.backgroundColor = 'rgba(217, 217, 217, 1)'; // Solid gray
    }
});

function landingPage() {
    document.getElementById("landingPage").scrollIntoView({
        behavior: 'smooth',
        block: "start"
    });

}
$(document).ready(function() {
    $('nav ul li a:not(:only-child)').click(function(e) {
        $(this).siblings('.nav-dropdown').toggle();
        e.stopPropagation();
    });

    $('html').click(function(){
        $('.nav-dropdown').hide();
    })
    $('#nav-toggle').click(function(){
        $('nav ul').slideToggle();
    })
    $('#nav-toggle').on('click', function(){
        this.classList.toggle('active');
    });
});
