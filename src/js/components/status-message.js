import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";

class StatusMessage extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const type = this.getAttribute("type");
    const showConfetti = this.getAttribute("show-confetti") === "true";

    const config = this.getConfig(type);

    this.render(config);

    this.setupViewLink(config);

    if (showConfetti) {
      this.triggerConfetti();
    }

    this.loadImageForType(type);
  }

  static get observedAttributes() {
    return [
      "booking-id",
      "room-id",
      "view-path",
      "view-param",
      "type",
      "show-confetti",
      "view-text",
      "image",
      "image-alt",
    ];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    if (name === "type") {
      const type = this.getAttribute("type");
      const config = this.getConfig(type);
      this.render(config);
      this.setupViewLink(config);
      this.updateImage(config);
      this.loadImageForType(type);
      return;
    }

    if (name === "show-confetti" && newVal === "true") {
      this.triggerConfetti();
      return;
    }

    if (
      name === "booking-id" ||
      name === "view-path" ||
      name === "view-param" ||
      name === "view-text"
    ) {
      const type = this.getAttribute("type");
      const config = this.getConfig(type);
      this.setupViewLink(config);
      this.loadImageForType(type);
    }

    if (name === "image" || name === "image-alt") {
      const type = this.getAttribute("type");
      const config = this.getConfig(type);
      this.updateImage(config);
      return;
    }

    if (name === "room-id") {
      const type = this.getAttribute("type");
      this.loadImageForType(type);
      return;
    }
  }

  async loadImageForType(type) {
    const config = this.getConfig(type);

    const getIdFromAttrsOrUrl = (attrNames) => {
      for (const attr of attrNames) {
        const val = this.getAttribute(attr);
        if (val) return val;
      }
      const urlParams = new URLSearchParams(window.location.search);
      for (const param of ["id", "roomId", "bookingId"]) {
        const v = urlParams.get(param);
        if (v) return v;
      }
      return null;
    };

    try {
      let imageUrl = null;

      if (type === "booking-confirmed") {
        const bookingId = getIdFromAttrsOrUrl(["booking-id"]);
        if (!bookingId) return;

        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        if (!bookingSnap.exists()) return;

        const bookingData = bookingSnap.data();
        const roomRef = bookingData.room;
        if (!roomRef) return;

        let roomSnap;
        if (typeof roomRef === "string") {
          roomSnap = await getDoc(doc(db, "rooms", roomRef));
        } else {
          roomSnap = await getDoc(roomRef);
        }

        if (roomSnap && roomSnap.exists()) {
          const roomData = roomSnap.data();
          imageUrl = roomData.imageUrl || roomData.image || null;
        }
      } else if (type === "room-created" || type === "room-deleted") {
        const roomId = getIdFromAttrsOrUrl(["room-id"]);
        if (!roomId) return;

        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;

        const roomData = roomSnap.data();
        imageUrl = roomData.imageUrl || roomData.image || null;
      }

      if (imageUrl) {
        this.setAttribute("image", imageUrl);
        this.updateImage(config);
      } else {
        const imageFromUrlParam = new URLSearchParams(
          window.location.search
        ).get("image");
        if (imageFromUrlParam) {
          this.setAttribute("image", imageFromUrlParam);
          this.updateImage(config);
        }
      }
    } catch (err) {
      console.error("Error loading related image for status message:", err);
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
        showViewLink: true,
        viewLinkText: "Vaata broneeringut",
        viewLinkPath: "/booking/view/",
      },
      "booking-cancelled": {
        title: "Teie broneering on tühistatud!",
        buttonText: "Tagasi broneeringute lehele",
        buttonLink: "/booking/",
        image: "/assets/MURG.jpg",
        imageAlt: "pilt MURGi hoonest.",
        showViewLink: false,
      },
      "room-created": {
        title: "Ruum on loodud!",
        buttonText: "Tagasi ruumide lehele",
        buttonLink: "/room/",
        image: "/assets/MURG.jpg",
        imageAlt: "pilt MURGi hoonest.",
        showViewLink: true,
        viewLinkText: "Vaata ruumi",
        viewLinkPath: "/room/",
      },
      "room-deleted": {
        title: "Ruum on kustutatud!",
        buttonText: "Tagasi ruumide lehele",
        buttonLink: "/room/",
        image: "/assets/MURG.jpg",
        imageAlt: "pilt MURGi hoonest.",
        showViewLink: false,
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

    const imgSrc = this.getAttribute("image") || config.image;
    const imgAlt = this.getAttribute("image-alt") || config.imageAlt;

    const viewLinkHtml = config.showViewLink
      ? `<a id="view-action-link" href="${config.viewLinkPath}" class="btn btn-primary">${config.viewLinkText}</a>`
      : "";

    const backButtonClass = config.showViewLink
      ? "btn btn-secondary"
      : "btn btn-primary";

    this.innerHTML = `
      <div class="pilt">
        <img src="${imgSrc}" alt="${imgAlt}" />
      </div>
      <main>
        <div class="confirmation-message">
          <h1>${config.title}</h1>

          <div class="confirmation-actions">
            ${viewLinkHtml}
            <a href="${config.buttonLink}" class="${backButtonClass}">
              ${config.buttonText}
            </a>
          </div>
        </div>
      </main>
    `;
  }

  updateImage(config) {
    const imgEl = this.querySelector(".pilt img");
    if (!imgEl) return;

    const imgSrc =
      this.getAttribute("image") ||
      (config && config.image) ||
      "/assets/MURG.jpg";
    const imgAlt =
      this.getAttribute("image-alt") ||
      (config && config.imageAlt) ||
      "pilt MURGi hoonest.";

    if (imgEl.src !== imgSrc) {
      imgEl.src = imgSrc;
    }
    imgEl.alt = imgAlt;
  }

  setupViewLink(config) {
    if (!config || !config.showViewLink) return;

    const paramName = this.getAttribute("view-param") || "id";

    const type = this.getAttribute("type");
    let idValue = null;

    if (type === "booking-confirmed") {
      idValue =
        this.getAttribute("booking-id") ||
        new URLSearchParams(window.location.search).get(paramName);
    } else if (type && type.startsWith("room")) {
      idValue =
        this.getAttribute("room-id") ||
        new URLSearchParams(window.location.search).get(paramName) ||
        new URLSearchParams(window.location.search).get("id") ||
        new URLSearchParams(window.location.search).get("roomId");
    } else {
      idValue =
        this.getAttribute("id") ||
        new URLSearchParams(window.location.search).get(paramName);
    }

    const viewPath =
      this.getAttribute("view-path") || config.viewLinkPath || "/booking/view/";

    const anchor = this.querySelector("#view-action-link");
    if (!anchor) return;

    const viewTextAttr = this.getAttribute("view-text");
    if (viewTextAttr) {
      anchor.textContent = viewTextAttr;
    }

    if (idValue) {
      anchor.href = `${viewPath}?${paramName}=${encodeURIComponent(idValue)}`;
    } else {
      anchor.href = viewPath;
    }
  }

  triggerConfetti() {
    import("./confetti.js").then((module) => {
      if (module && module.startConfetti) {
        module.startConfetti();
      }
    });
  }
}

customElements.define("status-message", StatusMessage);
