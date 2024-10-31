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
function toggleLoginFlyout(event) {
    if (event) event.preventDefault(); // Prevent the default anchor behavior
    const flyout = document.getElementById('LoginFlyout');
    flyout.classList.toggle('active'); // Toggle the active class
}

// Dummy function for login submission
function submitLogin() {
    alert('Login submitted!');
    toggleLoginFlyout(); // Optionally close the flyout after submission
}

// Close the login flyout when clicking outside of it
window.onclick = function(event) {
    const flyout = document.getElementById('LoginFlyout');
    if (event.target === flyout) {
        flyout.classList.remove('active');
    }
}

// function navigateToEvent (){
//     window.location.href("events/events.html");
// }

function navToEvent() {
    window.location.href("events/events.html");
}

function toggleNav() {
    const flyoutMenu = document.getElementById('flyout-menu');
    flyoutMenu.classList.toggle('hidden');            // Show or hide the flyout
    flyoutMenu.classList.toggle('translate-x-full');  // Slide in or out
}
