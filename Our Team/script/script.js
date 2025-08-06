 function showProfile(index) {
      const profiles = document.querySelectorAll('.profile');
      const tabs = document.querySelectorAll('.tab');

      profiles.forEach((profile, i) => {
        profile.classList.remove('active');
        tabs[i].classList.remove('active');
      });

      profiles[index].classList.add('active');
      tabs[index].classList.add('active');
    }