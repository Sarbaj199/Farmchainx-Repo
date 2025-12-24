import os
import time
import uuid
import json
from datetime import datetime
from urllib.parse import unquote, quote

from flask import Flask, request, render_template, jsonify, g, send_file
from werkzeug.utils import secure_filename

# YOLO
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except:
    ULTRALYTICS_AVAILABLE = False

# SQLAlchemy
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, scoped_session

# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------
app = Flask(__name__)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
HEATMAP_DIR = os.path.join(UPLOAD_DIR, "heatmaps")

# ✅ Allow ALL YOLO output folders (predict, predict2, predict3…)
OUTPUT_BASE = os.path.join(BASE_DIR, "runs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HEATMAP_DIR, exist_ok=True)
os.makedirs(OUTPUT_BASE, exist_ok=True)

MODEL_PATH = os.path.join(BASE_DIR, "best.pt")

# ---------------------------------------------------------
# LOAD MODEL
# ---------------------------------------------------------
_model = None
MODEL_VERSION = "custom-best"

if ULTRALYTICS_AVAILABLE and os.path.exists(MODEL_PATH):
    try:
        _model = YOLO(MODEL_PATH)
    except:
        _model = None


def get_model():
    global _model
    if _model is None and ULTRALYTICS_AVAILABLE:
        try:
            _model = YOLO(MODEL_PATH)
        except:
            pass
    return _model


# ---------------------------------------------------------
# DATABASE
# ---------------------------------------------------------
DB_PATH = os.path.join(BASE_DIR, "audits.db")
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    echo=False,
    connect_args={"check_same_thread": False},
)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()


class Audit(Base):
    __tablename__ = "audits"
    id = Column(Integer, primary_key=True)
    request_id = Column(String(64), unique=True)
    path = Column(String(256))
    method = Column(String(16))
    request_body = Column(Text)
    response_snippet = Column(Text)
    duration_ms = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    extra = Column(Text)


Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------
# UTILITIES
# ---------------------------------------------------------
def now_ts():
    return datetime.utcnow().isoformat() + "Z"


def calibrate_conf(raw):
    return round(max(0.0, min(1.0, raw - 0.02)), 4)


def quality_score(probs):
    if not probs:
        return 0.0
    c = max(probs.values())
    return round(c * 0.7 + 0.2 + 0.1, 4)


def unique_filename(name):
    name = secure_filename(name)
    if not name:
        return uuid.uuid4().hex + ".jpg"
    base, ext = os.path.splitext(name)
    if not ext:
        ext = ".jpg"
    return f"{base}_{uuid.uuid4().hex}{ext}"


# ---------------------------------------------------------
# SAFE FILE SERVING
# ---------------------------------------------------------

# ✅ ALLOW ENTIRE `runs` DIRECTORY
ALLOWED_DIRS = [UPLOAD_DIR, HEATMAP_DIR, OUTPUT_BASE]


def resolve_safe(path_raw):
    try:
        p = os.path.abspath(unquote(path_raw))
        for base in ALLOWED_DIRS:
            if os.path.commonpath([p, os.path.abspath(base)]) == os.path.abspath(base):
                return p
    except:
        pass
    return None


# ---------------------------------------------------------
# PARSE YOLO RESULTS
# ---------------------------------------------------------
def parse_boxes(results, filename):
    det = []
    probs = {}
    if results and hasattr(results[0], "boxes"):
        for b in results[0].boxes:
            cls = int(b.cls) if hasattr(b, "cls") else 0
            label = results[0].names.get(cls, str(cls))
            conf = float(b.conf)
            det.append({"label": label, "confidence": round(conf, 4)})
            probs[label] = max(probs.get(label, 0.0), conf)
    return det, probs


# ---------------------------------------------------------
# ROUTES
# ---------------------------------------------------------
@app.route("/")
def index():
    return """
    <html><body style='text-align:center; padding:50px;'>
    <h1>Fruit Quality Detector</h1>
    <form action='/predict' method='post' enctype='multipart/form-data'>
        <input type='file' name='image' required><br><br>
        <button type='submit'>Upload & Predict</button>
    </form>
    <p>Chatbot: <code>http://127.0.0.1:5001/chatbot</code></p>
    </body></html>
    """


@app.route("/predict", methods=["POST"])
def predict_html():
    if "image" not in request.files:
        return "No image", 400

    img = request.files["image"]
    filename = unique_filename(img.filename)
    saved_path = os.path.join(UPLOAD_DIR, filename)
    img.save(saved_path)

    # YOLO prediction
    model = get_model()
    results = model.predict(saved_path, save=True)

    det, probs = parse_boxes(results, filename)
    raw = max(probs.values()) if probs else 0
    conf = calibrate_conf(raw)
    q = quality_score(probs)

    request_id = uuid.uuid4().hex

    # ---------------------------------------------------------
    # FIXED: Locate annotated output image dynamically
    # ---------------------------------------------------------
    out = None
    try:
        save_dir = os.path.abspath(results[0].save_dir)  # runs/detect/predictX
        candidate = os.path.join(save_dir, filename)

        if os.path.exists(candidate):
            out = candidate
        else:
            # search inside folder
            for root, dirs, files in os.walk(save_dir):
                if filename in files:
                    out = os.path.join(root, filename)
                    break
    except:
        out = None

    out_url = "/result/" + quote(out, safe="") if out else None

    return render_template(
        "result.html",
        uploaded_image=filename,
        result_image_url=out_url,
        detections=det,
        confidence=raw,
        calibrated_confidence=conf,
        quality_score=q,
        request_id=request_id,
    )


@app.route("/result/<path:f>")
def result_file(f):
    p = resolve_safe(f)
    if not p or not os.path.exists(p):
        return "Not Found", 404
    return send_file(p)


# ---------------------------------------------------------
# RUN SERVER
# ---------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
