import json
import os
import base64
import requests
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

try:
    from service_rag import search_services
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

# ─── Nœuds du mall ────────────────────────────────────────────────────────────
# À synchroniser avec graph_data (graph_data.py / graph.json)
MALL_NODES = [
    "entrance",       # Entrée principale
    "hall",           # Hall central
    "food_court",     # Restauration
    "cinema",         # Cinéma
    "fashion_zone",   # Zone mode (Zara, H&M…)
    "supermarket",    # Supermarché
    "pharmacy",       # Pharmacie
    "atm_zone",       # Distributeurs ATM
    "kids_zone",      # Espace enfants
    "parking",        # Parking
    "restrooms",      # Toilettes / espace de prière
    "luxury_zone",    # Bijouterie / luxe
    "sport_zone",     # Articles de sport
]

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


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _rag_answer(query: str, current_node: str) -> AskResponse:
    """
    Logique RAG pour le mall :
    - Recherche le service/boutique le plus pertinent dans la base vectorielle
    - Construit une réponse naturelle orientée visiteur de mall
    - Calcule l'itinéraire depuis la position courante
    """
    try:
        results = search_services(query, top_k=1)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur RAG : {e}")

    if not results or not results.get("metadatas") or not results["metadatas"][0]:
        return AskResponse(
            answer="Désolé, je n'ai trouvé aucune boutique ou service correspondant à votre demande dans ce mall."
        )

    best = results["metadatas"][0][0]

    # Réponse adaptée au contexte mall
    answer = f"{best['name']} — {best['description']}"
    if best.get("horaires"):
        answer += f" Horaires d'ouverture : {best['horaires']}."
    answer += " Souhaitez-vous que je vous guide jusqu'à cet espace ?"

    nav       = None
    dest_node = best.get("node_id")
    if dest_node and current_node:
        try:
            nav = find_path(graph_data, current_node, dest_node)
        except Exception:
            nav = None

    return AskResponse(
        answer=answer,
        destination_node=dest_node,
        service_name=best.get("name"),
        horaires=best.get("horaires"),
        navigation=nav,
    )


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
    file_location = f"temp_{audio.filename}"
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
    """Liste des enseignes et espaces du mall."""
    return [
        {"id": "zara",        "name": "Zara",              "category": "Mode",         "floor": 1, "node_id": "fashion_zone",  "status": "Ouvert"},
        {"id": "carrefour",   "name": "Carrefour",         "category": "Supermarché",  "floor": 0, "node_id": "supermarket",   "status": "Ouvert"},
        {"id": "mcdo",        "name": "McDonald's",        "category": "Restauration", "floor": 2, "node_id": "food_court",    "status": "Ouvert"},
        {"id": "megaplex",    "name": "Cinéma Megaplex",   "category": "Cinéma",       "floor": 3, "node_id": "cinema",        "status": "Ouvert"},
        {"id": "decathlon",   "name": "Décathlon",         "category": "Sport",        "floor": 1, "node_id": "sport_zone",    "status": "Ouvert"},
        {"id": "pharmacie",   "name": "Pharmacie du Mall", "category": "Santé",        "floor": 0, "node_id": "pharmacy",      "status": "Ouvert"},
        {"id": "bijouterie",  "name": "Excellence Bijoux", "category": "Luxe",         "floor": 1, "node_id": "luxury_zone",   "status": "Ouvert"},
    ]


@app.get("/promotions")
def get_promotions():
    """Promotions et événements en cours dans le mall."""
    return [
        {"id": 1, "store": "Zara",          "title": "Soldes été -30%",         "valid_until": "2026-06-30"},
        {"id": 2, "store": "Carrefour",     "title": "Fruits & légumes offre",  "valid_until": "2026-05-20"},
        {"id": 3, "store": "Cinéma Megaplex","title": "Mardi -50% sur billets", "valid_until": "2026-12-31"},
        {"id": 4, "store": "Décathlon",     "title": "Kit running à 299 MAD",   "valid_until": "2026-05-31"},
    ]


@app.get("/emergency")
def get_emergency():
    return {
        "security":     "Sécurité mall : 05 35 00 11 22",
        "medical":      "Premiers secours : 05 35 00 33 44",
        "fire":         "15",
        "police":       "19",
        "lost_found":   "Objets trouvés — Accueil central : Niveau 0",
    }


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