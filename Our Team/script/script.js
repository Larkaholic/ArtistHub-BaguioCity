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
  const text = "Meet Our Team";
  let index = 0;
  typingElement.innerHTML = "";

  function typeEffect() {
      if (index < text.length) {
          typingElement.innerHTML += text.charAt(index);
          index++;
          setTimeout(typeEffect, 100);
      } else {
          // Delay before removing loader
          setTimeout(() => {
              loader.style.transform = "translateY(-100%)"; // Moves loader up
              loader.style.opacity = "0"; // Fades loader out
              content.style.opacity = "1"; // Reveals content
              content.style.pointerEvents = "auto"; // Enable interactions
          }, 2000);
      }
  }

  // Start Typing Effect
  typeEffect();
});


