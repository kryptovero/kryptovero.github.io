import { atom, useAtom } from "jotai";
import { focusAtom } from "jotai/optics";
import { Ledger } from "@fifo/ledger";
import { readCsv } from "@fifo/csv-reader";
import { useCallback } from "react";

type ImportAppStateItem = { type: "importCoinbaseCsv"; data: string };
type DeleteRowAppStateItem = { type: "deleteRow"; rowId: string };
export type AppStateItem = ImportAppStateItem | DeleteRowAppStateItem;
export type AppState = { version: 0; items: AppStateItem[] };

const applyLedgerItem = (ledger: Ledger, next: AppStateItem) => {
  switch (next.type) {
    case "importCoinbaseCsv":
      return [...ledger, ...readCsv(next.data)];
    case "deleteRow":
      return ledger.filter((item) => item.id !== next.rowId);
    default:
      return ledger;
  }
};

export const appStateAtom = atom<AppState>({ version: 0, items: [] });
export const computedStateAtom = atom<Ledger>((get) =>
  get(appStateItemsAtom).reduce<Ledger>(applyLedgerItem, [])
);

const appStateItemsAtom = focusAtom(appStateAtom, (optic) =>
  optic.prop("items")
);
export const useAppState = () => {
  const [appStateItems, setAppStateItems] = useAtom(appStateItemsAtom);
  const addAppStateItem = useCallback(
    (newItem: AppStateItem) => {
      setAppStateItems([...appStateItems, newItem]);
    },
    [setAppStateItems, appStateItems]
  );
  return addAppStateItem;
};
