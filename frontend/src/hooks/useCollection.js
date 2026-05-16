import { useState, useEffect, useCallback } from "react";
import { getData, setData } from "../services/dataStore";

/**
 * Reactive hook backed by the API data store (replaces localStorage).
 */
export function useCollection(key, defaultValue = []) {
  const [storedValue, setStoredValue] = useState(() => getData(key, defaultValue));

  useEffect(() => {
    const onChange = (event) => {
      if (event.detail?.key === key) {
        setStoredValue(event.detail?.value ?? event.detail?.data ?? defaultValue);
      }
      if (event.detail?.key === "__ready__") {
        setStoredValue(getData(key, defaultValue));
      }
    };
    window.addEventListener("dataStoreChange", onChange);
    window.addEventListener("localStorageChange", onChange);
    return () => {
      window.removeEventListener("dataStoreChange", onChange);
      window.removeEventListener("localStorageChange", onChange);
    };
  }, [key, defaultValue]);

  const setValue = useCallback(
    (value) => {
      const valueToStore = value instanceof Function ? value(getData(key, defaultValue)) : value;
      setStoredValue(valueToStore);
      setData(key, valueToStore);
    },
    [key, defaultValue],
  );

  return [storedValue, setValue];
}

export const useExercices = () => useCollection("exercices", []);
export const useNatures = () => useCollection("natures", []);
export const useLibelles = () => useCollection("libelles", []);
export const useFournisseurs = () => useCollection("fournisseurs", []);
export const useCommandes = () => useCollection("commandes", []);
export const useVatRates = () => useCollection("vatRates", []);
export const useRasRates = () => useCollection("rasRates", []);
export const useBudgetAllocations = () => useCollection("budgetAllocations", []);
export const useDevis = () => useCollection("devis", []);
export const useEngagements = () => useCollection("engagements", []);
export const useExecution = () => useCollection("executions", []);
export const useOrdonnances = () => useCollection("ordonnances", []);
export const usePaiements = () => useCollection("paiements", []);
export const useVirements = () => useCollection("virements", []);
export const useDocuments = () => useCollection("documents", []);
export const useAuditLogs = () => useCollection("auditLogs", []);
export const useUsers = () => useCollection("users", []);
export const useNotifications = () => useCollection("notifications", []);

export default useCollection;
