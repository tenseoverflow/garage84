/**
 * Validate booking form data
 * @param {object} data - Booking data to validate
 * @param {string} data.name - Booking name
 * @param {string} data.startDate - Start date (YYYY-MM-DD)
 * @param {string} data.endDate - End date (YYYY-MM-DD)
 * @param {string} data.startTime - Start time (HH:MM)
 * @param {string} data.endTime - End time (HH:MM)
 * @param {string} [data.desc] - Description (optional)
 * @param {string} [data.roomId] - Room ID (optional for validation)
 * @returns {string[]|null} Array of error messages or null if valid
 */
export function validateBookingData({
  name,
  startDate,
  endDate,
  startTime,
  endTime,
  desc = "",
  roomId = null,
}) {
  const errors = [];

  if (!name || !name.trim()) {
    errors.push("Palun sisesta nimi");
  }

  if (roomId !== null && !roomId) {
    errors.push("Ruumi ID puudub");
  }

  if (startDate) {
    const selectedDate = new Date(startDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (selectedDate < todayDate) {
      errors.push("Alguskuupäev ei saa olla minevikus");
    }
  }

  if (startDate && endDate) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (endDateObj < startDateObj) {
      errors.push("Lõppkuupäev ei saa olla enne alguskuupäeva");
    }
  }

  if (startTime && endTime && startDate && endDate && startDate === endDate) {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      errors.push("Lõppaeg peab olema pärast algusaega või vali järgmine päev");
    }
  }

  if (desc && desc.length > 500) {
    errors.push("Kirjeldus ei tohi olla pikem kui 500 tähemärki");
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Validate booking data with Date objects (for server-side validation)
 * @param {object} data - Booking data to validate
 * @param {string} data.name - Booking name
 * @param {Date} data.startDate - Start date as Date object
 * @param {Date} data.endDate - End date as Date object
 * @param {string} [data.desc] - Description (optional)
 * @param {string} [data.roomId] - Room ID (optional)
 * @returns {string|null} Error message or null if valid
 */
export function validateBookingDataWithDates({
  name,
  startDate,
  endDate,
  desc = "",
  roomId = null,
}) {
  if (!name || !name.trim()) {
    return "Palun sisesta broneeringu nimi";
  }

  if (roomId !== null && !roomId) {
    return "Ruumi ID puudub";
  }

  if (!startDate || !endDate) {
    return "Palun vali algus- ja lõppkuupäev";
  }

  if (endDate <= startDate) {
    return "Lõppaeg peab olema pärast algusaega";
  }

  if (desc && desc.length > 500) {
    return "Kirjeldus ei tohi olla pikem kui 500 tähemärki";
  }

  return null;
}
