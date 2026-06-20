"""
Full test data seed — AfroAgri
Generates realistic data across Burundi, Rwanda, DRC, Tanzania, Uganda, Kenya
Run: DB_ENGINE=sqlite python seed_full.py
"""
import os
import sys
import django
import random
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'afroagri.settings')
django.setup()

from type_user.models import TypeUser
from users.models import User
from champs.models import Champ
from plantes.models import Plante
from journal.models import JournalPlante
from diagnostic.models import DiagnosticResult
from etude_sol.models import EtudeSol
from django.contrib.auth.hashers import make_password

random.seed(42)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def rand_date(start_year=2023, end_year=2025):
    start = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    return start + timedelta(days=random.randint(0, (end - start).days))

def rand_coord(lat_min, lat_max, lng_min, lng_max):
    return round(random.uniform(lat_min, lat_max), 5), round(random.uniform(lng_min, lng_max), 5)

# ─── Zones géographiques ──────────────────────────────────────────────────────

ZONES = [
    {"country": "Burundi", "city": "Bujumbura",  "lat": (-3.45, -3.30), "lng": (29.30, 29.45)},
    {"country": "Burundi", "city": "Gitega",     "lat": (-3.80, -3.65), "lng": (29.85, 30.00)},
    {"country": "Burundi", "city": "Ngozi",      "lat": (-2.95, -2.80), "lng": (29.75, 29.95)},
    {"country": "Burundi", "city": "Rumonge",    "lat": (-3.98, -3.85), "lng": (29.40, 29.55)},
    {"country": "Burundi", "city": "Kayanza",    "lat": (-2.97, -2.82), "lng": (29.55, 29.70)},
    {"country": "Burundi", "city": "Muyinga",    "lat": (-2.90, -2.75), "lng": (30.25, 30.45)},
    {"country": "Burundi", "city": "Makamba",    "lat": (-4.40, -4.20), "lng": (29.75, 29.95)},
    {"country": "Burundi", "city": "Cibitoke",   "lat": (-2.98, -2.75), "lng": (29.05, 29.30)},
    {"country": "Burundi", "city": "Bururi",     "lat": (-3.95, -3.80), "lng": (29.55, 29.75)},
    {"country": "Burundi", "city": "Kirundo",    "lat": (-2.68, -2.50), "lng": (30.05, 30.25)},
]

# ─── Données agricoles ────────────────────────────────────────────────────────

CULTURES = [
    ("Riz",      ["Jasmin", "Basmati", "NERICA", "IR64", "WAB880"]),
    ("Maïs",     ["DK8031", "SC403", "WEMA", "H614D", "PAN53"]),
    ("Manioc",   ["TME419", "NASE14", "Kibandameno", "Musasa", "Rubirizi"]),
    ("Tomate",   ["Roma", "Moneymaker", "Tengeru97", "Domati", "Heinz"]),
    ("Arachide", ["Serenut4", "ICGV86031", "Valencia", "Natal Common", "Fleur11"]),
    ("Haricot",  ["RWR2245", "Lyamungu85", "Jesca", "Lyamungu90", "MAC44"]),
    ("Sorgho",   ["Sorghum Red", "SEREDO", "Kawanda", "Macia", "Gadam"]),
    ("Banane",   ["Gros Michel", "Cavendish", "Matooke", "Bogoya", "Pisang"]),
    ("Patate douce", ["SPK004", "Beauregard", "Mugande", "Tanzania", "CIP100034"]),
    ("Chou",     ["Copenhagen", "Gloria F1", "Pruktor", "Sugarloaf", "Oxylus"]),
]

STADES = [
    "Germination", "Levée", "Tallage", "Végétation",
    "Floraison", "Fructification", "Maturation", "Récolte",
]

SYMPTOMES_SAINS = ["Aucun", "Aucun symptôme", "Bonne croissance", ""]

SYMPTOMES_MALADES = [
    "Taches brunes sur les feuilles",
    "Jaunissement des feuilles",
    "Flétrissement des tiges",
    "Présence de pustules orangées",
    "Feuilles déformées et recroquevillées",
    "Pourriture à la base des tiges",
    "Lésions nécrotiques sur fruits",
    "Décoloration en mosaïque",
    "Galeries d'insectes visibles",
    "Feuilles découpées et mangées",
]

RAVAGEURS = [
    "Chenille légionnaire", "Puceron vert", "Aleurode", "Coccinelle africaine",
    "Nématode", "Thrips", "Mite rouge", "Punaise des cultures", "",
]

MALADIES_SUSPECTES = [
    "Mildiou", "Rouille foliaire", "Flétrissement bactérien", "Virus mosaïque",
    "Cercosporiose", "Anthracnose", "Pourriture racines", "Striga", "Striure brune",
    "Fonte des semis", "",
]

MALADIES_DETECTEES = [
    ("Mildiou",                  ["Bouillie bordelaise, supprimer parties atteintes, rotation 3 ans"]),
    ("Rouille foliaire",         ["Cendres de bois, variétés résistantes, espacer les plants"]),
    ("Flétrissement bactérien",  ["Arracher et brûler, jachère 2 ans, éviter excès eau"]),
    ("Virus de la mosaïque",     ["Contrôle aleurodes, plants certifiés, éliminer infectés"]),
    ("Cercosporiose",            ["Spray ail-piment, éviter irrigation foliaire, fongicide cuivre"]),
    ("Anthracnose",              ["Bouillie bordelaise, semences saines, rotation cultures"]),
    ("Pourriture des racines",   ["Drainage, huile de neem, rotation légumineuses"]),
    ("Striga",                   ["Sarclage précoce, Desmodium en inter-rang, légumineuses"]),
    ("Bonne santé",              ["Aucun traitement requis, maintenir les bonnes pratiques"]),
    ("Carence en azote",         ["Apport fumure organique, compost, urée légère"]),
    ("Carence en fer",           ["Correction pH, sulfate de fer, matière organique"]),
]

SOURCES_EAU = ["Forage", "Pluie", "Irrigation", "Riviere"]

TYPES_SOL = ["Argileux", "Sableux", "Limoneux", "Argilo-limoneux", "Sablo-limoneux"]
FERTILITES = ["Faible", "Moyenne", "Bonne", "Très bonne"]

# ─── Seed ─────────────────────────────────────────────────────────────────────

print("=== AfroAgri — Seeding test data ===\n")

# Types & Users
admin_type,        _ = TypeUser.objects.get_or_create(type='admin')
minister_type,     _ = TypeUser.objects.get_or_create(type='minister')
agriculteur_type,  _ = TypeUser.objects.get_or_create(type='agriculteur')
particulier_type,  _ = TypeUser.objects.get_or_create(type='particulier')

def get_or_create_user(email, prenom, nom, type_obj, pwd):
    u, created = User.objects.get_or_create(email=email, defaults={
        'prenom': prenom, 'nom': nom, 'id_type': type_obj, 'password': make_password(pwd)
    })
    return u

admin_user     = get_or_create_user('admin@kit-hub.com',      'KitHub',     'Admin',      admin_type,       'password')
minister_user  = get_or_create_user('minister@afroagri.com',  'Afroagri',   'Minister',   minister_type,    'minister')
maverick_user  = get_or_create_user('maverick@local.com',     'maverick',   'The One',    particulier_type, 'password')

# Agriculteur users (10 across countries)
FARMER_USERS = []
farmer_profiles = [
    ('Jean-Pierre', 'Nkurunziza', 'jp.nkurunziza@afroagri.com'),
    ('Amina',       'Uwimana',    'amina.uwimana@afroagri.com'),
    ('Emmanuel',    'Habimana',   'e.habimana@afroagri.com'),
    ('Grace',       'Mutesi',     'grace.mutesi@afroagri.com'),
    ('Pascal',      'Ntibagirirwa','pascal.ntib@afroagri.com'),
    ('Solange',     'Mukamana',   'solange.mukamana@afroagri.com'),
    ('David',       'Otieno',     'david.otieno@afroagri.com'),
    ('Fatuma',      'Rashid',     'fatuma.rashid@afroagri.com'),
    ('Samuel',      'Kizito',     'samuel.kizito@afroagri.com'),
    ('Marie',       'Ndayishimiye','marie.ndayi@afroagri.com'),
    ('agri',        'Agriculteur','agri@afroagri.com'),
]
for prenom, nom, email in farmer_profiles:
    u = get_or_create_user(email, prenom, nom, agriculteur_type, 'password')
    FARMER_USERS.append(u)

print(f"✓ Users: {User.objects.count()}")

# ─── Champs ───────────────────────────────────────────────────────────────────

champs_created = []
num_champs = 60

for i in range(num_champs):
    zone = random.choice(ZONES)
    lat, lng = rand_coord(*zone['lat'], *zone['lng'])
    superficie = round(random.uniform(0.5, 15.0), 2)
    champ = Champ.objects.create(
        superficie=superficie,
        source_eau=random.choice(SOURCES_EAU),
        latitude=lat,
        longitude=lng,
    )
    champs_created.append((champ, zone, random.choice(FARMER_USERS)))

print(f"✓ Champs: {len(champs_created)}")

# ─── Plantes ─────────────────────────────────────────────────────────────────

plantes_created = []

for champ, zone, owner in champs_created:
    n = random.randint(2, 5)
    cultures_for_champ = random.sample(CULTURES, min(n, len(CULTURES)))
    for nom_plante, varietes in cultures_for_champ:
        variete = random.choice(varietes)
        date_plant = rand_date(2022, 2024)
        plante = Plante.objects.create(
            nom_plante=nom_plante,
            variete=variete,
            date_plantation=date_plant,
            id_champ=champ,
        )
        plantes_created.append((plante, champ, zone, owner))

print(f"✓ Plantes: {len(plantes_created)}")

# ─── Journal ──────────────────────────────────────────────────────────────────

journal_created = []
import uuid

for plante, champ, zone, owner in plantes_created:
    n_obs = random.randint(2, 7)
    base_date = plante.date_plantation
    for j in range(n_obs):
        obs_date = base_date + timedelta(days=random.randint(7, 60) * (j + 1))
        if obs_date > date.today():
            obs_date = date.today() - timedelta(days=random.randint(1, 30))

        is_sick = random.random() < 0.35
        symptomes = random.choice(SYMPTOMES_MALADES if is_sick else SYMPTOMES_SAINS)
        ravageur = random.choice(RAVAGEURS) if is_sick else ""
        maladie = random.choice(MALADIES_SUSPECTES[:-1]) if is_sick else ""

        # Slight position variation around the champ
        lat = champ.latitude + random.uniform(-0.05, 0.05)
        lng = champ.longitude + random.uniform(-0.05, 0.05)

        entry = JournalPlante.objects.create(
            id_plante=plante,
            date_observation=obs_date,
            stade_croissance=STADES[min(j, len(STADES) - 1)],
            symptomes=symptomes,
            ravageur_suspecte=ravageur,
            maladie_suspecte=maladie,
            id_user=owner,
            session_uuid=str(uuid.uuid4())[:8],
            latitude=round(lat, 5),
            longitude=round(lng, 5),
        )
        journal_created.append((entry, is_sick))

print(f"✓ Journal: {len(journal_created)}")

# ─── Diagnostics ─────────────────────────────────────────────────────────────

diag_count = 0

for entry, is_sick in journal_created:
    if random.random() < 0.55:
        if is_sick:
            maladie_data = random.choice(MALADIES_DETECTEES[:-3])
        else:
            maladie_data = random.choice(MALADIES_DETECTEES[-3:])

        maladie_nom, traitements = maladie_data
        confiance = round(random.uniform(62.0, 98.5), 1)

        DiagnosticResult.objects.create(
            id_journal=entry,
            image='diagnostics/placeholder.jpg',
            maladie_detectee=maladie_nom,
            confiance=confiance,
            ravageur_detecte=random.choice(RAVAGEURS[:5]) if is_sick and random.random() < 0.4 else '',
            traitement_suggere=random.choice(traitements),
            source_github='',
        )
        diag_count += 1

print(f"✓ Diagnostics: {diag_count}")

# ─── Études de sol ────────────────────────────────────────────────────────────

etude_count = 0

for champ, zone, owner in champs_created:
    n_etudes = random.randint(1, 3)
    for _ in range(n_etudes):
        ph = round(random.uniform(4.5, 8.2), 1)
        fertilite = (
            "Très bonne" if ph >= 6.0 and ph <= 7.0
            else "Bonne"   if ph >= 5.5 and ph <= 7.5
            else "Moyenne" if ph >= 5.0
            else "Faible"
        )
        EtudeSol.objects.create(
            id_champ=champ,
            date_analyse=rand_date(2023, 2025),
            ph_sol=str(ph),
            matiere_organique=f"{round(random.uniform(0.8, 5.5), 1)}%",
            azote=f"{round(random.uniform(0.05, 0.35), 2)}%",
            phosphore=f"{round(random.uniform(5, 60), 0):.0f} mg/kg",
            potassium=f"{round(random.uniform(50, 400), 0):.0f} mg/kg",
            humidite=f"{round(random.uniform(15, 55), 1)}%",
            type_sol=random.choice(TYPES_SOL),
            fertilite=fertilite,
            rapport_analyse=(
                f"Analyse du champ {champ.id_champ}. pH={ph}, sol {random.choice(TYPES_SOL).lower()}. "
                f"Fertilité : {fertilite}. "
                f"Recommandation : {'Apport de compost et chaux agricole.' if ph < 5.5 else 'Maintenir les bonnes pratiques de fertilisation.'}"
            ),
        )
        etude_count += 1

print(f"✓ Études de sol: {etude_count}")

# ─── Summary ─────────────────────────────────────────────────────────────────

print("\n=== Résumé final ===")
print(f"  Users         : {User.objects.count()}")
print(f"  Champs        : {Champ.objects.count()}")
print(f"  Plantes       : {Plante.objects.count()}")
print(f"  Journal       : {JournalPlante.objects.count()}")
print(f"  Diagnostics   : {DiagnosticResult.objects.count()}")
print(f"  Études de sol : {EtudeSol.objects.count()}")
print("\n✅ Seed terminé avec succès !")
