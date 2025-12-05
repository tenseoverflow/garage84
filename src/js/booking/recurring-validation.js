/**
 * @typedef {Object} RecurringBookingData
 * @property {string} name - Booking name
 * @property {string} startDate - Start date (YYYY-MM-DD)
 * @property {string} startTime - Start time (HH:MM)
 * @property {string} endTime - End time (HH:MM)
 * @property {string} seriesEndDate - Series end date (YYYY-MM-DD)
 * @property {string} recurrenceType - "daily" | "weekly" | "monthly"
 * @property {string} [desc] - Description (optional)
 * @property {string} [roomId] - Room ID (optional for validation)
 */

/**
 * Validate recurring booking form data
 * @param {RecurringBookingData} data - Recurring booking data to validate
 * @returns {string[]|null} Array of error messages or null if valid
 */
export function validateRecurringBookingData({
  name,
  startDate,
  startTime,
  endTime,
  seriesEndDate,
  recurrenceType,
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

  if (
    !recurrenceType ||
    !["daily", "weekly", "monthly"].includes(recurrenceType)
  ) {
    errors.push("Palun vali kordumise tüüp");
  }

  if (!startDate) {
    errors.push("Palun vali alguskuupäev");
  } else {
    const selectedDate = new Date(startDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (selectedDate < todayDate) {
      errors.push("Alguskuupäev ei saa olla minevikus");
    }
  }

  if (!seriesEndDate) {
    errors.push("Palun vali kordumise lõppkuupäev");
  }

  if (startDate && seriesEndDate) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(seriesEndDate);

    if (endDateObj < startDateObj) {
      errors.push("Kordumise lõppkuupäev ei saa olla enne alguskuupäeva");
    }
  }

  if (startTime && endTime) {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      errors.push("Lõppaeg peab olema pärast algusaega");
    }
  }

  if (desc && desc.length > 500) {
    errors.push("Kirjeldus ei tohi olla pikem kui 500 tähemärki");
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Generate all occurrence dates for a recurring booking
 * @param {string} startDateStr - Start date (YYYY-MM-DD)
 * @param {string} seriesEndDateStr - Series end date (YYYY-MM-DD)
 * @param {string} recurrenceType - "daily" | "weekly" | "monthly"
 * @returns {Date[]} Array of occurrence dates
 */
export function generateOccurrenceDates(
  startDateStr,
  seriesEndDateStr,
  recurrenceType
) {
  const occurrences = [];
  const startDate = new Date(startDateStr);
  const seriesEndDate = new Date(seriesEndDateStr);

  seriesEndDate.setHours(23, 59, 59, 999);

  let currentDate = new Date(startDate);

  const maxOccurrences = 365;
  let count = 0;

  while (currentDate <= seriesEndDate && count < maxOccurrences) {
    occurrences.push(new Date(currentDate));
    count++;

    switch (recurrenceType) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        return occurrences;
    }
  }

  return occurrences;
}

/**
 * Create full booking datetime from occurrence date and time string
 * @param {Date} occurrenceDate - The date of the occurrence
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {Date} Full datetime
 */
export function createBookingDateTime(occurrenceDate, timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const result = new Date(occurrenceDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Find conflicts between generated occurrences and existing bookings
 * @param {Array} existingBookings - Array of existing bookings
 * @param {Date[]} occurrenceDates - Array of occurrence dates
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @returns {Date[]} Array of conflicting dates
 */
export function findConflictingOccurrences(
  existingBookings,
  occurrenceDates,
  startTime,
  endTime
) {
  const conflicts = [];

  for (const occurrenceDate of occurrenceDates) {
    const newStartDate = createBookingDateTime(occurrenceDate, startTime);
    const newEndDate = createBookingDateTime(occurrenceDate, endTime);

    const hasConflict = existingBookings.some((booking) => {
      const existingStart = booking.startDate?.toDate
        ? booking.startDate.toDate()
        : booking.startDate;
      const existingEnd = booking.endingDate?.toDate
        ? booking.endingDate.toDate()
        : booking.endingDate;

      if (!existingStart || !existingEnd) {
        return false;
      }

      return newStartDate < existingEnd && existingStart < newEndDate;
    });

    if (hasConflict) {
      conflicts.push(occurrenceDate);
    }
  }

  return conflicts;
}

/**
 * Format recurrence type for display in Estonian
 * @param {string} recurrenceType - "daily" | "weekly" | "monthly"
 * @returns {string} Formatted recurrence type
 */
export function formatRecurrenceType(recurrenceType) {
  switch (recurrenceType) {
    case "daily":
      return "iga päev";
    case "weekly":
      return "iga nädal";
    case "monthly":
      return "iga kuu";
    default:
      return recurrenceType;
  }
}
