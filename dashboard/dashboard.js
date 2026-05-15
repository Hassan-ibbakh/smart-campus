const API_BASE = 'http://localhost:8081/analytics'; // à adapter selon IP du backend

let map;
let heatLayer;

async function fetchData() {
    try {
        const summary = await fetch(`${API_BASE}/summary?hours=1`).then(r => r.json());
        document.getElementById('activeSessions').innerText = summary.active_sessions ?? 0;
        document.getElementById('avgDuration').innerText = `${summary.avg_navigation_duration_s ?? 0} s`;
        document.getElementById('totalSteps').innerText = summary.total_steps_recorded ?? 0;
        document.getElementById('distance').innerText = `${summary.estimated_distance_m ?? 0} m`;

        const topDest = summary.top_destinations || [];
        document.getElementById('topDestinations').innerHTML = topDest.length ? 
            `<table><tr><th>Lieu</th><th>Demandes</th></tr>${topDest.map(d => `<tr><td>${d.node_id}</td><td>${d.count}</td></tr>`).join('')}</table>` : 'Aucune donnée';

        const heatmap = await fetch(`${API_BASE}/heatmap?hours=24&floor=0`).then(r => r.json());
        if (heatmap.cells && map) {
            if (heatLayer) map.removeLayer(heatLayer);
            const points = heatmap.cells.map(c => [c.y, c.x, c.normalized || 1]);
            heatLayer = L.heatLayer(points, { radius: 15, blur: 10, maxZoom: 18 });
            heatLayer.addTo(map);
        }

        const congestion = await fetch(`${API_BASE}/congestion?window_minutes=10`).then(r => r.json());
        document.getElementById('congestionList').innerHTML = congestion.congestion_zones?.length ? 
            `<table><tr><th>Zone</th><th>Saturation</th><th>Recommandation</th></tr>${
                congestion.congestion_zones.map(z => `
                    <tr>
                        <td>${z.label}</td>
                        <td class="${z.level === 'critical' ? 'congestion-critical' : (z.level === 'warning' ? 'congestion-warning' : '')}">${z.saturation_pct}%</td>
                        <td>${z.recommendation || '-'}</td>
                    </tr>`).join('')
            }</table>` : 'Aucune congestion';

        const routes = await fetch(`${API_BASE}/top-routes?days=1`).then(r => r.json());
        document.getElementById('topRoutes').innerHTML = routes.top_routes?.length ?
            `<table><tr><th>Trajet</th><th>Fréquence</th></tr>${
                routes.top_routes.map(r => `<tr><td>${r.label}</td><td>${r.count}</td></tr>`).join('')
            }</table>` : '-';

        const pred = await fetch(`${API_BASE}/predict/congestion`).then(r => r.json());
        document.getElementById('prediction').innerHTML = pred.predictions?.length ?
            `<ul>${pred.predictions.map(p => `<li>${p.label} : ${p.predicted_sessions} sessions (${p.level})</li>`).join('')}</ul>` : 'Données insuffisantes';
    } catch (err) {
        console.error('Erreur API', err);
    }
}

function initMap() {
    map = L.map('map').setView([33.5731, -7.5898], 17); // Coordonnées approximatives campus FSO
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    }).addTo(map);
}

initMap();
setInterval(fetchData, 5000);
fetchData();