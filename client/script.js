import bot from "./assets/bot.svg";
import user from "./assets/user.svg";

let answerIsLoading = false;
const form = document.querySelector("form");
const chatContainer = document.querySelector("#chat_container");

let loadInterval;

// For showing the three dots while it's "thinking"
function loader(element) {
  element.textContent = "";
  loadInterval = setInterval(() => {
    element.textContent += ".";

    if (element.textContent === "....") {
      element.textContent = "";
    }
  }, 300);
}

// For the typewriter effect when bot's answer is showing
function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    // Check if we are still typing
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
      answerIsLoading = false;
    }
  }, 20);
}

// Create unique Id for every single message to be able to map over them
function generateUniqueId() {
  const timeStamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timeStamp}-${hexadecimalString}`;
}

// Dialogue stripes
function chatStripe(isAi, value, uniqueId) {
  return (
    //
    `
    <div class="wrapper ${isAi && "ai"}">
      <div class="chat">
        <div class="profile">
          <img
            src="${isAi ? bot : user}"
            alt="${isAi ? "bot" : "user"}"
          />
        </div>
        <div class="message" id="${uniqueId}">${value}</div>
      </div>
    </div>
    `
  );
}

function createBotMessageDiv_AndAddItToHTML() {
  const uniqueId = generateUniqueId();

  chatContainer.innerHTML += chatStripe(true, "", uniqueId);
  // Put the new message in view
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Fetch the newly created div
  return document.getElementById(uniqueId);
}

// Submit Button Handler
const handleSubmit = async (e) => {
  e.preventDefault();
  // check if bot is still "typing" the answer
  if (answerIsLoading) return;

  // Taking the data from the Form
  const data = new FormData(form);

  const promptValue = data.get("prompt");
  // User's chatstripe
  chatContainer.innerHTML += chatStripe(false, promptValue);

  form.reset();

  const messageDiv = createBotMessageDiv_AndAddItToHTML();

  // Check if the user typed only whitespace
  const onlyWhiteSpace = (string) => string.trim().length === 0;

  if (onlyWhiteSpace(promptValue)) {
    typeText(messageDiv, "What do you mean...?");

    return;
  }

  // For the three dots to be appeared as loading state
  loader(messageDiv);

  // Fetch data from server -> bot's response

  if (!answerIsLoading) {
    answerIsLoading = true;

    const response = await fetch("http://localhost:5000", {
      method: "POST",
      headers: {
        "Content-Type": " application/json",
      },
      body: JSON.stringify({ prompt: promptValue }),
    });

    // Stop loading (three dots)
    clearInterval(loadInterval);
    // Clear the dots
    messageDiv.innerHTML = "";

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim();

      typeText(messageDiv, parsedData);
    } else {
      const err = await response.json();

      messageDiv.innerHTML = "Something went wrong...";
      alert(err);
    }
  }
};

// Initialize bot's welcome message
const messageDiv = createBotMessageDiv_AndAddItToHTML();
typeText(messageDiv, "You're welcome! How can I help you?");

// Event Listeners
form.addEventListener("submit", handleSubmit);
form.addEventListener("keyup", (e) => {
  if (e.key == "Enter") {
    handleSubmit(e);
  }
});
