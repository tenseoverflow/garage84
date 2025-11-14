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

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const passwordAgain = passwordAgainInput.value.trim();

    // Password check
    if (password !== passwordAgain) {
      alert("Paroolid ei ühti!");
      return;
    }

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
