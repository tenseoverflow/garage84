import { auth } from "../firebase.js";
import { showError } from "../utils/banners.js";
import { expandRoomReference, fetchBooking } from "./booking.js";

/**
 * Download booking as iCal file
 * @param {string} bookingId - The booking ID to download
 */
export async function icalDownload(bookingId) {
  try {
    const { data: bookingData } = await fetchBooking(bookingId);

    const user = auth.currentUser;
    const organizerName = user?.displayName || user?.email || "MURG";
    const organizerEmail = user?.email || "";

    const roomData = await expandRoomReference(bookingData);
    const location = roomData
      ? `${roomData.name}${roomData.location ? ", " + roomData.location : ""}`
      : "";

    // carriage return sheesh
    const now = new Date();
    const formatDate = (date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const created = bookingData.createdAt
      ? formatDate(bookingData.createdAt.toDate())
      : formatDate(now);
    const lastModified = bookingData.updatedAt
      ? formatDate(bookingData.updatedAt.toDate())
      : created;

    const icalContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Garage84//Broneerimissysteem//ET",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${bookingId}`,
      `DTSTAMP:${formatDate(now)}`,
      `DTSTART:${formatDate(bookingData.startDate.toDate())}`,
      `DTEND:${formatDate(bookingData.endingDate.toDate())}`,
      `CREATED:${created}`,
      `LAST-MODIFIED:${lastModified}`,
      `SUMMARY:${bookingData.name || "Broneering"}`,
      `DESCRIPTION:${bookingData.desc || ""}`,
      `LOCATION:${location}`,
      `ORGANIZER;CN=${organizerName}${organizerEmail ? `:MAILTO:${organizerEmail}` : ""}`,
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "TRANSP:OPAQUE",
      "CLASS:PUBLIC",
      roomData ? `CATEGORIES:${roomData.name}` : "CATEGORIES:Broneering",
      `URL;VALUE=URI:${window.location.origin}/booking/view/?id=${bookingId}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icalContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${bookingData.name || "booking"}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading iCal:", error);
    showError("Viga iCal faili allalaadimisel: " + error.message);
  }
}
