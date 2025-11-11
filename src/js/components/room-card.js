const template = document.createElement("template");
template.innerHTML = `
  <div class="room-card info_my_bookings">
    <img part="image"/>
    <div class="details text_content">
      <p class="title"></p>
      <p class="desc"></p>
      <button class="action btn" part="button"></button>
    </div>
  </div>
`;

class RoomCard extends HTMLElement {
  static get observedAttributes() {
    return ["title", "description", "img", "status", "button-text"];
  }

  constructor() {
    super();
    // render into light DOM so global stylesheet applies
    this.appendChild(template.content.cloneNode(true));
    this._imgEl = this.querySelector("img");
    this._titleEl = this.querySelector(".title");
    this._descEl = this.querySelector(".desc");
    this._button = this.querySelector("button.action");
    this._root = this.querySelector(".room-card");

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
    ["title", "description", "img", "status", "buttonText"].forEach((prop) => {
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

  get buttonText() {
    return this.getAttribute("button-text") || "";
  }
  set buttonText(v) {
    this.setAttribute("button-text", v);
  }

  _render() {
    if (!this.isConnected) return;
    this._imgEl.src = this.img || "/assets/MURG.jpg";
    this._imgEl.alt = this.title || "Room image";
    this._titleEl.textContent = this.title || "";
    this._descEl.textContent = this.description || "";

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

    if (disabled) this._button.setAttribute("disabled", "");
    else this._button.removeAttribute("disabled");

    // also toggle wrapper classes to match previous markup selectors
    if (this._root) {
      // keep info_my_bookings and room-card, add status flags used by global CSS
      this._root.classList.remove("available", "not-available", "booked");
      if (status === "available") this._root.classList.add("available");
      else if (status === "booked") this._root.classList.add("booked");
      else this._root.classList.add("not-available");
    }
  }

  _onClick() {
    // If button is disabled do nothing
    if (this._button.hasAttribute("disabled")) return;
    const payload = { title: this.title, status: this.status };
    this.dispatchEvent(
      new CustomEvent("room-action", {
        detail: payload,
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("room-card", RoomCard);

export default RoomCard;
