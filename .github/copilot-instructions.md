# Copilot Instructions for garage84

Room booking system for educational institutions. Vanilla JS Multi-Page Application with Firebase backend and Cloudflare R2 storage.

## Development Commands

```bash
bun i -D              # Install dependencies
bun dev               # Start dev server (localhost:3000)
bun build             # Build for production (outputs to dist/)
bun lint              # Run ESLint
bun format            # Format with Prettier
```

**Note:** Uses Bun runtime, not npm/pnpm. Vite config auto-discovers all `index.html` files as entry points.

## Architecture Overview

### Multi-Page Application Structure

- **No client-side routing**: Each HTML page is a separate Vite entry point
- **Traditional navigation**: Use `window.location.href` for page transitions, never SPAs
- **Vite MPA setup**: `vite.config.js` recursively scans `src/` for all `index.html` files

### Data Flow: Firebase References Pattern

**Critical**: Firestore stores document references, not IDs. Always use `doc()` references:

```javascript
// CORRECT: Store reference
const roomRef = doc(db, "rooms", roomId);
const bookingData = { room: roomRef /* ... */ };

// Query by reference
const bookingsQuery = query(
  collection(db, "bookings"),
  where("room", "==", roomRef)
);

// Expand references when needed
const roomSnap = await getDoc(booking.room); // booking.room is a DocumentReference
```

### Timestamp Handling (Critical Pattern)

Firestore Timestamps must be converted before use. Two-way conversions are common:

```javascript
// Storage: JS Date → Firestore
import { serverTimestamp } from "firebase/firestore";
const data = {
  startDate: new Date(2025, 0, 1, 9, 0), // Store as Date object
  createdAt: serverTimestamp(), // Server-generated timestamp
};

// Retrieval: Firestore → JS Date
const startDate = booking.startDate.toDate(); // Firestore Timestamp → Date
const formatted = startDate.toLocaleDateString("et-EE");

// Form binding: Date ↔ Input string
function dateTimeToTimestamp(dateStr, timeStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function timestampToDateInput(timestamp) {
  const date = timestamp.toDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
```

**See**: `booking-creation.js`, `booking-change.js` for complete examples.

## Firestore Data Model

### Collections

```javascript
// rooms collection
{
  name: string,
  location: string,
  capacity: number,
  imageUrl: string,  // Cloudflare R2 public URL
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// bookings collection
{
  name: string,
  desc: string,
  startDate: Date,      // JavaScript Date object (not Timestamp!)
  endingDate: Date,     // Note: "endingDate" not "endDate"
  room: DocumentReference,  // Reference to rooms/{roomId}
  bookerId: string,     // User UID
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Critical**: Always check for booking conflicts before creating/updating. See `hasBookingConflict()` in `booking-validation.js`.

## Authentication Flow

### Route Protection Pattern

```javascript
// auth-guard.js - Include at top of protected pages
import "./js/auth-guard.js"; // Redirects if not authenticated

// Flow: unauthenticated → /login/
//       unverified email → /verify/
//       verified → page loads
```

### Auth State

```javascript
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";

onAuthStateChanged(auth, (user) => {
  if (user?.emailVerified) {
    // Authenticated logic
  }
});
```

**All user-facing text must be in Estonian (et-EE)**.

## Feature-Specific Patterns

### Form Handling (3-File Pattern)

Every form follows this structure:

1. **`*-validation.js`**: Pure validation functions
   - Export functions that return error strings or null
   - Example: `validateBookingData({ name, startDate, ... })`

2. **`*-form.js`**: UI logic and event listeners
   - Initialize form inputs with defaults
   - Real-time validation feedback
   - Summary/preview updates

3. **`*-creation.js` or `*-change.js`**: Submit handlers
   - Call validation
   - **Check for conflicts** (bookings only)
   - Firebase operations
   - Redirect on success

**Example**: `booking-validation.js` → `booking-form.js` → `booking-creation.js`

### Web Components (No Shadow DOM)

```javascript
class AppCalendar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<div>...</div>`; // Direct DOM, no shadow
  }

  set bookings(value) {
    this._bookings = value;
    this.render(); // Manual re-render
  }
}
customElements.define("app-calendar", AppCalendar);
```

**Components**: `<app-navbar>`, `<app-calendar>`, `<room-card>`. Global styles in `css/components/`.

### Cloudflare R2 Image Upload

```javascript
// 1. Upload via Worker
import { uploadImageToR2 } from "./utils/r2-upload.js";
const imageUrl = await uploadImageToR2(file); // Returns public URL

// 2. Store URL in Firestore
const roomData = { imageUrl /* ... */ };
await addDoc(collection(db, "rooms"), roomData);
```

**Worker**: `functions/get-upload-url.js` handles CORS and uploads. No presigned URLs—direct POST to Worker.

## Booking Conflict Detection

**Must call before creating/updating bookings**:

```javascript
import { hasBookingConflict } from "./booking-validation.js";
import { fetchRoomBookings } from "./booking.js";

const roomRef = doc(db, "rooms", roomId);
const existingBookings = await fetchRoomBookings(roomRef);

if (hasBookingConflict(existingBookings, newStartDate, newEndDate)) {
  throw new Error(
    "Sellel ajal on ruum juba broneeritud. Palun vali teine aeg."
  );
}

// For updates, exclude current booking:
if (
  hasBookingConflict(
    existingBookings,
    newStartDate,
    newEndDate,
    currentBookingId
  )
) {
  // conflict
}
```

Algorithm checks time range overlaps: `start1 < end2 && start2 < end1`.

## Error Handling

```javascript
import { showError } from "./utils/banners.js";

try {
  await createBooking();
} catch (error) {
  console.error("Technical details:", error); // Debug info
  showError("Viga broneeringu loomisel: " + error.message); // User-friendly Estonian
}
```

## Estonian Localization

- **All UI text in Estonian**: Buttons, labels, errors, validation messages
- **Date formatting**: `toLocaleDateString("et-EE")`, `toLocaleTimeString("et-EE")`
- **Relative dates**: "täna", "homme", "eile", "ülehomme"
- **Code/variables in English**: Internal logic uses English naming

## Code Style & Principles

- No comments! Code should be self-explanatory through clear naming
- Follow DRY (Don't Repeat Yourself) - extract reusable logic into functions/modules
- Follow KISS (Keep It Simple, Stupid) - prefer simple, straightforward solutions
- Skip README files unless explicitly requested
- Use JSDoc comments for functions, classes, and complex types
- The code uses Prettier and ESLint for formatting and linting. Do not fret if Prettier gives errors, the user will handle that.

## What NOT to Do

- ❌ COMMENTS (add only JSDOC where needed)
- ❌ Use React/Vue/Svelte—this is vanilla JS
- ❌ Client-side routing libraries
- ❌ Shadow DOM in web components
- ❌ Store Firestore document IDs instead of references
- ❌ Skip booking conflict checks
- ❌ Obvious comments (`// increment counter`)
- ❌ Forget `timestamp.toDate()` conversions

## Key Files Reference

- **`firebase.js`**: Firebase initialization, exports `auth`, `db`
- **`auth-guard.js`**: Include in protected pages for auth check
- **`booking-validation.js`**: Validation + conflict detection
- **`booking-creation.js`**: Booking create flow with conflict check
- **`utils/banners.js`**: `showError()` for user notifications
- **`vite.config.js`**: MPA entry point discovery logic
