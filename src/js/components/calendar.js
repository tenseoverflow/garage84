export function initCalendar() {
  const calTimes = document.getElementById("cal-times");
  const calDesc = document.getElementById("cal-desc");
  const calendarTitle = document.getElementById("calendar-title");
  const prevDayBtn = document.getElementById("prev-day");
  const nextDayBtn = document.getElementById("next-day");

  const dateInput = document.getElementById("booking-date");
  const startInput = document.getElementById("booking-start-time");
  const endDateInput = document.getElementById("booking-end-date");
  const endInput = document.getElementById("booking-end-time");
  const nameInput = document.getElementById("booking-name");

  let currentViewDate = null;

  function formatDate(date) {
    return date.toLocaleDateString("et-EE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getRelativeDay(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const diffTime = checkDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Täna";
    if (diffDays === 1) return "Homme";
    if (diffDays === -1) return "Eile";
    if (diffDays === 2) return "Ülehomme";

    return formatDate(date);
  }

  function updateCalendarTitle() {
    if (calendarTitle) {
      calendarTitle.textContent = getRelativeDay(currentViewDate);
    }
  }

  function isDateInBookingRange(checkDate, startDate, endDate) {
    const effectiveEndDate = endDate || startDate;
    return checkDate >= startDate && checkDate <= effectiveEndDate;
  }

  function renderCalendar() {
    if (!calTimes || !calDesc) return;

    calTimes.innerHTML = "";
    calDesc.innerHTML = "";

    const bookingStartDate = dateInput?.value;
    const bookingStartTime = startInput?.value;
    const bookingEndDate = endDateInput?.value;
    const bookingEndTime = endInput?.value;
    const bookingName = nameInput?.value || "Nimetu broneering";

    if (!currentViewDate && bookingStartDate) {
      const [year, month, day] = bookingStartDate.split("-").map(Number);
      currentViewDate = new Date(year, month - 1, day);
      updateCalendarTitle();
    } else if (!currentViewDate) {
      currentViewDate = new Date();
      currentViewDate.setHours(0, 0, 0, 0);
      updateCalendarTitle();
    }

    const year = currentViewDate.getFullYear();
    const month = String(currentViewDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentViewDate.getDate()).padStart(2, "0");
    const currentViewDateStr = `${year}-${month}-${day}`;
    const isBookingOnThisDay = isDateInBookingRange(
      currentViewDateStr,
      bookingStartDate,
      bookingEndDate || bookingStartDate
    );

    let bookingsToShow = [];

    if (isBookingOnThisDay && bookingStartTime && bookingEndTime) {
      const isStartDay = currentViewDateStr === bookingStartDate;
      const isEndDay =
        currentViewDateStr === (bookingEndDate || bookingStartDate);

      if (isStartDay && isEndDay && bookingStartDate === bookingEndDate) {
        // Same day booking
        bookingsToShow.push({
          start: bookingStartTime,
          end: bookingEndTime,
          description: bookingName,
          isUserBooking: true,
        });
      } else if (isStartDay) {
        // Multi-day booking - start day
        bookingsToShow.push({
          start: bookingStartTime,
          end: "23:59",
          description: `${bookingName} (algus)`,
          isUserBooking: true,
        });
      } else if (isEndDay) {
        // Multi-day booking - end day
        bookingsToShow.push({
          start: "00:00",
          end: bookingEndTime,
          description: `${bookingName} (lõpp)`,
          isUserBooking: true,
        });
      } else {
        // Multi-day booking - middle day
        bookingsToShow.push({
          start: "00:00",
          end: "23:59",
          description: bookingName,
          isUserBooking: true,
        });
      }
    }

    bookingsToShow.sort((a, b) => {
      const aTime = a.start.replace(":", "");
      const bTime = b.start.replace(":", "");
      return aTime - bTime;
    });

    bookingsToShow.forEach((booking) => {
      const timeLi = document.createElement("li");
      timeLi.textContent = `${booking.start}-${booking.end}`;
      if (booking.isUserBooking) {
        timeLi.classList.add("booked");
      }
      calTimes.appendChild(timeLi);

      const descLi = document.createElement("li");
      descLi.textContent = booking.description;
      if (booking.isUserBooking) {
        descLi.classList.add("booked");
      }
      calDesc.appendChild(descLi);
    });
  }

  function changeDay(direction) {
    currentViewDate.setDate(currentViewDate.getDate() + direction);
    updateCalendarTitle();
    renderCalendar();
  }

  if (prevDayBtn) {
    prevDayBtn.addEventListener("click", () => changeDay(-1));
  }

  if (nextDayBtn) {
    nextDayBtn.addEventListener("click", () => changeDay(1));
  }

  [dateInput, startInput, endDateInput, endInput, nameInput].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", renderCalendar);
    el.addEventListener("change", renderCalendar);
  });

  renderCalendar();
}
