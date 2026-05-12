import { useState } from 'react';
import { queryApi, RagResponse } from '../services/api';

export const useRag = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = async (text: string): Promise<RagResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryApi(text);
      return result;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la requête RAG');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { query, loading, error };
};
