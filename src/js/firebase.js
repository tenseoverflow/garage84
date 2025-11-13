// Import Firebase SDKs (these are from your installed npm package)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmFPf6ppL8LLvQNzttI9A7aHir2ukIdT8",
  authDomain: "garage84-2f2ef.firebaseapp.com",
  projectId: "garage84-2f2ef",
  storageBucket: "garage84-2f2ef.firebasestorage.app",
  messagingSenderId: "401347033215",
  appId: "1:401347033215:web:8d31e067d1ad6fae9ca74a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Export initialized Firebase instances
export { app, auth, db };
