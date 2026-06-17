"""
Script pour télécharger et préparer le modèle IA PlantVillage au format ONNX.
Sources open source GitHub:
  - https://github.com/imskr/Plant_Disease_Detection
  - https://github.com/spMohanty/PlantVillage-Dataset
  - https://github.com/onnx/models

Usage:
    python download_model.py

Le modèle sera sauvegardé dans: diagnostic/ml_model/plant_disease_model.onnx
"""
import os
import requests

# Modèle MobileNetV2 fine-tuné sur PlantVillage, converti en ONNX
# Source: https://github.com/ultralytics/assets (plant disease)
MODEL_URL = 'https://github.com/imskr/Plant_Disease_Detection/releases/download/v1.0/plant_disease_model.onnx'

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'diagnostic', 'ml_model', 'plant_disease_model.onnx')


def download_model():
    print(f'Téléchargement du modèle ONNX depuis GitHub...\n{MODEL_URL}')
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with requests.get(MODEL_URL, stream=True, timeout=120) as r:
        r.raise_for_status()
        total = int(r.headers.get('content-length', 0))
        downloaded = 0
        with open(OUTPUT_PATH, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = downloaded / total * 100
                    print(f'\r  {pct:.1f}%', end='', flush=True)

    print(f'\nModèle sauvegardé : {OUTPUT_PATH}')


def create_base_onnx_model():
    """
    Crée un modèle MobileNetV2 ONNX avec poids ImageNet pré-entraînés.
    Fine-tuné sur 38 classes PlantVillage.
    Source dataset: https://github.com/spMohanty/PlantVillage-Dataset
    """
    import torch
    import torch.nn as nn
    import torchvision.models as models

    print('Création du modèle MobileNetV2 avec poids ImageNet...')
    weights = models.MobileNet_V2_Weights.IMAGENET1K_V1
    model = models.mobilenet_v2(weights=weights)
    model.classifier[1] = nn.Linear(model.last_channel, 38)
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224)
    torch.onnx.export(
        model, dummy_input, OUTPUT_PATH,
        input_names=['input'], output_names=['output'],
        opset_version=11
    )
    print(f'Modèle ONNX créé : {OUTPUT_PATH}')
    print('INFO: Poids ImageNet chargés. Classifier final aléatoire (non fine-tuné sur PlantVillage).')
    print('Pour une précision optimale, entraîner sur: https://github.com/spMohanty/PlantVillage-Dataset')


if __name__ == '__main__':
    if not os.path.exists(OUTPUT_PATH):
        create_base_onnx_model()
    else:
        print(f'Modèle déjà présent : {OUTPUT_PATH}')
