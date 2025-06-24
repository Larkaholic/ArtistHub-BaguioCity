 document.addEventListener("DOMContentLoaded", function () {
      const loader = document.getElementById("loader");
      const typingElement = document.getElementById("typing");
      const content = document.getElementById("content");

      const text = ["Meet Our Team", "ArtistHub"];
      let lineIndex = 0;
      let charIndex = 0;

      function typeEffect() {
        if (lineIndex < text.length) {
          if (charIndex < text[lineIndex].length) {
            typingElement.innerHTML += text[lineIndex].charAt(charIndex);
            charIndex++;
            setTimeout(typeEffect, 150);
          } else {
            lineIndex++;
            charIndex = 0;
            if (lineIndex < text.length) {
              typingElement.innerHTML += "<br>";
              setTimeout(typeEffect, 400);
            } else {
              setTimeout(() => {
                loader.style.opacity = "0";
                loader.style.pointerEvents = "none";
                content.style.opacity = "1";
                content.style.pointerEvents = "auto";
              }, 1000);
            }
          }
        }
      }

      typeEffect();
    });

    function navToEvent(url) {
      window.location.href = url;
    }