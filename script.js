function toggleForms() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    
    // Toggle the display of the forms
    loginForm.classList.toggle("hidden");
    registerForm.classList.toggle("hidden");
}

function toggleLoginFlyout(event) {
    if (event) event.preventDefault(); // Prevent the default anchor behavior
    const flyout = document.getElementById('LoginFlyout');
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // Show login form by default and hide the register form
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    // Toggle visibility of the entire flyout
    flyout.classList.toggle('hidden');
}

// Close the login flyout when clicking outside of it
window.onclick = function(event) {
    const flyout = document.getElementById('LoginFlyout');
    if (event.target === flyout) {
        flyout.classList.add('hidden');
    }
}

function submitLogin() {
    // Login form submission logic
    alert("Login submitted!");
}

function submitRegister() {
    // Register form submission logic
    alert("Register submitted!");
}

function toggleNav() {
    const flyoutMenu = document.getElementById('flyout-menu');
    flyoutMenu.classList.toggle('hidden');            // Show or hide the flyout
    flyoutMenu.classList.toggle('translate-x-full');  // Slide in or out
}

function navToEvent(url) {
    window.location.href = url;
}

function updateActiveNavItem() {
    const sections = document.querySelectorAll("section"); // Add ID to each section you want to track
    const navItems = document.querySelectorAll(".nav-item");

    let currentSection = "";

    // Loop through sections to find the one in view
    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        // Check if section is within the viewport
        if (window.scrollY >= sectionTop - sectionHeight / 3) {
            currentSection = section.getAttribute("id");
        }
    });

    // Update nav items based on the current section
    navItems.forEach((item) => {
        item.classList.remove("active");
        if (item.querySelector("a").getAttribute("href") === `#${currentSection}`) {
            item.classList.add("active");
        }
    });
}

window.addEventListener("scroll", updateActiveNavItem);