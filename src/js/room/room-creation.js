import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";
import { showError } from "../utils/banners.js";
import { uploadImageToR2 } from "../utils/r2-upload.js";
import { validateRoomData } from "./room.js";

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

    const validationError = validateRoomData({ name, location, capacity });
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      let imageUrl = "";
      if (imageInput?.files && imageInput.files[0]) {
        try {
          imageUrl = await uploadImageToR2(imageInput.files[0]);
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          showError("Viga pildi üleslaadmisel: " + uploadError.message);

          if (submitBtn) {
            submitBtn.disabled = false;
          }
          return;
        }
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRoomForm);
} else {
  initRoomForm();
}
