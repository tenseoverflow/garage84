// based on: https://foolishdeveloper.com/css-confetti-animation/

let W = window.innerWidth;
let H = window.innerHeight;
let canvas = document.getElementById("canvas");
let context = canvas && canvas.getContext ? canvas.getContext("2d") : null;
const maxConfettis = 100;
const particles = [];

// Animation control
let animationId = null;
let isRunning = false;
let shouldSpawn = true;

const possibleColors = [
  "DodgerBlue",
  "OliveDrab",
  "Gold",
  "Pink",
  "SlateBlue",
  "LightBlue",
  "Gold",
  "Violet",
  "PaleGreen",
  "SteelBlue",
  "SandyBrown",
  "Chocolate",
  "Crimson",
];

function ensureCanvas() {
  if (!canvas) {
    canvas = document.getElementById("canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "canvas";
      document.body.appendChild(canvas);
    }
  }

  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    margin: "0",
    pointerEvents: "none",
    zIndex: "1000",
  });

  if (!context) {
    context = canvas.getContext("2d");
  }

  resizeCanvas();
}

function resizeCanvas() {
  if (!canvas || !context) return;
  const dpr = Math.max(window.devicePixelRatio || 1, 1);
  const cssW = Math.floor(window.innerWidth);
  const cssH = Math.floor(window.innerHeight);
  const actualW = Math.floor(cssW * dpr);
  const actualH = Math.floor(cssH * dpr);

  if (canvas.width !== actualW || canvas.height !== actualH) {
    canvas.width = actualW;
    canvas.height = actualH;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

window.addEventListener(
  "resize",
  function () {
    W = window.innerWidth;
    H = window.innerHeight;
    resizeCanvas();
  },
  false
);

function randomFromTo(from, to) {
  return Math.floor(Math.random() * (to - from + 1) + from);
}

function confettiParticle() {
  this.x = Math.random() * W; // x
  this.y = Math.random() * H - H; // y
  this.r = randomFromTo(11, 33); // radius
  this.d = Math.random() * maxConfettis + 11;
  this.color =
    possibleColors[Math.floor(Math.random() * possibleColors.length)];
  this.tilt = Math.floor(Math.random() * 33) - 11;
  this.tiltAngleIncremental = Math.random() * 0.07 + 0.05;
  this.tiltAngle = 0;
  this.tiltOffset = Math.random() * 40 - 20;

  this.draw = function () {
    if (!context) return;
    context.beginPath();
    context.lineWidth = this.r / 2;
    context.strokeStyle = this.color;
    context.moveTo(this.x + this.tilt + this.r / 3, this.y);
    context.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 5);
    return context.stroke();
  };
}

function Draw() {
  if (!isRunning) return;

  const results = [];

  // Magical recursive functional love
  animationId = requestAnimationFrame(Draw);

  if (!context) return results;
  context.clearRect(0, 0, W, H);

  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];

    results.push(particle.draw());

    // update
    particle.tiltAngle += particle.tiltAngleIncremental;
    particle.y += (Math.cos(particle.d) + 3 + particle.r / 2) / 2;
    particle.tilt = Math.sin(particle.tiltAngle + particle.tiltOffset) * 15;

    // If a confetti has fluttered out of view,
    // either recycle it (if we're still spawning) or remove it so it can finish
    // and disappear from the canvas permanently.
    if (particle.x > W + 30 || particle.x < -30 || particle.y > H) {
      if (shouldSpawn) {
        particle.x = Math.random() * W;
        particle.y = -30;
        particle.tilt = Math.floor(Math.random() * 10) - 20;
      } else {
        particles.splice(i, 1);
      }
    }
  }

  // stops the animation when there are no particles left
  if (!shouldSpawn && particles.length === 0) {
    isRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (context && canvas) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  return results;
}

// Control functions: start and stop the confetti animation
export function startConfetti(duration = 5000, confettiCount = maxConfettis) {
  ensureCanvas();

  if (!canvas || !context) return;
  if (isRunning) return; // already running

  shouldSpawn = true;

  W = window.innerWidth;
  H = window.innerHeight;
  resizeCanvas();

  particles.length = 0;
  for (let i = 0; i < confettiCount; i++) {
    particles.push(new confettiParticle());
  }

  isRunning = true;
  Draw();

  if (duration > 0) {
    setTimeout(() => {
      stopConfetti();
    }, duration);
  }
}

export function stopConfetti() {
  shouldSpawn = false;
}

export function _getParticles() {
  return particles;
}

export function _getCanvas() {
  return canvas;
}
