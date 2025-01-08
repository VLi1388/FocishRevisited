const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const quitButton = document.getElementById("quit-button");
const sessionStatus = document.getElementById("session-status");
const countdownContainer = document.getElementById("countdown-container");

let countdown = parseInt(localStorage.getItem("countdown")) || 0;
let timer; // To store the interval ID
let isPaused = false;


// variables for fish system
const fishContainer = document.getElementById("fish-container");
const waterLevel = document.getElementById("water-level");
const increaseWaterButton = document.getElementById("increase-water");
const decreaseWaterButton = document.getElementById("decrease-water");

// Animation frames for the fish using image paths for left and right directions
const fishFramesLt = [
    "fishFrames/L1.png",
    "fishFrames/L2.png",
    "fishFrames/L3.png",
    "fishFrames/L4.png",
    "fishFrames/L5.png"
];

const fishFramesRt = [
    "fishFrames/R1.png",
    "fishFrames/R2.png",
    "fishFrames/R3.png",
    "fishFrames/R4.png",
    "fishFrames/R5.png"
];

// Focus tracking variables
let monitoredUrls = JSON.parse(localStorage.getItem("focusURLs")) || [];
let monitoredUrl = null;

// Validate and set monitored URL if available
if (monitoredUrls.length > 0 && monitoredUrls[0]) {
    try {
        monitoredUrl = new URL(monitoredUrls[0]).hostname; // Extract hostname
        console.log("Monitored URL is set to:", monitoredUrl); // Add this debug log
    } catch (e) {
        console.error("Invalid URL in focusURLs:", e);
    }
}

let distractedTimer;
let isDistracted = false;

// Create the fish image element instead of using a text span
let frameIndex = 0; // Start at the first frame
const fish = document.createElement("img");
fish.style.position = "absolute";
fish.style.width = "50px"; // Set desired width (smaller size)
fish.style.height = "auto"; // Maintain aspect ratio
fishContainer.appendChild(fish);

// Movement variables
let currentWaterHeight = 100;
let fishX = 50; // Initial position
let fishY = 50;
let directionX = 1; // Horizontal movement direction: -1, 0, or 1
let directionY = 1; // Vertical movement direction: -1, 0, or 1
let fishMovementInterval;
let turnInterval;



// Add event listeners for tab monitoring on load
document.addEventListener("DOMContentLoaded", () => {
    // Existing initialization code for fish and water
    currentWaterHeight = parseInt(localStorage.getItem("currentWaterHeight")) || 100;
    fishX = parseFloat(localStorage.getItem("fishX")) || 50;
    fishY = parseFloat(localStorage.getItem("fishY")) || 50;
    waterLevel.style.height = `${currentWaterHeight}%`;
    fish.style.left = `${fishX}px`;
    fish.style.top = `${fishY}px`;
    fishMovementInterval = setInterval(moveFish, 50); 
    turnInterval = setInterval(randomTurn, 5000); 

    // Start session if countdown is active
    if (countdown > 0) {
        sessionStatus.textContent = "Session Active";
        countdownContainer.classList.remove("hidden");
        startButton.classList.add("hidden");
        pauseButton.classList.remove("hidden");
        quitButton.classList.remove("hidden");
        monitorTabActivity(); // Start monitoring tab activity
        startCountdown(countdown);
    }
});

// Tab monitoring for distractions
function monitorTabActivity() {
    if (monitoredUrl) {
        chrome.tabs.onActivated.addListener(() => {
            console.log("Tab activated.");
            checkActiveTab();
        });
        chrome.tabs.onUpdated.addListener(() => {
            console.log("Tab updated.");
            checkActiveTab();
        });
    } else {
        console.error("No valid focus URL to monitor.");
    }
}

// Check if the current tab matches the monitored URL
function checkActiveTab() {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url && tabs[0].url.startsWith("http")) {
            let activeUrl;
            try {
                activeUrl = new URL(tabs[0].url).hostname;
                console.log("Current Active Tab Hostname:", activeUrl);
            } catch (e) {
                console.error("Error constructing URL from active tab:", e);
                return;
            }

            // If the user is on the monitored URL, stop the distraction timer
            if (activeUrl === monitoredUrl) {
                console.log("User is on the focus page.");
                if (isDistracted) {
                    clearDistractedTimer();
                    isDistracted = false;
                }
            } else {
                console.log("User is off the focus page.");
                if (!isDistracted) {
                    startDistractedTimer();
                    isDistracted = true;
                }
            }
        } else {
            console.log("Skipping non-http URL:", tabs[0].url || "No URL available");
        }
    });
}

// Start the distraction timer to decrease water level
function startDistractedTimer() {
    console.log("Starting distraction timer.");
    distractedTimer = setInterval(() => {
        console.log("Distracted for 10 seconds, reducing water level.");
        updateWaterLevel(-10); // Decrease water by 10% every 10 seconds
        if (currentWaterHeight === 0) {
            console.log("Water level depleted; stopping distraction timer.");
            clearInterval(distractedTimer);
        }
    }, 10000);
}

// Stop the distraction timer when user returns to focus
function clearDistractedTimer() {
    if (distractedTimer) {
        clearInterval(distractedTimer);
        distractedTimer = null;
        console.log("Cleared distraction timer; user returned to focus page.");
    }
}

// Start countdown timer
function startCountdown(totalDuration) {
    const countdownElement = document.getElementById("countdown-timer");
    const sessionStatus = document.getElementById("session-status");

    let startTime = parseInt(localStorage.getItem("countdownStartTime"), 10);
    if (!startTime) {
        startTime = Date.now();
        localStorage.setItem("countdownStartTime", startTime);
        localStorage.setItem("countdownDuration", totalDuration);
    }

    function updateCountdown() {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        const remainingTime = totalDuration - elapsedTime;

        if (remainingTime <= 0) {
            clearInterval(timer);
            countdownElement.textContent = "Session Complete!";
            sessionStatus.textContent = "🎉 Congratulations! Mission Complete! 🎉";
            localStorage.removeItem("countdownStartTime");
            localStorage.removeItem("countdownDuration");
            pauseButton.classList.add("hidden");
            quitButton.textContent = "Close";
            return;
        }

        const hours = Math.floor(remainingTime / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        const seconds = remainingTime % 60;
        countdownElement.textContent = `Time Left: ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    updateCountdown();
    timer = setInterval(updateCountdown, 1000);
}

// Handle Start button click
startButton.addEventListener("click", () => {
    console.log("Start button clicked!");

    const newWindow = window.open(
        "start.html",
        "FocishSettings",
        `width=${window.innerWidth},height=${window.innerHeight},top=0,left=0`
    );

    if (!newWindow) {
        alert("Popup blocked! Please allow popups for this site.");
        return;
    }

    // Monitor if the new window is closed by checking focus back on the main window
    const checkWindowFocus = () => {
        if (newWindow.closed) {
            window.removeEventListener("focus", checkWindowFocus);
            location.reload(); // Refresh once the window is confirmed closed
        }
    };

    window.addEventListener("focus", checkWindowFocus);
});

// Pause button logic
pauseButton.addEventListener("click", () => {
    const sessionStatus = document.getElementById("session-status");

    if (isPaused) {
        // Resume the countdown
        isPaused = false;
        sessionStatus.textContent = "Session Active";
        pauseButton.textContent = "Pause";

        // Update the start time to account for the paused duration
        const pausedTime = parseInt(localStorage.getItem("pausedTime"), 10);
        const savedStartTime = parseInt(localStorage.getItem("countdownStartTime"), 10);

        // Adjust start time to "resume" the countdown correctly
        const adjustedStartTime = Date.now() - (pausedTime - savedStartTime);
        localStorage.setItem("countdownStartTime", adjustedStartTime);

        // Resume the countdown
        startCountdown(countdown);
    } else {
        // Pause the countdown
        isPaused = true;
        sessionStatus.textContent = "Session Paused";
        pauseButton.textContent = "Resume";

        // Save the paused time
        localStorage.setItem("pausedTime", Date.now());

        // Stop the timer
        clearInterval(timer);
    }
});


// Quit button logic
quitButton.addEventListener("click", () => {
    const countdownElement = document.getElementById("countdown-timer");
    const sessionStatus = document.getElementById("session-status");

    // Stop the active timer
    clearInterval(timer);

    // Clear countdown-related data from localStorage
    localStorage.removeItem("countdownStartTime");
    localStorage.removeItem("countdownDuration");
    localStorage.removeItem("pausedTime");
    localStorage.removeItem("countdown"); // This ensures the countdown doesn't persist

    // Reset countdown and UI state
    countdown = 0; // Reset countdown variable
    sessionStatus.textContent = "SEE YOU NEXT TIME YOU BETTER COME BACK TO STUDY MORE!";
    countdownElement.textContent = ""; // Clear the countdown display
    countdownContainer.classList.add("hidden"); // Hide countdown display
    startButton.classList.remove("hidden"); // Show Start button
    pauseButton.classList.add("hidden"); // Hide Pause button
    quitButton.classList.add("hidden"); // Hide Quit button
});


// functions for fish system
// Function to update the fish's position and direction
function moveFish() {
    // Determine the current frames based on direction
    const currentFrames = directionX >= 0 ? fishFramesLt : fishFramesRt;

    // Update the frame for animation
    fish.src = currentFrames[frameIndex]; // Set the image source to the current frame
    frameIndex = (frameIndex + 1) % currentFrames.length; // Cycle through frames

    // Calculate new position
    fishX += directionX * 0.7; // Adjust movement speed by changing multiplier
    fishY += directionY * 0.7;

    // Get bounds for movement within the water level
    const waterRect = waterLevel.getBoundingClientRect();
    const containerRect = fishContainer.getBoundingClientRect();

    // Calculate minY and maxY based on current water level height
    const minY = containerRect.height - waterRect.height;
    const maxY = containerRect.height - fish.offsetHeight;
    const minX = 0;
    const maxX = containerRect.width - fish.offsetWidth;

    // Boundary check and change direction if necessary
    if (fishX <= minX || fishX >= maxX) directionX *= -1;
    if (fishY <= minY || fishY >= maxY) directionY *= -1;

    // Apply the updated position
    fish.style.left = `${fishX}px`;
    fish.style.top = `${fishY}px`;

    // Save fish position to localStorage
    localStorage.setItem("fishX", fishX);
    localStorage.setItem("fishY", fishY);
}

// Randomly decide to turn every 10 seconds
function randomTurn() {
    const turnDecision = Math.floor(Math.random() * 5) + 1;
    if (turnDecision === 2) { // If the random number is 6, change direction
        directionX = (Math.floor(Math.random() * 3) - 1); // -1, 0, or 1
        directionY = (Math.floor(Math.random() * 3) - 1); // -1, 0, or 1
    }
}

// Function to update the water level height
function updateWaterLevel(change) {
    currentWaterHeight += change;
    if (currentWaterHeight > 100) currentWaterHeight = 100;
    if (currentWaterHeight < 0) currentWaterHeight = 0;

    waterLevel.style.height = `${currentWaterHeight}%`;

    // If water level reaches 0, stop the fish movement and remove the fish
    if (currentWaterHeight === 0) {
        clearInterval(fishMovementInterval); // Stop movement
        clearInterval(turnInterval); // Stop random turns
        fishContainer.removeChild(fish); // Remove the fish from the container
        fishContainer.innerHTML = "<p>You've killed your fish 😡</p>";
    }

    // Save current water level to localStorage
    localStorage.setItem("currentWaterHeight", currentWaterHeight);
}

// Event listeners for water level control buttons
increaseWaterButton.addEventListener("click", () => {
    if (currentWaterHeight < 100) updateWaterLevel(10);
});

decreaseWaterButton.addEventListener("click", () => {
    if (currentWaterHeight > 0) updateWaterLevel(-10);
});