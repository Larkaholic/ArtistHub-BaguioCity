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

var swiper = new Swiper(".centered-slide-carousel", {
  centeredSlides: true,
  paginationClickable: true,
  loop: true,
  spaceBetween: 30,
  slideToClickedSlide: true,
  pagination: {
    el: ".centered-slide-carousel .swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  breakpoints: {
    1920: {
      slidesPerView: 4,
      spaceBetween: 30
    },
    1028: {
      slidesPerView: 2,
      spaceBetween: 10
    },
    990: {
      slidesPerView: 1,
      spaceBetween: 0
    }
  }
});

function navToEvent(url) {
  window.location.href = url;
};

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

function toggleForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginForm.classList.contains('hidden')) {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
  } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
  }
}
