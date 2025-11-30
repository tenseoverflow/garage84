class StatusMessage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const type = this.getAttribute("type");
    const showConfetti = this.getAttribute("show-confetti") === "true";

    const config = this.getConfig(type);

    this.render(config);

    if (showConfetti) {
      this.triggerConfetti();
    }
  }

  getConfig(type) {
    const configs = {
      "booking-confirmed": {
        title: "Teie broneering on kinnitatud!",
        buttonText: "Tagasi broneeringute lehele",
        buttonLink: "/booking/",
        image: "/assets/MURG.jpg",
        imageAlt: "pilt MURGi hoonest.",
      },
      "booking-cancelled": {
        title: "Teie broneering on tühistatud!",
        buttonText: "Tagasi broneeringute lehele",
        buttonLink: "/booking/",
        image: "/assets/MURG.jpg",
        imageAlt: "pilt MURGi hoonest.",
      },
      "room-created": {
        title: "Ruum on loodud!",
        buttonText: "Tagasi ruumide lehele",
        buttonLink: "/room/",
        image: "/assets/MURG.jpg",
        imageAlt: "pilt MURGi hoonest.",
      },
      "room-deleted": {
        title: "Ruum on kustutatud!",
        buttonText: "Tagasi ruumide lehele",
        buttonLink: "/room/",
        image: "/assets/MURG.jpg",
        imageAlt: "pilt MURGi hoonest.",
      },
    };

    return (
      configs[type] || {
        title: "Tegevus õnnestus!",
        buttonText: "Tagasi",
        buttonLink: "/",
        image: "/assets/MURG.jpg",
        imageAlt: "pilt MURGi hoonest.",
      }
    );
  }

  render(config) {
    this.classList.add("split", "split-nav");

    this.innerHTML = `
      <div class="pilt">
        <img src="${config.image}" alt="${config.imageAlt}" />
      </div>
      <main>
        <div class="confirmation-message">
          <h1>${config.title}</h1>
          <a href="${config.buttonLink}" class="btn btn-primary">
            ${config.buttonText}
          </a>
        </div>
      </main>
    `;
  }

  triggerConfetti() {
    import("./confetti.js").then(() => {
      setTimeout(() => {
        if (window.confetti) {
          window.confetti();
        }
      }, 100);
    });
  }
}

customElements.define("status-message", StatusMessage);
