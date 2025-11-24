import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { showError } from "../utils/banners.js";

/**
 * Fetch a room by ID from Firestore
 * @param {string} roomId - The room ID to fetch
 * @returns {Promise<{id: string, data: object}>} Room data with ID
 * @throws {Error} If room doesn't exist or fetch fails
 */
export async function fetchRoom(roomId) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Ruumi ei leitud");
  }

  return {
    id: roomSnap.id,
    data: roomSnap.data(),
  };
}

/**
 * Get room ID from URL query parameters
 * @returns {string|null} Room ID or null if not present
 */
export function getRoomIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

/**
 * Validate room form data
 * @param {object} data - Room data to validate
 * @param {string} data.name - Room name
 * @param {string} data.location - Room location
 * @param {number} data.capacity - Room capacity
 * @returns {string|null} Error message or null if valid
 */
export function validateRoomData({ name, location, capacity }) {
  if (!name || !location) {
    return "Palun täida kõik nõutud väljad";
  }

  if (capacity <= 0) {
    return "Mahutavus peab olema positiivne number";
  }

  return null;
}

export function initRoomView() {
  const roomId = getRoomIdFromUrl();

  if (!roomId) {
    window.location.href = "/booking/";
    return;
  }

  const changeLink = document.querySelector('a[href="/room/change/"]');
  if (changeLink) {
    changeLink.href = `/room/change/?id=${roomId}`;
  }

  loadRoomData(roomId);
}

async function loadRoomData(roomId) {
  try {
    const roomTitleElem = document.getElementById("room-title");
    const roomLocationElem = document.getElementById("room-location");
    const roomCapacityElem = document.getElementById("room-capacity");
    const roomImageElem = document.getElementById("room-image");

    if (roomTitleElem) roomTitleElem.textContent = "Laadimine...";
    if (roomLocationElem) roomLocationElem.textContent = "";
    if (roomCapacityElem) roomCapacityElem.textContent = "";

    const { data: roomData } = await fetchRoom(roomId);

    document.title = roomData.name || "Ruum";

    if (roomTitleElem) {
      roomTitleElem.textContent = roomData.name;
    }

    if (roomLocationElem) {
      roomLocationElem.textContent = roomData.location;
    }

    // vb muudame descriptioniks
    if (roomCapacityElem) {
      roomCapacityElem.textContent = `Mahutavus: ${roomData.capacity || 0} inimest`;
    }

    if (roomImageElem) {
      if (roomData.imageUrl) {
        roomImageElem.src = roomData.imageUrl;
        roomImageElem.alt = `Pilt ruumist ${roomData.name}`;
      } else {
        // Keep default image if no custom image is set
        roomImageElem.alt = `Vaikepilt ruumist ${roomData.name}`;
      }
    }

    const navbar = document.querySelector("app-navbar");
    if (navbar) {
      navbar.setAttribute("title", `${roomData.name || ""}`);
    }
  } catch (error) {
    console.error("Error loading room:", error);
    showError("Viga ruumi laadimisel: " + error.message);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRoomView);
} else {
  initRoomView();
}
