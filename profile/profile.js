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

function toggleNav() {
    const flyoutMenu = document.getElementById('flyout-menu');
    flyoutMenu.classList.toggle('hidden');            // Show or hide the flyout
    flyoutMenu.classList.toggle('translate-x-full');  // Slide in or out
}

