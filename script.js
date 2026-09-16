/* =========================================
   AIShortFilmz
   Main JavaScript
========================================= */


/* =========================================
   FILM DATA
========================================= */

const films = {

  "film-1": {

    title: "The 7 Stars of Blessings",

    youtubeId: "0xThQ-BlV9E"

  }

};


/* =========================================
   MOBILE NAVIGATION
========================================= */

const menuToggle =
  document.getElementById("menuToggle");

const navigation =
  document.getElementById("navigation");

const navLinks =
  document.querySelectorAll(".navigation a");


if (menuToggle && navigation) {

  menuToggle.addEventListener(
    "click",
    () => {

      const isActive =
        navigation.classList.toggle("active");

      menuToggle.setAttribute(
        "aria-expanded",
        String(isActive)
      );

    }
  );


  navLinks.forEach((link) => {

    link.addEventListener(
      "click",
      () => {

        navigation.classList.remove(
          "active"
        );

        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );

      }
    );

  });


  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Escape") {

        navigation.classList.remove(
          "active"
        );

        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );

      }

    }
  );

}


/* =========================================
   VIDEO MODAL
========================================= */

const videoModal =
  document.getElementById("videoModal");

const videoPlayer =
  document.getElementById("filmPlayer");

const modalFilmTitle =
  document.getElementById("modalFilmTitle");

const modalClose =
  document.getElementById("modalClose");

const videoBackdrop =
  document.getElementById("videoBackdrop");


const filmButtons =
  document.querySelectorAll(
    "[data-film]"
  );


/* Open Film */

function openFilm(filmId) {

  const film = films[filmId];

  if (!film) {

    console.warn(
      `Film "${filmId}" is not available yet.`
    );

    return;

  }


  modalFilmTitle.textContent =
    film.title;


  /*
    YouTube embed URL.

    autoplay=1
    Starts playback when modal opens.

    rel=0
    Reduces related-video recommendations
    from other channels.
  */

  videoPlayer.src =
    `https://www.youtube.com/embed/${film.youtubeId}?autoplay=1&rel=0`;


  videoModal.classList.add("active");

  videoModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "modal-open"
  );

}


/* Close Film */

function closeFilm() {

  videoModal.classList.remove(
    "active"
  );

  videoModal.setAttribute(
    "aria-hidden",
    "true"
  );

  /*
    Clearing the iframe source stops
    the YouTube video immediately.
  */

  videoPlayer.src = "";

  document.body.classList.remove(
    "modal-open"
  );

}


/* Film Button Events */

filmButtons.forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      const filmId =
        button.dataset.film;

      openFilm(filmId);

    }
  );

});


/* Close Button */

modalClose.addEventListener(
  "click",
  closeFilm
);


/* Click Outside Modal */

videoBackdrop.addEventListener(
  "click",
  closeFilm
);


/* Escape Key */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      videoModal.classList.contains("active")
    ) {

      closeFilm();

    }

  }
);


/* =========================================
   SCROLL REVEAL
========================================= */

const revealElements =
  document.querySelectorAll(".reveal");


const revealObserver =
  new IntersectionObserver(

    (entries, observer) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add(
            "visible"
          );

          observer.unobserve(
            entry.target
          );

        }

      });

    },

    {
      threshold: 0.12
    }

  );


revealElements.forEach((element) => {

  revealObserver.observe(element);

});


/* =========================================
   CURRENT YEAR
========================================= */

const currentYear =
  document.getElementById(
    "currentYear"
  );


if (currentYear) {

  currentYear.textContent =
    new Date().getFullYear();

}