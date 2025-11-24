/**
 * Show an error message on the page.
 * @param {string} message - The error message to display.
 * @param {string} container - The container element to display the message in.
 */
export function showError(message, container = "main") {
  clearMessages();

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.style.cssText = `
    background-color: #fee;
    color: #c33;
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 0.5rem;
    border: 1px solid #fcc;
  `;
  errorDiv.textContent = message;

  const target =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (target) {
    const header = target.querySelector("header");
    const form = target.querySelector("form");

    if (form) {
      form.insertBefore(errorDiv, form.firstChild);
    } else if (header) {
      header.insertAdjacentElement("afterend", errorDiv);
    } else {
      target.insertBefore(errorDiv, target.firstChild);
    }
  }
}

export function clearMessages() {
  const messages = document.querySelectorAll(
    ".error-message, .success-message"
  );
  messages.forEach((msg) => msg.remove());
}
