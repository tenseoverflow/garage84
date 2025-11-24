import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

export function initRoomForm() {
  const form = document.querySelector(".new-room form");
  const nameInput = document.getElementById("room-name");
  const locationInput = document.getElementById("room-location");
  const capacityInput = document.getElementById("room-capacity");
  const imageInput = document.getElementById("room-image");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput?.value?.trim();
    const location = locationInput?.value?.trim();
    const capacity = capacityInput?.value ? parseInt(capacityInput.value) : 0;

    if (!name || !location) {
      showError("Palun täida kõik nõutud väljad");
      return;
    }

    if (capacity <= 0) {
      showError("Mahutavus peab olema positiivne number");
      return;
    }

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      let imageUrl = "";
      if (imageInput?.files && imageInput.files[0]) {
        imageUrl = "https://hen.ee/favicon.ico";
        console.log("Image file selected:", imageInput.files[0].name);
        // TODO: Implement Firebase Storage upload
      }

      const roomData = {
        name: name,
        location: location,
        capacity: capacity,
        imageUrl: imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "rooms"), roomData);

      window.location.href = `/room/?id=${docRef.id}`;
    } catch (error) {
      showError("Viga ruumi loomisel: " + error.message);

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
      }
    }
  });
}

function showError(message) {
  clearMessages();

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.style.cssText = `
    background-color: #fee;
    color: #c33;
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 0.5rem;
    border: 1px solid #fcc;
  `;
  errorDiv.textContent = message;

  const form = document.querySelector(".new-room form");
  if (form) {
    form.insertBefore(errorDiv, form.firstChild);
  }
}

function clearMessages() {
  const messages = document.querySelectorAll(
    ".error-message, .success-message"
  );
  messages.forEach((msg) => msg.remove());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRoomForm);
} else {
  initRoomForm();
}
