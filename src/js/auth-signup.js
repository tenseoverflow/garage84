import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.querySelector("form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordAgainInput = document.getElementById("password-again");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default page reload

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const passwordAgain = passwordAgainInput.value.trim();

    // ✅ Check if passwords match
    if (password !== passwordAgain) {
      alert("Paroolid ei ühti!"); // “Passwords do not match!”
      return;
    }

    try {
      // ✅ Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // ✅ Set user's display name
      await updateProfile(userCredential.user, { displayName: name });

      console.log("✅ Account created:", userCredential.user);
      alert("Konto loodud edukalt!"); // “Account created successfully!”

      // ✅ Redirect to your verification page
      window.location.href = "/verify/";
    } catch (error) {
      console.error("❌ Signup error:", error.message);
      alert("Konto loomine ebaõnnestus: " + error.message);
    }
  });
});
