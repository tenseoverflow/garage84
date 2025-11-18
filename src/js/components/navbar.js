import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../js/firebase.js";

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

          <!-- LEFT SIDE -->
          <div class="nav-left">
            <a class="nav-link" href="/booking/">Kodu</a>
            <p>Ruumibroneerimine</p>
          </div>

          <!-- RIGHT SIDE -->
          <div class="nav-right">
            
            <div class="button-navbar">
              <a class="nav-link" href="/booking/new/">Loo uus ruum</a>
            </div>

            <!-- USER PROFILE DROPDOWN -->
            <div class="user-menu" id="user-menu">
              <div class="user-avatar" id="user-avatar">U</div>
              <span class="user-name" id="user-name"></span>
              <svg class="user-caret" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" 
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>

              <div class="user-dropdown" id="user-dropdown">
                <a href="/settings/">Minu konto</a>
                <button id="logout-btn">
                  <svg class="logout-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6H5C4.44772 6 4 6.44772 4 7V17C4 17.5523 
                      4.44772 18 5 18H9" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16 12H8" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 8L16 12L12 16" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round"/>
                  </svg>
                  Logi välja
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;

    this.activateUserLogic();
  }

  activateUserLogic() {
    const avatar = this.querySelector("#user-avatar");
    const nameEl = this.querySelector("#user-name");
    const dropdown = this.querySelector("#user-dropdown");
    const logoutBtn = this.querySelector("#logout-btn");
    const userMenu = this.querySelector("#user-menu");

    // ------------------------------------
    // OPEN/CLOSE DROPDOWN
    // ------------------------------------
    userMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
      userMenu.classList.toggle("open");
    });

    // ------------------------------------
    // CLOSE WHEN CLICKING OUTSIDE
    // ------------------------------------
    document.addEventListener("click", () => {
      dropdown.classList.remove("open");
      userMenu.classList.remove("open");
    });

    // ------------------------------------
    // LOGOUT
    // ------------------------------------
    logoutBtn.addEventListener("click", () => {
      signOut(auth).then(() => {
        window.location.href = "/login/";
      });
    });

    // ------------------------------------
    // LOAD USER DATA
    // ------------------------------------
    onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const name = user.displayName || "Kasutaja";
      nameEl.textContent = name;
      avatar.textContent = name.charAt(0).toUpperCase();
    });
  }
}

customElements.define("app-navbar", AppNavbar);
