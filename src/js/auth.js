import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase.js";

// Sign up
async function signup(email, password) {
  await createUserWithEmailAndPassword(auth, email, password);
  console.log("User created!");
}

// Log in
async function login(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
  console.log("Logged in!");
}

// Listen for user changes
onAuthStateChanged(auth, (user) => {
  console.log("User state:", user);
});

// Log out
async function logout() {
  await signOut(auth);
  console.log("Logged out!");
}

export { login, logout, signup };
