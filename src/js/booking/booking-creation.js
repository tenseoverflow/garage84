import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { showError } from "../utils/banners.js";
import { initBookingForm } from "./booking-form.js";
import {
  hasBookingConflict,
  validateBookingDataWithDates,
} from "./booking-validation.js";

/**
 * Get room ID from URL query parameters
 * @returns {string|null} Room ID or null if not present
 */
function getRoomIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("roomId") || urlParams.get("id");
}

/**
 * Load and display room information
 * @param {string} roomId - Room ID to load
 */
async function loadRoomInfo(roomId) {
  try {
    const roomRef = doc(db, "rooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      const roomData = roomSnap.data();

      const roomTitleElem = document.getElementById("room-title");
      const roomLocationElem = document.getElementById("room-location");

      if (roomTitleElem) {
        roomTitleElem.textContent = roomData.name || "Ruum";
      }

      if (roomLocationElem) {
        roomLocationElem.textContent = roomData.location || "";
      }

      document.title = `Broneeri: ${roomData.name || "Ruum"}`;

      const navbar = document.querySelector("app-navbar");
      if (navbar) {
        navbar.setAttribute("title", `Broneeri: ${roomData.name || "Ruum"}`);
      }

      const calendar = document.querySelector("app-calendar");
      if (calendar) {
        const roomRef = doc(db, "rooms", roomId);
        const roomBookings = await fetchRoomBookings(roomRef);
        calendar.bookings = roomBookings;
      }
    } else {
      throw new Error("Ruumi ei leitud");
    }
  } catch (error) {
    console.error("Error loading room:", error);
    showError("Viga ruumi laadimisel: " + error.message);

    const roomTitleElem = document.getElementById("room-title");
    if (roomTitleElem) {
      roomTitleElem.textContent = "Ruum ei leitud";
    }
  }
}

/**
 * Fetch all bookings for a room
 * @param {object} roomRef - Firestore room reference
 * @returns {Promise<Array>} Array of booking objects with id
 */
async function fetchRoomBookings(roomRef) {
  try {
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("room", "==", roomRef)
    );
    const querySnapshot = await getDocs(bookingsQuery);
    const bookings = [];
    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return bookings;
  } catch (error) {
    console.error("Error fetching room bookings:", error);
    return [];
  }
}

/**
 * Convert date and time strings to Firestore timestamp
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {Date} JavaScript Date object
 */
function dateTimeToTimestamp(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function initBookingCreation() {
  const form = document.querySelector(".new-booking");
  const nameInput = document.getElementById("booking-name");
  const descInput = document.getElementById("booking-description");
  const dateInput = document.getElementById("booking-date");
  const startTimeInput = document.getElementById("booking-start-time");
  const endDateInput = document.getElementById("booking-end-date");
  const endTimeInput = document.getElementById("booking-end-time");
  const submitBtn = document.getElementById("submit-btn");

  const roomId = getRoomIdFromUrl();

  if (!roomId) {
    showError("Ruumi ID puudub URL-is");
    setTimeout(() => {
      window.location.href = "/booking/";
    }, 2000);
    return;
  }

  loadRoomInfo(roomId);

  const bookingFormValidator = initBookingForm();

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!bookingFormValidator.validate()) {
        return;
      }

      const name = nameInput?.value?.trim();
      const desc = descInput?.value?.trim() || "";
      const dateStr = dateInput?.value;
      const startTimeStr = startTimeInput?.value;
      const endDateStr = endDateInput?.value;
      const endTimeStr = endTimeInput?.value;

      const startDate = dateTimeToTimestamp(dateStr, startTimeStr);
      const endDate = dateTimeToTimestamp(endDateStr, endTimeStr);

      const validationError = validateBookingDataWithDates({
        name,
        startDate,
        endDate,
        desc,
        roomId,
      });

      if (validationError) {
        showError(validationError);
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
        }

        const user = auth.currentUser;
        if (!user) {
          throw new Error("Kasutaja pole sisse logitud");
        }

        const roomRef = doc(db, "rooms", roomId);

        const existingBookings = await fetchRoomBookings(roomRef);
        if (hasBookingConflict(existingBookings, startDate, endDate)) {
          throw new Error(
            "Sellel ajal on ruum juba broneeritud. Palun vali teine aeg."
          );
        }

        const bookingData = {
          name: name,
          desc: desc,
          startDate: startDate,
          endingDate: endDate,
          room: roomRef,
          bookerId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "bookings"), bookingData);

        window.location.href = `/booking/confirmed/?id=${docRef.id}`;
      } catch (error) {
        console.error("Error creating booking:", error);
        showError("Viga broneeringu loomisel: " + error.message);

        if (submitBtn) {
          submitBtn.disabled = false;
        }
      }
    });
  }

  if (submitBtn && !form) {
    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const formElement = document.querySelector(".new-booking");
      if (formElement) {
        formElement.dispatchEvent(new Event("submit"));
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBookingCreation);
} else {
  initBookingCreation();
}
