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
          <button type="button" class="cal-button" id="prev-day">
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
          <input type="date" id="calendar-date-picker" />
          <button type="button" class="cal-button" id="next-day">
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
    if (value) {
      this._currentViewDate = null;
    }
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
    const calendarTitle = this.querySelector("#calendar-title");
    const calendarDatePicker = this.querySelector("#calendar-date-picker");

    if (prevDayBtn) {
      prevDayBtn.addEventListener("click", () => this.changeDay(-1));
    }

    if (nextDayBtn) {
      nextDayBtn.addEventListener("click", () => this.changeDay(1));
    }

    if (calendarTitle && calendarDatePicker) {
      calendarTitle.style.cursor = "pointer";
      calendarTitle.addEventListener("click", () => {
        calendarDatePicker.showPicker?.();
      });
    }

    if (calendarDatePicker) {
      calendarDatePicker.addEventListener("change", (e) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
          const [year, month, day] = selectedDate.split("-").map(Number);
          this._currentViewDate = new Date(year, month - 1, day);
          this._currentViewDate.setHours(0, 0, 0, 0);
          this.updateCalendarDatePicker();
          this.updateCalendarTitle();
          this.render();
        }
      });
    }

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

  updateCalendarDatePicker() {
    const calendarDatePicker = this.querySelector("#calendar-date-picker");
    if (calendarDatePicker && this._currentViewDate) {
      const year = this._currentViewDate.getFullYear();
      const month = String(this._currentViewDate.getMonth() + 1).padStart(
        2,
        "0"
      );
      const day = String(this._currentViewDate.getDate()).padStart(2, "0");
      calendarDatePicker.value = `${year}-${month}-${day}`;
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

    if (!this._currentViewDate) {
      if (this._currentBookingId && this._bookings.length > 0) {
        const currentBooking = this._bookings.find(
          (b) => b.id === this._currentBookingId
        );
        if (currentBooking && currentBooking.startDate) {
          const bookingStartDate = currentBooking.startDate.toDate();
          this._currentViewDate = new Date(bookingStartDate);
          this._currentViewDate.setHours(0, 0, 0, 0);
        }
      }

      if (!this._currentViewDate && bookingStartDate) {
        const [year, month, day] = bookingStartDate.split("-").map(Number);
        this._currentViewDate = new Date(year, month - 1, day);
      }

      if (!this._currentViewDate) {
        this._currentViewDate = new Date();
        this._currentViewDate.setHours(0, 0, 0, 0);
      }

      this.updateCalendarTitle();
      this.updateCalendarDatePicker();
    }

    const year = this._currentViewDate.getFullYear();
    const month = String(this._currentViewDate.getMonth() + 1).padStart(2, "0");
    const day = String(this._currentViewDate.getDate()).padStart(2, "0");
    const currentViewDateStr = `${year}-${month}-${day}`;

    let bookingsToShow = [];

    const now = new Date();

    this._bookings.forEach((booking) => {
      const bookingStartDateStr = this.timestampToDateString(booking.startDate);
      const bookingEndDateStr = this.timestampToDateString(booking.endingDate);
      const bookingStartTimeStr = this.timestampToTimeString(booking.startDate);
      const bookingEndTimeStr = this.timestampToTimeString(booking.endingDate);

      if (!bookingStartDateStr || !bookingStartTimeStr || !bookingEndTimeStr) {
        return;
      }

      const bookingEndDate = booking.endingDate?.toDate
        ? booking.endingDate.toDate()
        : booking.endingDate;
      const isPast = bookingEndDate && bookingEndDate < now;

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
            isPast: isPast,
          });
        } else if (isStartDay) {
          bookingsToShow.push({
            start: bookingStartTimeStr,
            end: "23:59",
            description: `${booking.name || "Nimetu broneering"} (algus)`,
            isUserBooking: false,
            isCurrentBooking: isCurrent,
            bookingId: booking.id,
            isPast: isPast,
          });
        } else if (isEndDay) {
          bookingsToShow.push({
            start: "00:00",
            end: bookingEndTimeStr,
            description: `${booking.name || "Nimetu broneering"} (lõpp)`,
            isUserBooking: false,
            isCurrentBooking: isCurrent,
            bookingId: booking.id,
            isPast: isPast,
          });
        } else {
          bookingsToShow.push({
            start: "00:00",
            end: "23:59",
            description: booking.name || "Nimetu broneering",
            isUserBooking: false,
            isCurrentBooking: isCurrent,
            bookingId: booking.id,
            isPast: isPast,
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

    let hasConflict = false;
    if (
      shouldShowFormBooking &&
      bookingStartDate &&
      bookingEndDate &&
      bookingStartTime &&
      bookingEndTime
    ) {
      const [startYear, startMonth, startDay] = bookingStartDate
        .split("-")
        .map(Number);
      const [startHour, startMin] = bookingStartTime.split(":").map(Number);
      const [endYear, endMonth, endDay] = (bookingEndDate || bookingStartDate)
        .split("-")
        .map(Number);
      const [endHour, endMin] = bookingEndTime.split(":").map(Number);

      const userStart = new Date(
        startYear,
        startMonth - 1,
        startDay,
        startHour,
        startMin
      );
      const userEnd = new Date(endYear, endMonth - 1, endDay, endHour, endMin);

      hasConflict = this._bookings.some((booking) => {
        if (this._currentBookingId && booking.id === this._currentBookingId) {
          return false;
        }

        const existingStart = booking.startDate?.toDate
          ? booking.startDate.toDate()
          : booking.startDate;
        const existingEnd = booking.endingDate?.toDate
          ? booking.endingDate.toDate()
          : booking.endingDate;

        if (!existingStart || !existingEnd) {
          return false;
        }

        return userStart < existingEnd && existingStart < userEnd;
      });
    }

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
          hasConflict: hasConflict,
        });
      } else if (isStartDay) {
        bookingsToShow.push({
          start: bookingStartTime,
          end: "23:59",
          description: `${bookingName} (algus)`,
          isUserBooking: true,
          isCurrentBooking: true,
          hasConflict: hasConflict,
        });
      } else if (isEndDay) {
        bookingsToShow.push({
          start: "00:00",
          end: bookingEndTime,
          description: `${bookingName} (lõpp)`,
          isUserBooking: true,
          isCurrentBooking: true,
          hasConflict: hasConflict,
        });
      } else {
        bookingsToShow.push({
          start: "00:00",
          end: "23:59",
          description: bookingName,
          isUserBooking: true,
          isCurrentBooking: true,
          hasConflict: hasConflict,
        });
      }
    }

    bookingsToShow.sort((a, b) => {
      const aTime = a.start.replace(":", "");
      const bTime = b.start.replace(":", "");
      return aTime - bTime;
    });

    const [viewYear, viewMonth, viewDay] = currentViewDateStr
      .split("-")
      .map(Number);
    const viewDate = new Date(viewYear, viewMonth - 1, viewDay);
    viewDate.setHours(0, 0, 0, 0);
    const todayDate = new Date(now);
    todayDate.setHours(0, 0, 0, 0);

    const isToday = viewDate.getTime() === todayDate.getTime();
    const isPastDay = viewDate < todayDate;

    if (!isPastDay) {
      for (let hour = 8; hour < 18; hour++) {
        let slotStartHour = hour;
        let slotStartMinute = 0;

        if (isToday && hour <= now.getHours()) {
          if (hour === now.getHours()) {
            slotStartMinute = Math.ceil(now.getMinutes() / 5) * 5;
            if (slotStartMinute >= 60) {
              slotStartHour++;
              slotStartMinute = 0;
            }
          } else {
            continue;
          }
        }

        const slotStartTime = `${String(slotStartHour).padStart(2, "0")}:${String(slotStartMinute).padStart(2, "0")}`;
        const slotEndTime = `${String(hour + 1).padStart(2, "0")}:00`;

        if (slotStartHour >= hour + 1) {
          continue;
        }

        const overlappingBookings = bookingsToShow.filter((booking) => {
          if (booking.isTimeSlot) return false;

          const bookingStart = booking.start;
          const bookingEnd = booking.end;
          const slotStart = slotStartTime;
          const slotEnd = slotEndTime;

          const bookingStartMinutes = parseInt(bookingStart.replace(":", ""));
          const bookingEndMinutes = parseInt(bookingEnd.replace(":", ""));
          const slotStartMinutes = parseInt(slotStart.replace(":", ""));
          const slotEndMinutes = parseInt(slotEnd.replace(":", ""));

          return (
            bookingStartMinutes < slotEndMinutes &&
            slotStartMinutes < bookingEndMinutes
          );
        });

        if (overlappingBookings.length === 0) {
          bookingsToShow.push({
            start: slotStartTime,
            end: slotEndTime,
            description: "Vaba",
            isTimeSlot: true,
          });
        } else {
          const sortedBookings = overlappingBookings.sort((a, b) => {
            const aMin = parseInt(a.start.replace(":", ""));
            const bMin = parseInt(b.start.replace(":", ""));
            return aMin - bMin;
          });

          let currentTime = slotStartTime;
          const currentMinutes = parseInt(currentTime.replace(":", ""));
          const slotEndMinutes = parseInt(slotEndTime.replace(":", ""));

          for (const booking of sortedBookings) {
            const bookingStartMinutes = parseInt(
              booking.start.replace(":", "")
            );

            if (currentMinutes < bookingStartMinutes) {
              const gapStart = currentTime;
              const gapEnd = booking.start;

              bookingsToShow.push({
                start: gapStart,
                end: gapEnd,
                description: "Vaba",
                isTimeSlot: true,
              });
            }

            currentTime = booking.end;
          }

          const lastBookingEndMinutes = parseInt(
            sortedBookings[sortedBookings.length - 1].end.replace(":", "")
          );
          if (lastBookingEndMinutes < slotEndMinutes) {
            bookingsToShow.push({
              start: sortedBookings[sortedBookings.length - 1].end,
              end: slotEndTime,
              description: "Vaba",
              isTimeSlot: true,
            });
          }
        }
      }
    }

    bookingsToShow.sort((a, b) => {
      const aTime = a.start.replace(":", "");
      const bTime = b.start.replace(":", "");
      return aTime - bTime;
    });

    const addBookingClasses = (element, booking) => {
      if (booking.isTimeSlot) {
        element.classList.add("time-slot");
      } else if (booking.isPast && booking.isCurrentBooking) {
        element.classList.add("past-booking", "booked");
      } else if (booking.isPast) {
        element.classList.add("past-booking");
      } else if (booking.isUserBooking) {
        element.classList.add(
          booking.hasConflict ? "conflict-booking" : "user-booking"
        );
      } else if (booking.isCurrentBooking) {
        element.classList.add("booked");
      }
    };

    bookingsToShow.forEach((booking) => {
      const timeLi = document.createElement("li");
      timeLi.textContent = `${booking.start}-${booking.end}`;
      addBookingClasses(timeLi, booking);
      calTimes.appendChild(timeLi);

      const descLi = document.createElement("li");
      descLi.textContent = booking.description;
      addBookingClasses(descLi, booking);

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
      this.updateCalendarDatePicker();
      this.render();
    }
  }
}

customElements.define("app-calendar", AppCalendar);
