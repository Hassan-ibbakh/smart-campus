# 🎓 Smart Campus - Application de Navigation Inclusive

**Projet MIAthon 2026** - Système de navigation intérieure intelligent pour campus universitaire, conçu pour améliorer l'accessibilité et l'expérience des utilisateurs grâce à l'intelligence artificielle, la reconnaissance vocale et le positionnement en temps réel.

## 🌟 Vue d'Ensemble

Smart Campus est une application mobile innovante qui transforme la navigation sur un campus universitaire en une expérience intuitive et inclusive. En combinant l'IA générative, la synthèse vocale et les capteurs du téléphone, l'application permet aux utilisateurs de se déplacer facilement, même pour les personnes malvoyantes ou à mobilité réduite.

### 🎯 Objectifs du Projet
- **Accessibilité Universelle** : Rendre la navigation campus accessible à tous, indépendamment des handicaps.
- **Interaction Naturelle** : Utiliser la voix comme interface principale pour une expérience utilisateur fluide.
- **Navigation Temps Réel** : Intégrer le positionnement PDR (Pedestrian Dead Reckoning) pour un suivi précis des déplacements.
- **IA Intelligente** : Exploiter les modèles de langage avancés pour comprendre les intentions et fournir des réponses contextuelles.

---

## 🚀 Fonctionnalités Principales

### 🗣️ Navigation Vocale End-to-End
- **Reconnaissance Vocale** : Transcription automatique des commandes vocales via Whisper (hébergé sur Groq).
- **Analyse d'Intention** : Utilisation de Llama 3.1 pour extraire les lieux et intentions des requêtes naturelles.
- **Synthèse Vocale** : Guidage audio en temps réel avec indications directionnelles précises.

### 🧠 Système RAG Sémantique
- **Base de Connaissances** : Indexation vectorielle des services et lieux du campus avec ChromaDB.
- **Recherche Contextuelle** : Recherche sémantique pour localiser des bureaux, salles ou services via des descriptions naturelles.
- **Embeddings Multilingues** : Modèle `paraphrase-multilingual-mpnet-base-v2` pour une compréhension en français.

### 📍 Positionnement Temps Réel (PDR)
- **Suivi des Pas** : Utilisation des accéléromètres et gyroscopes du téléphone pour estimer les déplacements.
- **Calibration Automatique** : Ajustement de la longueur des pas basée sur les données des capteurs.
- **Intégration Carte** : Affichage en temps réel de la position sur la carte interactive du campus.

### ♿ Audio-Guide Inclusif
- **Instructions Vocales** : Annonces des directions, changements d'étage et points d'intérêt.
- **Accessibilité Renforcée** : Support pour les utilisateurs malvoyants avec descriptions détaillées.
- **Multimodalité** : Combinaison voix + texte pour une expérience hybride.

### 🛣️ Calcul d'Itinéraires
- **Algorithme A*** : Pathfinding optimisé avec heuristique euclidienne.
- **Options d'Accessibilité** : Itinéraires adaptés aux fauteuils roulants (éviter escaliers, etc.).
- **Instructions Détaillées** : Guidage pas-à-pas avec indications de virage et distance.

---

## 🛠️ Technologies Utilisées

### Frontend (Mobile)
- **React Native / Expo** : Framework cross-platform pour iOS et Android.
- **Expo Router** : Navigation basée sur le système de fichiers.
- **Expo Audio** : Gestion de l'audio pour la synthèse vocale et l'enregistrement.
- **TypeScript** : Typage statique pour une meilleure maintenabilité.

### Backend (API)
- **FastAPI** : Framework Python asynchrone pour l'API REST.
- **Uvicorn** : Serveur ASGI haute performance.
- **Groq API** : Accès aux modèles Llama 3.1 et Whisper pour IA et transcription.
- **ChromaDB** : Base de données vectorielle pour le stockage des embeddings.
- **Sentence Transformers** : Génération d'embeddings sémantiques.
- **PyTorch** : Framework ML sous-jacent pour les modèles d'IA.

### Données et Algorithmes
- **Graphe du Campus** : Structure JSON représentant les nœuds (lieux) et arêtes (connexions).
- **Pathfinding A*** : Algorithme de recherche de chemin avec heuristique.
- **PDR** : Estimation de position basée sur les capteurs inertiels.

---

## 📱 Installation et Déploiement

### Prérequis Système
- **Node.js** : Version 18 ou supérieure
- **Python** : Version 3.10 ou supérieure
- **Expo CLI** : Pour le développement mobile
- **Expo Go** : Application mobile pour tester (SDK 54)

### 1. Clonage et Configuration
```bash
# Cloner le dépôt (ou extraire l'archive)
cd /path/to/project

# Installer les dépendances frontend
npm install
```

### 2. Configuration Backend
```bash
# Aller dans le dossier backend
cd backend

# Créer un environnement virtuel (recommandé)
python -m venv venv
# Sur Windows
venv\Scripts\activate
# Sur macOS/Linux
source venv/bin/activate

# Installer les dépendances Python
pip install -r requirements.txt
```

### 3. Configuration des Clés API
Crée un fichier `backend/.env` et ajoute-y ta clé Groq/OpenAI.

```env
# backend/.env
GROQ_API_KEY=votre_clé_api_groq
```

Le fichier `backend/.env` est déjà ignoré par `.gitignore`, donc il ne sera pas poussé sur GitHub.

### 4. Lancement du Backend
```bash
# Depuis le dossier backend
uvicorn main:app --reload --host 0.0.0.0 --port 8081
```

### 5. Publication sur GitHub
Si tu veux pousser ce projet vers `https://github.com/Hassan-ibbakh/smart-campus`, exécute depuis la racine du projet :

```powershell
cd "c:\Users\ATLAS PRO ELECTRO\Downloads\projet X\zip version\zip version"

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/Hassan-ibbakh/smart-campus.git
git push -u origin main
```

Si tu as déjà un dépôt Git local, vérifie que `backend/venv/` et `backend/.env` ne sont pas ajoutés :

```powershell
git status --short
```

Si ces éléments apparaissent, retire-les avec :

```powershell
git rm --cached -r backend/venv
git rm --cached backend/.env
```

### 6. Lancement du Frontend
```bash
# Retourner à la racine du projet
cd ..

# Lancer Expo
npx expo start -c
```

### 5. Lancement du Frontend
```bash
# Retourner à la racine du projet
cd ..

# Lancer Expo
npx expo start -c
```

---

## 📱 Test sur Appareil Mobile

### Configuration Réseau
1. **Connexion Wi-Fi** : Assurez-vous que votre PC et smartphone sont sur le même réseau.
2. **Adresse IP** : Identifiez l'IP locale de votre PC (`ipconfig` sur Windows, `ifconfig` sur Linux/Mac).
3. **Mise à Jour API** : Modifier `API_URL` dans `services/api.ts` avec l'IP de votre PC.

### Application Expo Go
- **Téléchargement** : Installez Expo Go depuis l'App Store ou Google Play (version SDK 54).
- **Scan QR Code** : Scannez le code affiché dans le terminal après `npx expo start`.
- **Test** : Utilisez l'application pour tester la navigation vocale et PDR.

---

## 🏗️ Architecture du Projet

```
smart-campus/
├── app/                    # Écrans React Native (Expo Router)
│   ├── _layout.tsx        # Layout principal
│   ├── index.tsx          # Écran d'accueil
│   ├── ask.tsx            # Écran de question vocale
│   ├── navigate.tsx       # Écran de navigation
│   ├── menu.tsx           # Menu principal
│   └── settings.tsx       # Paramètres
├── components/            # Composants UI réutilisables
│   ├── CampusMap.tsx     # Carte interactive du campus
│   ├── VoiceButton.tsx   # Bouton d'enregistrement vocal
│   ├── AudioGuide.tsx    # Guide audio
│   ├── BottomNav.tsx     # Navigation inférieure
│   └── RagResultCard.tsx # Carte de résultats RAG
├── hooks/                 # Logique métier réutilisable
│   ├── useNavigation.ts  # Gestion de la navigation
│   ├── usePDR.ts         # Positionnement PDR
│   ├── useRag.ts         # Intégration RAG
│   └── useSpeech.ts      # Gestion de la synthèse vocale
├── services/              # Services API
│   └── api.ts            # Client API pour le backend
├── data/                  # Données statiques
│   └── campus_graph.json # Graphe du campus
├── backend/               # Serveur FastAPI
│   ├── main.py           # Point d'entrée API
│   ├── service_rag.py    # Service RAG avec ChromaDB
│   ├── pathfinding.py    # Algorithme de pathfinding
│   ├── graph_data.py     # Chargement du graphe
│   ├── rag.py            # Simulation RAG (legacy)
│   ├── requirements.txt  # Dépendances Python
│   └── chroma_services/  # Base ChromaDB persistante
└── README.md              # Ce fichier
```

---

## 🔌 API Endpoints

Le backend expose les endpoints suivants via FastAPI :

- `POST /ask` : Analyse d'une requête vocale et génération de réponse IA
- `POST /navigate` : Calcul d'itinéraire entre deux points
- `POST /locate` : Localisation sémantique d'un lieu via description
- `POST /transcribe` : Transcription audio vers texte
- `GET /graph` : Récupération du graphe du campus

Tous les endpoints supportent CORS pour l'intégration frontend.

---

## 🤝 Contribution

Ce projet a été développé dans le cadre du MIAthon 2026. Pour contribuer :
1. Fork le dépôt
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -am 'Ajout de nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

---

## 📄 Licence

Ce projet est développé pour des fins éducatives et de démonstration dans le cadre du MIAthon 2026.

---

## 🙏 Remerciements

- **Groq** : Pour l'accès aux modèles Llama 3.1 et Whisper
- **MIAthon 2026** : Pour l'opportunité d'innover dans l'accessibilité
- **Communauté Open Source** : Pour les bibliothèques utilisées (FastAPI, ChromaDB, Sentence Transformers, etc.)

---

**Développé avec ❤️ pour rendre les campus plus accessibles à tous.**
