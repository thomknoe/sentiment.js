# sentiment.js

A general-purpose AI-powered text analysis tool that performs sentiment analysis, keyword extraction, and custom term relevance scoring on any text input. Analyze dialogue, reviews, feedback, or any textual content to extract insights about emotions, key topics, and relevance to custom vocabulary terms.

## Features

- **Sentiment Analysis**: Detects 27 different emotions using RoBERTa-based emotion classification
- **Keyword Extraction**: Automatically extracts important keywords and phrases using KeyBERT
- **Custom Term Analysis**: Define your own vocabulary terms and analyze their relevance in the text
- **Preset Vocabularies**: Quick-start with Design, Business, or Technical term presets
- **Voice Input**: Record audio directly in the browser (requires HTTPS/localhost)
- **Interactive UI**: Modern, clean interface with tabbed results for multiple analyses

## Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/thomknoe/sentiment.js.git
   cd sentiment.js
   ```

2. Create and activate a virtual environment (recommended):

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

   Or install manually:

   ```bash
   pip install flask flask-cors transformers torch torchvision keybert sentence-transformers scikit-learn
   ```

4. Run the Flask backend server:

   ```bash
   python backend.py
   ```

   The backend will start on `http://127.0.0.1:5000`

5. Open the frontend:

   - **Option A**: Use VS Code's "Go Live" extension or any local server
   - **Option B**: Open `index.html` directly in a browser (voice recording won't work without HTTPS)
   - **Option C**: Use Python's built-in server:
     ```bash
     python -m http.server 8000
     ```
     Then open `http://localhost:8000` in your browser

6. Start analyzing text!

## Project Structure

```
sentiment.js/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── script.js           # Frontend JavaScript and API calls
├── backend.py          # Flask backend server
├── requirements.txt    # Python dependencies
├── .gitignore          # Git ignore file
└── readme.md           # This file
```

## Usage

1. **Add Analysis Terms**:

   - Use preset vocabularies (Design, Business, Technical) or
   - Add custom terms manually using the input field

2. **Input Text**:

   - Type text directly, or
   - Use the microphone button to record (requires HTTPS/localhost)

3. **Analyze**:

   - Enter a subject name (optional)
   - Click "Process Feedback" to analyze

4. **View Results**:

   - **Keywords**: Automatically extracted important terms
   - **Sentiment Analysis**: Top 5 detected emotions with scores
   - **Term Relevance**: Relevance scores for your custom vocabulary terms

## Technical Details

- **Sentiment Model**: RoBERTa-base fine-tuned on GoEmotions dataset
- **Keyword Extraction**: KeyBERT (BERT-based keyword extraction)
- **Term Relevance**: SentenceTransformer embeddings with cosine similarity
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Flask (Python)

## Browser Compatibility

- Voice recording requires Chrome, Edge, or Safari
- Voice recording requires HTTPS or localhost (security requirement)
- All modern browsers support the core functionality

## License

[Add your license here]

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
