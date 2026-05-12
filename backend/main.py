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
app = FastAPI(title="Smart Campus API", description="Backend pour l'application inclusive Smart Campus")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

graph_data   = load_graph()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY doit être défini dans backend/.env ou dans les variables d'environnement")

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
    """Logique RAG commune (texte → AskResponse)."""
    try:
        results = search_services(query, top_k=1)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur RAG : {e}")

    if not results or not results.get("metadatas") or not results["metadatas"][0]:
        return AskResponse(answer="Désolé, je n'ai trouvé aucun service correspondant à votre demande.")

    best   = results["metadatas"][0][0]
    answer = f"{best['name']}. {best['description']}"
    if best.get("horaires"):
        answer += f" Horaires : {best['horaires']}."
    answer += " Puis-je vous guider vers ce service ?"

    nav       = None
    dest_node = best.get("node_id")
    if dest_node and current_node:
        try:
            nav = find_path(graph_data, current_node, dest_node)
        except Exception:
            nav = None

    return AskResponse(
        answer=answer, destination_node=dest_node,
        service_name=best.get("name"), horaires=best.get("horaires"), navigation=nav,
    )


def _tts_base64(text: str) -> Optional[str]:
    """
    Synthèse vocale via Groq TTS.
    Retourne le MP3 encodé en base64, ou None si erreur.
    """
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
    system_prompt = """Tu es le système de géolocalisation sémantique du Smart Campus.
Noeuds : entrance (entrée), hall (hall central), cafeteria (buffet), amphi_1 (jury+projecteur), corridor_a (couloir).
Retourne UNIQUEMENT l'ID du nœud. Rien d'autre."""
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    try:
        res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json={
            "model": "llama3-8b-8192",
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": f"Je vois : {req.description}"}],
            "temperature": 0.1, "max_tokens": 10,
        })
        res.raise_for_status()
        node_id = res.json()["choices"][0]["message"]["content"].strip().lower()
        matched = next((n for n in ["entrance","hall","cafeteria","amphi_1","corridor_a"] if n in node_id), "entrance")
        return {"success": True, "detected_node_id": matched, "raw_llm_response": node_id, "engine": "Groq LLaMA3-8b"}
    except Exception as e:
        return {"success": False, "detected_node_id": "entrance", "error": str(e)}


@app.post("/voice_command")
async def process_voice_command(audio: UploadFile = File(...)):
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
        if os.path.exists(file_location): os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Whisper Error: {e}")
    finally:
        if os.path.exists(file_location): os.remove(file_location)

    if not transcription or len(transcription.strip()) < 2:
        return {"transcription": transcription, "extracted_intent": {"from_node": "entrance", "to_node": "hall"}, "navigation": find_path(graph_data, "entrance", "hall")}

    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    system_prompt = """Tu es l'assistant de navigation d'un campus.
Lieux : entrance, hall, corridor_a, amphi_1, cafeteria, scolarite, direction, rh.
Retourne UNIQUEMENT : {"from_node": "ID", "to_node": "ID"}. Si départ absent, utilise "entrance"."""
    try:
        res    = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json={
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": f"'{transcription}'"}],
            "temperature": 0.1, "response_format": {"type": "json_object"},
        })
        res.raise_for_status()
        result    = json.loads(res.json()["choices"][0]["message"]["content"])
        from_node = result.get("from_node", "entrance")
        to_node   = result.get("to_node", "amphi_1")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM Error: {e}")

    nav = find_path(graph_data, from_node, to_node)
    if not nav: raise HTTPException(status_code=404, detail="Chemin introuvable")
    nodes_dict = {n["id"]: n for n in graph_data["nodes"]}
    return {"transcription": transcription, "extracted_intent": {"from_node": from_node, "to_node": to_node, "from_label": nodes_dict.get(from_node, {}).get("label", from_node), "to_label": nodes_dict.get(to_node, {}).get("label", to_node)}, "navigation": nav}


@app.post("/navigate")
def handle_navigate(request: NavigateRequest):
    path_result = find_path(graph_data, request.from_node, request.to_node)
    if not path_result: raise HTTPException(status_code=404, detail="Chemin impossible")
    return path_result


@app.get("/buildings")
def get_buildings():
    return [
        {"id": "fst",        "name": "Faculté des Sciences",  "nameAr": "كلية العلوم",                     "type": "academic", "color": "#3b82f6", "status": "Open",       "floors": 4},
        {"id": "encg",       "name": "ENCG Oujda",            "nameAr": "المدرسة الوطنية للتجارة والتسيير", "type": "academic", "color": "#059669", "status": "Open",       "floors": 2},
        {"id": "presidence", "name": "Présidence UMP",        "nameAr": "رئاسة جامعة محمد الأول",          "type": "admin",    "color": "#d4af37", "status": "Open",       "floors": 3},
        {"id": "lab_ia",     "name": "MIA Lab",               "nameAr": "مختبر الذكاء الاصطناعي",          "type": "lab",      "color": "#8b5cf6", "status": "Restricted", "floors": 2},
    ]

@app.get("/history")
def get_history():
    return [
        {"id": 1, "destination": "Bureau B104 (Scolarité)", "date": "2026-05-09", "time": "14:20"},
        {"id": 2, "destination": "Amphi A",                 "date": "2026-05-08", "time": "09:15"},
        {"id": 3, "destination": "Laboratoire IA",          "date": "2026-05-07", "time": "16:45"},
    ]

@app.get("/faculty")
def get_faculty(q: Optional[str] = None):
    faculty_list = [
        {"id": "p1", "name": "Dr. Ahmed Mansouri", "department": "Informatique",  "office": "B201"},
        {"id": "p2", "name": "Pr. Nadia Alami",    "department": "Mathématiques", "office": "C102"},
        {"id": "p3", "name": "Dr. Karim Tazi",     "department": "Physique",      "office": "A305"},
    ]
    if q:
        return [f for f in faculty_list if q.lower() in f["name"].lower() or q.lower() in f["department"].lower()]
    return faculty_list

@app.get("/emergency")
def get_emergency():
    return {"security": "05 36 00 11 22", "medical": "05 36 00 33 44", "fire": "15", "police": "19"}

@app.post("/query")
def handle_query(request: QueryRequest):
    from rag import query_rag
    result = query_rag(request.query)
    if not result: raise HTTPException(status_code=404, detail="Bureau non trouvé")
    return result

@app.get("/graph")
def get_graph():
    return graph_data


# ==================== /ask — texte → texte ====================================

@app.post("/ask", response_model=AskResponse)
def ask_service(req: AskRequest):
    """RAG : question texte → réponse texte."""
    return _rag_answer(req.query, req.current_node or "entrance")


# ==================== /ask/voice — audio → texte + audio =====================

@app.post("/ask/voice")
async def ask_voice(
    audio:        UploadFile    = File(...),
    current_node: Optional[str] = Form(default="entrance"),
):
    """
    Flux vocal complet :
    1. Audio reçu  →  Whisper (transcription)
    2. Texte       →  RAG vectoriel (service + navigation)
    3. Réponse     →  Groq TTS (mp3 base64)

    Retourne :
    {
      transcription, answer, service_name, horaires,
      destination_node, navigation,
      audio_base64 (mp3 en base64),
      audio_format  ("mp3")
    }
    """
    # 1. Sauvegarder le fichier audio
    file_location = f"temp_ask_{audio.filename}"
    with open(file_location, "wb") as f:
        f.write(await audio.read())

    # 2. Transcription Whisper
    try:
        with open(file_location, "rb") as fu:
            res = requests.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                files={"file": (file_location, fu, "audio/m4a")},
                data={"model": "whisper-large-v3-turbo", "response_format": "json"},
            )
            res.raise_for_status()
            transcription = res.json()["text"].strip()
    except Exception as e:
        if os.path.exists(file_location): os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Whisper Error: {e}")
    finally:
        if os.path.exists(file_location): os.remove(file_location)

    if not transcription or len(transcription) < 2:
        return JSONResponse(status_code=422, content={"error": "Audio trop court ou inaudible", "transcription": transcription})

    # 3. RAG
    rag = _rag_answer(transcription, current_node or "entrance")

    # 4. TTS — génère l'audio de la réponse
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