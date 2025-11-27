import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { showError } from "../utils/banners.js";
import { initBookingForm } from "./booking-form.js";
import { validateBookingDataWithDates } from "./booking-validation.js";
import { fetchBooking, getBookingIdFromUrl } from "./booking.js";

/**
 * Convert Firestore timestamp to date input string (YYYY-MM-DD)
 * @param {object} timestamp - Firestore timestamp
 * @returns {string} Date string in YYYY-MM-DD format
 */
function timestampToDateInput(timestamp) {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/**
 * Convert Firestore timestamp to time input string (HH:MM)
 * @param {object} timestamp - Firestore timestamp
 * @returns {string} Time string in HH:MM format
 */
function timestampToTimeInput(timestamp) {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "";
  }
}

/**
 * Convert date and time strings to JavaScript Date object
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {Date} JavaScript Date object
 */
function dateTimeToTimestamp(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export function initBookingChange() {
  const bookingId = getBookingIdFromUrl();

  if (!bookingId) {
    window.location.href = "/booking/";
    return;
  }

  const deleteBtn = document.getElementById("cancel-booking");
  const saveBtn = document.querySelector(".change-booking .btn-primary");

  loadBookingData(bookingId);

  if (saveBtn) {
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await saveBookingData(bookingId);
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await deleteBooking(bookingId);
    });
  }
}

async function loadBookingData(bookingId) {
  try {
    const nameInput = document.getElementById("booking-name");
    const descInput = document.getElementById("booking-description");
    const dateInput = document.getElementById("booking-date");
    const startTimeInput = document.getElementById("booking-start-time");
    const endDateInput = document.getElementById("booking-end-date");
    const endTimeInput = document.getElementById("booking-end-time");

    // Show loading state
    if (nameInput) nameInput.value = "Laadimine...";
    if (descInput) descInput.value = "";

    const { data: bookingData } = await fetchBooking(bookingId);

    document.title = `Muuda ${bookingData.name || "broneeringut"}`;

    const navbar = document.querySelector("app-navbar");
    if (navbar) {
      navbar.setAttribute(
        "title",
        `Muuda ${bookingData.name || "broneeringut"}`
      );
    }

    // Populate form fields
    if (nameInput) nameInput.value = bookingData.name || "";
    if (descInput) descInput.value = bookingData.desc || "";

    if (dateInput) {
      dateInput.value = timestampToDateInput(bookingData.startDate);
    }

    if (startTimeInput) {
      startTimeInput.value = timestampToTimeInput(bookingData.startDate);
    }

    if (endDateInput) {
      endDateInput.value = timestampToDateInput(bookingData.endingDate);
    }

    if (endTimeInput) {
      endTimeInput.value = timestampToTimeInput(bookingData.endingDate);
    }

    // Initialize booking form for validation and UI updates
    initBookingForm();
  } catch (error) {
    showError("Viga broneeringu laadimisel: " + error.message);

    if (error.message === "Broneeringut ei leitud") {
      setTimeout(() => {
        window.location.href = "/booking/";
      }, 2000);
    }
  }
}

async function saveBookingData(bookingId) {
  try {
    const nameInput = document.getElementById("booking-name");
    const descInput = document.getElementById("booking-description");
    const dateInput = document.getElementById("booking-date");
    const startTimeInput = document.getElementById("booking-start-time");
    const endDateInput = document.getElementById("booking-end-date");
    const endTimeInput = document.getElementById("booking-end-time");
    const saveBtn = document.querySelector(".change-booking .btn-primary");

    const name = nameInput?.value?.trim();
    const desc = descInput?.value?.trim() || "";
    const dateStr = dateInput?.value;
    const startTimeStr = startTimeInput?.value;
    const endDateStr = endDateInput?.value;
    const endTimeStr = endTimeInput?.value;

    // Convert to timestamps
    const startDate = dateTimeToTimestamp(dateStr, startTimeStr);
    const endDate = dateTimeToTimestamp(endDateStr, endTimeStr);

    // Validate booking data
    const validationError = validateBookingDataWithDates({
      name,
      startDate,
      endDate,
      desc,
    });

    if (validationError) {
      showError(validationError);
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvestamine...";
    }

    // Prepare update data (preserve bookerId and room)
    const updateData = {
      name: name,
      desc: desc,
      startDate: startDate,
      endingDate: endDate,
      updatedAt: serverTimestamp(),
    };

    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, updateData);

    // Redirect back to booking view
    window.location.href = `/booking/view/?id=${bookingId}`;
  } catch (error) {
    console.error("Error updating booking:", error);
    showError("Viga broneeringu uuendamisel: " + error.message);

    const saveBtn = document.querySelector(".change-booking .btn-primary");
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Muuda broneeringut";
    }
  }
}

async function deleteBooking(bookingId) {
  const nameInput = document.getElementById("booking-name");
  const bookingName = nameInput?.value || "see broneering";

  const confirmed = confirm(
    `Kindel, et soovid tühistada broneeringu "${bookingName}"?`
  );

  if (!confirmed) {
    return;
  }

  try {
    const deleteBtn = document.getElementById("cancel-booking");

    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Tühistamine...";
    }

    const bookingRef = doc(db, "bookings", bookingId);
    await deleteDoc(bookingRef);

    // Redirect to cancelled page
    window.location.href = "/booking/cancelled/";
  } catch (error) {
    console.error("Error deleting booking:", error);
    showError("Viga broneeringu tühistamisel: " + error.message);

    const deleteBtn = document.getElementById("cancel-booking");
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Tühista broneering";
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBookingChange);
} else {
  initBookingChange();
}
