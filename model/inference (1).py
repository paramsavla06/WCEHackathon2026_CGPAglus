"""
inference.py — called by index.js as a child process.
Usage: python inference.py <image_path>
Prints a single JSON line to stdout with the prediction result.
"""
import sys
import os
import json

import torch
import torchvision.models as models
from torchvision import transforms
from PIL import Image

# ── Device & paths ─────────────────────────────────────────────────────────────
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'severity_model_v3_67pct.pth')

# ── Model ───────────────────────────────────────────────────────────────────────
def load_model():
    model = models.resnet50(weights=None)
    model.fc = torch.nn.Sequential(
        torch.nn.Flatten(),
        torch.nn.Linear(2048, 256),
        torch.nn.ReLU(),
        torch.nn.Dropout(0.3),
        torch.nn.Linear(256, 3)
    )
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    return model

# ── ImageNet normalisation ──────────────────────────────────────────────────────
_NORM = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])

# ── Single standard transform ──────────────────────────────────────────────────
TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(), _NORM
])

SEVERITY_MAPPING = {0: "HIGH", 1: "MEDIUM", 2: "LOW"}

def run_inference(image_path: str) -> dict:
    model = load_model()
    img = Image.open(image_path).convert('RGB')

    with torch.no_grad():
        img_t = TRANSFORM(img).unsqueeze(0).to(DEVICE)
        outputs = model(img_t)
        probs = torch.softmax(outputs, dim=1)

    confidence, predicted = torch.max(probs, dim=1)
    confidence_val = round(confidence.item() * 100, 1)
    severity_index = predicted.item()
    severity_label = SEVERITY_MAPPING.get(severity_index, "UNKNOWN")

    all_probs = {
        SEVERITY_MAPPING[i]: round(probs[0][i].item() * 100, 1)
        for i in range(3)
    }

    return {
        'severity':       severity_label,
        'severity_index': severity_index,
        'confidence':     confidence_val,
        'all_probabilities': all_probs,
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No image path provided'}))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({'error': f'Image not found: {image_path}'}))
        sys.exit(1)

    try:
        result = run_inference(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
