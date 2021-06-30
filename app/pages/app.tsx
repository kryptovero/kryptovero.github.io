import { useAtom } from "jotai";
import { calculateGains } from "@fifo/ledger";
import { Temporal } from "proposal-temporal";
import Header from "../components/Header";
import { useSave } from "../components/use-save";
import s from "../styles/App.module.scss";
import { useEffect, useState } from "react";
import EntryRow from "../components/EntryRow";
import Link from "next/link";
import { appStateAtom, computedStateAtom } from "../components/app-state";
import AddRowForm from "../components/AddRowForm";

export default function App() {
  const [onSave, onAutosave] = useSave();
  const [appState] = useAtom(appStateAtom);
  useEffect(() => {
    onAutosave(appState);
  }, [appState, onAutosave]);
  const [ledger] = useAtom(computedStateAtom);
  const uniqYears = Array.from(
    new Set(ledger.map((item) => item.date.year))
  ).sort((a, b) => b - a);
  const [showAddRow, setShowAddRow] = useState(false);

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
          <div className={`${s.box} ${s.buttons}`}>
            <button
              className="btn btn-wider"
              onClick={() => setShowAddRow(true)}
            >
              Lisää uusi rivi...
            </button>
            <Link href="/coinbase-import">
              <a className="btn btn--secondary btn-wider">Tuo Coinbasesta...</a>
            </Link>
          </div>
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
                {ledger
                  .filter((item) => item.date.year === year)
                  .map((item) => (
                    <EntryRow key={item.id} item={item} />
                  ))}
              </>
            );
          })}
        </div>
      </main>
      {showAddRow && <AddRowForm onHide={() => setShowAddRow(false)} />}
    </>
  );
}
