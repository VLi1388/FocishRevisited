// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    const tabTitle = tab.title || "Unknown Tab";

    chrome.storage.local.set({ currentTab: tabTitle }, () => {
      console.log(`Current tab set to "${tabTitle}"`);
      checkForMismatch(tabTitle);
    });
  });
});

// Check for mismatch between current tab and logged tabs
const checkForMismatch = (currentTab, callback) => {
  chrome.storage.local.get(["accessedTabs"], (data) => {
    const accessedTabs = data.accessedTabs || [];
    let mismatchStatus = "No tabs have been logged yet.";

    if (accessedTabs.length === 0) {
      mismatchStatus = "No tabs have been logged yet.";
    } else if (!accessedTabs.includes(currentTab)) {
      mismatchStatus = "Mismatch detected.";
    } else {
      mismatchStatus = "No mismatch detected.";
    }

    // Save the mismatch status to storage
    chrome.storage.local.set({ mismatchStatus }, () => {
      console.log(`Mismatch status updated: ${mismatchStatus}`);
      callback?.(); // Call the callback after updating the mismatch status
    });
  });
};

// Handle messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "logTab") {
    logTab(message.tabTitle, () => {
      console.log("Tab logged, now updating mismatch status...");
      checkForMismatch(message.tabTitle, () => {
        sendResponse({ status: "ok" }); // Notify popup only after mismatch status is updated
        console.log("Notified popup after updating mismatch status.");
      });
    });
  } else if (message.action === "clearTabs") {
    clearTabs(() => {
      console.log("Tabs cleared, now updating mismatch status...");
      checkForMismatch(null, () => {
        sendResponse({ status: "ok" }); // Notify popup only after mismatch status is updated
        console.log("Notified popup after clearing tabs and updating mismatch status.");
      });
    });
  }

  return true; // Indicates the response will be sent asynchronously
});

// Log the current tab
const logTab = (tabTitle, callback) => {
  chrome.storage.local.get(["accessedTabs"], (data) => {
    const accessedTabs = data.accessedTabs || [];

    if (!accessedTabs.includes(tabTitle)) {
      accessedTabs.push(tabTitle);

      // Save the updated tabs
      chrome.storage.local.set({ accessedTabs }, () => {
        console.log(`Tab "${tabTitle}" logged.`);
        callback?.();
      });
    } else {
      console.log(`Tab "${tabTitle}" is already logged.`);
      callback?.();
    }
  });
};

// Clear all logged tabs
const clearTabs = (callback) => {
  chrome.storage.local.set({ accessedTabs: [] }, () => {
    console.log("All logged tabs cleared.");
    callback?.();
  });
};

// code for timer, we are doing 2 hour study sessions
let timerId = null; // For the countdown timer
let timeTotal = 7200; // 2 hours
let timeLeft = timeTotal;
let checkIntervalId = null; // For the periodic checks
let sessionCompleted = false; // by default the we have not ran a whole session

// Start the timer
function startTimer() {
  sessionCompleted = false;
  chrome.storage.local.set({ sessionCompleted });
  console.log("sessionCompleted set to false");

  if (!timerId) {
    timerId = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        console.log(`Time Left: ${formatTime(timeLeft)}`);

        // Save the current timer state
        chrome.storage.local.set({ timeLeft });
      } else {
        stopTimer(); // Stop the timer when it reaches 0
        console.log("Timer ended.");
      }
    }, 1000); // Decrease time every second
  }

  // Start the 10-second mismatch checker
  if (!checkIntervalId) {
    checkIntervalId = setInterval(() => {
      performMismatchCheck();
    }, 10000); // Every 10 seconds
  }

  console.log("Timer started.");
}

// Pause the timer
function pauseTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    console.log("Timer paused.");
  }

  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.log("Periodic check paused.");
  }
}

// Quit the timer
function quitTimer() {
  pauseTimer(); // Stop the timer and checker
  timeLeft = timeTotal; // Reset time
  currentWaterHeight = 100; // Reset water level
  chrome.storage.local.set({ timeLeft, currentWaterHeight }, () => {
    console.log(`Timer quit and water level reset to "${currentWaterHeight}"`);

    // Notify popup about the reset water level
    chrome.runtime.sendMessage({
      action: "updateWaterLevel",
      currentWaterHeight
    });
  });
}

// Stop the timer once it successfully reaches 0
function stopTimer() {
  pauseTimer(); // Stop the timer and checker
  timeLeft = timeTotal; // Reset time
  chrome.storage.local.set({ timeLeft }); // Save the reset state
  sessionCompleted = true;
  chrome.storage.local.set({ sessionCompleted });
  console.log("sessionCompleted set to true");
  console.log("Timer ended.");
}

// Format time as HH:MM:SS
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Perform mismatch check
function performMismatchCheck() {
  chrome.storage.local.get(["mismatchStatus"], (data) => {
    const mismatchStatus = data.mismatchStatus || "No mismatch detected.";
    console.log(`Performing check: ${mismatchStatus}`);

    if (mismatchStatus === "Mismatch detected.") {
      // Decrease water level
      decreaseWaterLevel();
    }
  });
}

let currentWaterHeight = 100;

// Decrease water level
function decreaseWaterLevel() {
  console.log("Water level decreased due to mismatch.");
  currentWaterHeight -= 5; // decrease water level by 5
  if (currentWaterHeight < 0) currentWaterHeight = 0; // Ensure water level doesn't go below 0

  // Update storage and notify popup
  chrome.storage.local.set({ currentWaterHeight }, () => {
    console.log(`Current water level set to "${currentWaterHeight}"`);

    // Notify popup of the updated water level
    chrome.runtime.sendMessage({
      action: "updateWaterLevel",
      currentWaterHeight
    });
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startTimer") {
    startTimer();
    sendResponse({ status: "Timer started" });
  } else if (message.action === "pauseTimer") {
    pauseTimer();
    sendResponse({ status: "Timer paused" });
  } else if (message.action === "quitTimer") {
    quitTimer();
    sendResponse({ status: "Timer quit" });
  } else if (message.action === "getTimeStatus") {
    sendResponse({ timeLeft, timeTotal, sessionCompleted });
  }

  return true; // Keep the message channel open for asynchronous responses
});
  


// Log when the extension starts
console.log("Background service worker running...");