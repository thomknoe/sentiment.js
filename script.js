// Backend URL configuration
// Use local backend when on localhost, 127.0.0.1, or file:// (empty hostname)
const BACKEND_URL =
  !window.location.hostname ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5001"
    : "https://your-backend-url.com"; // Update this to your deployed backend URL

const recordButton = document.getElementById("recordButton");
const inputText = document.getElementById("inputText");
const analyzeButton = document.getElementById("analyzeButton");
const noteInput = document.getElementById("noteInput");
const tabsContainer = document.getElementById("tabs");
let storedAnalyses = [];
let activeTabIndex = null;

const TOOLTIP_ORIGINAL_TEXT =
  "The feedback text you entered. Hover over keywords in the Keywords panel to highlight them here.";
const TOOLTIP_KEYWORDS =
  "The KeyBERT model is used for keyword extraction. KeyBERT is based on BERT embeddings and is designed to extract keywords or keyphrases from the text using pre-trained BERT-based models. KeyBERT works by first embedding the input text into a high-dimensional vector space and then using this representation to identify key terms that are semantically important. The top n keyphrases are returned.";
const TOOLTIP_SENTIMENT =
  "The model used for emotion classification is RoBERTa (Robustly optimized BERT approach), fine-tuned for emotion detection. Specifically, it uses the model SamLowe/roberta-base-go_emotions, which is trained on the GoEmotions dataset. The model predicts the probability of the presence of 27 different emotions (like joy, anger, sadness, etc.) in the text. Each emotion has a score indicating its likelihood.";
const TOOLTIP_TERM_RELEVANCE =
  "The SentenceTransformer model all-MiniLM-L6-v2 is used to obtain sentence-level embeddings for both the input text and your custom vocabulary terms. Cosine similarity is a metric that calculates the cosine of the angle between two vectors in a vector space. A higher cosine similarity score indicates that the text and the term are more similar.";

const TOOLTIP_BY_ID = {
  originalText: TOOLTIP_ORIGINAL_TEXT,
  keywords: TOOLTIP_KEYWORDS,
  sentiment: TOOLTIP_SENTIMENT,
  termRelevance: TOOLTIP_TERM_RELEVANCE,
};

// Info modal: open on .info-icon click, close on X or overlay click
const infoModal = document.getElementById("infoModal");
const modalContent = document.querySelector(".modal-content");
const modalClose = document.querySelector(".modal-close");

function openInfoModal(text) {
  if (!modalContent) return;
  modalContent.textContent = text;
  if (infoModal) {
    infoModal.classList.add("modal-visible");
    infoModal.setAttribute("aria-hidden", "false");
  }
}

function closeInfoModal() {
  if (infoModal) {
    infoModal.classList.remove("modal-visible");
    infoModal.setAttribute("aria-hidden", "true");
  }
}

document.addEventListener("click", (e) => {
  const icon = e.target.closest(".info-icon, .tooltip-icon");
  if (icon) {
    e.preventDefault();
    const id = icon.getAttribute("data-tooltip-id");
    const text = id ? TOOLTIP_BY_ID[id] : icon.getAttribute("title");
    if (text) openInfoModal(text);
  }
});

if (modalClose) modalClose.addEventListener("click", closeInfoModal);
if (infoModal) {
  infoModal.addEventListener("click", (e) => {
    if (e.target === infoModal) closeInfoModal();
  });
}

// Fixed design vocabulary — all feedback is measured against these terms
const DESIGN_VOCABULARY = [
  "CLARITY",
  "SIMPLICITY",
  "ELEGANCE",
  "CONSISTENCY",
  "BALANCE",
  "HARMONY",
  "VISUAL APPEAL",
  "INTUITIVENESS",
  "USER-CENTRIC",
  "RESPONSIVENESS",
  "LEGIBILITY",
  "ACCESSIBILITY",
  "FUNCTIONALITY",
  "AESTHETIC COHESION",
  "USABILITY",
  "FLEXIBILITY",
  "ADAPTABILITY",
  "CREATIVITY",
  "INNOVATION",
  "ORIGINALITY",
  "EFFICIENCY",
  "SCALABILITY",
  "SUSTAINABILITY",
  "ENGAGEMENT",
  "INTERACTION",
  "VISUAL IMPACT",
  "PRECISION",
  "REFINEMENT",
  "VERSATILITY",
  "EMOTIONAL CONNECTION",
  "TIMELESSNESS",
  "MINIMALISM",
  "MAXIMALISM",
  "IMPACTFULNESS",
  "APPROPRIATENESS",
  "TRANSPARENCY",
  "USER-FRIENDLINESS",
  "COMFORT",
  "CLARITY OF PURPOSE",
  "ATTENTION TO DETAIL",
  "EASE OF USE",
  "SATISFACTION",
  "ATTRACTIVENESS",
  "DIFFERENTIATION",
  "INSPIRATION",
  "NARRATIVE",
  "FUNCTIONALITY OVER FORM",
  "BRAND ALIGNMENT",
  "CONSISTENCY OF TONE",
  "FLOW",
  "STRUCTURE",
  "CONTRAST",
  "SPACING",
  "TEXTURAL SENSITIVITY",
  "PRECISION IN DETAIL",
  "AUTHENTICITY",
  "MOOD",
  "APPEAL",
  "CONTEXTUAL RELEVANCE",
  "INNOVATION IN DESIGN",
  "ENGAGING EXPERIENCE",
  "VERSATILITY IN APPLICATION",
  "COHERENCE",
  "CRAFTSMANSHIP",
  "EXPLORATION",
  "PLAYFULNESS",
  "INCLUSIVITY",
  "RESPONSIVENESS TO CHANGE",
  "PROVOCATION",
  "SUSTAINABILITY IN MATERIALS",
  "PROPORTIONALITY",
  "COMPOSITIONAL BALANCE",
  "TACTILITY",
  "PERCEPTION",
  "CRAFT",
  "RESONANCE",
];

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
      "Speech Recognition requires HTTPS or localhost. Voice recording may not work.",
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
      "Speech Recognition is not supported in your browser.\n\nPlease use Chrome, Edge, or Safari.",
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
        "3. Or type your feedback manually in the text area",
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
            "3. Or type your feedback manually",
        );
        stopEllipsisAnimation();
        inputText.value = "";
      } else {
        console.error("Error starting recognition:", error);
        alert(
          "Error starting speech recognition: " +
            error.message +
            "\n\nPlease try again or type your feedback manually.",
        );
        stopEllipsisAnimation();
        inputText.value = "";
      }
    }
  }
});

function updateResultsPanels(data, text) {
  const emotions = data.emotions || {};
  const topEmotions = Object.entries(emotions)
    .sort(([, aScore], [, bScore]) => bScore - aScore)
    .slice(0, 5);

  const keywords = data.keywords || [];
  const termRelevance = (data.term_relevance || [])
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 6);

  const termHtml =
    termRelevance.length > 0
      ? termRelevance
          .map(
            ({ term, relevance }) => `
            <div class="design-card">
              <div class="design-card-content">
                <div class="relevance-score">${(relevance * 100).toFixed(0)}%</div>
                <div class="design-term">${term}</div>
              </div>
            </div>`,
          )
          .join("")
      : '<p class="panel-empty">No relevant terms found</p>';

  const panelText = document.getElementById("panelText");
  const panelKeywords = document.getElementById("panelKeywords");
  const panelSentiment = document.getElementById("panelSentiment");
  const panelTerms = document.getElementById("panelTerms");

  if (!panelText || !panelKeywords || !panelSentiment || !panelTerms) return;

  function showContent(panel, placeholderEl, contentEl, html) {
    if (placeholderEl) {
      placeholderEl.hidden = true;
      placeholderEl.style.display = "none";
    }
    if (contentEl) {
      contentEl.innerHTML = html;
      contentEl.hidden = false;
      contentEl.style.display = "block";
    }
  }

  showContent(
    panelText,
    panelText.querySelector(".panel-placeholder"),
    panelText.querySelector(".panel-content"),
    `<h3>Original Text</h3><p class="original-text panel-text-body">${escapeHtml(text)}</p>`,
  );

  showContent(
    panelKeywords,
    panelKeywords.querySelector(".panel-placeholder"),
    panelKeywords.querySelector(".panel-content"),
    `<span class="info-icon" data-tooltip-id="keywords">ⓘ</span><h3>Keywords</h3><div class="keyword-pills">${keywords.map((kw) => `<span class="pill" data-keyword="${escapeHtml(kw)}">${escapeHtml(kw)}</span>`).join("")}</div>`,
  );

  showContent(
    panelSentiment,
    panelSentiment.querySelector(".panel-placeholder"),
    panelSentiment.querySelector(".panel-content"),
    `<span class="info-icon" data-tooltip-id="sentiment">ⓘ</span><h3>Sentiment</h3><div class="emotion-bars">${topEmotions.map(([emotion, score]) => `<div class="emotion-row"><span class="emotion-label">${capitalize(emotion)} ${Math.round(score * 100)}%</span><div class="bar-container"><div class="bar" style="width: ${Math.round(score * 100)}%;"></div></div></div>`).join("")}</div>`,
  );

  showContent(
    panelTerms,
    panelTerms.querySelector(".panel-placeholder"),
    panelTerms.querySelector(".panel-content"),
    `<span class="info-icon" data-tooltip-id="termRelevance">ⓘ</span><h3>Term Relevance</h3><div class="design-grid">${termHtml}</div>`,
  );

  attachKeywordHover(panelText, panelKeywords);
}

function attachKeywordHover(panelTextEl, panelKeywordsEl) {
  if (!panelTextEl || !panelKeywordsEl) return;
  const originalTextEl = panelTextEl.querySelector(".original-text");
  const pills = panelKeywordsEl.querySelectorAll(".pill[data-keyword]");
  if (!originalTextEl || !pills.length) return;
  const rawText = originalTextEl.textContent;
  pills.forEach((pill) => {
    const keyword = pill.getAttribute("data-keyword");
    if (!keyword) return;
    pill.addEventListener("mouseover", () => {
      const regex = new RegExp(
        `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi",
      );
      originalTextEl.innerHTML = rawText.replace(
        regex,
        (match) => `<span class="highlight">${match}</span>`,
      );
    });
    pill.addEventListener("mouseout", () => {
      originalTextEl.textContent = rawText;
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

analyzeButton.addEventListener("click", async () => {
  const text = inputText.value.trim();
  const note = noteInput.value.trim();
  if (!text) {
    alert("Please enter or record text to analyze.");
    return;
  }

  const customVocabulary = DESIGN_VOCABULARY;

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
      const note = noteInput.value.trim() || "Untitled";
      const index = storedAnalyses.length;
      storedAnalyses.push({ note, text, data });

      const tabBtn = document.createElement("button");
      tabBtn.type = "button";
      tabBtn.className = "tab-button";
      tabBtn.textContent = note;
      tabBtn.dataset.index = String(index);
      tabBtn.addEventListener("click", () => {
        const stored = storedAnalyses[Number(tabBtn.dataset.index)];
        if (stored) {
          updateResultsPanels(stored.data, stored.text);
          document
            .querySelectorAll(".tab-button")
            .forEach((b) => b.classList.remove("active-tab"));
          tabBtn.classList.add("active-tab");
          activeTabIndex = Number(tabBtn.dataset.index);
        }
      });

      if (tabsContainer) tabsContainer.appendChild(tabBtn);

      updateResultsPanels(data, text);
      document
        .querySelectorAll(".tab-button")
        .forEach((b) => b.classList.remove("active-tab"));
      tabBtn.classList.add("active-tab");
      activeTabIndex = index;
    }
  } catch (error) {
    console.error("Error during analysis:", error);
    const msg = error.message || String(error);
    alert(
      "Could not reach the analysis server.\n\n" +
        (msg.includes("fetch") || msg.includes("Failed")
          ? "Make sure the backend is running (python3 backend.py) and try again."
          : msg),
    );
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
      `<span class="highlight">${keyword}</span>`,
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
