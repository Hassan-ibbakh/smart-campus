def query_rag(query: str):
    """
    Système RAG simplifié pour un centre commercial (mall).
    Retourne les infos de la boutique / zone la plus pertinente
    en fonction de mots-clés dans la requête.
    En production, remplacer par ChromaDB + embeddings (voir service_rag.py).
    node_id synchronisés avec data/services.json.
    """
    query_lower = query.lower()

    # ── Restauration / Food ───────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "manger", "déjeuner", "repas", "faim", "food", "restaurant",
        "burger", "mcdo", "mcdonald", "kfc", "poulet", "fast food",
    ]):
        return {
            "office":      "McDonald's",
            "node_id":     "mcdonalds",
            "floor":       0,
            "description": "Restaurant de restauration rapide : burgers, menus, Happy Meal, McNuggets.",
            "horaires":    "Lun-Dim 9h-23h",
            "rag_excerpt": "[Plan du mall] McDonald's — Food Court."
        }

    # ── Café / Boissons ───────────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "café", "cafétéria", "starbucks", "latte", "frappuccino",
        "thé", "pause", "boisson", "wi-fi", "coffee",
    ]):
        return {
            "office":      "Starbucks Coffee",
            "node_id":     "starbucks",
            "floor":       0,
            "description": "Cafés chauds et froids, thés, snacks, Wi-Fi gratuit.",
            "horaires":    "Lun-Dim 9h-22h",
            "rag_excerpt": "[Plan du mall] Starbucks Coffee."
        }

    # ── Pizza / Sushi / Autres restos ─────────────────────────────────────────
    if any(k in query_lower for k in ["pizza", "sushi", "sandwicherie"]):
        return {
            "office":      "KFC",
            "node_id":     "kfc",
            "floor":       0,
            "description": "Spécialiste du poulet frit : Bucket, wings, tenders, Twister.",
            "horaires":    "Lun-Dim 10h-23h",
            "rag_excerpt": "[Plan du mall] KFC — Food Court."
        }

    # ── Cinéma ────────────────────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "cinéma", "film", "séance", "billet", "3d", "imax", "4dx",
        "projection", "pathé", "pathe", "popcorn",
    ]):
        return {
            "office":      "Cinéma Pathé",
            "node_id":     "pathe",
            "floor":       0,
            "description": "Complexe 10 salles dont 2 IMAX et 1 4DX. Films VO/VF, avant-premières.",
            "horaires":    "Lun-Dim 10h-00h",
            "rag_excerpt": "[Plan du mall] Cinéma Pathé."
        }

    # ── Mode / Vêtements — Zara ───────────────────────────────────────────────
    if any(k in query_lower for k in [
        "zara", "vêtements", "mode", "habits", "shopping",
        "tenue", "robe", "jean", "collection",
    ]):
        return {
            "office":      "Zara",
            "node_id":     "zara",
            "floor":       0,
            "description": "Boutique de mode internationale : homme, femme, enfant. Collections tendance.",
            "horaires":    "Lun-Dim 10h-22h",
            "rag_excerpt": "[Plan du mall] Zara."
        }

    # ── Mode / Vêtements — H&M ───────────────────────────────────────────────
    if any(k in query_lower for k in [
        "h&m", "hm", "soldes", "promo", "basiques", "casual", "bébé",
    ]):
        return {
            "office":      "H&M",
            "node_id":     "h_m",
            "floor":       0,
            "description": "Mode accessible pour toute la famille. Promotions régulières, H&M Home.",
            "horaires":    "Lun-Dim 10h-22h",
            "rag_excerpt": "[Plan du mall] H&M."
        }

    # ── Sport — Nike ──────────────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "nike", "sneakers", "air max", "jordan", "running",
    ]):
        return {
            "office":      "Nike Store",
            "node_id":     "nike",
            "floor":       0,
            "description": "Concept store Nike : chaussures, vêtements running et training, personnalisation.",
            "horaires":    "Lun-Dim 10h-22h",
            "rag_excerpt": "[Plan du mall] Nike Store."
        }

    # ── Sport — Adidas ────────────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "adidas", "ultraboost", "originals", "football",
        "sport", "fitness", "vélo", "chaussures sport",
    ]):
        return {
            "office":      "Adidas",
            "node_id":     "adidas",
            "floor":       0,
            "description": "Articles de sport et lifestyle Adidas : running, football, basketball, Originals.",
            "horaires":    "Lun-Dim 10h-22h",
            "rag_excerpt": "[Plan du mall] Adidas."
        }

    # ── Beauté — Sephora ──────────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "sephora", "beauté", "maquillage", "parfum", "cosmétiques",
        "soin", "skincare", "rouge à lèvres", "fond de teint", "crème",
    ]):
        return {
            "office":      "Sephora",
            "node_id":     "sephora",
            "floor":       0,
            "description": "Référence beauté : parfums, maquillage, soins. +300 marques.",
            "horaires":    "Lun-Dim 10h-22h",
            "rag_excerpt": "[Plan du mall] Sephora."
        }

    # ── Beauté — Dior Beauty ──────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "dior", "j'adore", "miss dior", "sauvage", "capture totale",
    ]):
        return {
            "office":      "Dior Beauty",
            "node_id":     "dior_beauty",
            "floor":       0,
            "description": "Parfums iconiques, maquillage haute couture et soins Dior.",
            "horaires":    "Lun-Dim 10h-21h",
            "rag_excerpt": "[Plan du mall] Dior Beauty."
        }

    # ── Tech — Apple Store ────────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "apple", "iphone", "mac", "ipad", "airpods", "macbook",
        "watch", "genius bar", "réparation", "tech",
    ]):
        return {
            "office":      "Apple Store",
            "node_id":     "apple_store",
            "floor":       0,
            "description": "Store officiel Apple. iPhone, iPad, Mac, Watch. Genius Bar, ateliers gratuits.",
            "horaires":    "Lun-Dim 10h-22h",
            "rag_excerpt": "[Plan du mall] Apple Store."
        }

    # ── Gaming — Micromania ───────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "jeux vidéo", "gaming", "ps5", "xbox", "nintendo", "switch",
        "figurines", "geek", "mangas", "micromania",
    ]):
        return {
            "office":      "Micromania-Zing",
            "node_id":     "micromania",
            "floor":       0,
            "description": "Jeux vidéo PS5/Xbox/Switch, figurines, mangas, goodies. Reprise d'occasion.",
            "horaires":    "Lun-Dim 10h-21h30",
            "rag_excerpt": "[Plan du mall] Micromania-Zing."
        }

    # ── Luxe — Gucci ──────────────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "gucci", "luxe", "maroquinerie", "sac", "haute couture",
        "designer", "prestige", "cadeau luxe",
    ]):
        return {
            "office":      "Gucci",
            "node_id":     "gucci",
            "floor":       0,
            "description": "Maison de luxe : prêt-à-porter, maroquinerie, bijoux, parfums.",
            "horaires":    "Lun-Sam 10h-21h, Dim 11h-20h",
            "rag_excerpt": "[Plan du mall] Gucci."
        }

    # ── Luxe — Rolex ──────────────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "rolex", "montre", "horlogerie", "suisse", "submariner",
        "datejust", "bijoux", "or", "bague", "cadeau",
    ]):
        return {
            "office":      "Rolex",
            "node_id":     "rolex",
            "floor":       0,
            "description": "Horlogerie suisse de prestige. Montres Oyster, Datejust, Submariner.",
            "horaires":    "Lun-Sam 10h-20h, Dim 11h-19h",
            "rag_excerpt": "[Plan du mall] Rolex."
        }

    # ── Accueil / Information ─────────────────────────────────────────────────
    if any(k in query_lower for k in [
        "accueil", "information", "plan", "aide", "renseignement",
        "objets trouvés", "perdu", "entrée", "hall",
    ]):
        return {
            "office":      "Entrée Grand Hall",
            "node_id":     "entree_principale",
            "floor":       0,
            "description": "Point d'information central : plans, renseignements, objets trouvés, assistance.",
            "horaires":    "Lun-Dim 9h-22h",
            "rag_excerpt": "[Plan du mall] Entrée Grand Hall — accueil central."
        }

    # ── Aucun résultat ────────────────────────────────────────────────────────
    return None