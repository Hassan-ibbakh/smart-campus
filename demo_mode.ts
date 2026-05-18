// Scénarios prédéfinis pour le mode démo adaptés au Smart Mall
// Utile si le backend est lent ou pour une présentation fluide sans aléas.

export const DEMO_SCENARIOS = [
    {
      id: "zara",
      query: "Où se trouve Zara ?",
      ragResult: {
        name: "Zara",
        node_id: "fashion_zone",
        floor: 1,
        description: "Boutique de mode homme, femme et enfant. Collections tendance.",
        horaires: "Lun-Dim 10h-22h",
        rag_excerpt: "[Base Vectorielle] Zara est situé dans la Zone Mode au Niveau 1."
      },
      from_node: "entrance",
      to_node: "fashion_zone"
    },
    {
      id: "food_court",
      query: "J'ai faim, où sont les restaurants ?",
      ragResult: {
        name: "Food Court",
        node_id: "food_court",
        floor: 2,
        description: "Espace restauration avec plusieurs enseignes : fast food, pizza, sushi.",
        horaires: "Lun-Dim 11h-22h",
        rag_excerpt: "[Base Vectorielle] Le Food Court se trouve au Niveau 2, accessible par les escalators centraux."
      },
      from_node: "entrance",
      to_node: "food_court"
    },
    {
      id: "restrooms",
      query: "Où sont les toilettes et la salle de prière ?",
      ragResult: {
        name: "Toilettes & Espace de Prière",
        node_id: "restrooms",
        floor: 0,
        description: "Sanitaires publics et espace de prière séparé homme/femme.",
        horaires: "Lun-Dim 9h-22h30",
        rag_excerpt: "[Base Vectorielle] Les sanitaires et la salle de prière sont situés au rez-de-chaussée (Niveau 0) près de la zone ATM."
      },
      from_node: "entrance",
      to_node: "restrooms"
    },
    {
      id: "cinema",
      query: "Je veux voir un film au cinéma.",
      ragResult: {
        name: "Cinéma Megaplex",
        node_id: "cinema",
        floor: 2,
        description: "Complexe cinématographique avec 8 salles, 3D et IMAX.",
        horaires: "Lun-Dim 10h-23h",
        rag_excerpt: "[Base Vectorielle] Le Cinéma Megaplex est situé au Niveau 2, au bout de l'aile Est."
      },
      from_node: "entrance",
      to_node: "cinema"
    }
  ];
  
  export let currentScenarioIndex = 0;
  
  export const getNextDemoScenario = () => {
    const scenario = DEMO_SCENARIOS[currentScenarioIndex];
    currentScenarioIndex = (currentScenarioIndex + 1) % DEMO_SCENARIOS.length;
    return scenario;
  };
