import { collection, doc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase.js";

// Utility: check if room is currently booked (there is a booking covering 'now')
async function isRoomBookedNow(roomId) {
  try {
    const roomRef = doc(db, "rooms", roomId);
    const now = new Date();
    const bookingsRef = collection(db, "bookings");
    const q1 = query(bookingsRef, where("room", "==", roomRef));
    const snap = await getDocs(q1);
    for (const d of snap.docs) {
      const data = d.data();
      const start = data.startDate ? data.startDate.toDate() : null;
      const end = data.endingDate ? data.endingDate.toDate() : null;
      if (start && end && start <= now && now <= end) return true;
    }
    return false;
  } catch (err) {
    console.error("Error checking room bookings:", err);
    return false;
  }
}

// Render rooms into the given container
function renderRooms(container, rooms) {
  container.innerHTML = "";
  if (!rooms || rooms.length === 0) {
    container.innerHTML = `<p class="empty-list">Ruume ei leitud.</p>`;
    return;
  }

  rooms.forEach((r) => {
    const card = document.createElement("div");
    card.className =
      "room-card info_my_bookings" +
      (r.availableNow ? " available" : r.bookedNow ? " booked" : "");

    // Media
    const media = document.createElement("div");
    media.className = "media";
    const img = document.createElement("img");
    img.src = r.imageUrl || "/assets/MURG.jpg";
    img.alt = r.name || "Ruumi pilt";
    media.appendChild(img);
    const capacityBadge = document.createElement("div");
    capacityBadge.className = "capacity-badge";
    capacityBadge.textContent = r.capacity ? String(r.capacity) : "";
    media.appendChild(capacityBadge);

    // Details
    const details = document.createElement("div");
    details.className = "details text_content";

    const titleRow = document.createElement("div");
    titleRow.className = "title-row";
    const title = document.createElement("p");
    title.className = "title";
    title.textContent = r.name || "Ruumi nimi";
    const capTop = document.createElement("div");
    capTop.className = "capacity-topright";
    capTop.textContent = r.capacity ? String(r.capacity) : "";
    titleRow.appendChild(title);
    titleRow.appendChild(capTop);

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = r.location || "";

    const status = r.availableNow
      ? "available"
      : r.bookedNow
        ? "booked"
        : "unavailable";
    const statusEl = document.createElement("p");
    statusEl.className = "status-pill";
    if (status === "available") {
      const dot = document.createElement("span");
      dot.className = "dot available";
      statusEl.appendChild(dot);
      statusEl.appendChild(document.createTextNode("Praegu saadaval"));
    }

    const action = document.createElement("a");
    action.className = "action btn btn-primary";
    // In the main rooms list every card should offer the same primary action
    // label. 'Ava broneering' is reserved for the My Bookings area.
    action.textContent = "Broneeri";
    action.href = `/room/?id=${r.id}`;

    details.appendChild(titleRow);
    details.appendChild(desc);
    if (status === "available") {
      details.appendChild(statusEl);
    }
    details.appendChild(action);

    card.appendChild(media);
    card.appendChild(details);

    container.appendChild(card);
  });
}

// Render user's bookings into my bookings container
function renderMyBookings(container, bookings, roomsById) {
  container.innerHTML = "";
  if (!bookings || bookings.length === 0) {
    // Keep it empty as requested (no placeholder), but you can uncomment a small note
    // container.innerHTML = `<p class="empty-list">Sul ei ole broneeringuid.</p>`;
    return;
  }

  bookings.forEach((b) => {
    const roomRef = b.room;
    const roomId = roomRef && roomRef.id ? roomRef.id : b.roomId || null;
    const room = roomId ? roomsById[roomId] : null;

    const card = document.createElement("div");
    card.className = "room-card info_my_bookings booked";

    const media = document.createElement("div");
    media.className = "media";
    const img = document.createElement("img");
    img.src = (room && room.imageUrl) || "/assets/MURG.jpg";
    img.alt = (room && room.name) || b.name || "Broneering";
    media.appendChild(img);
    const capacityBadge = document.createElement("div");
    capacityBadge.className = "capacity-badge";
    capacityBadge.textContent =
      room && room.capacity ? String(room.capacity) : "";
    media.appendChild(capacityBadge);

    const details = document.createElement("div");
    details.className = "details text_content";
    const titleRow = document.createElement("div");
    titleRow.className = "title-row";
    const title = document.createElement("p");
    title.className = "title";
    title.textContent = room ? room.name : b.name || "Broneering";
    const capTop = document.createElement("div");
    capTop.className = "capacity-topright";
    capTop.textContent = room && room.capacity ? String(room.capacity) : "";
    titleRow.appendChild(title);
    titleRow.appendChild(capTop);

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = room ? room.location : b.desc || "";

    const action = document.createElement("a");
    action.className = "action btn btn-success";
    action.textContent = "Ava";
    action.href = `/booking/view/?id=${b.id}`;

    details.appendChild(titleRow);
    details.appendChild(desc);
    // booked card: show booked label (optional)
    details.appendChild(action);

    card.appendChild(media);
    card.appendChild(details);

    container.appendChild(card);
  });
}

async function load() {
  try {
    const roomsGrid = document.querySelectorAll(".new_booking .rooms-grid")[0];
    const myBookingsGrid = document.querySelectorAll(
      ".my_bookings .rooms-grid"
    )[0];
    const myBookingsSection = document.querySelectorAll(".my_bookings")[0];
    if (!roomsGrid) return;

    // Create spinner elements and helper functions
    function makeSpinner() {
      const s = document.createElement("div");
      s.className = "spinner";
      const loader = document.createElement("div");
      loader.className = "loader";
      s.appendChild(loader);
      return s;
    }

    let roomsSpinner = makeSpinner();
    let bookingsSpinner = makeSpinner();
    // show spinner while loading
    roomsGrid.appendChild(roomsSpinner);
    if (myBookingsGrid) myBookingsGrid.appendChild(bookingsSpinner);

    // Load rooms
    const roomsSnap = await getDocs(collection(db, "rooms"));
    const rooms = [];
    const roomsById = {};
    for (const d of roomsSnap.docs) {
      const data = d.data();
      const id = d.id;
      const roomObj = { id, ...data };
      roomsById[id] = roomObj;
      rooms.push(roomObj);
    }

    // For each room, compute availability concurrently (but not too many parallel operations)
    const checks = rooms.map(async (r) => {
      const booked = await isRoomBookedNow(r.id);
      r.bookedNow = booked;
      r.availableNow = !booked;
      return r;
    });
    await Promise.all(checks);

    // Keep a master copy of rooms for filtering
    const allRooms = rooms.slice();

    // Render rooms (only rooms that exist)
    renderRooms(roomsGrid, allRooms);
    // remove spinner after render
    try {
      roomsGrid.removeChild(roomsSpinner);
    } catch {
      /* ignore */
    }

    // Attach filter UI listeners (name search, floor select, available now)
    try {
      const searchInput = document.querySelector(".new_booking .search-input");
      const floorSelect = document.querySelector(".new_booking .floor-select");
      const availableCheckbox = document.querySelector(
        ".new_booking .available-checkbox"
      );

      function mapFloorValue(val) {
        if (!val || val === "any") return null;
        if (val === "1_floor") return "1. korrus";
        if (val === "2_floor") return "2. korrus";
        if (val === "3_floor") return "3. korrus";
        return null;
      }

      function applyFilters() {
        const q = ((searchInput && searchInput.value) || "")
          .trim()
          .toLowerCase();
        const floorVal = floorSelect ? mapFloorValue(floorSelect.value) : null;
        const availOnly = availableCheckbox ? availableCheckbox.checked : false;

        const filtered = allRooms.filter((r) => {
          // name search
          if (q) {
            const name = (r.name || "").toLowerCase();
            if (!name.includes(q)) return false;
          }
          // floor filter (room.location contains floor string)
          if (floorVal) {
            const loc = (r.location || "").toLowerCase();
            if (!loc.includes(floorVal.toLowerCase())) return false;
          }
          // available now
          if (availOnly) {
            if (!r.availableNow) return false;
          }
          return true;
        });

        renderRooms(roomsGrid, filtered);
      }

      if (searchInput) searchInput.addEventListener("input", applyFilters);
      if (floorSelect) floorSelect.addEventListener("change", applyFilters);
      if (availableCheckbox)
        availableCheckbox.addEventListener("change", applyFilters);
    } catch (e) {
      // non-fatal: if filter wiring fails, just continue
      console.warn("Could not attach filters:", e);
    }

    // now render user's bookings
    const user = auth.currentUser;
    if (myBookingsGrid && myBookingsSection && user) {
      // query bookings where bookerId == user.uid
      const q = query(
        collection(db, "bookings"),
        where("bookerId", "==", user.uid)
      );
      const bookingSnap = await getDocs(q);
      const now = new Date();
      // map bookings and filter out those that have already ended
      const bookings = bookingSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((b) => {
          if (b.recurringBookingRef) return false;
          try {
            const end = b.endingDate ? b.endingDate.toDate() : null;
            // keep booking if it has no end time or its end is in the future
            return !end || end > now;
          } catch {
            return true;
          }
        });
      if (!bookings || bookings.length === 0) {
        // hide the whole My Bookings section when there are no active bookings
        myBookingsSection.style.display = "none";
      } else {
        myBookingsSection.style.display = "block";
        renderMyBookings(myBookingsGrid, bookings, roomsById);
      }
      try {
        if (myBookingsGrid && bookingsSpinner.parentNode)
          myBookingsGrid.removeChild(bookingsSpinner);
      } catch {
        /* ignore */
      }
    } else if (myBookingsGrid && !user) {
      // no user: hide the whole My Bookings section
      if (myBookingsSection) myBookingsSection.style.display = "none";
      try {
        if (bookingsSpinner.parentNode)
          myBookingsGrid.removeChild(bookingsSpinner);
      } catch {
        /* ignore */
      }
    }
  } catch (err) {
    console.error("Error loading rooms:", err);
    // ensure spinners are removed on error
    try {
      const rg = document.querySelectorAll(".new_booking .rooms-grid")[0];
      if (rg) rg.querySelectorAll(".spinner").forEach((n) => n.remove());
    } catch {
      /* ignore */
    }
    try {
      const mg = document.querySelectorAll(".my_bookings .rooms-grid")[0];
      if (mg) mg.querySelectorAll(".spinner").forEach((n) => n.remove());
    } catch {
      /* ignore */
    }
  }
}

// Wait for auth to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // small delay to let auth-guard set currentUser; alternatively rely on onAuthStateChanged
    setTimeout(load, 150);
  });
} else {
  setTimeout(load, 150);
}

export default load;
