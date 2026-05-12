def query_rag(query: str):
    """
    Simule un système RAG. 
    En production, ceci utiliserait LangChain/LlamaIndex et une vraie base vectorielle.
    """
    query_lower = query.lower()
    
    if "scolarité" in query_lower or "inscription" in query_lower or "diplôme" in query_lower:
        return {
            "office": "Scolarité",
            "node_id": "B104",
            "floor": 1,
            "description": "Le service de scolarité gère les inscriptions et les diplômes.",
            "rag_excerpt": "[Extrait du livret d'accueil.pdf] Le bureau B104 (Scolarité) est ouvert de 9h à 16h au premier étage."
        }
    
    if "direction" in query_lower or "doyen" in query_lower:
        return {
            "office": "Direction",
            "node_id": "B105",
            "floor": 1,
            "description": "Le bureau du doyen et de la direction générale.",
            "rag_excerpt": "[Extrait organigramme.pdf] La direction est située au B105."
        }
        
    if "rh" in query_lower or "ressources humaines" in query_lower:
        return {
            "office": "Ressources Humaines",
            "node_id": "B106",
            "floor": 1,
            "description": "Service du personnel et des ressources humaines.",
            "rag_excerpt": "[Extrait annuaire.pdf] RH : Bureau B106."
        }
    
    return None
