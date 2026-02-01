from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import traceback

app = Flask(__name__)
# Allow CORS from all origins (update in production to specific domains)
CORS(app, resources={r"/analyze": {"origins": "*"}})

emotion_model_name = "SamLowe/roberta-base-go_emotions"
tokenizer = AutoTokenizer.from_pretrained(emotion_model_name)
model = AutoModelForSequenceClassification.from_pretrained(emotion_model_name)
emotion_classifier = pipeline("text-classification", model=model, tokenizer=tokenizer, top_k=None)

keyword_extractor = KeyBERT()
embedder = SentenceTransformer('all-MiniLM-L6-v2')

def extract_term_relevance(text, vocabulary):
    """Calculate the relevance of terms in the text using the provided vocabulary."""
    try:
        if not vocabulary or len(vocabulary) == 0:
            return []
        
        text_embedding = embedder.encode([text])
        vocab_embeddings = embedder.encode(vocabulary)

        scores = cosine_similarity(text_embedding, vocab_embeddings)[0]
        relevancy = {vocabulary[i]: scores[i] for i in range(len(vocabulary))}

        sorted_relevancy = sorted(relevancy.items(), key=lambda x: x[1], reverse=True)

        return sorted_relevancy
    except Exception as e:
        print(f"Error in term relevance extraction: {e}")
        return []

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        text = data.get("text", "")
        custom_vocabulary = data.get("vocabulary", [])
        
        print(f"Received vocabulary: {custom_vocabulary}")
        print(f"Vocabulary length: {len(custom_vocabulary) if custom_vocabulary else 0}")

        if not text.strip():
            return jsonify({"error": "No text provided"}), 400

        emotion_scores = emotion_classifier(text)

        emotions = {entry["label"]: float(entry["score"]) for entry in emotion_scores[0]}

        keywords = keyword_extractor.extract_keywords(text, 
                                                      keyphrase_ngram_range=(1, 2), 
                                                      stop_words='english', 
                                                      top_n=10)

        keywords_cleaned = [kw[0] for kw in keywords]

        # Use custom vocabulary (remove duplicates)
        combined_vocabulary = list(set(custom_vocabulary)) if custom_vocabulary else []
        
        print(f"Combined vocabulary: {combined_vocabulary}")
        print(f"Combined vocabulary length: {len(combined_vocabulary)}")
        
        term_relevance_raw = extract_term_relevance(text, combined_vocabulary)
        
        print(f"Term relevance raw: {term_relevance_raw}")

        term_relevance = [
            {"term": term, "relevance": float(score)} for term, score in term_relevance_raw
        ]
        
        print(f"Term relevance processed: {term_relevance}")
        print(f"Term relevance type: {type(term_relevance)}")
        print(f"Term relevance length: {len(term_relevance)}")

        response_data = {
            "emotions": emotions,
            "keywords": keywords_cleaned,
            "term_relevance": term_relevance
        }
        
        print(f"Response data being sent: {response_data}")
        print(f"Response data keys: {response_data.keys()}")

        return jsonify(response_data)

    except Exception as e:
        traceback.print_exc()
        print(f"Exception occurred: {str(e)}")
        print(f"Exception type: {type(e)}")
        return jsonify({
            "error": f"An error occurred: {str(e)}",
            "emotions": {},
            "keywords": [],
            "term_relevance": []
        }), 500

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
