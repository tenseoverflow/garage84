# Copilot Instructions for garage84

## Project Overview

**garage84** is a room booking system for educational institutions built with:

- **Frontend:** Vanilla JavaScript, HTML, CSS (no frameworks)
- **Build Tool:** Vite (Multi-Page Application setup) with Bun runtime
- **Backend:** Firebase (Authentication, Firestore database)
- **Storage:** Cloudflare R2 for image uploads
- **Deployment:** GitLab Pages with CI/CD

## Project Structure

```
src/
├── index.html                 # Landing page
├── booking/                   # Booking management pages
│   ├── index.html            # User's bookings list
│   ├── new/                  # Create new booking
│   ├── view/                 # View booking details
│   ├── confirmed/            # Booking success page
│   └── cancelled/            # Booking cancellation page
├── room/                      # Room management pages
│   ├── index.html            # View room with calendar
│   ├── new/                  # Create new room
│   └── change/               # Edit existing room
├── login/, signup/, verify/  # Authentication pages
├── settings/                  # User settings
├── privacy/                   # Privacy policy page
├── qr/                       # QR code scanner
├── js/
│   ├── auth-*.js             # Authentication logic
│   ├── firebase.js           # Firebase initialization
│   ├── auth-guard.js         # Route protection
│   ├── booking/              # Booking business logic
│   │   ├── booking.js        # Core booking functions
│   │   ├── booking-form.js   # Form initialization
│   │   ├── booking-creation.js
│   │   ├── booking-change.js
│   │   └── booking-validation.js
│   ├── room/                 # Room business logic
│   │   ├── room.js           # Core room functions
│   │   ├── room-creation.js
│   │   ├── room-change.js
│   │   └── room-validation.js
│   ├── components/           # Reusable web components
│   │   ├── navbar.js         # <app-navbar> custom element
│   │   ├── room-card.js      # <room-card> custom element
│   │   ├── calendar.js       # <app-calendar> custom element
│   │   └── confetti.js       # Confetti animation
│   └── utils/                # Utility functions
│       ├── banners.js        # Error/success messages
│       └── r2-upload.js      # Cloudflare R2 integration
├── css/
│   ├── style.css             # Main CSS (imports all others)
│   ├── base.css              # Base styles & CSS variables
│   ├── layout.css            # Layout utilities
│   ├── components/           # Component-specific styles
│   └── pages/                # Page-specific styles
└── public/
    └── assets/               # Static images

functions/                     # Cloudflare Workers
└── get-upload-url.js         # R2 presigned URL generator
```

## Architecture Patterns

### Multi-Page Application (MPA)

- Each HTML page is a separate entry point
- Vite builds multiple bundles automatically
- No client-side routing - traditional navigation

### Web Components

- Custom elements used for reusable UI: `<app-navbar>`, `<app-calendar>`, `<room-card>`
- Lifecycle methods: `connectedCallback()`, `attributeChangedCallback()`
- No shadow DOM - styles are global

### Firebase Integration

- **Authentication:** Email/password with email verification required
- **Firestore Collections:**
  - `rooms` - Room data with references to images in R2
  - `bookings` - Booking data with references to rooms and users
- **Security:** `auth-guard.js` protects authenticated routes

### Modular JavaScript

- ES modules with explicit imports/exports
- Separation by feature: booking/, room/, components/, utils/
- Shared utilities for common operations (validation, formatting, error handling)

### Form Handling Pattern

All forms follow this structure:

1. **Validation module** - Pure functions that validate data
2. **Form initialization** - Set up event listeners and UI
3. **Creation/Change module** - Handle submit, call Firebase, redirect

### State Management

- No global state management library
- Firebase `onAuthStateChanged` for auth state
- URL query parameters for page context (e.g., `?id=roomId`)
- Direct DOM manipulation for UI updates

## Code Style & Principles

- Follow DRY (Don't Repeat Yourself) - extract reusable logic into functions/modules
- Follow KISS (Keep It Simple, Stupid) - prefer simple, straightforward solutions
- Avoid redundant comments - code should be self-explanatory through clear naming
- Skip README files unless explicitly requested
- Use JSDoc comments for functions, classes, and complex types
- Prefer descriptive variable and function names over explanatory comments

## JSDoc Guidelines

- Document function parameters, return types, and purpose
- Include `@param`, `@returns`, and `@throws` tags where applicable
- Add brief descriptions for non-obvious logic
- Example:
  ```javascript
  /**
   * Calculates user engagement score
   * @param {Object} user - User object with activity data
   * @param {number} timeframeMs - Timeframe in milliseconds
   * @returns {number} Engagement score between 0-100
   */
  ```

## Language & Localization

- **UI Language:** Estonian (et-EE)
- All user-facing text, error messages, and labels are in Estonian
- Date/time formatting uses Estonian locale
- Variable names and code comments can be in English

## Common Patterns

### Fetching Data from Firestore

```javascript
const docRef = doc(db, "collection", "docId");
const docSnap = await getDoc(docRef);
if (!docSnap.exists()) throw new Error("Not found");
return { id: docSnap.id, data: docSnap.data() };
```

### Timestamp Handling

- Firebase uses Firestore Timestamps
- Convert with `timestamp.toDate()` before formatting
- Use `serverTimestamp()` when creating/updating documents

### Error Handling

- Use `showError(message)` from `utils/banners.js` to display errors
- Catch Firebase errors and show user-friendly Estonian messages
- Log technical errors to console for debugging

### Image Uploads

- Get presigned URL from Cloudflare Worker
- Upload directly to R2 from browser
- Store only the public URL in Firestore

## What to Avoid

- Obvious comments like `// increment counter`
- Redundant documentation files
- Over-engineering simple solutions
- Repeating similar code blocks - refactor instead
- Using frontend frameworks (React, Vue, etc.) - this is vanilla JS
- Client-side routing libraries - use native navigation

## When to Add Context

- Complex algorithms or business logic
- Public APIs and exported functions
- Non-obvious performance optimizations
- Security-sensitive code sections
- Firebase Firestore queries with complex logic
- Date/time manipulation functions
