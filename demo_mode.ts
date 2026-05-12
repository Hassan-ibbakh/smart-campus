// Scénarios prédéfinis pour le mode démo sans backend

export const DEMO_SCENARIOS = [
    {
      id: "scolarite",
      query: "Où est la scolarité ?",
      ragResult: {
        office: "Scolarité",
        node_id: "B104",
        floor: 1,
        description: "Le service de scolarité gère les inscriptions et les diplômes.",
        rag_excerpt: "[Extrait du livret d'accueil.pdf] Le bureau B104 (Scolarité) est ouvert de 9h à 16h."
      },
      from_node: "entrance",
      to_node: "B104"
    },
    {
      id: "direction",
      query: "Je cherche le bureau de la direction",
      ragResult: {
        office: "Direction",
        node_id: "B105",
        floor: 1,
        description: "Le bureau du doyen et de la direction générale.",
        rag_excerpt: "[Extrait organigramme.pdf] La direction est située au B105."
      },
      from_node: "entrance",
      to_node: "B105"
    },
    {
      id: "rh",
      query: "Où sont les ressources humaines ?",
      ragResult: {
        office: "Ressources Humaines",
        node_id: "B106",
        floor: 1,
        description: "Service du personnel et des ressources humaines.",
        rag_excerpt: "[Extrait annuaire.pdf] RH : Bureau B106."
      },
      from_node: "entrance",
      to_node: "B106"
    }
  ];
  
  export let currentScenarioIndex = 0;
  
  export const getNextDemoScenario = () => {
    const scenario = DEMO_SCENARIOS[currentScenarioIndex];
    currentScenarioIndex = (currentScenarioIndex + 1) % DEMO_SCENARIOS.length;
    return scenario;
  };
