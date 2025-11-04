import jsQR from "jsqr";

let video;
let canvas;
let ctx;

function initElements() {
  video = document.getElementById("camera-stream");
  canvas = document.getElementById("qr-canvas");
  ctx = canvas.getContext("2d");

  if (!video || !canvas) {
    console.error("Required elements not found");
    return false;
  }
  return true;
}

function startCamera() {
  if (!initElements()) return;

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      video.srcObject = stream;
      video.setAttribute("playsinline", true);
      video.play();
      requestAnimationFrame(tick);
    })
    .catch((err) => {
      console.error("Error accessing camera: ", err);
      const resultDiv = document.getElementById("qr-result");
      if (resultDiv) {
        resultDiv.innerText = `Camera Error: ${err.message}`;
      }
    });
}

function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      if (code.data.startsWith("https://example.com/")) {
        /* TODO: change URL */
        window.location.href = code.data;
      }
    } else {
      requestAnimationFrame(tick);
    }
  } else {
    requestAnimationFrame(tick);
  }
}

// Wait for DOM to be ready before starting
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startCamera);
} else {
  startCamera();
}
