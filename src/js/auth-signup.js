import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.querySelector("form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordAgainInput = document.getElementById("password-again");
  const signupBtn = document.getElementById("signupBtn");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const passwordAgainError = document.getElementById("passwordAgainError");

  function validateForm() {
    let valid = true;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const passwordAgain = passwordAgainInput.value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Email validation
    if (!emailRegex.test(email)) {
      emailError.textContent = "Palun sisesta kehtiv e-post.";
      valid = false;
    } else {
      emailError.textContent = "";
    }

    // Password length
    if (password.length < 6) {
      passwordError.textContent = "Parool peab olema vähemalt 6 tähemärki.";
      valid = false;
    } else {
      passwordError.textContent = "";
    }

    // Password match
    if (passwordAgain !== password) {
      passwordAgainError.textContent = "Paroolid ei ühti.";
      valid = false;
    } else {
      passwordAgainError.textContent = "";
    }

    // Disable / enable button
    signupBtn.disabled = !valid;
  }

  // Reaalajas valideerimine
  emailInput.addEventListener("input", validateForm);
  passwordInput.addEventListener("input", validateForm);
  passwordAgainInput.addEventListener("input", validateForm);

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    validateForm();
    if (signupBtn.disabled) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      // Create the user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Set display name
      await updateProfile(user, { displayName: name });

      // ✅ SEND VERIFICATION EMAIL
      await sendEmailVerification(user);

      console.log("📨 Verification email sent to:", email);

      alert("Konto loodud! Kontrolli oma meili ja kinnita oma konto.");

      // Redirect to verify page
      window.location.href = "/verify/";
    } catch (error) {
      console.error("❌ Signup error:", error.message);
      alert("Konto loomine ebaõnnestus: " + error.message);
    }
  });
});
