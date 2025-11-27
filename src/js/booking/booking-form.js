import { validateBookingData } from "./booking-validation.js";

export function initBookingForm() {
  const nameInput = document.getElementById("booking-name");
  const dateInput = document.getElementById("booking-date");
  const startInput = document.getElementById("booking-start-time");
  const endDateInput = document.getElementById("booking-end-date");
  const endInput = document.getElementById("booking-end-time");
  const descInput = document.getElementById("booking-description");

  const summaryDate = document.getElementById("summary-date");
  const summaryStart = document.getElementById("summary-start");
  const summaryEnd = document.getElementById("summary-end");
  const summaryEndDateSection = document.getElementById(
    "summary-end-date-section"
  );

  const errorContainer = document.getElementById("validation-errors");
  const submitBtn = document.getElementById("submit-btn");

  const today = new Date().toISOString().split("T")[0];
  if (dateInput) {
    dateInput.setAttribute("min", today);
    dateInput.value = today;
  }

  if (endDateInput) {
    endDateInput.setAttribute("min", today);
  }

  const now = new Date();
  const currentHour = now.getHours();
  const nextHour = (currentHour + 1) % 24;

  if (startInput) {
    startInput.value = `${String(currentHour).padStart(2, "0")}:00`;
  }

  if (endInput) {
    endInput.value = `${String(nextHour).padStart(2, "0")}:00`;
  }

  function formatDate(iso) {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("et-EE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function getRelativeDay(iso) {
    if (!iso) return "";

    const inputDate = new Date(iso);
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

  function formatDateWithRelative(iso) {
    if (!iso) return "-";

    const formatted = formatDate(iso);
    const relative = getRelativeDay(iso);

    if (relative) {
      return `${formatted} (${relative})`;
    }

    return formatted;
  }

  let lastAutoSetEndDate = null;

  function autoSetEndDate() {
    const date = dateInput?.value;
    const startTime = startInput?.value;
    const endTime = endInput?.value;

    if (!date || !startTime || !endTime) return;

    const currentEndDate = endDateInput?.value;
    if (
      currentEndDate &&
      currentEndDate !== lastAutoSetEndDate &&
      currentEndDate !== date
    ) {
      return;
    }

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    let newEndDate;
    if (endMinutes <= startMinutes) {
      const startDate = new Date(date);
      const nextDay = new Date(startDate);
      nextDay.setDate(nextDay.getDate() + 1);
      newEndDate = nextDay.toISOString().split("T")[0];
    } else {
      newEndDate = date;
    }

    if (endDateInput && newEndDate) {
      endDateInput.value = newEndDate;
      lastAutoSetEndDate = newEndDate;
    }
  }

  function validateForm() {
    const name = nameInput?.value?.trim();
    const startDate = dateInput?.value;
    const startTime = startInput?.value;
    const endDate = endDateInput?.value;
    const endTime = endInput?.value;
    const desc = descInput?.value?.trim();

    const errors =
      validateBookingData({
        name,
        startDate,
        endDate,
        startTime,
        endTime,
        desc,
      }) || [];

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

  function updateSummary() {
    const date = dateInput?.value;
    const startTime = startInput?.value;
    const endTime = endInput?.value;

    autoSetEndDate();

    if (date && startTime && endTime) {
      const formattedStartDate = formatDateWithRelative(date);
      const actualEndDate = endDateInput?.value;
      const formattedEndDate = actualEndDate
        ? formatDateWithRelative(actualEndDate)
        : "";

      if (actualEndDate && actualEndDate !== date) {
        summaryDate.textContent = formattedStartDate;
        summaryStart.textContent = startTime;
        summaryEnd.textContent = endTime;
        if (summaryEndDateSection) {
          summaryEndDateSection.textContent = `${formattedEndDate}`;
        }
      } else {
        summaryDate.textContent = formattedStartDate;
        summaryStart.textContent = startTime;
        summaryEnd.textContent = endTime;
        if (summaryEndDateSection) {
          summaryEndDateSection.textContent = "";
        }
      }
    } else {
      summaryDate.textContent = "-";
      summaryStart.textContent = "-";
      summaryEnd.textContent = "-";
      if (summaryEndDateSection) {
        summaryEndDateSection.textContent = "";
      }
    }

    validateForm();
  }

  [nameInput, dateInput, startInput, endDateInput, endInput].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", updateSummary);
    el.addEventListener("change", updateSummary);
  });

  updateSummary();

  return {
    validate: validateForm,
  };
}
