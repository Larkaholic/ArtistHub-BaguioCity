function toggleLoginFlyout(event) {
  if (event) event.preventDefault(); // Prevent the default anchor behavior
  const flyout = document.getElementById('LoginFlyout');
  flyout.classList.toggle('active'); // Toggle the active class
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
}