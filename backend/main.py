import json
import os
import base64
import requests
import threading
from pathlib import Path
from functools import lru_cache

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

try:
    from service_rag import search_services, _get_collection
except Exception as _e:
    import traceback
    print(f"[ERREUR] Impossible d'importer service_rag : {_e}")
    traceback.print_exc()
    raise

from pathfinding import find_path
from graph_data import load_graph

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Mall API",
    description="Backend pour l'application de navigation inclusive Smart Mall",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

graph_data   = load_graph()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY doit être défini dans backend/.env ou dans les variables d'environnement")

# ─── Préchargement du modèle RAG au démarrage (en arrière-plan) ───────────
def _warmup_rag():
    try:
        print("[STARTUP] Préchargement du modèle RAG...")
        _get_collection()  # Charge le modèle + l'index ChromaDB
        print("[STARTUP] ✅ Modèle RAG prêt.")
    except Exception as e:
        print(f"[STARTUP] ⚠️ Warmup RAG échoué : {e}")

threading.Thread(target=_warmup_rag, daemon=True).start()

# ─── Cache des réponses RAG pour éviter de recalculer les mêmes requêtes ────────
_rag_cache: dict = {}

# ─── Nœuds du mall (chargés dynamiquement depuis le graphe) ───────────────────
MALL_NODES = [n["id"] for n in graph_data["nodes"]]

# ─── Chargement des données externes ──────────────────────────────────────────
def load_data(filename):
    path = BASE_DIR / "data" / filename
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

PROMOTIONS = load_data("promotions.json")
EMERGENCY  = load_data("emergency.json")
SERVICES   = load_data("services.json")

# ─── Modèles ──────────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str

class NavigateRequest(BaseModel):
    from_node: str
    to_node: str
    accessible: Optional[bool] = False

class SemanticLocateRequest(BaseModel):
    description: str

class AskRequest(BaseModel):
    query: str
    current_node: Optional[str] = "entrance"

class AskResponse(BaseModel):
    answer: str
    destination_node: Optional[str] = None
    service_name: Optional[str] = None
    horaires: Optional[str] = None
    navigation: Optional[dict] = None
    promotion: Optional[str] = None

class PositionUpdate(BaseModel):
    user_id: str
    node_id: str
    timestamp: float
    type: str  # 'visitor' or 'resource' (security, staff)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _rag_answer(query: str, current_node: str) -> AskResponse:
    """
    Logique RAG pour le mall :
    - Cache en mémoire pour les requêtes fréquentes (< 50ms)
    - Recherche le service/boutique le plus pertinent dans la base vectorielle
    - Construit une réponse naturelle orientée visiteur de mall
    - Calcule l'itinéraire depuis la position courante
    - Ajoute les infos de promotions si existantes
    """
    # ── Cache : clé = (query normalisée, nœud de départ) ────────────────────
    cache_key = (query.lower().strip()[:80], current_node)
    if cache_key in _rag_cache:
        print(f"[RAG] Cache hit pour '{query}'")
        return _rag_cache[cache_key]

    try:
        results = search_services(query, top_k=1)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur RAG : {e}")

    if not results or not results.get("metadatas") or not results["metadatas"][0]:
        return AskResponse(
            answer="Désolé, je n'ai trouvé aucune boutique ou service correspondant à votre demande dans ce mall."
        )

    best = results["metadatas"][0][0]
    store_name = best['name']

    # Vérifier les promotions
    active_promo = next((p["title"] for p in PROMOTIONS if p["store"].lower() in store_name.lower()), None)

    # Réponse adaptée au contexte mall
    answer = f"{store_name} — {best['description']}"
    if best.get("horaires"):
        answer += f" Horaires d'ouverture : {best['horaires']}."
    
    if active_promo:
        answer += f" Bonne nouvelle ! Il y a une promotion en cours : {active_promo}."
        
    answer += " Souhaitez-vous que je vous guide jusqu'à cet espace ?"

    nav       = None
    dest_node = best.get("node_id")
    if dest_node and current_node:
        try:
            nav = find_path(graph_data, current_node, dest_node)
        except Exception:
            nav = None

    response = AskResponse(
        answer=answer,
        destination_node=dest_node,
        service_name=store_name,
        horaires=best.get("horaires"),
        navigation=nav,
        promotion=active_promo
    )

    # Stocker en cache (max 100 entrées pour éviter les fuites mémoire)
    if len(_rag_cache) < 100:
        _rag_cache[cache_key] = response

    return response


# Stockage temporaire des positions pour le dashboard
USER_POSITIONS = {}

@app.post("/position")
def update_position(update: PositionUpdate):
    """
    Reçoit les mises à jour de position en temps réel.
    Permet de suivre les visiteurs et les ressources (sécurité, etc.)
    """
    USER_POSITIONS[update.user_id] = {
        "node_id": update.node_id,
        "timestamp": update.timestamp,
        "type": update.type
    }
    return {"status": "success", "count": len(USER_POSITIONS)}

@app.get("/analytics/realtime")
def get_realtime_analytics():
    """Données pour le dashboard de gestion du mall."""
    visitors = [v for v in USER_POSITIONS.values() if v["type"] == "visitor"]
    resources = [r for r in USER_POSITIONS.values() if r["type"] == "resource"]
    
    # Calcul simple de congestion par zone
    congestion = {}
    for v in visitors:
        node = v["node_id"]
        congestion[node] = congestion.get(node, 0) + 1
        
    return {
        "active_visitors": len(visitors),
        "active_resources": len(resources),
        "zone_congestion": congestion,
        "resource_status": resources
    }


def _tts_base64(text: str) -> Optional[str]:
    """Synthèse vocale via Groq TTS. Retourne le MP3 encodé en base64."""
    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/audio/speech",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
            json={"model": "playai-tts", "input": text, "voice": "Fritz-PlayAI", "response_format": "mp3"},
            timeout=20,
        )
        res.raise_for_status()
        return base64.b64encode(res.content).decode("utf-8")
    except Exception as e:
        print(f"[TTS] Erreur : {e}")
        return None


# ==================== ENDPOINTS EXISTANTS =====================================

@app.post("/locate_semantically")
def locate_semantically(req: SemanticLocateRequest):
    """
    Géolocalisation sémantique adaptée au mall :
    le LLM identifie dans quel espace du mall se trouve le visiteur
    d'après ce qu'il décrit autour de lui.
    """
    nodes_list = ", ".join(MALL_NODES)
    system_prompt = f"""Tu es le système de géolocalisation sémantique d'un centre commercial (mall).
Espaces disponibles : {nodes_list}.
D'après la description visuelle ou textuelle du visiteur, retourne UNIQUEMENT l'ID de l'espace le plus probable.
Rien d'autre — pas de phrase, pas d'explication."""

    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json={
                "model": "llama3-8b-8192",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Je vois autour de moi : {req.description}"},
                ],
                "temperature": 0.1,
                "max_tokens": 10,
            },
        )
        res.raise_for_status()
        node_id = res.json()["choices"][0]["message"]["content"].strip().lower()
        matched = next((n for n in MALL_NODES if n in node_id), "entrance")
        return {
            "success": True,
            "detected_node_id": matched,
            "raw_llm_response": node_id,
            "engine": "Groq LLaMA3-8b",
        }
    except Exception as e:
        return {"success": False, "detected_node_id": "entrance", "error": str(e)}


@app.post("/voice_command")
async def process_voice_command(audio: UploadFile = File(...)):
    """
    Commande vocale de navigation dans le mall :
    Whisper transcrit → LLM extrait from_node / to_node parmi les espaces du mall.
    """
    file_location = f"temp_voice_{os.getpid()}_{os.urandom(4).hex()}.m4a"
    with open(file_location, "wb") as f:
        f.write(await audio.read())

    try:
        with open(file_location, "rb") as fu:
            res = requests.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                files={"file": (file_location, fu, "audio/m4a")},
                data={"model": "whisper-large-v3-turbo", "response_format": "json"},
            )
            res.raise_for_status()
            transcription = res.json()["text"]
    except Exception as e:
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Whisper Error: {e}")
    finally:
        if os.path.exists(file_location):
            os.remove(file_location)

    if not transcription or len(transcription.strip()) < 2:
        return {
            "transcription": transcription,
            "extracted_intent": {"from_node": "entrance", "to_node": "food_court"},
            "navigation": find_path(graph_data, "entrance", "food_court"),
        }

    nodes_list = ", ".join(MALL_NODES)
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    system_prompt = f"""Tu es l'assistant de navigation d'un centre commercial (mall).
Espaces disponibles : {nodes_list}.
À partir de la demande du visiteur, retourne UNIQUEMENT :
{{"from_node": "ID_depart", "to_node": "ID_destination"}}
Si le départ n'est pas mentionné, utilise "entrance".
Choisis l'espace le plus proche sémantiquement parmi la liste fournie."""

    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"'{transcription}'"},
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            },
        )
        res.raise_for_status()
        result    = json.loads(res.json()["choices"][0]["message"]["content"])
        from_node = result.get("from_node", "entrance")
        to_node   = result.get("to_node", "food_court")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {e}")

    nav = find_path(graph_data, from_node, to_node)
    if not nav:
        raise HTTPException(status_code=404, detail="Chemin introuvable")

    nodes_dict = {n["id"]: n for n in graph_data["nodes"]}
    return {
        "transcription": transcription,
        "extracted_intent": {
            "from_node":  from_node,
            "to_node":    to_node,
            "from_label": nodes_dict.get(from_node, {}).get("label", from_node),
            "to_label":   nodes_dict.get(to_node, {}).get("label", to_node),
        },
        "navigation": nav,
    }


@app.post("/navigate")
def handle_navigate(request: NavigateRequest):
    path_result = find_path(graph_data, request.from_node, request.to_node)
    if not path_result:
        raise HTTPException(status_code=404, detail="Chemin impossible")
    return path_result


@app.get("/stores")
def get_stores():
    """Liste des enseignes et espaces du mall chargées depuis services.json."""
    return SERVICES


@app.get("/promotions")
def get_promotions():
    """Promotions et événements en cours dans le mall chargées depuis promotions.json."""
    return PROMOTIONS


@app.get("/emergency")
def get_emergency():
    """Contacts d'urgence chargés depuis emergency.json."""
    return EMERGENCY


@app.get("/graph")
def get_graph():
    return graph_data


# ==================== /ask — texte → texte ====================================

@app.post("/ask", response_model=AskResponse)
def ask_service(req: AskRequest):
    """RAG mall : question texte → réponse texte avec navigation."""
    return _rag_answer(req.query, req.current_node or "entrance")


# ==================== /ask/voice — audio → texte + audio =====================

@app.post("/ask/voice")
async def ask_voice(
    audio:        UploadFile    = File(...),
    current_node: Optional[str] = Form(default="entrance"),
):
    """
    Flux vocal complet pour le mall :
    1. Audio reçu  →  Whisper (transcription)
    2. Texte       →  RAG vectoriel (boutique / service + navigation)
    3. Réponse     →  Groq TTS (mp3 base64)

    Retourne :
    {
      transcription, answer, service_name, horaires,
      destination_node, navigation,
      audio_base64 (mp3 en base64),
      audio_format  ("mp3")
    }
    """
    # 1. Détecter le format audio
    filename = audio.filename or "query.m4a"
    if "webm" in filename.lower() or "blob" in filename.lower():
        mime_type = "audio/webm"
        ext = "webm"
    else:
        mime_type = "audio/m4a"
        ext = "m4a"

    file_location = f"temp_ask_{os.getpid()}.{ext}"
    with open(file_location, "wb") as f:
        f.write(await audio.read())

    # 2. Transcription Whisper
    try:
        with open(file_location, "rb") as fu:
            res = requests.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                files={"file": (f"audio.{ext}", fu, mime_type)},
                data={"model": "whisper-large-v3-turbo", "response_format": "json"},
                timeout=30,
            )
            res.raise_for_status()
            transcription = res.json()["text"].strip()
    except Exception as e:
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Whisper Error: {e}")
    finally:
        if os.path.exists(file_location):
            os.remove(file_location)

    if not transcription or len(transcription) < 2:
        return JSONResponse(
            status_code=422,
            content={"error": "Audio trop court ou inaudible", "transcription": transcription},
        )

    # 3. RAG mall
    rag = _rag_answer(transcription, current_node or "entrance")

    # 4. TTS
    audio_b64 = _tts_base64(rag.answer)

    # 5. Réponse finale
    return {
        "transcription":    transcription,
        "answer":           rag.answer,
        "destination_node": rag.destination_node,
        "service_name":     rag.service_name,
        "horaires":         rag.horaires,
        "navigation":       rag.navigation,
        "audio_base64":     audio_b64,
        "audio_format":     "mp3",
    }