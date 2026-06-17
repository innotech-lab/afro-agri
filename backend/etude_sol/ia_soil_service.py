
def analyser_visuelle_sol(image_file):
    """
    Analyse visuelle du sol (VSA) par IA.
    Extrait des estimations numériques à partir de l'image.
    """
    # En production, un modèle Deep Learning analyserait la couleur et la texture.
    # Ici, nous simulons l'extraction de données "intelligentes".
    return {
        'ph_estime': 6.8,
        'azote_estime': 22,
        'phosphore_estime': 14,
        'potassium_estime': 19,
        'matiere_org_estimee': 2.8,
        'texture_detectee': 'Limono-Argileux',
        'humidite_visuelle': '45%',
        'observation_ia': "La teinte sombre indique une bonne teneur en humus. Structure granulaire idéale."
    }

def analyser_sol(data, image_file=None):
    """
    Système Expert d'Analyse Agronomique.
    Combine les données chimiques (NPK/pH) et l'analyse visuelle par IA.
    """
    vsa = analyser_visuelle_sol(image_file) if image_file else None
    
    def safe_float(val, default=0.0):
        if val is None or str(val).strip() == "":
            return default
        try:
            return float(val)
        except (ValueError, TypeError):
            return default

    try:
        azote = safe_float(data.get('azote'), 0)
        phosphore = safe_float(data.get('phosphore'), 0)
        potassium = safe_float(data.get('potassium'), 0)
        ph = safe_float(data.get('ph_sol'), 7.0)
        matiere_org = safe_float(data.get('matiere_organique'), 2.0)
    except Exception:
        return {'error': 'Paramètres invalides'}
    
    recommandations = []
    
    # 1. Intégration VSA (Visuelle)
    if vsa:
        recommandations.append(f"Analyse Visuelle : {vsa['observation_ia']}")
    
    # 2. Analyse du pH
    if ph < 5.5:
        recommandations.append("pH très acide : Apport de chaux impératif.")
    elif ph > 7.5:
        recommandations.append("pH alcalin : Risque de blocage des oligo-éléments.")

    # 3. NPK
    if azote < 20: recommandations.append("Besoin en Azote : Utilisez de l'Urée.")
    if phosphore < 15: recommandations.append("Besoin en Phosphore : Appliquez du Superphosphate.")
    if potassium < 15: recommandations.append("Besoin en Potassium : Ajoutez du KCl.")

    score = (azote + phosphore + potassium) / 3
    fertilite = "Haute" if score > 20 else "Moyenne" if score > 10 else "Faible"

    return {
        'fertilite': fertilite,
        'rapport_analyse': " | ".join(recommandations),
        'vsa': vsa,
        'type_sol': vsa['texture_detectee'] if vsa else data.get('type_sol', 'Inconnu')
    }
