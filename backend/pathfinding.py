import heapq
import math

def heuristic(node1, node2):
    # Distance euclidienne basée sur les coordonnées x, y
    return math.sqrt((node1['x'] - node2['x'])**2 + (node1['y'] - node2['y'])**2)

def get_turn_instruction(p1, p2, p3):
    if p1['floor'] != p2['floor'] or p2['floor'] != p3['floor']:
        if p2['floor'] < p3['floor']:
            return "Montez à l'étage supérieur"
        else:
            return "Descendez à l'étage inférieur"

    v1x = p2['x'] - p1['x']
    v1y = p2['y'] - p1['y']
    v2x = p3['x'] - p2['x']
    v2y = p3['y'] - p2['y']
    
    cross = v1x * v2y - v1y * v2x
    dot = v1x * v2x + v1y * v2y
    
    angle = math.degrees(math.atan2(cross, dot))
    
    if angle > 45:
        return "Tournez à droite"
    elif angle < -45:
        return "Tournez à gauche"
    else:
        return "Continuez tout droit"

def find_path(graph_data, start_id: str, goal_id: str, require_accessible: bool = False):
    nodes = {n['id']: n for n in graph_data['nodes']}
    
    # Construire la liste d'adjacence
    adj = {n['id']: [] for n in graph_data['nodes']}
    for edge in graph_data['edges']:
        if require_accessible and not edge.get('isAccessible', True):
            continue
        adj[edge['from']].append((edge['to'], edge['distance']))
    
    if start_id not in nodes or goal_id not in nodes:
        return None
        
    goal_node = nodes[goal_id]
        
    # File de priorité: (f_score, distance_cumulée, node_id, chemin_noeuds)
    pq = [(0, 0, start_id, [start_id])]
    visited = set()
    
    while pq:
        f_score, dist, current, path = heapq.heappop(pq)
        
        if current == goal_id:
            # Reconstruire les étapes avec des instructions dynamiques
            steps = []
            for i in range(len(path)):
                node_info = nodes[path[i]].copy()
                
                # Génération dynamique des instructions
                if i == 0:
                    node_info['accessibilityHint'] = f"Départ depuis {node_info['label']}."
                elif i == len(path) - 1:
                    node_info['accessibilityHint'] = f"Vous êtes arrivé à {node_info['label']}."
                else:
                    prev_node = nodes[path[i-1]]
                    curr_node = nodes[path[i]]
                    next_node = nodes[path[i+1]]
                    
                    action = get_turn_instruction(prev_node, curr_node, next_node)
                    node_info['accessibilityHint'] = f"{action} vers {next_node['label']}."
                
                steps.append(node_info)
            
            # Temps estimé (vitesse moyenne de marche 1.2 m/s)
            estimated_time = int(dist / 1.2)
            
            return {
                "path": path,
                "total_distance": dist,
                "estimated_time_seconds": estimated_time,
                "steps": steps
            }
            
        if current in visited:
            continue
            
        visited.add(current)
        
        for neighbor, weight in adj.get(current, []):
            if neighbor not in visited:
                g_score = dist + weight
                h_score = heuristic(nodes[neighbor], goal_node)
                f = g_score + h_score
                heapq.heappush(pq, (f, g_score, neighbor, path + [neighbor]))
                
    return None
