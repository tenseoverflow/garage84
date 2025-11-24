import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { showError } from "../utils/banners.js";
import { fetchRoom, getRoomIdFromUrl, validateRoomData } from "./room.js";

export function initRoomChange() {
  const roomId = getRoomIdFromUrl();

  if (!roomId) {
    window.location.href = "/";
    return;
  }

  const deleteBtn = document.querySelector(".btn-danger");
  const saveBtn = document.querySelector(".btn-success");

  loadRoomData(roomId);

  if (saveBtn) {
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await saveRoomData(roomId);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await deleteRoom(roomId);
    });
  }
}

async function loadRoomData(roomId) {
  try {
    const nameInput = document.getElementById("room-name");
    const locationInput = document.getElementById("room-location");
    const capacityInput = document.getElementById("room-capacity");
    const descriptionInput = document.getElementById("room-description");
    const roomImageElem = document.getElementById("room-image");
    const deleteBtn = document.querySelector(".btn-danger");

    if (nameInput) nameInput.value = "Laadimine...";
    if (locationInput) locationInput.value = "";
    if (capacityInput) capacityInput.value = "";
    if (descriptionInput) descriptionInput.value = "";

    const { data: roomData } = await fetchRoom(roomId);

    document.title = `Muuda ${roomData.name || "tuba"}`;

    const navbar = document.querySelector("app-navbar");
    if (navbar) {
      navbar.setAttribute("title", `Muuda ${roomData.name || "tuba"}`);
    }

    if (nameInput) nameInput.value = roomData.name || "";
    if (locationInput) locationInput.value = roomData.location || "";
    if (capacityInput) capacityInput.value = roomData.capacity || "";
    if (descriptionInput) descriptionInput.value = roomData.description || "";

    if (roomImageElem && roomData.imageUrl) {
      roomImageElem.src = roomData.imageUrl;
      roomImageElem.alt = `Pilt ruumist ${roomData.name}`;
    }

    if (deleteBtn) {
      deleteBtn.textContent = `Kustuta ${roomData.name || "tuba"}`;
    }
  } catch (error) {
    showError("Viga ruumi laadimisel: " + error.message);

    if (error.message === "Ruumi ei leitud") {
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }
}

async function saveRoomData(roomId) {
  try {
    const nameInput = document.getElementById("room-name");
    const locationInput = document.getElementById("room-location");
    const capacityInput = document.getElementById("room-capacity");
    const imageInput = document.getElementById("room-image");
    const saveBtn = document.querySelector(".btn-success");

    const name = nameInput?.value?.trim();
    const location = locationInput?.value?.trim();
    const capacity = capacityInput?.value ? parseInt(capacityInput.value) : 0;

    const validationError = validateRoomData({ name, location, capacity });
    if (validationError) {
      showError(validationError);
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
    }

    const updateData = {
      name: name,
      location: location,
      capacity: capacity,
      updatedAt: serverTimestamp(),
    };

    if (imageInput?.files && imageInput.files[0]) {
      // TODO: Implement Firebase Storage upload
      console.log("Image file selected:", imageInput.files[0].name);
    }

    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, updateData);

    window.location.href = `/room/?id=${roomId}`;
  } catch (error) {
    console.error("Error updating room:", error);
    showError("Viga ruumi uuendamisel: " + error.message);

    const saveBtn = document.querySelector(".btn-success");
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Salvesta andmed";
    }
  }
}

async function deleteRoom(roomId) {
  const nameInput = document.getElementById("room-name");
  const roomName = nameInput?.value || "see ruum";

  const confirmed = confirm(`Kindel, et soovid kustutada "${roomName}"?`);

  if (!confirmed) {
    return;
  }

  try {
    const deleteBtn = document.querySelector(".btn-danger");

    if (deleteBtn) {
      deleteBtn.disabled = true;
    }

    const roomRef = doc(db, "rooms", roomId);
    await deleteDoc(roomRef);

    window.location.href = "/";
  } catch (error) {
    console.error("Error deleting room:", error);
    showError("Viga ruumi kustutamisel: " + error.message);

    const deleteBtn = document.querySelector(".btn-danger");
    if (deleteBtn) {
      deleteBtn.disabled = false;
      const nameInput = document.getElementById("room-name");
      const roomName = nameInput?.value || "tuba";
      deleteBtn.textContent = `Kustuta ${roomName}`;
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRoomChange);
} else {
  initRoomChange();
}
