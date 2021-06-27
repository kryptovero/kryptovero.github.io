import { useAtom } from "jotai";
import { calculateGains } from "@fifo/ledger";
import { Temporal } from "proposal-temporal";
import Header from "../components/Header";
import { useSave } from "../components/use-save";
import s from "../styles/App.module.scss";
import { useEffect } from "react";
import EntryRow from "../components/EntryRow";
import Importer from "../components/Importer";
import Link from "next/link";
import {
  appStateAtom,
  computedStateAtom,
  useAppState,
} from "../components/app-state";

export default function App() {
  const [onSave, onAutosave] = useSave();
  const [appState] = useAtom(appStateAtom);
  const addAppStateItem = useAppState();
  useEffect(() => {
    onAutosave(appState);
  }, [appState, onAutosave]);
  const [ledger] = useAtom(computedStateAtom);
  const uniqYears = Array.from(
    new Set(ledger.map((item) => item.date.year))
  ).sort((a, b) => b - a);

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
          {uniqYears.map((year) => {
            const gains = calculateGains(
              Temporal.PlainDate.from(`${year}-01-01`),
              Temporal.PlainDate.from(`${year}-12-31`),
              ledger
            );
            const taxes = gains * 0.3;
            return (
              <>
                <dl className={s.box}>
                  <dt>Verotettavan tulon märä {year}</dt>
                  <dd>
                    {gains.toLocaleString("fi", { maximumFractionDigits: 2 })} €
                  </dd>
                </dl>
                <dl className={s.box}>
                  <dt>Maksettavan veron määrä {year}</dt>
                  <dd>
                    {taxes.toLocaleString("fi", { maximumFractionDigits: 2 })} €
                  </dd>
                </dl>
                <div className={`${s.box} ${s.buttons}`}>
                  <Link href="/">
                    <a className="btn btn-wider">Lisää uusi rivi...</a>
                  </Link>
                  <Link href="/">
                    <a className="btn btn--secondary btn-wider">
                      Tuo Coinbasesta...
                    </a>
                  </Link>
                </div>
                {ledger
                  .filter((item) => item.date.year === year)
                  .map((item) => (
                    <EntryRow key={item.id} item={item} />
                  ))}
              </>
            );
          })}
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
