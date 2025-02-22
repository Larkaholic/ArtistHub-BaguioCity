// function toggleLoginFlyout(event) {
//     if (event) event.preventDefault(); // Prevent the default anchor behavior
//     const flyout = document.getElementById('LoginFlyout');
//     flyout.classList.toggle('active'); // Toggle the active class
// }

// // Close the login flyout when clicking outside of it
// window.onclick = function(event) {
//     const flyout = document.getElementById('LoginFlyout');
//     if (event.target === flyout) {
//         flyout.classList.remove('active');
//     }
// }


// function toggleNav() {
//     const flyoutMenu = document.getElementById('flyout-menu');
//     flyoutMenu.classList.toggle('hidden');            // Show or hide the flyout
//     flyoutMenu.classList.toggle('translate-x-full');  // Slide in or out
// }

// function toggleForms() {
//     const loginForm = document.getElementById('loginForm');
//     const registerForm = document.getElementById('registerForm');
    
//     if (loginForm.classList.contains('hidden')) {
//         loginForm.classList.remove('hidden');
//         registerForm.classList.add('hidden');
//     } else {
//         loginForm.classList.add('hidden');
//         registerForm.classList.remove('hidden');
//     }
// }

// function loadTailwindCSS() {
//     const link = document.createElement('link');
//     link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
//     link.rel = 'stylesheet';
//     document.head.appendChild(link);
// }

// document.addEventListener('DOMContentLoaded', function() {
//     loadTailwindCSS();
//     showSpinner();
//     // Hide spinner after all components have loaded
//     window.addEventListener('load', hideSpinner);
//     document.querySelectorAll('a[href^="#"]').forEach(anchor => {
//         anchor.addEventListener('click', function (e) {
//             e.preventDefault();
//             const target = document.querySelector(this.getAttribute('href'));
//             if (target) {
//                 target.scrollIntoView({
//                     behavior: 'smooth',
//                     block: 'start'
//                 });
//             }
//         });
//     });
// });
document.addEventListener("DOMContentLoaded", function() {
    const header = document.getElementById('main-header');
    
    if (!header) {
        console.error("ERROR: #main-header not found in the DOM!");
        return;
    }

    console.log("Header found:", header);

    window.addEventListener('scroll', function() {
        if (window.scrollY > 0) {
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
