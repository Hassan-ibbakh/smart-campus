import json
import os

def load_graph():
    # Chemin vers le fichier data partagé avec le frontend
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, 'data', 'mall_graph.json')
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)
