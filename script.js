// Backend URL configuration
// For local development: 'http://127.0.0.1:5000'
// For production: Update to your deployed backend URL
const BACKEND_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "https://your-backend-url.com"; // Update this to your deployed backend URL

const recordButton = document.getElementById("recordButton");
const inputText = document.getElementById("inputText");
const analyzeButton = document.getElementById("analyzeButton");
const sentimentResult = document.getElementById("sentimentResult");
const keywordsResult = document.getElementById("keywordsResult");
const designRelevanceResult = document.getElementById("designRelevanceResult");
const fullTextDisplay = document.getElementById("fullTextDisplay");
const tabsContainer = document.getElementById("tabs");
const resultsContainer = document.getElementById("resultsContainer");
let tabCounter = 0;
const noteInput = document.getElementById("noteInput");

// Vocabulary management
const vocabularyInput = document.getElementById("vocabularyInput");
const addVocabularyBtn = document.getElementById("addVocabularyBtn");
const vocabularyPills = document.getElementById("vocabularyPills");
const presetButtons = document.querySelectorAll(".preset-btn");

// Store current vocabulary
let currentVocabulary = [];

// Preset vocabularies
const presets = {
  design: [
    "Clarity",
    "Simplicity",
    "Elegance",
    "Consistency",
    "Balance",
    "Harmony",
    "Visual Appeal",
    "Intuitiveness",
    "User-Centric",
    "Legibility",
    "Accessibility",
    "Functionality",
    "Usability",
    "Flexibility",
    "Creativity",
    "Innovation",
    "Aesthetic Cohesion",
  ],
  business: [
    "Efficiency",
    "Scalability",
    "Sustainability",
    "Engagement",
    "Innovation",
    "Flexibility",
    "Growth",
    "Profitability",
    "Market Share",
    "Customer Satisfaction",
    "Competitive Advantage",
    "Strategic Planning",
    "Risk Management",
    "Value Creation",
  ],
  technical: [
    "Performance",
    "Reliability",
    "Scalability",
    "Security",
    "Maintainability",
    "Efficiency",
    "Robustness",
    "Modularity",
    "Documentation",
    "Testing",
    "Code Quality",
    "Architecture",
    "Optimization",
    "Compatibility",
    "Integration",
  ],
};

let recognition;
let isRecording = false;

// Check if we're on HTTPS or localhost (required for speech recognition)
function isSecureContext() {
  return (
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  if (!isSecureContext()) {
    console.warn(
      "Speech Recognition requires HTTPS or localhost. Voice recording may not work."
    );
    // Disable the record button visually
    recordButton.style.opacity = "0.5";
    recordButton.title =
      "Voice recording requires HTTPS or localhost. Please use a local server or HTTPS.";
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false; // Stop automatically after speech ends

  // Handle successful recognition
  recognition.onresult = (event) => {
    stopEllipsisAnimation();
    const transcript = event.results[0][0].transcript;
    inputText.value = transcript;
    isRecording = false;
    updateRecordButton(false);
  };

  // Handle when recognition ends
  recognition.onend = () => {
    stopEllipsisAnimation();
    isRecording = false;
    updateRecordButton(false);
    // If no transcript was captured, clear the recording message
    if (
      inputText.value === "Recording in progress." ||
      inputText.value.startsWith("Recording in progress")
    ) {
      inputText.value = "";
    }
  };

  // Handle errors
  recognition.onerror = (event) => {
    stopEllipsisAnimation();
    isRecording = false;
    updateRecordButton(false);

    let errorMessage = "Speech recognition error: ";
    switch (event.error) {
      case "no-speech":
        errorMessage = "No speech detected. Please try again.";
        break;
      case "audio-capture":
        errorMessage = "No microphone found. Please check your microphone.";
        break;
      case "not-allowed":
        errorMessage =
          "Microphone permission denied. Please allow microphone access in your browser settings.";
        break;
      case "service-not-allowed":
        errorMessage =
          "Speech recognition service not available. This usually means:\n\n1. The page must be served over HTTPS (or localhost)\n2. Your browser may not support this feature\n3. Try using Chrome or Edge browser\n\nYou can still type your feedback manually.";
        break;
      case "network":
        errorMessage = "Network error. Please check your internet connection.";
        break;
      case "aborted":
        // User stopped recording, no need to show error
        return;
      default:
        errorMessage = `Error: ${event.error}\n\nIf this persists, please type your feedback manually.`;
    }

    inputText.value = "";
    alert(errorMessage);
  };

  // Handle when speech starts
  recognition.onstart = () => {
    isRecording = true;
    updateRecordButton(true);
  };
} else {
  alert("Speech Recognition is not supported in your browser.");
}

let ellipsisInterval;
let ellipsisState = 0;

function startEllipsisAnimation() {
  ellipsisState = 0;
  ellipsisInterval = setInterval(() => {
    ellipsisState = (ellipsisState + 1) % 4;
    const ellipsis = ".".repeat(ellipsisState);
    inputText.value = `Recording in progress${ellipsis}`;
  }, 500);
}

function stopEllipsisAnimation() {
  if (ellipsisInterval) {
    clearInterval(ellipsisInterval);
    ellipsisInterval = null;
  }
}

function updateRecordButton(recording) {
  if (recording) {
    recordButton.style.background = "#ff3b30";
    recordButton.style.color = "#fff";
    recordButton.title = "Click to stop recording";
  } else {
    recordButton.style.background = "#f2f2f7";
    recordButton.style.color = "#1d1d1f";
    recordButton.title = "Click to start recording";
  }
}

recordButton.addEventListener("click", () => {
  if (!recognition) {
    alert(
      "Speech Recognition is not supported in your browser.\n\nPlease use Chrome, Edge, or Safari."
    );
    return;
  }

  // Check secure context before attempting to record
  if (!isSecureContext()) {
    alert(
      "Voice recording requires HTTPS or localhost.\n\n" +
        "To use voice recording:\n" +
        "1. Use a local development server (like VS Code's 'Go Live' extension)\n" +
        "2. Or serve the page over HTTPS\n" +
        "3. Or type your feedback manually in the text area"
    );
    return;
  }

  if (isRecording) {
    // Stop recording if already recording
    recognition.stop();
    stopEllipsisAnimation();
    isRecording = false;
    updateRecordButton(false);
  } else {
    // Start recording
    try {
      inputText.value = "Recording in progress.";
      startEllipsisAnimation();
      recognition.start();
    } catch (error) {
      // Handle case where recognition is already running
      if (error.name === "InvalidStateError") {
        recognition.stop();
        setTimeout(() => {
          recognition.start();
        }, 100);
      } else if (
        error.name === "NotAllowedError" ||
        error.message.includes("not allowed")
      ) {
        alert(
          "Microphone access denied.\n\n" +
            "Please:\n" +
            "1. Allow microphone access in your browser settings\n" +
            "2. Check your browser's permission settings for this site\n" +
            "3. Or type your feedback manually"
        );
        stopEllipsisAnimation();
        inputText.value = "";
      } else {
        console.error("Error starting recognition:", error);
        alert(
          "Error starting speech recognition: " +
            error.message +
            "\n\nPlease try again or type your feedback manually."
        );
        stopEllipsisAnimation();
        inputText.value = "";
      }
    }
  }
});

function createNewTab(data, text, note) {
  tabCounter++;

  const tabButton = document.createElement("button");
  tabButton.textContent = `${note}`;
  tabButton.className = "tab-button";
  tabButton.dataset.tabId = `tab-${tabCounter}`;

  tabButton.addEventListener("click", () => {
    switchToTab(tabButton.dataset.tabId);
  });

  tabsContainer.appendChild(tabButton);

  const tabContent = document.createElement("div");
  tabContent.id = `tab-${tabCounter}`;
  tabContent.className = "tab-content";

  const emotions = data.emotions || {};
  const topEmotions = Object.entries(emotions)
    .sort(([, aScore], [, bScore]) => bScore - aScore)
    .slice(0, 5);

  const keywords = data.keywords || [];
  const highlightedText = highlightKeywords(text, keywords);

  const termRelevance = data.term_relevance || [];
  console.log("Processing term relevance:", termRelevance);
  console.log("Term relevance length:", termRelevance.length);

  const topTermRelevance = termRelevance
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 4);

  console.log("Top term relevance:", topTermRelevance);

  const termHtml = topTermRelevance.length
    ? topTermRelevance
        .map(
          ({ term, relevance }) => `
          <div class="design-card">
            <div class="design-card-content">
              <div class="relevance-score">${(relevance * 100).toFixed(
                0
              )}%</div>
              <div class="design-term">${term}</div>
            </div>
          </div>`
        )
        .join("")
    : "<p>No relevant terms found</p>";

  tabContent.innerHTML = `
    <div class="full-text-container card">
    <span class="tooltip-icon" title="The KeyBERT model is used for keyword extraction. KeyBERT is based on BERT embeddings and is designed to extract keywords or keyphrases from the text using pre-trained BERT-based models.KeyBERT works by first embedding the input text into a high-dimensional vector space and then using this representation to identify key terms that are semantically important. The top n keyphrases are returned.">ⓘ</span>
      <h3>Original Text & Keywords:</h3>
      <p class="original-text">${text}</p>      
      <div class="keywords-container">
        <div class="keyword-pills">
          ${keywords
            .map(
              (keyword) =>
                `<span class="pill" data-keyword="${keyword}">${keyword}</span>`
            )
            .join("")}
        </div>
      </div>
    </div>
    <div class="sentiment-container card">
     <span class="tooltip-icon" title="The model used for emotion classification is RoBERTa (Robustly optimized BERT approach), fine-tuned for emotion detection. Specifically, it uses the model SamLowe/roberta-base-go_emotions, which is trained on the GoEmotions dataset. The model predicts the probability of the presence of 27 different emotions (like joy, anger, sadness, etc.) in the text. Each emotion has a score indicating its likelihood.">ⓘ</span>
      <h3>Sentiment Analysis:</h3>
      <div class="emotion-bars">
        ${topEmotions
          .map(
            ([emotion, score], index) =>
              `<div class="emotion-row">
                <span class="emotion-label">${capitalize(emotion)} ${Math.round(
                score * 100
              )}%</span>
                <div class="bar-container">
                  <div class="bar" style="width: ${Math.round(
                    score * 100
                  )}%;"></div>
                </div>
              </div>`
          )
          .join("")}
      </div>
    </div>
    <div class="design-relevance-container card">
     <span class="tooltip-icon" title="The SentenceTransformer model all-MiniLM-L6-v2 is used to obtain sentence-level embeddings for both the input text and your custom vocabulary terms. Cosine similarity is a metric that calculates the cosine of the angle between two vectors in a vector space. A higher cosine similarity score indicates that the text and the term are more similar.">ⓘ</span>
      <h3>Term Relevance Scores:</h3>
      <div class="design-grid">${termHtml}</div>
    </div>
  `;

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.style.display = "none";
  });

  resultsContainer.appendChild(tabContent);
  switchToTab(tabContent.id);

  addHoverEffectToPills(keywords);
}

function switchToTab(tabId) {
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.style.display = content.id === tabId ? "block" : "none";
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active-tab", button.dataset.tabId === tabId);
  });
}

function addHoverEffectToPills(keywords) {
  const pills = document.querySelectorAll(".pill");
  const originalTextElement = document.querySelector(".original-text");

  pills.forEach((pill) => {
    const keyword = pill.dataset.keyword.toLowerCase();

    pill.addEventListener("mouseover", () => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      originalTextElement.innerHTML = originalTextElement.textContent.replace(
        regex,
        (match) => `<span class="highlight">${match}</span>`
      );
    });

    pill.addEventListener("mouseout", () => {
      originalTextElement.innerHTML = originalTextElement.textContent;
    });
  });
}

analyzeButton.addEventListener("click", async () => {
  const text = inputText.value.trim();
  const note = noteInput.value.trim();
  if (!text) {
    alert("Please enter or record text to analyze.");
    return;
  }

  // Get current vocabulary
  const customVocabulary = currentVocabulary;

  console.log("Sending vocabulary to backend:", customVocabulary);
  console.log("Vocabulary length:", customVocabulary.length);

  try {
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        vocabulary: customVocabulary,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error("Backend error:", errorData);
      alert(`Error: ${errorData.error || "Failed to analyze text"}`);
      return;
    }

    const data = await response.json();

    console.log("Full response from backend:", JSON.stringify(data, null, 2));
    console.log("Term relevance received:", data.term_relevance);
    console.log("Response keys:", Object.keys(data));

    if (data.error) {
      alert(`Error: ${data.error}`);
    } else {
      createNewTab(data, text, note);
    }
  } catch (error) {
    console.error("Error during analysis:", error);
    alert("An error occurred while analyzing the text.");
  }
});

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function highlightKeywords(text, keywords) {
  let highlightedText = text;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    highlightedText = highlightedText.replace(
      regex,
      `<span class="highlight">${keyword}</span>`
    );
  });
  return highlightedText;
}

function fadeInHighlights(keyword) {
  const highlights = document.querySelectorAll(".highlight");
  highlights.forEach((highlight) => {
    if (highlight.textContent.toLowerCase() === keyword.toLowerCase()) {
      highlight.style.transition = "background-color 0.3s ease";
      highlight.style.backgroundColor = "#1a73e8";
      setTimeout(() => {
        highlight.style.backgroundColor = "transparent";
      }, 600);
    }
  });
}

// Vocabulary Management Functions
function addVocabularyTerm(term) {
  const trimmedTerm = term.trim();
  if (!trimmedTerm) return false;

  // Check if term already exists (case-insensitive)
  const termLower = trimmedTerm.toLowerCase();
  if (currentVocabulary.some((t) => t.toLowerCase() === termLower)) {
    return false;
  }

  currentVocabulary.push(trimmedTerm);
  renderVocabularyPills();
  return true;
}

function removeVocabularyTerm(term) {
  currentVocabulary = currentVocabulary.filter((t) => t !== term);
  renderVocabularyPills();
  return true;
}

function renderVocabularyPills() {
  vocabularyPills.innerHTML = "";

  currentVocabulary.forEach((term) => {
    const pill = document.createElement("span");
    pill.className = "vocab-pill";
    pill.dataset.term = term;
    pill.innerHTML = `${term} <i class="fas fa-times remove-term"></i>`;

    const removeBtn = pill.querySelector(".remove-term");
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeVocabularyTerm(term);
    });

    vocabularyPills.appendChild(pill);
  });
}

function loadPreset(presetName) {
  if (presets[presetName]) {
    currentVocabulary = [...presets[presetName]];
    console.log("Loaded preset:", presetName, "Vocabulary:", currentVocabulary);
    renderVocabularyPills();

    // Update active preset button
    presetButtons.forEach((btn) => {
      btn.classList.remove("active-preset");
      if (btn.dataset.preset === presetName) {
        btn.classList.add("active-preset");
      }
    });
  } else {
    console.warn("Preset not found:", presetName);
  }
}

// Vocabulary input handlers
addVocabularyBtn.addEventListener("click", () => {
  const term = vocabularyInput.value.trim();
  if (term) {
    if (addVocabularyTerm(term)) {
      vocabularyInput.value = "";
    } else {
      alert("This term already exists in your vocabulary.");
    }
  }
});

vocabularyInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addVocabularyBtn.click();
  }
});

// Preset button handlers
presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const presetName = btn.dataset.preset;
    loadPreset(presetName);
  });
});

// Initialize with empty vocabulary
renderVocabularyPills();
