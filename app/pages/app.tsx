import { atom, useAtom } from "jotai";
import { focusAtom } from "jotai/optics";
import { Ledger } from "../../ledger/build";
import Header from "../components/Header";
import { useSave } from "../components/use-save";
import { readCsv } from "@fifo/csv-reader";
import s from "../styles/App.module.scss";
import { useCallback, useEffect } from "react";
import Importer from "../components/Importer";

type ImportAppStateItem = { type: "importCoinbaseCsv"; data: string };
type AppStateItem = ImportAppStateItem;
type AppState = { version: 0; items: AppStateItem[] };

const applyLedgerItem = (ledger: Ledger, next: AppStateItem) => {
  switch (next.type) {
    case "importCoinbaseCsv":
      return [...ledger, ...readCsv(next.data)];
    default:
      return ledger;
  }
};

const appStateAtom = atom<AppState>({ version: 0, items: [] });
const appStateItemsAtom = focusAtom(appStateAtom, (optic) =>
  optic.prop("items")
);
const computedStateAtom = atom<Ledger>((get) =>
  get(appStateItemsAtom).reduce<Ledger>(applyLedgerItem, [])
);

export default function App() {
  const [onSave, onAutosave] = useSave();
  const [appState] = useAtom(appStateAtom);
  const [appStateItems, setAppStateItems] = useAtom(appStateItemsAtom);
  const addAppStateItem = useCallback(
    (newItem: AppStateItem) => {
      setAppStateItems([...appStateItems, newItem]);
    },
    [setAppStateItems, appStateItems]
  );
  useEffect(() => {
    onAutosave(appState);
  }, [appState, onAutosave]);
  const [ledger] = useAtom(computedStateAtom);
  return (
    <>
      <Header
        buttons={
          <button className="btn" onClick={() => onSave(appState)}>
            Tallenna
          </button>
        }
      />
      <main className={s.app}>
        <div className={s.container}>
          <pre>{JSON.stringify(ledger, null, 2)}</pre>
        </div>

        <div className={s.container}>
          <Importer
            onRead={(data) =>
              addAppStateItem({ data, type: "importCoinbaseCsv" })
            }
          >
            Drop CSV here
          </Importer>
        </div>
      </main>
    </>
  );
}
