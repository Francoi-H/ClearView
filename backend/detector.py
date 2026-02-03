from huggingface_hub import hf_hub_download
import importlib.util
import sys

print("Loading ClearView model...")

model_path = hf_hub_download(
    repo_id="Bombek1/ai-image-detector-siglip-dinov2",
    filename="pytorch_model.pt"
)

model_code_path = hf_hub_download(
    repo_id="Bombek1/ai-image-detector-siglip-dinov2",
    filename="model.py"
)

spec = importlib.util.spec_from_file_location("model", model_code_path)
model_module = importlib.util.module_from_spec(spec)
sys.modules["model"] = model_module
spec.loader.exec_module(model_module)

from model import AIImageDetector

detector = AIImageDetector(model_path)
print("✓ Model loaded")

from PIL import Image

def clearview_detect(image_file):
    """
    image_file: Flask FileStorage
    """

    # Convert uploaded file → PIL Image
    image = Image.open(image_file.stream).convert("RGB")

    # Run model prediction
    result = detector.predict(image)

    adjusted_probability = result["probability"]

    if result["prediction"] == "real":
        adjusted_probability = min(adjusted_probability * 1.15, 1.0)

        if adjusted_probability > 0.48:
            return {
                "prediction": "ai-generated",
                "confidence": (1 - adjusted_probability) * 100,
                "probability": adjusted_probability,
                "method": "CNN adjusted",
                "original_prediction": "real"
            }

    return {
        "prediction": result["prediction"],
        "confidence": result["confidence"] * 100,
        "probability": adjusted_probability,
        "method": "CNN baseline",
        "original_prediction": result["prediction"]
    }
