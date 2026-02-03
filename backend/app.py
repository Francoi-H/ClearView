from flask import Flask, request, jsonify, send_from_directory
from detector import clearview_detect
import os

# Resolve frontend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR)

# -------------------------
# Frontend routes
# -------------------------

@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(FRONTEND_DIR, path)

# -------------------------
# API route
# -------------------------

@app.route("/api/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files["image"]
    result = clearview_detect(image)

    return jsonify(result)

# -------------------------

if __name__ == "__main__":
    app.run(debug=True)
