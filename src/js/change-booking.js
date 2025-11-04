const cancelBookingBtn = document.getElementById("cancel-booking");

if (cancelBookingBtn) {
  cancelBookingBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const confirmed = confirm("Do you want to cancel booking?");
    if (confirmed) {
      // TODO: Add actual cancel booking logic here
      console.log("Booking cancelled");
    }
  });
}
