document.addEventListener("DOMContentLoaded", () => {
  const statusElement = document.getElementById("status");
  const loggedTabsList = document.getElementById("logged-tabs");
  const currentTabText = document.getElementById("current-tab");
  const logButton = document.getElementById("log-tab-button");
  const clearButton = document.getElementById("clear-tabs-button");
  const mismatchStatusText = document.getElementById("mismatch-status");

  // variables for timer
  const countdownContainer = document.getElementById("countdown-container");
  const countdownTimer = document.getElementById("countdown-timer");
  const startButton = document.getElementById("start-button");
  const pauseButton = document.getElementById("pause-button");
  const quitButton = document.getElementById("quit-button");

  // variables for fish container
  const fishContainer = document.getElementById("fish-container");
  const waterLevel = document.getElementById("water-level");
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

  // Create the fish image element instead of using a text span
  let frameIndex = 0; // Start at the first frame
  const fish = document.createElement("img");
  fish.style.position = "absolute";
  fish.style.width = "40px"; // Set desired width (smaller size)
  fish.style.height = "auto"; // Maintain aspect ratio
  fishContainer.appendChild(fish);

  let directionX = 1; // Horizontal movement direction: -1, 0, or 1
  let directionY = 1; // Vertical movement direction: -1, 0, or 1
  let fishMovementInterval;
  let turnInterval;

  // currentWaterHeight = parseInt(localStorage.getItem("currentWaterHeight")) || 100;
  fishX = parseFloat(localStorage.getItem("fishX")) || 50;
  fishY = parseFloat(localStorage.getItem("fishY")) || 50;
  // waterLevel.style.height = `${currentWaterHeight}%`;

  fish.style.left = `${fishX}px`;
  fish.style.top = `${fishY}px`;

  // moving the fish every 50 time interval
  fishMovementInterval = setInterval(moveFish, 50); 
  // turning the fish every 5000 time interval
  turnInterval = setInterval(randomTurn, 5000); 

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
  
  // Function to load current tab
  const loadCurrentTab = () => {
    chrome.storage.local.get("currentTab", (data) => {
      const currentTab = data.currentTab || "No tab detected yet.";
      currentTabText.innerHTML = `${currentTab}`;
    });
  };

  // Function to load and display logged tabs
  const loadLoggedTabs = () => {
    chrome.storage.local.get("accessedTabs", (data) => {
      const accessedTabs = data.accessedTabs || [];
      loggedTabsList.innerHTML = ""; // Clear existing list

      if (accessedTabs.length === 0) {
        statusElement.innerText = "No tabs have been logged yet.";
      } else {
        accessedTabs.forEach((tabTitle) => {
          const listItem = document.createElement("li");
          listItem.textContent = tabTitle;
          loggedTabsList.appendChild(listItem);
        });
        statusElement.innerText = "Tabs loaded successfully.";
      }
    });
  };

  // Function to load mismatch status
  const loadMismatchStatus = () => {
    chrome.storage.local.get("mismatchStatus", (data) => {
      const mismatchStatus = data.mismatchStatus || "No tabs have been logged yet.";
      // mismatchStatusText.innerText = mismatchStatus;
    });
  };

  // Function to load fish tank
  const loadFishTank = () => {
    chrome.storage.local.get("currentWaterHeight", (data) => {
      const currentWaterHeight = data.currentWaterHeight || 100;
      waterLevel.style.height = `${currentWaterHeight}%`;
    });
  };

  // Unified function to refresh all displayed data
  const refreshPopupData = () => {
    loadLoggedTabs();
    loadCurrentTab();
    loadMismatchStatus();
    checkTimerState();
    loadFishTank();
  };

  // Handle the "Log this Tab" button click
  logButton.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const tabTitle = tabs[0].title || "Unknown Tab";

        // Send a message to the background script to log the tab
        chrome.runtime.sendMessage({ action: "logTab", tabTitle }, (response) => {
          if (response?.status === "ok") {
            refreshPopupData(); // Refresh popup after logging the tab
            console.log("Refreshed popup data from log button");
          }
        });
      } else {
        statusElement.innerText = "No active tab detected.";
      }
    });
  });

  // Handle the "Clear Accessed Tabs" button click
  clearButton.addEventListener("click", () => {
    // Send a message to the background script to clear tabs
    chrome.runtime.sendMessage({ action: "clearTabs" }, (response) => {
      if (response?.status === "ok") {
        refreshPopupData(); // Refresh popup after clearing tabs
        console.log("Refreshed popup data from clear button");
      }
    });
  });

  const checkTimerState = () => {
    chrome.runtime.sendMessage({ action: "getTimeStatus" }, (response) => {
      const timeLeft = response.timeLeft || 0;
      const timeTotal = response.timeTotal || 0;
      const sessionCompleted = response.sessionCompleted || false;
      
      // timer not started: only the start button
      // timer started: pause, quit, and countdown
      // finished one session: start button and timer countdown

      if (timeLeft == timeTotal) {
        // timer not started, only show start button
        console.log("timer has not started yet");

        countdownContainer.classList.add("hidden");
        startButton.classList.remove("hidden");
        pauseButton.classList.add("hidden");
        quitButton.classList.add("hidden");
        updateTimerDisplay();
      } else if (timeLeft > 0 && sessionCompleted == false) {
        // timer is running, show pause, quit, countdown
        console.log("timer is running");

        countdownContainer.classList.remove("hidden");
        startButton.classList.add("hidden");
        pauseButton.classList.remove("hidden");
        quitButton.classList.remove("hidden");
        updateTimerDisplay();
      } else {
        // timer ended, show start, countdown
        console.log("timer ended");

        countdownContainer.classList.remove("hidden");
        startButton.classList.remove("hidden");
        pauseButton.classList.add("hidden");
        quitButton.classList.add("hidden");
        updateTimerDisplay();
      }
    });
  };

   // Update the timer display
   const updateTimerDisplay = () => {
    chrome.runtime.sendMessage({ action: "getTimeStatus" }, (response) => {
      const timeLeft = response.timeLeft || 0;
      const sessionCompleted = response.sessionCompleted || false;

      if (sessionCompleted == false) {
        countdownTimer.textContent = `Time Left: ${formatTime(timeLeft)}`;
      } else {
        countdownTimer.textContent = `You finished your session!`;
        pauseButton.classList.add("hidden");
      }
    });
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle the Start button
  startButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "startTimer" }, (response) => {
      console.log(response.status);
      countdownContainer.classList.remove("hidden");
      startButton.classList.add("hidden");
      pauseButton.classList.remove("hidden");
      quitButton.classList.remove("hidden");
    });
  });

  // Handle the Pause button
  pauseButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "pauseTimer" }, (response) => {
      console.log(response.status);
      pauseButton.classList.add("hidden");
      startButton.textContent = "Continue";
      startButton.classList.remove("hidden");
    });
  });

  // Handle the Quit button
  quitButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "quitTimer" }, (response) => {
      console.log(response.status);
      countdownContainer.classList.add("hidden");
      startButton.textContent = "Start";
      startButton.classList.remove("hidden");
      pauseButton.classList.add("hidden");
      quitButton.classList.add("hidden");
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateWaterLevel") {
      const { currentWaterHeight } = message;
  
      // Update the water level display
      waterLevel.style.height = `${currentWaterHeight}%`;
  
      // Optionally log for debugging
      console.log(`Water level updated to ${currentWaterHeight}% in the popup`);

      // If tank empties out, stop the fish movement and remove the fish
      if (currentWaterHeight <= 0) {
        chrome.runtime.sendMessage({ action: "pauseTimer" }, (response) => {
          console.log(response.status);
          pauseButton.classList.add("hidden");
          startButton.classList.add("hidden");
          quitButton.classList.remove("hidden");
        });
        clearInterval(fishMovementInterval); // Stop movement
        clearInterval(turnInterval); // Stop random turns
        fishContainer.removeChild(fish); // Remove the fish from the container
        fishContainer.innerHTML = "<p>You've killed your fish 😡</p>";
      }
    }
  });

  // Load the popup
  refreshPopupData();
  
  // Continuously update the timer display every second
  setInterval(updateTimerDisplay, 1000);
});
