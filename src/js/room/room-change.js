import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { showError } from "../utils/banners.js";
import { uploadImageToR2 } from "../utils/r2-upload.js";
import { validateRoomData } from "./room-validation.js";
import { fetchRoom, getRoomIdFromUrl } from "./room.js";

export function initRoomChange() {
  const roomId = getRoomIdFromUrl();

  if (!roomId) {
    window.location.href = "/";
    return;
  }

  const deleteBtn = document.querySelector(".btn-danger");
  const saveBtn = document.querySelector(".btn-success");
  const addRecurringLink = document.getElementById("add-recurring-link");

  loadRoomData(roomId);
  loadRecurringBookings(roomId);

  if (addRecurringLink) {
    addRecurringLink.href = `/booking/recurring/?id=${roomId}`;
  }

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
    const roomImageElem = document.getElementById("room-image-preview");
    const deleteBtn = document.querySelector(".btn-danger");

    if (nameInput) nameInput.value = "Laadimine...";
    if (locationInput) locationInput.value = "";
    if (capacityInput) capacityInput.value = "";
    if (descriptionInput) descriptionInput.value = "";

    const { data: roomData } = await fetchRoom(roomId);

    document.title = `Muuda ${roomData.name || "tuba"}`;

    if (nameInput) nameInput.value = roomData.name || "";

    if (locationInput) {
      const allowed = ["1. korrus", "2. korrus", "3. korrus"];
      let loc = roomData.location || "";
      if (loc && !allowed.includes(loc)) {
        const m = String(loc).match(/\b([1-3])\b/);
        if (m) loc = `${m[1]}. korrus`;
      }

      // Rebuild the select options from scratch to avoid any malformed DOM
      while (locationInput.firstChild) {
        locationInput.removeChild(locationInput.firstChild);
      }

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Vali korrus";
      placeholder.disabled = true;
      placeholder.selected = true;
      locationInput.appendChild(placeholder);

      allowed.forEach((val) => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        locationInput.appendChild(opt);
      });

      // Select matching option if possible
      const match = Array.from(locationInput.options).find(
        (o) => o.value.trim() === String(loc).trim()
      );
      if (match) {
        match.selected = true;
      } else {
        // leave placeholder selected
        locationInput.selectedIndex = 0;
      }
    }
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

function formatRecurrenceType(type) {
  switch (type) {
    case "daily":
      return "Iga päev";
    case "weekly":
      return "Iga nädal";
    case "monthly":
      return "Iga kuu";
    default:
      return type;
  }
}

function formatDate(date) {
  return date.toLocaleDateString("et-EE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function loadRecurringBookings(roomId) {
  const listEl = document.getElementById("recurring-bookings-list");
  if (!listEl) return;

  try {
    const roomRef = doc(db, "rooms", roomId);
    const recurringQuery = query(
      collection(db, "recurringBookings"),
      where("room", "==", roomRef)
    );
    const querySnapshot = await getDocs(recurringQuery);

    if (querySnapshot.empty) {
      listEl.innerHTML =
        '<li style="color: #666; font-style: italic">Korduvaid sündmusi pole lisatud.</li>';
      return;
    }

    listEl.innerHTML = "";

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement("li");
      li.style.cssText =
        "padding: 0.75rem; background: #f5f5f5; border-radius: 4px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;";

      const startDate = data.startDate?.toDate
        ? data.startDate.toDate()
        : new Date(data.startDate);
      const endDate = data.endDate?.toDate
        ? data.endDate.toDate()
        : new Date(data.endDate);

      const info = document.createElement("div");
      info.innerHTML = `
        <strong>${data.name || "Nimetu sündmus"}</strong><br>
        <span style="font-size: 0.85rem; color: #666">
          ${formatRecurrenceType(data.recurrenceType)} kell ${data.startTime} - ${data.endTime}<br>
          ${formatDate(startDate)} - ${formatDate(endDate)}
        </span>
      `;

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Kustuta";
      deleteBtn.className = "btn btn-small btn-danger";
      deleteBtn.style.cssText = "padding: 0.25rem 0.5rem; font-size: 0.8rem;";
      deleteBtn.addEventListener("click", async () => {
        if (
          confirm(
            `Kustutada "${data.name}" ja kõik sellega seotud broneeringud?`
          )
        ) {
          await deleteRecurringBooking(docSnap.id, roomId);
        }
      });

      li.appendChild(info);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  } catch (error) {
    console.error("Error loading recurring bookings:", error);
    listEl.innerHTML =
      '<li style="color: red">Viga korduvate sündmuste laadimisel.</li>';
  }
}

async function deleteRecurringBooking(recurringId, roomId) {
  try {
    const recurringRef = doc(db, "recurringBookings", recurringId);

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("recurringBookingRef", "==", recurringRef)
    );
    const querySnapshot = await getDocs(bookingsQuery);

    const batch = writeBatch(db);

    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    batch.delete(recurringRef);

    await batch.commit();

    loadRecurringBookings(roomId);
  } catch (error) {
    console.error("Error deleting recurring booking:", error);
    showError("Viga korduva sündmuse kustutamisel: " + error.message);
  }
}

async function saveRoomData(roomId) {
  try {
    const nameInput = document.getElementById("room-name");
    const locationInput = document.getElementById("room-location");
    const capacityInput = document.getElementById("room-capacity");
    const imageInput = document.getElementById("room-image-input");
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
      try {
        const { data: oldRoomData } = await fetchRoom(roomId);
        const oldImageUrl = oldRoomData.imageUrl;

        const newImageUrl = await uploadImageToR2(imageInput.files[0]);
        updateData.imageUrl = newImageUrl;

        if (oldImageUrl && oldImageUrl.startsWith("http")) {
          try {
            const urlParts = oldImageUrl.split("/");
            const filename = `rooms/${urlParts[urlParts.length - 1]}`;

            console.log("Deleting old image:", filename);

            const deleteResponse = await fetch(
              `https://broken-cell-ff16.tense.workers.dev/?filename=${encodeURIComponent(filename)}`,
              { method: "DELETE" }
            );

            if (deleteResponse.ok) {
              console.log("Old image deleted successfully");
            } else {
              console.warn(
                "Could not delete old image:",
                await deleteResponse.text()
              );
            }
          } catch (deleteError) {
            console.warn("Could not delete old image:", deleteError);
          }
        }
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        showError("Viga pildi üleslaadmisel: " + uploadError.message);

        if (saveBtn) {
          saveBtn.disabled = false;
        }
        return;
      }
    }

    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, updateData);

    if (
      document.referrer &&
      document.referrer.includes(window.location.hostname)
    ) {
      window.location.href = document.referrer;
    } else {
      window.location.href = `/room/?id=${roomId}`;
    }
  } catch (error) {
    console.error("Error updating room:", error);
    showError("Viga ruumi uuendamisel: " + error.message);

    const saveBtn = document.querySelector(".btn-success");
    if (saveBtn) {
      saveBtn.disabled = false;
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
    const { data: oldRoomData } = await fetchRoom(roomId);
    await deleteDoc(roomRef);

    const params = new URLSearchParams();
    params.set("id", roomId);
    if (oldRoomData && oldRoomData.name) {
      params.set("name", oldRoomData.name);
    }
    if (oldRoomData && oldRoomData.imageUrl) {
      params.set("image", oldRoomData.imageUrl);
    }

    window.location.href = `/room/deleted/?${params.toString()}`;
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
