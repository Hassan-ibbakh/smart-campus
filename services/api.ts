import { API_URL } from '../config';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

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

export interface AskResponse {
  transcription: string;
  answer: string;
  destination_node?: string;
  service_name?: string;
  horaires?: string;
  navigation?: NavigationResponse;
  audio_base64?: string;
  audio_format?: string;
  promotion?: string;
}

export interface RagResponse extends AskResponse {
  office?: string;
  description?: string;
  rag_excerpt?: string;
}

export const queryApi = async (query: string, currentNode: string = 'entrance'): Promise<RagResponse> => {
  try {
    const response = await axios.post(`${API_URL}/ask`, {
      query,
      current_node: currentNode
    });
    return response.data;
  } catch (error) {
    console.error("API Error (query):", error);
    throw error;
  }
};

export const updatePosition = async (userId: string, nodeId: string, type: 'visitor' | 'resource' = 'visitor') => {
  try {
    await axios.post(`${API_URL}/position`, {
      user_id: userId,
      node_id: nodeId,
      timestamp: Date.now() / 1000,
      type
    });
  } catch (error) {
    console.error("API Error (position):", error);
  }
};

export const askVoice = async (audioUri: string, currentNode: string = 'entrance'): Promise<AskResponse> => {
  try {
    const uploadResult = await FileSystem.uploadAsync(`${API_URL}/ask/voice`, audioUri, {
      httpMethod: 'POST',
      uploadType: 1,
      fieldName: 'audio',
      parameters: { current_node: currentNode }
    });
    return JSON.parse(uploadResult.body);
  } catch (error) {
    console.error("API Error (ask_voice):", error);
    throw error;
  }
};

export const processVoiceCommand = async (audioUri: string) => {
  try {
    const uploadResult = await FileSystem.uploadAsync(`${API_URL}/voice_command`, audioUri, {
      httpMethod: 'POST',
      uploadType: 1,
      fieldName: 'audio'
    });
    return JSON.parse(uploadResult.body);
  } catch (error) {
    console.error("API Error (voice_command):", error);
    throw error;
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

export const fetchStores = async () => {
  try {
    const response = await axios.get(`${API_URL}/stores`);
    return response.data;
  } catch (error) {
    console.error("API Error (stores):", error);
    return [];
  }
};

export const fetchPromotions = async () => {
  try {
    const response = await axios.get(`${API_URL}/promotions`);
    return response.data;
  } catch (error) {
    console.error("API Error (promotions):", error);
    return [];
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
