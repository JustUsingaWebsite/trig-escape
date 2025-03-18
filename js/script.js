// ------------------------------------------------------
// 1) CANVAS / DOM ELEMENTS
// ------------------------------------------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");

// Inputs for customizing the bird's path
const controls = document.getElementById("controls");
//const birdFunctionSelect = document.getElementById("birdFunctionSelect");
const birdAmplitudeInput = document.getElementById("amplitudeInput");
const birdFrequencyInput = document.getElementById("frequencyInput");
const birdPhaseInput = document.getElementById("phaseInput");
const birdVerticalShiftInput = document.getElementById("verticalShiftInput");

// Initialize sound system on first user interaction
document.addEventListener('click', () => {
  if (window.soundManager && !window.soundManager.initialized) {
    window.soundManager.init();
  }
}, { once: true });

// ------------------------------------------------------
// 2) BASE FUNCTION (FOR OBSTACLES)
// ------------------------------------------------------

// Randomly pick the base trig function for obstacles
const functionTypes = ["sine", "cosine", "tangent"];
const baseFunctionType = localStorage.getItem('selectedFunction') || 'sine'; //functionTypes[Math.floor(Math.random() * functionTypes.length)];
console.log("Base function type (obstacles):", baseFunctionType);

// Base function parameters
var amplitude = 50; // tan 5
var frequency = 0.2; // 0.02
var phase = 0; // 1.55
var baseVerticalShift = canvas.height / 2;

if (baseFunctionType === functionTypes[1]){
amplitude = 65;
frequency = 0.02;
phase = 3.3
}

if (baseFunctionType === functionTypes[2]){
amplitude = 5;
frequency = 0.02;
phase = 1.55
}

birdAmplitudeInput.defaultValue = amplitude
birdFrequencyInput.defaultValue = frequency
birdPhaseInput.defaultValue = phase
birdVerticalShiftInput.defaultValue = baseVerticalShift

// Evaluate the base function (for obstacles/finish line)
function evaluateBaseFunction(x) {
  switch (baseFunctionType) {
    case "cosine":
      return amplitude * Math.cos(frequency * x + phase) + baseVerticalShift;
    case "tangent":
      return amplitude * Math.tan(frequency * x + phase) + baseVerticalShift;
    case "sine":
    default:
      return amplitude * Math.sin(frequency * x + phase) + baseVerticalShift;
  }
}

// ------------------------------------------------------
// 3) BIRD FUNCTION (USER-CONTROLLED)
// ------------------------------------------------------

// Start with sine by default (matches the initial <select> value)
let birdFunctionType = baseFunctionType;
let birdAmplitude = amplitude;        // starts the same as the base
let birdFrequency = frequency;
let birdPhase = phase;
let birdVerticalShift = baseVerticalShift;


// Evaluate the bird's function at x
function evaluateBirdFunction(xVal) {
  switch (birdFunctionType) {
    case "cosine":
      return birdAmplitude * Math.cos(birdFrequency * xVal + birdPhase) + birdVerticalShift;
    case "tangent":
      return birdAmplitude * Math.tan(birdFrequency * xVal + birdPhase) + birdVerticalShift;
    case "sine":
    default:
      return birdAmplitude * Math.sin(birdFrequency * xVal + birdPhase) + birdVerticalShift;
  }
}

// ------------------------------------------------------
// 4) GAME STATE
// ------------------------------------------------------
let birdX = 0;
let gameActive = false;
let animationFrameId = null;
const birdSize = 20;
const speed = 2; // Bird's movement speed along the x-axis

// ------------------------------------------------------
// 5) OBSTACLES & RANDOM TRANSFORMATION
// ------------------------------------------------------
const obstacleWidth = 30;
const obstacleHeight = 30;

// Our obstacles
// - type "reset" → collisions reset the game
// - type "finish" → collisions cause a win
const obstacles = [
  { x: 200, type: "reset" },
  { x: 400, type: "reset" },
  { x: 600, type: "reset" },
  { x: 750, type: "finish" }
];

// Transformation options for the obstacles
const transformationOptions = ["none", "verticalShift", "amplitude", "phaseShift", "frequency"];
const chosenTransformation = transformationOptions[Math.floor(Math.random() * transformationOptions.length)];
console.log("Chosen transformation for obstacles:", chosenTransformation);

// Variables for the random transformation
let verticalShiftDelta = 0;
let amplitudeMultiplier = 1;
let phaseShiftDelta = 0;
let frequencyMultiplier = 1;

switch (chosenTransformation) {
  case "verticalShift":
    verticalShiftDelta = (Math.random() * 100) - 50; // offset between -50 and +50
    break;
  case "amplitude":
    amplitudeMultiplier = 0.5 + Math.random();       // between 0.5 and 1.5
    break;
  case "phaseShift":
    phaseShiftDelta = (Math.random() * Math.PI) - (Math.PI / 2); // -π/2 to π/2
    break;
  case "frequency":
    frequencyMultiplier = 0.5 + Math.random();       // between 0.5 and 1.5
    break;
  case "none":
  default:
    // no transformation
    break;
}

// ------------------------------------------------------
// 6) DRAWING FUNCTIONS
// ------------------------------------------------------

// Draw the bird's path curve (the user‐chosen trig function)
// MODIFIED: Only shown before the game starts
function drawBirdCurve() {
  if (!gameActive) {
    ctx.beginPath();
    ctx.moveTo(0, evaluateBirdFunction(0 + birdX));
    for (let x = 0; x < canvas.width; x++) {
      const y = evaluateBirdFunction(x + birdX);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#d84315"; // orange/red
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// Draw the bird (changed from square to bird shape)
function drawBird(x, y) {
  ctx.save();
  
  // Determine bird's vertical direction based on function slope
  let slope = 0;
  if (birdX > 0) {
    const prevY = evaluateBirdFunction(birdX - 1);
    const currentY = evaluateBirdFunction(birdX);
    slope = currentY - prevY;
  }
  
  // Rotate slightly based on movement direction
  const rotationAngle = Math.atan2(slope, 5) * 0.5;
  ctx.translate(x, y);
  ctx.rotate(rotationAngle);
  
  // Bird body (oval)
  ctx.fillStyle = "#f44336";
  ctx.beginPath();
  ctx.ellipse(0, 0, birdSize/1.5, birdSize/2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Bird head
  ctx.fillStyle = "#d32f2f";
  ctx.beginPath();
  ctx.ellipse(birdSize/2, -birdSize/8, birdSize/3, birdSize/4, 0.3, 0, Math.PI * 2);
  ctx.fill();
  
// Bird eye
ctx.fillStyle = "white";
ctx.beginPath();
ctx.arc(birdSize/2 + 2, -birdSize/8 - 2, birdSize/6, 0, Math.PI * 2);
ctx.fill();

// Bird pupil
ctx.fillStyle = "black";
ctx.beginPath();
ctx.arc(birdSize/2 + 2, -birdSize/8 - 2, birdSize/12, 0, Math.PI * 2);
ctx.fill();

// Bird beak
ctx.fillStyle = "#ff9800";
ctx.beginPath();
ctx.moveTo(birdSize/2 + 6, -birdSize/8);
ctx.lineTo(birdSize/2 + 15, -birdSize/8 - 2);
ctx.lineTo(birdSize/2 + 6, -birdSize/8 - 4);
ctx.closePath();
ctx.fill();

// Bird wings
ctx.fillStyle = "#ef5350";
ctx.beginPath();
ctx.ellipse(-2, 0, birdSize/2.5, birdSize/5, Math.PI/4, 0, Math.PI * 2);
ctx.fill();

// Bird tail
ctx.fillStyle = "#ef5350";
ctx.beginPath();
ctx.moveTo(-birdSize/1.8, 0);
ctx.lineTo(-birdSize*1.1, -birdSize/4);
ctx.lineTo(-birdSize*1.1, birdSize/4);
ctx.closePath();
ctx.fill();

ctx.restore();
}

// Compute obstacle y-value, applying random transformation if type == "reset"
function computeObstacleY(obstacle) {
const baseY = evaluateBaseFunction(obstacle.x);
if (obstacle.type === "finish") {
  // Finish line uses the untransformed base function
  return baseY;
}
// Otherwise, apply the chosen transformation
switch (chosenTransformation) {
  case "verticalShift":
    return baseY + verticalShiftDelta;
  case "amplitude":
    return (amplitude * amplitudeMultiplier) *
           trigOf(baseFunctionType, obstacle.x, frequency, phase) +
           baseVerticalShift;
  case "phaseShift":
    return amplitude *
           trigOf(baseFunctionType, obstacle.x, frequency, phase + phaseShiftDelta) +
           baseVerticalShift;
  case "frequency":
    return amplitude *
           trigOf(baseFunctionType, obstacle.x, frequency * frequencyMultiplier, phase) +
           baseVerticalShift;
  case "none":
  default:
    return baseY;
}
}

// Helper: evaluate the same trig function type used by the base function
function trigOf(funcType, xVal, freq, phs) {
switch (funcType) {
  case "cosine":
    return Math.cos(freq * xVal + phs);
  case "tangent":
    return Math.tan(freq * xVal + phs);
  case "sine":
  default:
    return Math.sin(freq * xVal + phs);
}
}

// Draw an obstacle (spikes instead of squares)
function drawObstacle(obstacle) {
const obsY = computeObstacleY(obstacle);

if (obstacle.type === "finish") {
  // Draw a finish line/flag instead of a square
  ctx.fillStyle = "#4caf50"; // green
  
  // Flag pole
  ctx.fillRect(obstacle.x - 2, obsY - obstacleHeight, 4, obstacleHeight * 2);
  
  // Flag
  ctx.beginPath();
  ctx.moveTo(obstacle.x, obsY - obstacleHeight);
  ctx.lineTo(obstacle.x + obstacleWidth/1.5, obsY - obstacleHeight/2);
  ctx.lineTo(obstacle.x, obsY);
  ctx.closePath();
  ctx.fill();
  
  // Base
  ctx.beginPath();
  ctx.ellipse(obstacle.x, obsY + obstacleHeight, obstacleWidth/2, obstacleHeight/4, 0, 0, Math.PI * 2);
  ctx.fill();
} else {
  // Draw spikes instead of squares for reset obstacles
  ctx.fillStyle = "#3f51b5"; // blue
  
  // Draw a cluster of spikes
  const spikeCount = 5;
  const spikeWidth = obstacleWidth / spikeCount;
  
  for (let i = 0; i < spikeCount; i++) {
    const spikeX = obstacle.x - obstacleWidth / 2 + i * spikeWidth + spikeWidth / 2;
    
    // Draw spike triangle
    ctx.beginPath();
    ctx.moveTo(spikeX, obsY - obstacleHeight / 2);
    ctx.lineTo(spikeX + spikeWidth / 2, obsY + obstacleHeight / 2);
    ctx.lineTo(spikeX - spikeWidth / 2, obsY + obstacleHeight / 2);
    ctx.closePath();
    ctx.fill();
  }
}
}

// ------------------------------------------------------
// 7) COLLISION & GAME LOGIC
// ------------------------------------------------------

// AABB collision detection (modified to work with new shapes)
function checkCollision(birdX, birdY, birdSize, obstacleX, obstacleY, obstacleWidth, obstacleHeight, obstacleType) {
// For simplicity, we'll still use a slightly smaller AABB for the bird despite its new shape
const birdRadius = birdSize / 2;

if (obstacleType === "finish") {
  // Finish line collision - use a rectangle for the pole
  return (
    Math.abs(birdX - obstacleX) < birdRadius + 4 &&
    Math.abs(birdY - obstacleY) < birdRadius + obstacleHeight
  );
} else {
  // For spikes, we'll use a slightly adjusted hitbox (triangle-ish shape)
  const halfObstacleWidth = obstacleWidth / 2;
  
  // Calculate if the bird's circle collides with the spike area
  return (
    birdX + birdRadius > obstacleX - halfObstacleWidth &&
    birdX - birdRadius < obstacleX + halfObstacleWidth &&
    birdY + birdRadius > obstacleY - obstacleHeight / 2 &&
    birdY - birdRadius < obstacleY + obstacleHeight / 2
  );
}
}

let isLosing = false;

function showLoseScreen() {
  if (isLosing) return;
  isLosing = true;
  
  const loseScreen = document.getElementById('loseScreen');
  const gameCanvas = document.getElementById('gameCanvas');
  
  // Start effects
  gameCanvas.style.transform = 'translate(0, 0)';
  gameCanvas.style.animation = 'shake 0.5s linear infinite, redFlicker 0.1s linear infinite';
  
  // Phase 1: Shake + red flicker
  setTimeout(() => {
    gameCanvas.style.animation = 'none';
    loseScreen.style.backgroundColor = 'rgba(0,0,0,1)';
    loseScreen.classList.add('active');
    document.querySelector('.death-content').classList.add('visible');
  }, 500);

  // Phase 2: Fully black
  setTimeout(() => {
    isLosing = false;
  }, 1500);
}

function hideLoseScreen() {
  const loseScreen = document.getElementById('loseScreen');
  const gameCanvas = document.getElementById('gameCanvas');
  
  // Reset all effects
  loseScreen.style.backgroundColor = 'rgba(0,0,0,0)';
  loseScreen.classList.remove('active');
  document.querySelector('.death-content').classList.remove('visible');
  gameCanvas.style.animation = '';
  gameCanvas.style.transform = '';
}

// Updated event listeners
document.getElementById('retryButton').addEventListener('click', () => {
  if (isLosing) return;
  hideLoseScreen();
});

document.getElementById('quitButton').addEventListener('click', () => {
    setTimeout(() => {
        localStorage.removeItem('selectedFunction');
        window.location.href = 'index.html';
    }, 1000);
});

document.querySelectorAll('.icon-button, #startButton, .toggle-button').forEach(btn => {
  btn.addEventListener('click', () => {
      if (window.soundManager.initialized) {
          window.soundManager.playSound('click');
      }
  });
});


document.addEventListener('DOMContentLoaded', () => {
  if (window.soundManager.initialized && localStorage.getItem('currentMusic')) {
      window.soundManager.playMusic(localStorage.getItem('currentMusic'), true);
  } else {
    window.soundManager.init()
    window.soundManager.crossfadeMusic('menuMusic', 1.0);
  }
});

// Reset the game
function resetGame() {
  cancelAnimationFrame(animationFrameId);
  gameActive = false;
  birdX = 0;

  // Play lose sound effect
  if (window.soundManager && window.soundManager.initialized) {
    window.soundManager.playSound('lose');
    // Switch back to menu music with crossfade
    window.soundManager.crossfadeMusic('menuMusic', 2.2);
  }

  showLoseScreen();

  // Show the start button and controls again
  startButton.style.display = "grid";
  controls.style.display = "grid";

  // Clear and redraw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBirdCurve();
  obstacles.forEach(drawObstacle);
}

// Win the game
function gameWin() {
  cancelAnimationFrame(animationFrameId);
  gameActive = false;
  startButton.style.display = "block";
  controls.style.display = "block";

  // Play win sound effect
  if (window.soundManager && window.soundManager.initialized) {
    window.soundManager.playSound('win');
    // Switch back to menu music with crossfade
    window.soundManager.crossfadeMusic('menuMusic', 2);
  }

  // Clear and redraw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBirdCurve();
  obstacles.forEach(drawObstacle);

  // Display the winning text
  ctx.font = "30px Arial";
  ctx.fillStyle = "#4caf50";
  ctx.fillText("You Win!", canvas.width / 2 - 60, canvas.height / 2);

  // After 2 seconds, reset
  setTimeout(() => {
    birdX = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBirdCurve();
    obstacles.forEach(drawObstacle);
  }, 2000);
}

// ------------------------------------------------------
// 8) MAIN GAME LOOP
// ------------------------------------------------------
function gameLoop() {
ctx.clearRect(0, 0, canvas.width, canvas.height);

// 1) Draw the bird's path - REMOVED during gameplay (only shown before start)
drawBirdCurve();

// 2) Draw obstacles
obstacles.forEach(drawObstacle);

// 3) Bird's y = user-chosen function
const birdY = evaluateBirdFunction(birdX);
drawBird(birdX, birdY);

// 4) Check collisions
for (let obstacle of obstacles) {
  const obsY = computeObstacleY(obstacle);
  if (checkCollision(birdX, birdY, birdSize, obstacle.x, obsY, obstacleWidth, obstacleHeight, obstacle.type)) {
    if (obstacle.type === "finish") {
      console.log("Finish line reached!");
      gameWin();
      return;
    } else {
      console.log("Collision with obstacle. Resetting game.");
      resetGame();
      return;
    }
  }
}

// 5) Move bird along x
birdX += speed;

// Reset if the bird goes off the right edge
if (birdX - birdSize / 2 > canvas.width) {
  resetGame();
  return;
}

animationFrameId = requestAnimationFrame(gameLoop);
}

// ------------------------------------------------------
// 9) USER INPUTS (CHANGE BIRD'S FUNCTION & PARAMETERS)
// ------------------------------------------------------
function updateBirdParameters() {
// Only allow changes when the game is NOT running
if (!gameActive) {
  // Play value change sound effect
  if (window.soundManager && window.soundManager.initialized) {
    window.soundManager.playSound('valueChange');
  }
  
  // Bird's function type
  //birdFunctionType = birdFunctionSelect.value;

  // Bird's amplitude, frequency, phase, vertical shift
  birdAmplitude = parseFloat(birdAmplitudeInput.value) || amplitude;
  birdFrequency = parseFloat(birdFrequencyInput.value) || frequency;
  birdPhase = parseFloat(birdPhaseInput.value) || phase;
  birdVerticalShift = parseFloat(birdVerticalShiftInput.value) || baseVerticalShift;

  // Redraw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBirdCurve();
  obstacles.forEach(drawObstacle);
}
}

// Listen for input changes
//birdFunctionSelect.addEventListener("change", updateBirdParameters);
birdAmplitudeInput.addEventListener("input", updateBirdParameters);
birdFrequencyInput.addEventListener("input", updateBirdParameters);
birdPhaseInput.addEventListener("input", updateBirdParameters);
birdVerticalShiftInput.addEventListener("input", updateBirdParameters);

// ------------------------------------------------------
// 10) START BUTTON
// ------------------------------------------------------
startButton.addEventListener("click", function () {
if (!gameActive) {
  gameActive = true;
  birdX = 0;
  
  // Initialize audio if not already done
  if (window.soundManager && !window.soundManager.initialized) {
    window.soundManager.init();
  }
  
  // Play click sound
  if (window.soundManager && window.soundManager.initialized) {
    window.soundManager.playSound('click');
    // Switch to game music with crossfade
    window.soundManager.crossfadeMusic('gameMusic', 1.0);
  }
  
  // Hide the start button and controls while playing
  startButton.style.display = "none";
  controls.style.display = "none";
  gameLoop();
}
});

// ------------------------------------------------------
// INITIAL DRAW
// ------------------------------------------------------
drawBirdCurve();
obstacles.forEach(drawObstacle);
