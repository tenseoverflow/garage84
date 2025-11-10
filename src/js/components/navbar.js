class AppNavbar extends HTMLElement {
  constructor() {
    super();
    this._initialized = false;
  }

  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.innerHTML = `
      <nav class="navbar">
        <div class="navitems">
          <div class="nav-left">
            <a class="nav-link" href="/booking/">Kodu</a>
            <p>Ruumibroneerimine</p>
          </div>
          <div class="nav-right">
            <div class="button-navbar">
              <a class="nav-link" href="/room/create/">Loo uus ruum</a>
            </div>
            <div class="button-navbar">
              <a class="nav-link" href="/settings/">Settings</a>
            </div>
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define("app-navbar", AppNavbar);
