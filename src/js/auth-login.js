import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        alert("Palun kinnita oma e-posti aadress enne sisselogimist!");
        return;
      }

      console.log("✅ Logged in successfully!");
      window.location.href = "/booking/";
    } catch (error) {
      console.error("❌ Login failed:", error.message);
      alert("Vale e-post või parool!");
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User logged in:", user.email);
    } else {
      console.log("No user logged in.");
    }
  });
});
