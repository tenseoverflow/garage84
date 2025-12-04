const template = document.createElement("template");
template.innerHTML = `
  <div class="room-card info_my_bookings">
    <div class="media">
      <img part="image"/>
      <div class="capacity-badge" part="capacity"></div>
    </div>
    <div class="details text_content">
      <div class="title-row">
        <p class="title"></p>
        <div class="capacity-topright"></div>
      </div>
      <p class="desc"></p>
      <p class="meta floor"></p>
      <a class="action btn" part="button" href="#" role="button"></a>
    </div>
  </div>
`;

class RoomCard extends HTMLElement {
  static get observedAttributes() {
    return [
      "title",
      "description",
      "img",
      "status",
      "button-url",
      "capacity",
      "floor",
    ];
  }

  constructor() {
    super();
    // render into light DOM so global stylesheet applies
    this.appendChild(template.content.cloneNode(true));
    this._imgEl = this.querySelector("img");
    this._titleEl = this.querySelector(".title");
    this._descEl = this.querySelector(".desc");
    this._button = this.querySelector("a.action");
    this._root = this.querySelector(".room-card");
    this._capacityBadge = this.querySelector(".capacity-badge");
    this._capacityTopRight = this.querySelector(".capacity-topright");
    this._floorEl = this.querySelector(".meta.floor");

    this._onClick = this._onClick.bind(this);
  }

  connectedCallback() {
    this._upgradeProperties();
    this._render();
    this._button.addEventListener("click", this._onClick);
  }

  disconnectedCallback() {
    this._button.removeEventListener("click", this._onClick);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    this._render();
  }

  // support setting properties directly on the element instance
  _upgradeProperties() {
    [
      "title",
      "description",
      "img",
      "status",
      "buttonUrl",
      "capacity",
      "floor",
    ].forEach((prop) => {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const val = this[prop];
        delete this[prop];
        this[prop] = val;
      }
    });
  }

  get title() {
    return this.getAttribute("title") || "";
  }
  set title(v) {
    this.setAttribute("title", v);
  }

  get description() {
    return this.getAttribute("description") || "";
  }
  set description(v) {
    this.setAttribute("description", v);
  }

  get img() {
    return this.getAttribute("img") || "";
  }
  set img(v) {
    this.setAttribute("img", v);
  }

  get status() {
    return this.getAttribute("status") || "available";
  }
  set status(v) {
    this.setAttribute("status", v);
  }

  get buttonUrl() {
    return this.getAttribute("button-url") || "";
  }
  set buttonUrl(v) {
    this.setAttribute("button-url", v);
  }

  get capacity() {
    return this.getAttribute("capacity") || "";
  }
  set capacity(v) {
    this.setAttribute("capacity", v);
  }

  get floor() {
    return this.getAttribute("floor") || "";
  }
  set floor(v) {
    this.setAttribute("floor", v);
  }

  _render() {
    if (!this.isConnected) return;
    this._imgEl.src = this.img || "/assets/MURG.jpg";
    this._imgEl.alt = this.title || "Room image";
    this._titleEl.textContent = this.title || "";
    this._descEl.textContent = this.description || "";
    if (this.capacity && this._capacityBadge) {
      this._capacityBadge.textContent = this.capacity;
      this._capacityTopRight.textContent = this.capacity;
    } else {
      if (this._capacityBadge) this._capacityBadge.textContent = "";
      if (this._capacityTopRight) this._capacityTopRight.textContent = "";
    }

    if (this.floor && this._floorEl) {
      this._floorEl.textContent = this.floor;
    } else if (this._floorEl) {
      this._floorEl.textContent = "";
    }

    const status = (this.status || "").toLowerCase();
    let text = this.buttonText || "";
    let disabled = false;

    if (!text) {
      if (status === "booked") text = "Go to booking";
      else if (status === "available") text = "Available times";
      else if (
        status === "not-available" ||
        status === "notavailable" ||
        status === "unavailable"
      )
        text = "Not available";
      else text = "Details";
    }

    if (status === "booked") {
      // booked — interactive
    } else if (status === "available") {
      // available — interactive
    } else {
      // not available/unrecognized
      disabled = status !== "available" && status !== "booked";
    }

    // map to global button variant classes so existing CSS applies
    const variantClass =
      status === "booked"
        ? "btn-success"
        : status === "available"
          ? "btn-primary"
          : "";
    this._button.textContent = text;
    this._button.className = "action btn " + (variantClass ? variantClass : "");

    const url = this.buttonUrl || "#";
    if (disabled) {
      // anchor: remove href to prevent navigation and mark as disabled for styling/accessibility
      this._button.removeAttribute("href");
      this._button.setAttribute("aria-disabled", "true");
      this._button.setAttribute("tabindex", "-1");
      this._button.setAttribute("disabled", "");
    } else {
      this._button.setAttribute("href", url);
      this._button.removeAttribute("aria-disabled");
      this._button.removeAttribute("tabindex");
      this._button.removeAttribute("disabled");
    }

    // also toggle wrapper classes to match previous markup selectors
    if (this._root) {
      // keep info_my_bookings and room-card, add status flags used by global CSS
      this._root.classList.remove("available", "not-available", "booked");
      if (status === "available") this._root.classList.add("available");
      else if (status === "booked") this._root.classList.add("booked");
      else this._root.classList.add("not-available");
    }
  }

  _onClick(event) {
    // If button is disabled do nothing and prevent navigation
    if (this._button.hasAttribute("disabled")) {
      if (event && typeof event.preventDefault === "function")
        event.preventDefault();
      return;
    }

    // Dispatch the room-action event for listeners. Do not prevent navigation here so the anchor can navigate.
    const payload = { title: this.title, status: this.status };
    this.dispatchEvent(
      new CustomEvent("room-action", {
        detail: payload,
        bubbles: true,
        composed: true,
      })
    );

    // If a consumer wants to intercept navigation, they can listen for 'room-action' and call event.preventDefault() on the click.
  }
}

customElements.define("room-card", RoomCard);

export default RoomCard;
