class AppCalendar extends HTMLElement {
  constructor() {
    super();
    this._initialized = false;
    this._currentViewDate = null;
    this._bookings = [];
    this._currentBookingId = null;
  }

  connectedCallback() {
    if (this._initialized) return;
    this._initialized = true;

    this.innerHTML = `
      <div class="calendar">
        <div class="calendar-header">
          <button class="cal-button" id="prev-day">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <h2 id="calendar-title">Täna</h2>
          <button class="cal-button" id="next-day">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="cal-grid">
          <ul class="cal-times" id="cal-times"></ul>
          <ul class="cal-desc" id="cal-desc"></ul>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.render();
  }

  set bookings(value) {
    this._bookings = value || [];
    if (this._initialized) {
      this.render();
    }
  }

  get bookings() {
    return this._bookings;
  }

  set currentBookingId(value) {
    this._currentBookingId = value;
    if (this._initialized) {
      this.render();
    }
  }

  get currentBookingId() {
    return this._currentBookingId;
  }

  setupEventListeners() {
    const prevDayBtn = this.querySelector("#prev-day");
    const nextDayBtn = this.querySelector("#next-day");

    if (prevDayBtn) {
      prevDayBtn.addEventListener("click", () => this.changeDay(-1));
    }

    if (nextDayBtn) {
      nextDayBtn.addEventListener("click", () => this.changeDay(1));
    }

    // Watch for form input changes in parent document
    const dateInput = document.getElementById("booking-date");
    const startInput = document.getElementById("booking-start-time");
    const endDateInput = document.getElementById("booking-end-date");
    const endInput = document.getElementById("booking-end-time");
    const nameInput = document.getElementById("booking-name");

    [dateInput, startInput, endDateInput, endInput, nameInput].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", () => this.render());
      el.addEventListener("change", () => this.render());
    });
  }

  formatDate(date) {
    return date.toLocaleDateString("et-EE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getRelativeDay(date) {
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

    return this.formatDate(date);
  }

  updateCalendarTitle() {
    const calendarTitle = this.querySelector("#calendar-title");
    if (calendarTitle && this._currentViewDate) {
      calendarTitle.textContent = this.getRelativeDay(this._currentViewDate);
    }
  }

  isDateInBookingRange(checkDate, startDate, endDate) {
    const effectiveEndDate = endDate || startDate;
    return checkDate >= startDate && checkDate <= effectiveEndDate;
  }

  timestampToDateString(timestamp) {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  }

  timestampToTimeString(timestamp) {
    if (!timestamp) return null;
    try {
      const date = timestamp.toDate();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return null;
    }
  }

  render() {
    const calTimes = this.querySelector("#cal-times");
    const calDesc = this.querySelector("#cal-desc");

    if (!calTimes || !calDesc) return;

    calTimes.innerHTML = "";
    calDesc.innerHTML = "";

    const dateInput = document.getElementById("booking-date");
    const startInput = document.getElementById("booking-start-time");
    const endDateInput = document.getElementById("booking-end-date");
    const endInput = document.getElementById("booking-end-time");
    const nameInput = document.getElementById("booking-name");

    const bookingStartDate = dateInput?.value;
    const bookingStartTime = startInput?.value;
    const bookingEndDate = endDateInput?.value;
    const bookingEndTime = endInput?.value;
    const bookingName = nameInput?.value || "Nimetu broneering";

    if (!this._currentViewDate && bookingStartDate) {
      const [year, month, day] = bookingStartDate.split("-").map(Number);
      this._currentViewDate = new Date(year, month - 1, day);
      this.updateCalendarTitle();
    } else if (!this._currentViewDate) {
      this._currentViewDate = new Date();
      this._currentViewDate.setHours(0, 0, 0, 0);
      this.updateCalendarTitle();
    }

    const year = this._currentViewDate.getFullYear();
    const month = String(this._currentViewDate.getMonth() + 1).padStart(2, "0");
    const day = String(this._currentViewDate.getDate()).padStart(2, "0");
    const currentViewDateStr = `${year}-${month}-${day}`;

    let bookingsToShow = [];

    this._bookings.forEach((booking) => {
      const bookingStartDateStr = this.timestampToDateString(booking.startDate);
      const bookingEndDateStr = this.timestampToDateString(booking.endingDate);
      const bookingStartTimeStr = this.timestampToTimeString(booking.startDate);
      const bookingEndTimeStr = this.timestampToTimeString(booking.endingDate);

      if (!bookingStartDateStr || !bookingStartTimeStr || !bookingEndTimeStr) {
        return;
      }

      const isOnThisDay = this.isDateInBookingRange(
        currentViewDateStr,
        bookingStartDateStr,
        bookingEndDateStr || bookingStartDateStr
      );

      if (isOnThisDay) {
        const isStartDay = currentViewDateStr === bookingStartDateStr;
        const isEndDay =
          currentViewDateStr === (bookingEndDateStr || bookingStartDateStr);
        const isCurrent = booking.id === this._currentBookingId;

        if (
          isStartDay &&
          isEndDay &&
          bookingStartDateStr === bookingEndDateStr
        ) {
          bookingsToShow.push({
            start: bookingStartTimeStr,
            end: bookingEndTimeStr,
            description: booking.name || "Nimetu broneering",
            isUserBooking: false,
            isCurrentBooking: isCurrent,
            bookingId: booking.id,
          });
        } else if (isStartDay) {
          bookingsToShow.push({
            start: bookingStartTimeStr,
            end: "23:59",
            description: `${booking.name || "Nimetu broneering"} (algus)`,
            isUserBooking: false,
            isCurrentBooking: isCurrent,
            bookingId: booking.id,
          });
        } else if (isEndDay) {
          bookingsToShow.push({
            start: "00:00",
            end: bookingEndTimeStr,
            description: `${booking.name || "Nimetu broneering"} (lõpp)`,
            isUserBooking: false,
            isCurrentBooking: isCurrent,
            bookingId: booking.id,
          });
        } else {
          bookingsToShow.push({
            start: "00:00",
            end: "23:59",
            description: booking.name || "Nimetu broneering",
            isUserBooking: false,
            isCurrentBooking: isCurrent,
            bookingId: booking.id,
          });
        }
      }
    });

    const editForm = document.querySelector(".change-booking");
    const isEditFormVisible =
      editForm &&
      editForm.style.display !== "none" &&
      editForm.classList.contains("show");
    const isCreationPage = !editForm;

    const shouldShowFormBooking =
      (isCreationPage || isEditFormVisible) &&
      bookingStartDate &&
      bookingStartTime &&
      bookingEndTime;

    const isBookingOnThisDay = this.isDateInBookingRange(
      currentViewDateStr,
      bookingStartDate,
      bookingEndDate || bookingStartDate
    );

    if (shouldShowFormBooking && isBookingOnThisDay) {
      const isStartDay = currentViewDateStr === bookingStartDate;
      const isEndDay =
        currentViewDateStr === (bookingEndDate || bookingStartDate);

      if (isStartDay && isEndDay && bookingStartDate === bookingEndDate) {
        bookingsToShow.push({
          start: bookingStartTime,
          end: bookingEndTime,
          description: bookingName,
          isUserBooking: true,
          isCurrentBooking: true,
        });
      } else if (isStartDay) {
        bookingsToShow.push({
          start: bookingStartTime,
          end: "23:59",
          description: `${bookingName} (algus)`,
          isUserBooking: true,
          isCurrentBooking: true,
        });
      } else if (isEndDay) {
        bookingsToShow.push({
          start: "00:00",
          end: bookingEndTime,
          description: `${bookingName} (lõpp)`,
          isUserBooking: true,
          isCurrentBooking: true,
        });
      } else {
        bookingsToShow.push({
          start: "00:00",
          end: "23:59",
          description: bookingName,
          isUserBooking: true,
          isCurrentBooking: true,
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
        timeLi.classList.add("user-booking");
      } else if (booking.isCurrentBooking) {
        timeLi.classList.add("booked");
      }
      calTimes.appendChild(timeLi);

      const descLi = document.createElement("li");
      descLi.textContent = booking.description;
      if (booking.isUserBooking) {
        descLi.classList.add("user-booking");
      } else if (booking.isCurrentBooking) {
        descLi.classList.add("booked");
      }

      if (booking.bookingId && !booking.isUserBooking) {
        descLi.style.cursor = "pointer";
        descLi.addEventListener("click", () => {
          window.location.href = `/booking/view/?id=${booking.bookingId}`;
        });
      }

      calDesc.appendChild(descLi);
    });
  }

  changeDay(direction) {
    if (this._currentViewDate) {
      this._currentViewDate.setDate(
        this._currentViewDate.getDate() + direction
      );
      this.updateCalendarTitle();
      this.render();
    }
  }
}

customElements.define("app-calendar", AppCalendar);
