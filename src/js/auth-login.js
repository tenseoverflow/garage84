import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;

    // vaheta ikoon
    togglePassword.classList.toggle("fa-eye");
    togglePassword.classList.toggle("fa-eye-slash");
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      // Try to sign user in
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Check if they confirmed email
      if (!user.emailVerified) {
        alert("Palun kinnita oma meiliaadress enne sisselogimist.");
        return;
      }

      // If all good → redirect
      window.location.href = "/booking/";
    } catch (error) {
      console.error(error);

      if (error.code === "auth/user-not-found") {
        alert("Kasutajat ei leitud. Kontrolli oma andmeid.");
      } else if (error.code === "auth/wrong-password") {
        alert("Vale parool.");
      } else {
        alert("Sisselogimine ebaõnnestus: " + error.message);
      }
    }
  });
});
