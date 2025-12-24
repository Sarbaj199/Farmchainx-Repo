# chatbot.py
import os
import time
import uuid
import json
import re
from datetime import datetime
from urllib.parse import quote, unquote

from flask import Flask, request, jsonify, send_file, render_template
from werkzeug.utils import secure_filename

# --- 1. IMPORT FLASK-CORS ---
# You may need to run: pip install flask-cors
try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
except ImportError:
    CORS_AVAILABLE = False

# --- YOLO (optional) ---
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except Exception:
    ULTRALYTICS_AVAILABLE = False

# --- SQLAlchemy DB setup ---
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, scoped_session

# --- optional embeddings (sentence-transformers) ---
try:
    from sentence_transformers import SentenceTransformer, util
    EMBEDDING_AVAILABLE = True
except Exception:
    EMBEDDING_AVAILABLE = False

# --------------------------------------------------
# Flask & paths
# --------------------------------------------------
app = Flask(__name__)

# --- 2. ENABLE CORS ---
# This allows your React application to send requests to this server
if CORS_AVAILABLE:
    CORS(app)
else:
    app.logger.warning("flask-cors not installed. Frontend requests may be blocked.")

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
HEATMAP_DIR = os.path.join(UPLOAD_DIR, "heatmaps")
OUTPUT_BASE = os.path.abspath(os.path.join(BASE_DIR, "runs", "detect"))

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HEATMAP_DIR, exist_ok=True)
os.makedirs(OUTPUT_BASE, exist_ok=True)

MODEL_PATH = os.path.join(BASE_DIR, "best.pt")

AUDIT_STORE = {}

# --------------------------------------------------
# YOLO model loading
# --------------------------------------------------
MODEL_VERSION = "custom-best"
_model = None
if ULTRALYTICS_AVAILABLE and os.path.exists(MODEL_PATH):
    try:
        _model = YOLO(MODEL_PATH)
        MODEL_VERSION = getattr(_model, "model", None) or MODEL_VERSION
    except Exception as e:
        app.logger.warning("Failed to load YOLO model at startup: %s", e)
        _model = None


def get_model():
    global _model
    if not ULTRALYTICS_AVAILABLE:
        return None
    if _model is None:
        try:
            _model = YOLO(MODEL_PATH)
        except Exception as e:
            app.logger.exception("Failed to load model: %s", e)
            _model = None
    return _model


# --------------------------------------------------
# Database config
# --------------------------------------------------
DB_PATH = os.path.join(BASE_DIR, "audits.db")
SQLALCHEMY_DATABASE_URI = f"sqlite:///{DB_PATH}"
engine = create_engine(SQLALCHEMY_DATABASE_URI, echo=False, connect_args={"check_same_thread": False})
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()


class Audit(Base):
    __tablename__ = "audits"
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(64), index=True, unique=True)
    path = Column(String(256))
    method = Column(String(16))
    request_body = Column(Text)
    response_snippet = Column(Text)
    duration_ms = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    extra = Column(Text)


Base.metadata.create_all(bind=engine)

# --------------------------------------------------
# Utilities
# --------------------------------------------------
def now_ts():
    return datetime.utcnow().isoformat() + "Z"

def calibrate_confidence(raw_conf):
    cal = max(0.0, min(1.0, raw_conf - 0.02))
    return round(cal, 4)

def compute_quality_score(probabilities, metadata=None):
    if not probabilities:
        return 0.0
    confidence = max(probabilities.values()) if probabilities else 0.0
    completeness = 1.0
    explainability = 1.0
    score = confidence * 0.7 + completeness * 0.2 + explainability * 0.1
    return round(score, 4)

def append_audit(audit):
    db = SessionLocal()
    try:
        a = Audit(
            request_id=audit.get("request_id"),
            path=audit.get("path"),
            method=audit.get("method"),
            request_body=json.dumps(audit.get("request_body"), default=str) if audit.get("request_body") else None,
            response_snippet=(audit.get("response_snippet")[:2000] if audit.get("response_snippet") else None),
            duration_ms=audit.get("duration_ms"),
            timestamp=datetime.utcnow(),
            extra=json.dumps(audit, default=str)
        )
        db.add(a)
        db.commit()
        db.refresh(a)
        if a.request_id:
            AUDIT_STORE[a.request_id] = audit
    except Exception as e:
        app.logger.exception("Failed to write audit to DB: %s", e)
        if audit.get("request_id"):
            AUDIT_STORE[audit.get("request_id")] = audit
    finally:
        try:
            db.close()
        except Exception:
            pass

def generate_heatmap_stub(file_path, out_dir):
    return None

def unique_filename(filename):
    filename = secure_filename(filename)
    if not filename:
        return f"{uuid.uuid4().hex}.jpg"
    name, ext = os.path.splitext(filename)
    if not ext:
        ext = ".jpg"
    return f"{name}_{uuid.uuid4().hex}{ext}"

ALLOWED_OUTPUT_DIRS = [UPLOAD_DIR, HEATMAP_DIR, OUTPUT_BASE]

def resolve_safe_path(encoded_or_raw_path):
    try:
        p = unquote(encoded_or_raw_path)
        p_abs = os.path.abspath(p)
        for base in ALLOWED_OUTPUT_DIRS:
            base_abs = os.path.abspath(base)
            try:
                if os.path.commonpath([p_abs, base_abs]) == base_abs:
                    return p_abs
            except Exception:
                continue
    except Exception:
        pass
    return None

def parse_results_boxes(results, filename):
    detections = []
    probs = {}
    try:
        if len(results) and hasattr(results[0], "boxes"):
            for box in results[0].boxes:
                try:
                    cls = int(box.cls)
                except Exception:
                    cls = int(getattr(box, "class", 0))
                label = getattr(results[0], "names", {}).get(cls, str(cls)) if hasattr(results[0], "names") else str(cls)
                try:
                    conf = float(box.conf)
                except Exception:
                    conf = float(getattr(box, "confidence", 0.0))
                detections.append({"label": label, "confidence": round(conf, 4), "box": None})
                probs[label] = max(probs.get(label, 0.0), conf)
    except Exception:
        app.logger.exception("parse_results_boxes error")
    return detections, probs

# --------------------------------------------------
# NLP & Interpretation Logic
# --------------------------------------------------
def interpret_fruit_status(audit):
    if not audit:
        return "unknown", "No audit information available.", {}
    detections = audit.get("detections") or []
    probs = audit.get("probabilities") or {}
    labels = [((d.get("label") or "").lower(), d.get("confidence", 0.0)) for d in detections]
    
    status_scores = {"ripe": 0.0, "unripe": 0.0, "rotten": 0.0, "fresh": 0.0, "damaged": 0.0}
    keywords = {
        "ripe": ["ripe", "ripen"], "unripe": ["unripe", "raw", "green"],
        "rotten": ["rot", "rotten", "mold", "spoiled", "decay", "bad"],
        "fresh": ["fresh", "good", "healthy"], "damaged": ["bruise", "blemish", "damage"]
    }

    top_label, top_conf = (None, 0.0)
    for lbl, conf in labels:
        if conf > top_conf:
            top_conf, top_label = conf, lbl
        for st, keys in keywords.items():
            for kw in keys:
                if kw in lbl: status_scores[st] += conf

    if any(v > 0 for v in status_scores.values()):
        chosen = max(status_scores.items(), key=lambda x: x[1])[0]
        return chosen, f"Suggests '{chosen}'. Top label: {top_label} ({round(top_conf,4)})", {"detections": detections}
    return "unknown", "Unable to determine quality.", {}

INTENT_EXAMPLES = {
    "fruit_status": ["Is this ripe?", "Quality check", "Is it spoiled?"],
    "help": ["help", "what can you do?"],
    "greeting": ["hi", "hello"],
    "object_count": ["how many?", "count"]
}

_embedding_model = None
_example_emb = None
_example_texts = [ex for exs in INTENT_EXAMPLES.values() for ex in exs]
_example_mapping = [k for k, exs in INTENT_EXAMPLES.items() for ex in exs]

def ensure_embedding_model():
    global _embedding_model, _example_emb
    if not EMBEDDING_AVAILABLE: return False
    if _embedding_model is None:
        _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        _example_emb = _embedding_model.encode(_example_texts, convert_to_tensor=True)
    return True

def parse_intent_nlp(text):
    if ensure_embedding_model():
        emb = _embedding_model.encode(text, convert_to_tensor=True)
        hits = util.semantic_search(emb, _example_emb, top_k=1)[0]
        if hits[0]["score"] >= 0.48:
            return {"intent": _example_mapping[int(hits[0]["corpus_id"])], "params": {}}
    return {"intent": "unknown", "params": {}}

def answer_question_nlp(intent, params, audit=None, question_text=None):
    if intent == "fruit_status" and audit:
        status, explanation, _ = interpret_fruit_status(audit)
        replies = {"ripe": "It looks ripe and ready!", "unripe": "It looks unripe.", "rotten": "It looks spoiled.", "damaged": "It looks damaged."}
        return {"reply": replies.get(status, "I can't tell the quality."), "data": {"status": status}}
    if intent == "help": return {"reply": "I can analyze fruit images for quality and ripeness.", "data": {}}
    if intent == "greeting": return {"reply": "Hello! Upload a fruit photo to begin.", "data": {}}
    return {"reply": "I didn't understand. Try 'Is this fruit ripe?'", "data": {}}

# --------------------------------------------------
# API Endpoints
# --------------------------------------------------
@app.route("/api/v1/chat", methods=["POST"])
def chat_api():
    if request.content_type and "multipart/form-data" in request.content_type and 'image' in request.files:
        file = request.files['image']
        filename = unique_filename(file.filename)
        file_path = os.path.join(UPLOAD_DIR, filename)
        file.save(file_path)

        model = get_model()
        results = model.predict(file_path, save=True) if model else []
        detections, probs = parse_results_boxes(results, filename)
        
        request_id = str(uuid.uuid4())
        audit = {"request_id": request_id, "detections": detections, "probabilities": probs, "timestamp": now_ts()}
        append_audit(audit)

        result_image = os.path.basename(results[0].save_dir) if results else None
        return jsonify({
            "reply": f"Detected {len(detections)} objects. (ID: {request_id})",
            "data": {"detections": detections, "result_image": filename}
        }), 200

    body = request.get_json(silent=True) or {}
    text = body.get("message", "")
    parsed = parse_intent_nlp(text)
    audit = list(AUDIT_STORE.values())[-1] if AUDIT_STORE else None
    ans = answer_question_nlp(parsed["intent"], {}, audit=audit)
    return jsonify({"reply": ans["reply"], "data": ans.get("data", {})}), 200

@app.route("/chatbot")
def chatbot_page():
    return "Chatbot API is running on port 5001. Use the React widget to connect."

@app.route("/result/<path:basename>")
def result_file(basename):
    found = None
    for base in ALLOWED_OUTPUT_DIRS:
        path = os.path.join(base, basename)
        if os.path.exists(path): found = path; break
    if not found:
        # Recursive search for YOLO outputs
        for root, _, files in os.walk(OUTPUT_BASE):
            if basename in files: found = os.path.join(root, basename); break
    
    return send_file(found) if found else ("Not found", 404)

if __name__ == "__main__":
    # Ensure port matches what React is calling
    app.run(host="0.0.0.0", port=5001, debug=False)