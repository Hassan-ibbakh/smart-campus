from typing import Optional
from service_rag import search_services

def query_rag(query: str, top_k: int = 1) -> Optional[dict]:
    """
    Système RAG unifié pour le Mall.
    Utilise la recherche vectorielle (ChromaDB) pour trouver les services pertinents.
    """
    try:
        results = search_services(query, top_k=top_k)
        
        if not results or not results.get("metadatas") or not results["metadatas"][0]:
            return None
            
        best = results["metadatas"][0][0]
        
        return {
            "name": best['name'],
            "node_id": best.get("node_id"),
            "floor": best.get("floor"),
            "description": best['description'],
            "horaires": best.get("horaires"),
            "category": best.get("category"),
            "rag_excerpt": f"[Base Vectorielle] {best['name']} : {best['description']}"
        }
    except Exception as e:
        print(f"[RAG] Erreur lors de la requête : {e}")
        return None
