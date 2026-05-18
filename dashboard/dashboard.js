const API_BASE = 'http://localhost:8081'; // URL du backend FastAPI

let map;
let markers = [];

async function fetchData() {
    try {
        const res = await fetch(`${API_BASE}/analytics/realtime`);
        if (!res.ok) return;
        const data = await res.json();

        // Mettre à jour les compteurs
        document.getElementById('activeSessions').innerText = data.active_visitors || 0;
        document.getElementById('activeResources').innerText = data.active_resources || 0;

        // Top boutiques (basé sur la congestion/fréquentation actuelle)
        const topDest = Object.entries(data.zone_congestion)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        document.getElementById('topDestinations').innerHTML = topDest.length ? 
            `<table><tr><th>Zone</th><th>Visiteurs</th></tr>${topDest.map(([node, count]) => `<tr><td>${node}</td><td>${count}</td></tr>`).join('')}</table>` : 'Aucune donnée';

        // Alertes congestion
        const congestionList = document.getElementById('congestionList');
        const alertes = Object.entries(data.zone_congestion).filter(([_, count]) => count > 5);
        congestionList.innerHTML = alertes.length ? 
            `<table><tr><th>Zone</th><th>Statut</th></tr>${alertes.map(([node, count]) => `
                <tr>
                    <td>${node}</td>
                    <td class="congestion-critical">⚠️ Critique (${count})</td>
                </tr>`).join('')}</table>` : 'Trafic fluide';

        // Statut des ressources
        const resStatus = document.getElementById('resourceStatus');
        resStatus.innerHTML = data.resource_status.length ? 
            `<ul>${data.resource_status.map(r => `<li>${r.user_id} (${r.node_id})</li>`).join('')}</ul>` : 'Aucun staff actif';

        // Simulation de prédiction
        document.getElementById('prediction').innerHTML = "Affluence attendue : <b>Stable</b> pour la prochaine heure.";

    } catch (err) {
        console.error('Erreur API', err);
    }
}

function initMap() {
    // Coordonnées pour le Grand Mall (ex: Casablanca)
    map = L.map('map').setView([33.5731, -7.5898], 17);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Ajouter des points pour les zones du mall
    const zones = [
        { name: "Entrée", pos: [33.5731, -7.5898] },
        { name: "Mode", pos: [33.5735, -7.5905] },
        { name: "Food Court", pos: [33.5725, -7.5890] },
        { name: "Supermarché", pos: [33.5730, -7.5910] }
    ];

    zones.forEach(z => {
        L.circle(z.pos, { color: 'blue', fillColor: '#30f', fillOpacity: 0.2, radius: 20 })
            .addTo(map)
            .bindPopup(z.name);
    });
}

initMap();
setInterval(fetchData, 3000);
fetchData();