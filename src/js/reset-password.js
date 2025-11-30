import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase.js";

const form = document.getElementById("resetForm");
const emailInput = document.getElementById("email");
const messageEl = document.getElementById("message");
const errorEl = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  messageEl.textContent = "";
  errorEl.textContent = "";

  const email = emailInput.value.trim();

  try {
    await sendPasswordResetEmail(auth, email);

    messageEl.textContent =
      "Saatsime sulle parooli lähtestamise meili. Kontrolli oma postkasti!";
  } catch (error) {
    // Kasutajasõbralikud vead
    if (error.code === "auth/user-not-found") {
      errorEl.textContent = "Sellise e-postiga kasutajat ei leitud.";
    } else if (error.code === "auth/invalid-email") {
      errorEl.textContent = "E-posti aadress ei ole korrektne.";
    } else {
      errorEl.textContent = "Tekkis viga: " + error.message;
    }
  }
});
