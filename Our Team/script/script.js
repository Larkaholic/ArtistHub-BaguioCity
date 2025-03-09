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
const words = ["Our Team","ArtistHub"];
let i = 0, j = 0, currentWord = "", isDeleting = false;
        const speed = 200; 
        const cursorSpeed = 900; 
function loopTyping() {
  currentWord = words[i].substring(0, j);
  document.getElementById("typing").innerHTML = currentWord + " |";

  if (!isDeleting && j < words[i].length) {
    j++;
    setTimeout(loopTyping, 100);
  } else if (isDeleting && j > 0) {
    j--;
    setTimeout(loopTyping, 100);
  } else {
    isDeleting = !isDeleting;
    if (!isDeleting) i = (i + 1) % words.length;
    setTimeout(loopTyping, 1000);
  }
}

window.onload = loopTyping;
/* End of Typing Loop */