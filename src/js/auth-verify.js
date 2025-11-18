import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebase.js";

const statusText = document.getElementById("verify-status");
const resendBtn = document.getElementById("resend-email");
const refreshBtn = document.getElementById("refresh-status");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    statusText.textContent =
      "Sa ei ole sisse logitud. Palun logi sisse uuesti.";
    return;
  }

  // Show current state
  if (user.emailVerified) {
    statusText.textContent = "Sinu e-posti aadress on kinnitatud!";
    window.location.href = "/booking/";
  } else {
    statusText.textContent = "Sinu e-posti aadress ei ole veel kinnitatud.";
  }

  // Handle resend email
  resendBtn.addEventListener("click", async () => {
    try {
      await sendEmailVerification(user);
      alert("Kinnituse e-kiri saadetud uuesti!");
    } catch (error) {
      console.error(error);
      alert("Tekkis viga e-kirja saatmisel.");
    }
  });

  // Handle refresh button
  refreshBtn.addEventListener("click", async () => {
    await user.reload(); // Reloads user data from Firebase
    if (user.emailVerified) {
      alert("Kinnitamine õnnestus! Sind suunatakse edasi.");
      window.location.href = "/booking/";
    } else {
      statusText.textContent =
        "Meiliaadressi pole veel kinnitatud. Kontrolli uuesti.";
    }
  });
});
