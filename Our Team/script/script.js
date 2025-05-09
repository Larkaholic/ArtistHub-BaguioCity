/*ChatBot AI*/
(function(d, t) {
    var v = d.createElement(t), s = d.getElementsByTagName(t)[0];
    v.onload = function() {
      window.voiceflow.chat.load({
        verify: { projectID: '6706887ba2382c6fe907495e' },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production', 
        voice: { 
          url: "https://runtime-api.voiceflow.com" 
        }
      });
    }
    v.src = "https://cdn.voiceflow.com/widget-next/bundle.mjs"; v.type = "text/javascript"; s.parentNode.insertBefore(v, s);
})(document, 'script');
/*End of ChatBot AI*/

/*Typing Loop OUR TEAM */
document.addEventListener("DOMContentLoaded", function () {
  console.log("JavaScript Loaded!");

  const loader = document.getElementById("loader");
  const typingElement = document.getElementById("typing");
  const content = document.getElementById("content");

  if (!loader || !typingElement || !content) {
      console.error("One or more elements are missing!");
      return;
  }

  // Typing Effect
  const text = ["Meet Our Team,", "ArtistHub"];
  let lineIndex = 0;
  let charIndex = 0;

  function typeEffect() {
      if (lineIndex < text.length) {
          if (charIndex < text[lineIndex].length) {
              typingElement.innerHTML += text[lineIndex].charAt(charIndex);
              charIndex++;
              setTimeout(typeEffect, 100);
          } else {
              // Move to the next line
              lineIndex++;
              charIndex = 0;
              if (lineIndex < text.length) {
                  typingElement.innerHTML += "<br>";
                  setTimeout(typeEffect, 500); // Pause before starting next line
              } else {
                  setTimeout(() => {
                      loader.style.transform = "translateY(-100%)";
                      loader.style.opacity = "0";
                      content.style.opacity = "1";
                      content.style.pointerEvents = "auto";
                  }, 1200);
              }
          }
      }
  }

  // Start Typing Effect
  typeEffect();
});
