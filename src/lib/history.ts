import { useCallback, useEffect, useState } from "react";
import type { ConversaResult } from "./conversa.functions";

export type HistoryItem = {
  id: string;
  createdAt: number;
  mode: string;
  title: string;
  favorite: boolean;
  result: ConversaResult;
};

const KEY = "conversa-quente-historico";

function read(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(read());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: HistoryItem[]) => {
    setItems(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next.slice(0, 60)));
    } catch {
      /* storage cheio ou indisponível */
    }
  }, []);

  const add = useCallback(
    (item: Omit<HistoryItem, "id" | "createdAt" | "favorite">) => {
      persist([
        { ...item, id: crypto.randomUUID(), createdAt: Date.now(), favorite: false },
        ...read(),
      ]);
    },
    [persist],
  );

  const remove = useCallback((id: string) => persist(read().filter((i) => i.id !== id)), [persist]);

  const toggleFavorite = useCallback(
    (id: string) => persist(read().map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i))),
    [persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { items, hydrated, add, remove, toggleFavorite, clear };
}
