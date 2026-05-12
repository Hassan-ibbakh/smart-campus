import os
import json
import chromadb
from sentence_transformers import SentenceTransformer

# ─── Chemins absolus ──────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
SERVICES_FILE = os.path.join(BASE_DIR, "data", "services.json")
CHROMA_DIR    = os.path.join(BASE_DIR, "chroma_services")

# ─── Modèle (meilleur sur le français que distiluse) ─────────────────────────
MODEL_NAME = "paraphrase-multilingual-mpnet-base-v2"

_model      = None
_collection = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"[RAG] Chargement du modèle {MODEL_NAME}...")
        _model = SentenceTransformer(MODEL_NAME)
        print("[RAG] Modèle chargé.")
    return _model


def _build_text(s: dict) -> str:
    """
    Texte riche pour l'indexation.
    On répète nom + keywords pour augmenter leur poids sémantique.
    """
    keywords = ", ".join(s.get("keywords", []))
    return (
        f"{s['name']}. {s['name']}. "
        f"{s['description']} "
        f"Mots clés: {keywords}. {keywords}."
    )


def _get_collection() -> chromadb.Collection:
    global _collection
    if _collection is not None:
        return _collection

    os.makedirs(CHROMA_DIR, exist_ok=True)
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    # Supprimer l'ancienne collection pour forcer la réindexation avec le nouveau modèle
    try:
        client.delete_collection("services")
        print("[RAG] Ancienne collection supprimée — réindexation en cours.")
    except Exception:
        pass

    col = client.get_or_create_collection(name="services")

    if not os.path.exists(SERVICES_FILE):
        raise FileNotFoundError(
            f"[RAG] Fichier introuvable : {SERVICES_FILE}\n"
            "Placez services.json dans le dossier data/ à côté de service_rag.py."
        )

    with open(SERVICES_FILE, "r", encoding="utf-8") as f:
        services = json.load(f)

    model = _get_model()
    print(f"[RAG] Indexation de {len(services)} services...")

    for s in services:
        text      = _build_text(s)
        embedding = model.encode(text).tolist()
        col.add(
            ids=[s["id"]],
            embeddings=[embedding],
            documents=[text],
            metadatas=[{
                "node_id":     s["node_id"],
                "name":        s["name"],
                "horaires":    s.get("horaires", ""),
                "description": s["description"],
            }],
        )

    print(f"[RAG] ✅ {len(services)} services indexés avec {MODEL_NAME}.")
    _collection = col
    return col


def search_services(query: str, top_k: int = 3) -> dict:
    col   = _get_collection()
    model = _get_model()
    emb   = model.encode(query).tolist()
    return col.query(
        query_embeddings=[emb],
        n_results=min(top_k, col.count()),
    )