import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { showError } from "../utils/banners.js";

/**
 * Fetch a booking by ID from Firestore
 * @param {string} bookingId - The booking ID to fetch
 * @returns {Promise<{id: string, data: object}>} Booking data with ID
 * @throws {Error} If booking doesn't exist or fetch fails
 */
export async function fetchBooking(bookingId) {
  const bookingRef = doc(db, "bookings", bookingId);
  const bookingSnap = await getDoc(bookingRef);

  if (!bookingSnap.exists()) {
    throw new Error("Broneeringut ei leitud");
  }

  return {
    id: bookingSnap.id,
    data: bookingSnap.data(),
  };
}

/**
 * Get booking ID from URL query parameters
 * @returns {string|null} Booking ID or null if not present
 */
export function getBookingIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

/**
 * Expand room reference to fetch room data
 * @param {object} booking - Booking data with room reference
 * @returns {Promise<object>} Room data
 */
export async function expandRoomReference(booking) {
  if (!booking.room) {
    return null;
  }

  try {
    const roomSnap = await getDoc(booking.room);
    if (roomSnap.exists()) {
      return {
        id: roomSnap.id,
        ...roomSnap.data(),
      };
    }
  } catch (error) {
    console.error("Error fetching room:", error);
  }

  return null;
}

/**
 * Format Firestore timestamp to date string
 * @param {object} timestamp - Firestore timestamp
 * @returns {string} Formatted date
 */
function formatDate(timestamp) {
  if (!timestamp) return "-";
  try {
    const date = timestamp.toDate();
    return date.toLocaleDateString("et-EE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

/**
 * Format Firestore timestamp to time string
 * @param {object} timestamp - Firestore timestamp
 * @returns {string} Formatted time (HH:MM)
 */
function formatTime(timestamp) {
  if (!timestamp) return "-";
  try {
    const date = timestamp.toDate();
    return date.toLocaleTimeString("et-EE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

/**
 * Get relative day label (täna, homme, eile, etc.)
 * @param {object} timestamp - Firestore timestamp
 * @returns {string} Relative day label or empty string
 */
function getRelativeDay(timestamp) {
  if (!timestamp) return "";

  const inputDate = timestamp.toDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);

  const diffTime = inputDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "täna";
  if (diffDays === 1) return "homme";
  if (diffDays === -1) return "eile";
  if (diffDays === 2) return "ülehomme";

  return "";
}

/**
 * Format date with relative label
 * @param {object} timestamp - Firestore timestamp
 * @returns {string} Formatted date with relative label
 */
function formatDateWithRelative(timestamp) {
  if (!timestamp) return "-";

  const formatted = formatDate(timestamp);
  const relative = getRelativeDay(timestamp);

  if (relative) {
    return `${formatted} (${relative})`;
  }

  return formatted;
}

/**
 * Fetch all bookings for a room
 * @param {object} roomRef - Firestore room reference
 * @returns {Promise<Array>} Array of booking objects with id
 */
export async function fetchRoomBookings(roomRef) {
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

export function initBookingView() {
  const bookingId = getBookingIdFromUrl();

  if (!bookingId) {
    window.location.href = "/booking/";
    return;
  }

  const changeLink = document.getElementById("change-booking-link");
  if (changeLink) {
    changeLink.href = `/room/change/?id=${bookingId}`;
  }

  loadBookingData(bookingId);
}

async function loadBookingData(bookingId) {
  try {
    const bookingTitleElem = document.getElementById("booking-title");
    const bookingDescElem = document.getElementById("booking-desc");
    const bookingDateElem = document.getElementById("booking-date-display");
    const bookingTimeElem = document.getElementById("booking-time-display");
    const roomTitleElem = document.getElementById("room-title");
    const roomLocationElem = document.getElementById("room-location");
    const bookerNameElem = document.getElementById("booker-name");

    if (bookingTitleElem) bookingTitleElem.textContent = "Laadimine...";
    if (bookingDescElem) bookingDescElem.textContent = "";
    if (bookingDateElem) bookingDateElem.textContent = "";
    if (bookingTimeElem) bookingTimeElem.textContent = "";
    if (bookerNameElem) bookerNameElem.textContent = "";

    const { data: bookingData } = await fetchBooking(bookingId);

    const now = new Date();
    const endDate = bookingData.endingDate?.toDate();
    const isPast = endDate && endDate < now;

    const bookingName = bookingData.name || "Nimetu broneering";
    const titleWithTag = isPast ? `${bookingName} (Möödunud)` : bookingName;

    document.title = titleWithTag;

    if (bookingTitleElem) {
      bookingTitleElem.textContent = titleWithTag;
    }

    if (bookingDescElem) {
      bookingDescElem.textContent = bookingData.desc || "";
    }

    if (bookingDateElem) {
      const startDateFormatted = formatDateWithRelative(bookingData.startDate);
      const endDateFormatted = formatDateWithRelative(bookingData.endingDate);

      const startDate = bookingData.startDate?.toDate();
      const endDate = bookingData.endingDate?.toDate();

      if (startDate && endDate) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (startDate.getTime() === endDate.getTime()) {
          bookingDateElem.textContent = startDateFormatted;
        } else {
          bookingDateElem.textContent = `${startDateFormatted} - ${endDateFormatted}`;
        }
      }
    }

    if (bookingTimeElem) {
      const startTime = formatTime(bookingData.startDate);
      const endTime = formatTime(bookingData.endingDate);
      bookingTimeElem.textContent = `${startTime} - ${endTime}`;
    }

    if (bookerNameElem) {
      if (bookingData.bookerName || bookingData.bookerEmail) {
        bookerNameElem.textContent =
          bookingData.bookerName || bookingData.bookerEmail;
      } else {
        const currentUser = auth.currentUser;
        if (currentUser && bookingData.bookerId === currentUser.uid) {
          bookerNameElem.textContent =
            currentUser.displayName || currentUser.email || "Sina";
        } else {
          bookerNameElem.textContent = "Kasutaja";
        }
      }
    }

    const roomData = await expandRoomReference(bookingData);
    if (roomData) {
      if (roomTitleElem) {
        roomTitleElem.textContent = roomData.name || "Ruum";
      }
      if (roomLocationElem) {
        roomLocationElem.textContent = roomData.location || "";
      }

      const roomImageElem = document.getElementById("room-image");
      if (roomImageElem) {
        if (roomData.imageUrl) {
          roomImageElem.src = roomData.imageUrl;
          roomImageElem.alt = `Pilt ruumist ${roomData.name}`;
        } else {
          roomImageElem.alt = `Vaikepilt ruumist ${roomData.name}`;
        }
      }

      const changeRoomLink = document.getElementById("change-booking-link");
      if (changeRoomLink && roomData.id) {
        changeRoomLink.href = `/room/change/?id=${roomData.id}`;
      }

      const navbar = document.querySelector("app-navbar");
      if (navbar) {
        navbar.setAttribute("title", `${bookingData.name || "Broneering"}`);
      }

      const calendar = document.getElementById("booking-calendar");
      if (calendar && bookingData.room) {
        const roomBookings = await fetchRoomBookings(bookingData.room);
        calendar.bookings = roomBookings;
        calendar.currentBookingId = bookingId;
      }
    }

    const currentUser = auth.currentUser;
    const isOwner = currentUser && bookingData.bookerId === currentUser.uid;

    const toggleEditBtn = document.getElementById("toggle-edit-form");
    const changeRoomBtn = document.getElementById("change-booking-link");

    if (!isOwner) {
      if (toggleEditBtn) toggleEditBtn.style.display = "none";
      if (changeRoomBtn) changeRoomBtn.style.display = "none";
    }
  } catch (error) {
    console.error("Error loading booking:", error);
    showError("Viga broneeringu laadimisel: " + error.message);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBookingView);
} else {
  initBookingView();
}
