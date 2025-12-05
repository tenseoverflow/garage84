import {
  findConflictingOccurrences,
  formatRecurrenceType,
  generateOccurrenceDates,
  validateRecurringBookingData,
} from "./recurring-validation.js";

/**
 * @typedef {Object} RecurringFormValidator
 * @property {function(): boolean} validate - Validate the form
 * @property {function(): Date[]} getOccurrences - Get generated occurrence dates
 * @property {function(): Date[]} getConflicts - Get conflicting dates
 */

/**
 * Initialize the recurring booking form
 * @param {Array} existingBookings - Existing bookings for conflict detection
 * @returns {RecurringFormValidator} Form validator object
 */
export function initRecurringForm(existingBookings = []) {
  const nameInput = document.getElementById("booking-name");
  const descInput = document.getElementById("booking-description");
  const recurrenceTypeSelect = document.getElementById("recurrence-type");
  const startDateInput = document.getElementById("booking-start-date");
  const startTimeInput = document.getElementById("booking-start-time");
  const endTimeInput = document.getElementById("booking-end-time");
  const seriesEndDateInput = document.getElementById("booking-series-end-date");

  const errorContainer = document.getElementById("validation-errors");
  const conflictContainer = document.getElementById("conflict-warnings");
  const summaryText = document.getElementById("summary-text");
  const occurrenceCount = document.getElementById("occurrence-count");
  const submitBtn = document.getElementById("submit-btn");

  let currentOccurrences = [];
  let currentConflicts = [];

  const today = new Date().toISOString().split("T")[0];
  if (startDateInput) {
    startDateInput.setAttribute("min", today);
    startDateInput.value = today;
  }

  if (seriesEndDateInput) {
    seriesEndDateInput.setAttribute("min", today);
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    seriesEndDateInput.value = threeMonthsLater.toISOString().split("T")[0];
  }

  const now = new Date();
  const currentHour = now.getHours();
  const nextHour = (currentHour + 1) % 24;

  if (startTimeInput) {
    startTimeInput.value = `${String(currentHour).padStart(2, "0")}:00`;
  }

  if (endTimeInput) {
    endTimeInput.value = `${String(nextHour).padStart(2, "0")}:00`;
  }

  function formatDateEstonian(date) {
    return date.toLocaleDateString("et-EE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function autoSetEndTime() {
    const startTime = startTimeInput?.value;
    if (!startTime) return;

    const [startHour, startMin] = startTime.split(":").map(Number);
    const endHour = (startHour + 1) % 24;
    const newEndTime = `${String(endHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;

    if (endTimeInput) {
      endTimeInput.value = newEndTime;
    }
  }

  function updateOccurrencesAndConflicts() {
    const startDate = startDateInput?.value;
    const seriesEndDate = seriesEndDateInput?.value;
    const recurrenceType = recurrenceTypeSelect?.value;
    const startTime = startTimeInput?.value;
    const endTime = endTimeInput?.value;

    if (
      !startDate ||
      !seriesEndDate ||
      !recurrenceType ||
      !startTime ||
      !endTime
    ) {
      currentOccurrences = [];
      currentConflicts = [];
      return;
    }

    currentOccurrences = generateOccurrenceDates(
      startDate,
      seriesEndDate,
      recurrenceType
    );
    currentConflicts = findConflictingOccurrences(
      existingBookings,
      currentOccurrences,
      startTime,
      endTime
    );
  }

  function renderConflictWarnings() {
    if (!conflictContainer) return;

    if (currentConflicts.length === 0) {
      conflictContainer.innerHTML = "";
      return;
    }

    const conflictDates = currentConflicts
      .map((date) => formatDateEstonian(date))
      .join(", ");

    conflictContainer.innerHTML = `
      <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 1rem; border-radius: 4px;">
        <strong style="color: #856404;">⚠️ Hoiatus: ${currentConflicts.length} konfliktiga kuupäeva</strong>
        <p style="margin: 0.5rem 0 0 0; color: #856404;">
          Järgmistel kuupäevadel on ruum juba broneeritud: ${conflictDates}
        </p>
        <p style="margin: 0.5rem 0 0 0; color: #856404; font-size: 0.9em;">
          Kui jätkad, luuakse broneeringud ka nendel kuupäevadel.
        </p>
      </div>
    `;
  }

  function updateSummary() {
    updateOccurrencesAndConflicts();

    const startDate = startDateInput?.value;
    const startTime = startTimeInput?.value;
    const endTime = endTimeInput?.value;
    const seriesEndDate = seriesEndDateInput?.value;
    const recurrenceType = recurrenceTypeSelect?.value;

    if (startDate && startTime && endTime && seriesEndDate && recurrenceType) {
      const formattedStartDate = formatDateEstonian(new Date(startDate));
      const formattedEndDate = formatDateEstonian(new Date(seriesEndDate));
      const formattedRecurrence = formatRecurrenceType(recurrenceType);

      if (summaryText) {
        summaryText.textContent = `${formattedRecurrence} kell ${startTime} - ${endTime}, alates ${formattedStartDate} kuni ${formattedEndDate}`;
      }

      if (occurrenceCount) {
        occurrenceCount.textContent = `${currentOccurrences.length}`;
      }
    } else {
      if (summaryText) summaryText.textContent = "-";
      if (occurrenceCount) occurrenceCount.textContent = "0";
    }

    renderConflictWarnings();
    validateForm();
  }

  function validateForm() {
    const name = nameInput?.value?.trim();
    const startDate = startDateInput?.value;
    const startTime = startTimeInput?.value;
    const endTime = endTimeInput?.value;
    const seriesEndDate = seriesEndDateInput?.value;
    const recurrenceType = recurrenceTypeSelect?.value;
    const desc = descInput?.value?.trim();

    const errors =
      validateRecurringBookingData({
        name,
        startDate,
        startTime,
        endTime,
        seriesEndDate,
        recurrenceType,
        desc,
      }) || [];

    if (currentOccurrences.length === 0 && !errors.length) {
      errors.push("Valitud vahemikus ei ole ühtegi broneeringut");
    }

    if (errorContainer) {
      if (errors.length > 0) {
        errorContainer.innerHTML = errors
          .map((err) => `<p style="margin: 0.25rem 0;">• ${err}</p>`)
          .join("");
      } else {
        errorContainer.innerHTML = "";
      }
    }

    if (submitBtn) {
      if (errors.length > 0) {
        submitBtn.classList.remove("btn-success");
        submitBtn.classList.add("btn-disabled");
        submitBtn.disabled = true;
      } else {
        submitBtn.classList.remove("btn-disabled");
        submitBtn.classList.add("btn-success");
        submitBtn.disabled = false;
      }
    }

    return errors.length === 0;
  }

  if (startTimeInput) {
    startTimeInput.addEventListener("input", () => {
      autoSetEndTime();
      updateSummary();
    });
    startTimeInput.addEventListener("change", () => {
      autoSetEndTime();
      updateSummary();
    });
  }

  const formInputs = [
    nameInput,
    descInput,
    recurrenceTypeSelect,
    startDateInput,
    endTimeInput,
    seriesEndDateInput,
  ];

  formInputs.forEach((el) => {
    if (!el) return;
    el.addEventListener("input", updateSummary);
    el.addEventListener("change", updateSummary);
  });

  updateSummary();

  return {
    validate: validateForm,
    getOccurrences: () => currentOccurrences,
    getConflicts: () => currentConflicts,
    updateBookings: (bookings) => {
      existingBookings = bookings;
      updateSummary();
    },
  };
}
