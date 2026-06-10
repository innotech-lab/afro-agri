# -*- coding: utf-8 -*-
import sys
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import warnings
warnings.filterwarnings('ignore')

import torch
import torch.nn as nn
import torchvision.models as models

OUTPUT = os.path.join(os.path.dirname(__file__), 'diagnostic', 'ml_model', 'plant_disease_model.onnx')
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

print("Chargement MobileNetV2 avec poids ImageNet...")
weights = models.MobileNet_V2_Weights.IMAGENET1K_V1
model = models.mobilenet_v2(weights=weights)
model.classifier[1] = nn.Linear(model.last_channel, 38)
model.eval()

print("Export ONNX en cours...")
dummy = torch.randn(1, 3, 224, 224)

try:
    torch.onnx.export(
        model,
        dummy,
        OUTPUT,
        input_names=['input'],
        output_names=['output'],
        opset_version=18,
        verbose=False
    )
    size_mb = round(os.path.getsize(OUTPUT) / 1024 / 1024, 2)
    print(f"Modele cree avec succes: {OUTPUT}")
    print(f"Taille: {size_mb} MB")
except Exception as e:
    print(f"Erreur export ONNX: {e}")
    sys.exit(1)
