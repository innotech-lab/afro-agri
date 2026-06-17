import numpy as np
import requests
from io import BytesIO
from PIL import Image


# 38 classes du dataset PlantVillage (open source GitHub)
# Source: https://github.com/spMohanty/PlantVillage-Dataset
PLANT_VILLAGE_CLASSES = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry___Powdery_mildew', 'Cherry___healthy',
    'Corn___Cercospora_leaf_spot', 'Corn___Common_rust', 'Corn___Northern_Leaf_Blight', 'Corn___healthy',
    'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight', 'Grape___healthy',
    'Orange___Haunglongbing', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper___Bacterial_spot', 'Pepper___healthy',
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
    'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch', 'Strawberry___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
    'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites', 'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy',
]

# Traitements associés aux maladies (base locale enrichie par GitHub)
TRAITEMENTS = {
    'Apple_scab': 'Appliquer fongicide à base de captane ou myclobutanil.',
    'Black_rot': 'Tailler les parties infectées, appliquer fongicide cuivre.',
    'Cedar_apple_rust': 'Fongicide préventif au printemps, myclobutanil.',
    'Powdery_mildew': 'Soufre en poudre ou bicarbonate de potassium.',
    'Cercospora_leaf_spot': 'Rotation des cultures, fongicide triazole.',
    'Common_rust': 'Fongicide à base de strobilurine.',
    'Northern_Leaf_Blight': 'Variétés résistantes, fongicide propiconazole.',
    'Bacterial_spot': 'Cuivre bactéricide, éviter arrosage foliaire.',
    'Early_blight': 'Chlorothalonil ou fongicide cuivre.',
    'Late_blight': 'Métalaxyl ou fongicide systémique, drainage.',
    'Leaf_Mold': 'Ventilation, fongicide chlorothalonil.',
    'Septoria_leaf_spot': 'Fongicide manèbe ou chlorothalonil.',
    'Spider_mites': 'Acaricide abamectine, augmenter humidité.',
    'Target_Spot': 'Fongicide pyraclostrobine.',
    'Yellow_Leaf_Curl_Virus': 'Contrôle des aleurodes vecteurs, insecticide.',
    'mosaic_virus': 'Pas de traitement chimique, arracher les plantes infectées.',
    'Leaf_scorch': 'Irrigation régulière, fongicide.',
    'Haunglongbing': 'Contrôle du psylle asiatique des agrumes.',
    'Esca_(Black_Measles)': 'Pas de traitement curatif, prévention par taille.',
    'Leaf_blight': 'Fongicide cuivre, taille des parties infectées.',
    'healthy': 'Plante saine. Continuer les bonnes pratiques agricoles.',
}


def preprocess_image(image_file):
    """Prétraite l'image pour le modèle IA (224x224, normalisée)."""
    img = Image.open(image_file).convert('RGB')
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = np.transpose(arr, (2, 0, 1))  # HWC -> CHW
    return np.expand_dims(arr, axis=0)  # shape (1, 3, 224, 224)


def predict_disease(image_file):
    """
    Prédit la maladie depuis l'image avec le modèle ONNX PlantVillage.
    Retourne (classe_predite, score_confiance).
    Modèle ONNX open source: https://github.com/onnx/models
    """
    import os
    from django.conf import settings

    model_path = os.path.join(settings.BASE_DIR, 'diagnostic', 'ml_model', 'plant_disease_model.onnx')

    if not os.path.exists(model_path):
        # Modèle non encore téléchargé : retourner état non-déterminé
        return 'Modele_non_charge___Veuillez_lancer_download_model.py', 0.0

    try:
        import onnxruntime as ort
        session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        input_name = session.get_inputs()[0].name
        img_array = preprocess_image(image_file).astype(np.float32)
        input_shape = session.get_inputs()[0].shape  # vérifier le format attendu
        # Si le modèle attend NHWC (1, 224, 224, 3), on retransforme
        if len(input_shape) == 4 and input_shape[3] == 3:
            img_array = np.transpose(img_array, (0, 2, 3, 1))  # NCHW -> NHWC
        predictions = session.run(None, {input_name: img_array})[0]
        probs = predictions[0]
        idx = int(np.argmax(probs))
        confiance = float(np.max(probs)) * 100 if probs.max() <= 1.0 else float(probs[idx])
        return PLANT_VILLAGE_CLASSES[idx], round(confiance, 2)
    except Exception as e:
        return f'Erreur_inference___{str(e)[:50]}', 0.0


def get_traitement(classe):
    """Retourne le traitement local correspondant à la classe détectée."""
    for key, val in TRAITEMENTS.items():
        if key in classe:
            return val
    return 'Consulter un agronome local.'


def consulter_github(maladie, plante):
    """
    Consulte l'API GitHub Search pour trouver des ressources open source
    sur la maladie détectée et retourne l'URL du repo le plus pertinent.
    """
    query = f'{plante} {maladie} plant disease treatment'
    url = f'https://api.github.com/search/repositories?q={query}&sort=stars&per_page=3'
    try:
        resp = requests.get(
            url,
            headers={'Accept': 'application/vnd.github.v3+json'},
            timeout=8
        )
        resp.raise_for_status()
        items = resp.json().get('items', [])
        if items:
            return {
                'url': items[0]['html_url'],
                'nom': items[0]['full_name'],
                'description': items[0].get('description', ''),
                'stars': items[0]['stargazers_count'],
                'autres_sources': [
                    {'url': i['html_url'], 'nom': i['full_name']} for i in items[1:]
                ]
            }
    except requests.RequestException:
        pass
    return {'url': '', 'nom': '', 'description': '', 'stars': 0, 'autres_sources': []}


def extract_growth_stage(classe, confiance):
    """Estime le stade de croissance selon la maladie détectée et la confiance."""
    if 'healthy' in classe.lower():
        if confiance > 80:
            return 'floraison'
        elif confiance > 60:
            return 'fructification'
        else:
            return 'croissance'
    else:
        # Maladie détectée = stade avancé
        return 'fructification'


def extract_symptoms(classe):
    """Extrait les symptômes visibles de la classe détectée."""
    symptoms_map = {
        'scab': 'Taches brunes/grises sur feuilles et fruits',
        'rot': 'Pourriture, décoloration, ramollissement des tissus',
        'rust': 'Pustules orange-rouges sur les feuilles',
        'blight': 'Taches nécrotiques progressives, flétrissement',
        'mildew': 'Poudre blanche/grise, feuilles crispées',
        'spot': 'Petites taches circulaires, auréoles jaunes',
        'mites': 'Jaunissement progressif, toiles, points rouges minuscules',
        'virus': 'Déformation foliaire, mosaïque jaune, nanisme',
        'healthy': 'Aucun symptôme visible',
    }
    
    lower_classe = classe.lower()
    for key, symptom in symptoms_map.items():
        if key in lower_classe:
            return symptom
    return 'Symptômes à déterminer'


def extract_pests(classe):
    """Extrait les ravageurs possibles selon la maladie/classe."""
    pests_map = {
        'spider_mites': 'Acariens tétranychides',
        'bacterial': 'Bactéries pathogènes (Xanthomonas)',
        'powdery': 'Oïdium, acariens',
        'virus': 'Aleurodes, pucerons (vecteurs)',
        'blight': 'Potentiel d\'infestation secondaire',
        'healthy': 'Aucun ravageur détecté',
    }
    
    lower_classe = classe.lower()
    for key, pest in pests_map.items():
        if key in lower_classe:
            return pest
    return 'Ravageur non identifié'


def diagnostiquer(image_file, nom_plante=''):
    """
    Pipeline complet :
    1. Analyse IA de l'image
    2. Extraction maladie + traitement
    3. Extraction stade, symptômes, ravageurs
    4. Consultation GitHub open source
    Retourne un dictionnaire de résultats exploitables.
    """
    classe, confiance = predict_disease(image_file)
    parties = classe.split('___')
    plante_detectee = parties[0].replace('_', ' ') if len(parties) > 0 else nom_plante
    maladie = parties[1].replace('_', ' ') if len(parties) > 1 else 'Inconnue'
    traitement = get_traitement(classe)
    github_info = consulter_github(maladie, plante_detectee)
    
    # Extraction automatique des données structurées
    stade_croissance = extract_growth_stage(classe, confiance)
    symptomes = extract_symptoms(classe)
    ravageurs = extract_pests(classe)
    est_saine = 'healthy' in classe.lower()

    return {
        'plante_detectee': plante_detectee,
        'maladie_detectee': maladie,
        'classe_complete': classe,
        'confiance': confiance,
        'traitement_suggere': traitement,
        'github': github_info,
        'est_saine': est_saine,
        # Nouvelles données structurées automatisées
        'stade_croissance': stade_croissance,
        'symptomes': symptomes,
        'ravageur_suspecte': ravageurs,
    }
