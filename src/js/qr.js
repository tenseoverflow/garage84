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
      let roomId = code.data.trim();

      if (roomId.startsWith("http")) {
        try {
          const url = new URL(roomId);
          const idParam = url.searchParams.get("id");
          if (idParam) {
            roomId = idParam;
          }
        } catch (e) {
          console.error("Invalid URL in QR code:", e);
        }
      }

      if (roomId) {
        window.location.href = `/room/?id=${roomId}`;
        return;
      }
    }
    // Continue scanning
    requestAnimationFrame(tick);
  } else {
    requestAnimationFrame(tick);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startCamera);
} else {
  startCamera();
}
