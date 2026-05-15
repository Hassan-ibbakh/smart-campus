import axios from 'axios';

// Utiliser l'IP de la machine de dev pour le test sur device physique
// Remplacer localhost par votre adresse IP locale si test sur vrai téléphone (ex: 192.168.1.10)
const API_URL = 'http://192.168.43.65:8001';

export interface RagResponse {
  office: string;
  node_id: string;
  floor: number;
  description: string;
  rag_excerpt: string;
}

export interface NavigationStep {
  id: string;
  label: string;
  floor: number;
  x: number;
  y: number;
  type: string;
  accessibilityHint: string;
}

export interface NavigationResponse {
  path: string[];
  total_distance: number;
  estimated_time_seconds: number;
  steps: NavigationStep[];
}

export const fetchBuildings = async () => {
  try {
    const response = await axios.get(`${API_URL}/buildings`);
    return response.data;
  } catch (error) {
    console.error("API Error (buildings):", error);
    return [];
  }
};

export const fetchHistory = async () => {
  try {
    const response = await axios.get(`${API_URL}/history`);
    return response.data;
  } catch (error) {
    console.error("API Error (history):", error);
    return [];
  }
};

export const fetchEmergency = async () => {
  try {
    const response = await axios.get(`${API_URL}/emergency`);
    return response.data;
  } catch (error) {
    console.error("API Error (emergency):", error);
    return null;
  }
};

export const queryApi = async (query: string): Promise<RagResponse> => {
  try {
    const response = await axios.post(`${API_URL}/query`, { query });
    return response.data;
  } catch (error) {
    console.error("API Error (query):", error);
    throw error;
  }
};

export const navigateApi = async (from_node: string, to_node: string, accessible: boolean = false): Promise<NavigationResponse> => {
  try {
    const response = await axios.post(`${API_URL}/navigate`, { 
      from_node, 
      to_node, 
      accessible 
    });
    return response.data;
  } catch (error) {
    console.error("API Error (navigate):", error);
    throw error;
  }
};

export const getGraphApi = async () => {
  try {
    const response = await axios.get(`${API_URL}/graph`);
    return response.data;
  } catch (error) {
    console.error("API Error (graph):", error);
    return null;
  }
};

export const locateSemantically = async (description: string) => {
  try {
    const response = await axios.post(`${API_URL}/locate_semantically`, { description });
    return response.data;
  } catch (error) {
    console.error("API Error (locate_semantically):", error);
    throw error;
  }
};

import * as FileSystem from 'expo-file-system/legacy';

export const processVoiceCommand = async (audioUri: string | File) => {
  try {
    if (typeof audioUri === 'string') {
      const uploadResult = await FileSystem.uploadAsync(`${API_URL}/voice_command`, audioUri, {
        httpMethod: 'POST',
        uploadType: 1, // FileSystemUploadType.MULTIPART enum is 1
        fieldName: 'audio'
      });
      return JSON.parse(uploadResult.body);
    }

    const form = new FormData();
    form.append('audio', audioUri, audioUri.name);

    const response = await fetch(`${API_URL}/voice_command`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Serveur ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (voice_command):", error);
    throw error;
  }
};
