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

            <div class="button-navbar">
              <a class="nav-link" href="/settings/">Settings</a>
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

            <!-- MOBILE BUTTON -->
            <div class="button-navbar">
              <a class="nav-link-mobile" href="/settings/"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 2V4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 22V20" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 20.66L16 18.93" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11 10.27L7 3.34" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20.66 17L18.93 16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.34 7L5.07 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 12H22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12H4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20.66 7L18.93 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3.34 17L5.07 16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M17 3.34L16 5.07" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11 13.73L7 20.66" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg></a>
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
