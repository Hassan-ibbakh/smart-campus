def query_rag(query: str):
    """
    Système RAG simplifié pour un centre commercial (mall).
    Retourne les infos de la boutique / zone la plus pertinente
    en fonction de mots-clés dans la requête.
    En production, remplacer par ChromaDB + embeddings (voir service_rag.py).
    """
    query_lower = query.lower()

    # ── Restauration / Food Court ─────────────────────────────────────────────
    if any(k in query_lower for k in ["manger", "déjeuner", "repas", "faim", "food", "restaurant", "pizza", "burger", "sushi", "café", "cafétéria"]):
        return {
            "office":       "Food Court",
            "node_id":      "food_court",
            "floor":        2,
            "description":  "Espace restauration avec plusieurs enseignes : fast food, pizza, sushi, sandwicherie, café.",
            "horaires":     "Lun-Dim 11h-22h",
            "rag_excerpt":  "[Plan du mall] Le Food Court est situé au niveau 2, aile Est."
        }

    # ── Supermarché ───────────────────────────────────────────────────────────
    if any(k in query_lower for k in ["supermarché", "courses", "alimentation", "épicerie", "carrefour", "nourriture", "provisions"]):
        return {
            "office":       "Supermarché Carrefour",
            "node_id":      "supermarket",
            "floor":        0,
            "description":  "Grande surface alimentaire : épicerie, fruits et légumes, boucherie, boulangerie.",
            "horaires":     "Lun-Dim 9h-22h",
            "rag_excerpt":  "[Plan du mall] Carrefour est situé au rez-de-chaussée, entrée principale."
        }

    # ── Cinéma ────────────────────────────────────────────────────────────────
    if any(k in query_lower for k in ["cinéma", "film", "séance", "billet", "3d", "imax", "projection"]):
        return {
            "office":       "Cinéma Megaplex",
            "node_id":      "cinema",
            "floor":        3,
            "description":  "Complexe cinématographique 8 salles, films en VO/VF, séances 3D et IMAX.",
            "horaires":     "Lun-Dim 10h-23h",
            "rag_excerpt":  "[Plan du mall] Le cinéma Megaplex est au niveau 3, aile Nord."
        }

    # ── Mode / Vêtements ──────────────────────────────────────────────────────
    if any(k in query_lower for k in ["zara", "vêtements", "mode", "habits", "shopping", "femme", "homme", "enfant", "tenue", "robe", "jean"]):
        return {
            "office":       "Zara",
            "node_id":      "fashion_zone",
            "floor":        1,
            "description":  "Boutique de mode homme, femme et enfant. Collections tendance, vêtements, accessoires.",
            "horaires":     "Lun-Dim 10h-22h",
            "rag_excerpt":  "[Plan du mall] Zone Mode — Niveau 1, aile Ouest. Zara, H&M, Bershka."
        }

    # ── Pharmacie ─────────────────────────────────────────────────────────────
    if any(k in query_lower for k in ["pharmacie", "médicament", "santé", "ordonnance", "parapharmacie", "soin", "cosmétique"]):
        return {
            "office":       "Pharmacie du Mall",
            "node_id":      "pharmacy",
            "floor":        0,
            "description":  "Pharmacie complète : médicaments, parapharmacie, cosmétiques, conseils santé.",
            "horaires":     "Lun-Dim 9h-22h",
            "rag_excerpt":  "[Plan du mall] Pharmacie au rez-de-chaussée, près de l'entrée Sud."
        }

    # ── ATM / Banque ──────────────────────────────────────────────────────────
    if any(k in query_lower for k in ["atm", "distributeur", "argent", "retrait", "banque", "cash", "billets"]):
        return {
            "office":       "Zone ATM",
            "node_id":      "atm_zone",
            "floor":        0,
            "description":  "Distributeurs automatiques CIH, Attijariwafa, BMCE disponibles 24h/24.",
            "horaires":     "24h/24",
            "rag_excerpt":  "[Plan du mall] ATM regroupés près de l'accueil central, niveau 0."
        }

    # ── Espace enfants / Jeux ─────────────────────────────────────────────────
    if any(k in query_lower for k in ["enfants", "jeux", "kids", "manège", "aire de jeux", "famille", "activités"]):
        return {
            "office":       "Espace Kids & Jeux",
            "node_id":      "kids_zone",
            "floor":        2,
            "description":  "Zone de jeux pour enfants, manèges, aire de jeux couverte, activités ludiques.",
            "horaires":     "Lun-Dim 10h-21h30",
            "rag_excerpt":  "[Plan du mall] Kids Zone au niveau 2, aile Ouest."
        }

    # ── Sport ─────────────────────────────────────────────────────────────────
    if any(k in query_lower for k in ["sport", "fitness", "décathlon", "running", "vélo", "chaussures sport", "football"]):
        return {
            "office":       "Décathlon Sport",
            "node_id":      "sport_zone",
            "floor":        1,
            "description":  "Articles de sport toutes disciplines : vêtements, chaussures, équipements fitness.",
            "horaires":     "Lun-Dim 9h-22h",
            "rag_excerpt":  "[Plan du mall] Décathlon — Niveau 1, aile Est."
        }

    # ── Bijouterie / Luxe ─────────────────────────────────────────────────────
    if any(k in query_lower for k in ["bijoux", "or", "montre", "bague", "cadeau", "bijouterie", "luxe", "argent"]):
        return {
            "office":       "Bijouterie Excellence",
            "node_id":      "luxury_zone",
            "floor":        1,
            "description":  "Bijoux en or et argent, montres de marque, gravure personnalisée.",
            "horaires":     "Lun-Dim 10h-21h",
            "rag_excerpt":  "[Plan du mall] Zone Luxe — Niveau 1, galerie centrale."
        }

    # ── Parking ───────────────────────────────────────────────────────────────
    if any(k in query_lower for k in ["parking", "voiture", "stationnement", "place", "garer"]):
        return {
            "office":       "Parking du Mall",
            "node_id":      "parking",
            "floor":        -1,
            "description":  "Parking souterrain et extérieur, 1500 places, accessible PMR, paiement automatique.",
            "horaires":     "Lun-Dim 8h-23h",
            "rag_excerpt":  "[Plan du mall] Accès parking : rampe d'entrée côté rue principale."
        }

    # ── Toilettes / Prière ────────────────────────────────────────────────────
    if any(k in query_lower for k in ["toilettes", "wc", "sanitaires", "prière", "ablutions", "mosquée"]):
        return {
            "office":       "Toilettes & Espace de Prière",
            "node_id":      "restrooms",
            "floor":        0,
            "description":  "Sanitaires publics à chaque niveau, espace de prière séparé homme/femme.",
            "horaires":     "Lun-Dim 9h-22h30",
            "rag_excerpt":  "[Plan du mall] Toilettes disponibles à chaque niveau près des escaliers."
        }

    # ── Accueil / Information ─────────────────────────────────────────────────
    if any(k in query_lower for k in ["accueil", "information", "plan", "aide", "renseignement", "objets trouvés", "perdu"]):
        return {
            "office":       "Accueil & Information",
            "node_id":      "entrance",
            "floor":        0,
            "description":  "Point d'information central : plans, renseignements, objets trouvés, assistance.",
            "horaires":     "Lun-Dim 10h-22h",
            "rag_excerpt":  "[Plan du mall] Accueil central à l'entrée principale, niveau 0."
        }

    # ── Aucun résultat ────────────────────────────────────────────────────────
    return None