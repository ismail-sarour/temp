import { useState, useEffect } from "react";

const devDefault = import.meta.env.DEV ? "/api" : "http://localhost:5000/api";
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ""
    ? import.meta.env.VITE_API_BASE_URL
    : devDefault;

// ─── Helper générique pour tous les appels CRUD ───────────────────────────────
export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `Erreur API ${res.status}`);
  return data;
}

// ─── Hook polling (lecture auto) ──────────────────────────────────────────────
export function useApiData(endpoint, interval = 5000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = () => {
      fetch(`${API_BASE_URL}/${endpoint}`)
        .then((res) => {
          if (!res.ok) throw new Error(`API error ${res.status}`);
          return res.json();
        })
        .then((json) => {
          if (!mounted) return;
          setData(json);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (!mounted) return;
          console.error(err);
          setError(err);
          setLoading(false);
        });
    };

    fetchData();
    const timer = setInterval(fetchData, interval);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [endpoint, interval]);

  return { data, loading, error };
}