// Get references to elements
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const urlContainer = document.getElementById("url-container");
const submitButton = document.getElementById("submit-button");

// Validate time inputs
hoursInput.addEventListener("input", () => {
    if (hoursInput.value < 0) hoursInput.value = 0; // Prevent negative numbers
});

minutesInput.addEventListener("input", () => {
    if (minutesInput.value < 0) minutesInput.value = 0; // Prevent negative numbers
    if (minutesInput.value > 59) minutesInput.value = 59; // Limit minutes to 59
});

// Handle adding new URL inputs
urlContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-url-button")) {
        // Hide the "+" button for the previous row
        const addButtons = urlContainer.querySelectorAll(".add-url-button");
        addButtons.forEach((button) => button.classList.add("hidden"));

        // Create a new URL row
        const newRow = document.createElement("div");
        newRow.classList.add("url-row");
        newRow.innerHTML = `
            <input type="url" class="url-input" placeholder="https://example.com" />
            <button class="add-url-button">+</button>
        `;
        urlContainer.appendChild(newRow);
    }
});

// Handle Submit button click
submitButton.addEventListener("click", () => {
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;

    // Gather all entered URLs
    const urlInputs = document.querySelectorAll(".url-input");
    const urls = Array.from(urlInputs)
        .map((input) => input.value.trim())
        .filter((url) => url);

    if (hours === 0 && minutes === 0) {
        alert("Please set a valid study time.");
        return;
    }

    if (urls.length === 0) {
        alert("Please add at least one website.");
        return;
    }

    // Calculate total duration in seconds
    const totalDuration = hours * 3600 + minutes * 60;

    // Save the inputs to local storage
    localStorage.setItem("studyHours", hours);
    localStorage.setItem("studyMinutes", minutes);
    localStorage.setItem("focusURLs", JSON.stringify(urls));
    localStorage.setItem("countdown", totalDuration);

    alert(`Your study session is set for ${hours} hours, ${minutes} minutes, and ${urls.length} websites.`);


    // Select the first URL as monitoredUrl
    const monitoredUrl = urls[0]; // First URL entered
    console.log(`Automatically monitoring the first URL: ${monitoredUrl}`);
    
    if (!urls.includes(monitoredUrl)) {
        alert("Invalid URL selected for monitoring.");
        return;
    }

    // Send the monitored URL to background.js
    chrome.runtime.sendMessage({ action: "setUrl", url: monitoredUrl }, (response) => {
        if (response && response.success) {
            alert(`Monitoring set for ${monitoredUrl}.`);
        }
    });

    

    // Close the window after submission
    window.close();



});



