import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";

// This file should be included at the top of any page that requires authentication.
// It redirects unauthenticated users to the login page and unverified users to the email verification page.

onAuthStateChanged(auth, (user) => {
  // Not logged in → send to login page
  if (!user) {
    window.location.href = "/login/";
    return;
  }

  // Logged in but email not verified → force verify page
  if (!user.emailVerified) {
    window.location.href = "/verify/";
    return;
  }

  // Otherwise: allow page to load
  console.log("User authenticated:", user.email);
});
