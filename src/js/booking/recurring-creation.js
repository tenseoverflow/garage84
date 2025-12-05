import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { showError } from "../utils/banners.js";
import { initRecurringForm } from "./recurring-form.js";
import {
  createBookingDateTime,
  validateRecurringBookingData,
} from "./recurring-validation.js";

function getRoomIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("roomId") || urlParams.get("id");
}

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

      const roomImageElem = document.getElementById("room-image");
      if (roomImageElem && roomData.imageUrl) {
        roomImageElem.src = roomData.imageUrl;
        roomImageElem.alt = `Pilt ruumist ${roomData.name}`;
      }

      document.title = `Korduv broneering: ${roomData.name || "Ruum"}`;

      const navbar = document.querySelector("app-navbar");
      if (navbar) {
        navbar.setAttribute(
          "title",
          `Korduv broneering: ${roomData.name || "Ruum"}`
        );
      }

      return roomData;
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
    return null;
  }
}

async function fetchRoomBookings(roomRef) {
  try {
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("room", "==", roomRef)
    );
    const querySnapshot = await getDocs(bookingsQuery);
    const bookings = [];
    querySnapshot.forEach((docSnap) => {
      bookings.push({
        id: docSnap.id,
        ...docSnap.data(),
      });
    });
    return bookings;
  } catch (error) {
    console.error("Error fetching room bookings:", error);
    return [];
  }
}

async function createRecurringBooking(formValidator, roomId) {
  const nameInput = document.getElementById("booking-name");
  const descInput = document.getElementById("booking-description");
  const recurrenceTypeSelect = document.getElementById("recurrence-type");
  const startDateInput = document.getElementById("booking-start-date");
  const startTimeInput = document.getElementById("booking-start-time");
  const endTimeInput = document.getElementById("booking-end-time");
  const seriesEndDateInput = document.getElementById("booking-series-end-date");
  const submitBtn = document.getElementById("submit-btn");

  const name = nameInput?.value?.trim();
  const desc = descInput?.value?.trim() || "";
  const recurrenceType = recurrenceTypeSelect?.value;
  const startDateStr = startDateInput?.value;
  const startTime = startTimeInput?.value;
  const endTime = endTimeInput?.value;
  const seriesEndDateStr = seriesEndDateInput?.value;

  const validationErrors = validateRecurringBookingData({
    name,
    startDate: startDateStr,
    startTime,
    endTime,
    seriesEndDate: seriesEndDateStr,
    recurrenceType,
    desc,
    roomId,
  });

  if (validationErrors) {
    showError(validationErrors.join(", "));
    return;
  }

  const occurrences = formValidator.getOccurrences();
  if (occurrences.length === 0) {
    showError("Valitud vahemikus ei ole ühtegi broneeringut");
    return;
  }

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Loome broneeringuid...";
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error("Kasutaja pole sisse logitud");
    }

    const roomRef = doc(db, "rooms", roomId);

    const recurringBookingData = {
      name,
      desc,
      startTime,
      endTime,
      startDate: new Date(startDateStr),
      endDate: new Date(seriesEndDateStr),
      recurrenceType,
      room: roomRef,
      bookerId: user.uid,
      bookerName: user.displayName,
      bookerEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const recurringDocRef = await addDoc(
      collection(db, "recurringBookings"),
      recurringBookingData
    );

    const batch = writeBatch(db);
    const bookingsCollectionRef = collection(db, "bookings");

    for (const occurrenceDate of occurrences) {
      const startDateTime = createBookingDateTime(occurrenceDate, startTime);
      const endDateTime = createBookingDateTime(occurrenceDate, endTime);

      const bookingData = {
        name,
        desc,
        startDate: startDateTime,
        endingDate: endDateTime,
        room: roomRef,
        bookerId: user.uid,
        bookerName: user.displayName,
        bookerEmail: user.email,
        recurringBookingRef: recurringDocRef,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const newBookingRef = doc(bookingsCollectionRef);
      batch.set(newBookingRef, bookingData);
    }

    await batch.commit();

    window.location.href = `/room/?id=${roomId}`;
  } catch (error) {
    console.error("Error creating recurring booking:", error);
    showError("Viga korduvate broneeringute loomisel: " + error.message);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Loo korduvad broneeringud";
    }
  }
}

export function initRecurringCreation() {
  const form = document.querySelector(".new-booking");
  const roomId = getRoomIdFromUrl();

  if (!roomId) {
    showError("Ruumi ID puudub URL-is");
    setTimeout(() => {
      window.location.href = "/booking/";
    }, 2000);
    return;
  }

  let formValidator = initRecurringForm([]);

  loadRoomInfo(roomId).then(async () => {
    const roomRef = doc(db, "rooms", roomId);
    const existingBookings = await fetchRoomBookings(roomRef);

    formValidator = initRecurringForm(existingBookings);

    const calendar = document.querySelector("app-calendar");
    if (calendar) {
      calendar.bookings = existingBookings;
    }
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!formValidator.validate()) {
        return;
      }

      await createRecurringBooking(formValidator, roomId);
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRecurringCreation);
} else {
  initRecurringCreation();
}
