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
  const text = "Meet Our Team, ArtistHub";

  let index = 0;
  typingElement.innerHTML = "";

  function typeEffect() {
      if (index < text.length) {
          typingElement.innerHTML += text.charAt(index);
          index++;
          setTimeout(typeEffect, 100);
      } else {
          setTimeout(() => {
              loader.style.transform = "translateY(-100%)";
              loader.style.opacity = "0";
              content.style.opacity = "1";
              content.style.pointerEvents = "auto";
          }, 1200);
      }
  }

  // Start Typing Effect
  typeEffect();
});

// FOR SECURITY OF THE WEBSITE //
/*
// Create a custom alert box
function showCustomAlert(message) {
  let alertBox = document.createElement("div");
  alertBox.innerHTML = `<div style="
      position: fixed; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      border-radius: 10px;
      width: 50%;
      max-width: 400px;
      z-index: 9999;
      box-shadow: 0px 0px 15px rgba(255, 255, 255, 0.5);
  ">
      ${message}
  </div>`;

  document.body.appendChild(alertBox);
  setTimeout(() => alertBox.remove(), 1000); // Hide after 1 second
}
*/
/* Prevent Right Click, F12, and Ctrl+Shift+I/U/J */

// Disable right-click
document.addEventListener("contextmenu", function (event) {
     event.preventDefault();
//   showCustomAlert("RIGHT CLICK IS DISABLE DUE TO PRIVACY CONTENT");
});

// Block all key shortcuts
document.addEventListener("keydown", function (event) {
  let key = event.key.toLowerCase();

  if (event.ctrlKey && event.shiftKey) {
      event.preventDefault();
  //  showCustomAlert("THIS ACTION IS DISABLED ON THIS WEBSITE DUE TO PRIVACY CONTENT");
      return false;
  }

  if (key === "f12") {
      event.preventDefault();
  //  showCustomAlert("DEVELOPER TOOLS ARE DISABLED DUE TO PRIVACY CONTENT");
      return false;
  }

  if ((event.ctrlKey && key === "s") || // Ctrl + S (Save)
      (event.ctrlKey && key === "p") || // Ctrl + P (Print)
      (event.ctrlKey && key === "u") || // Ctrl + U (View Source)
      (key === "printscreen")) { // Print Screen (PrtScn)
      event.preventDefault();
  //  showCustomAlert("THIS ACTION IS DISABLED ON THIS WEBSITE DUE TO PRIVACY CONTENT");
      return false;
  }
});
