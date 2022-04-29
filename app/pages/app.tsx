import { v4 as uuid } from "uuid";
import { calculateGains } from "@fifo/ledger";
import Header from "../components/Header";
import { useSave } from "../components/use-save";
import s from "../styles/App.module.scss";
import { useEffect, useState, Fragment } from "react";
import EntryRow from "../components/EntryRow";
import Link from "next/link";
import { usePreventUserLeaving } from "../components/app-state";
import AddRowForm from "../components/AddRowForm";
import {
  computedLedgerSelector,
  eventsSelector,
  useAppSelector,
  isPrefillingSelector,
} from "../components/store";
import Loading from "../components/Loading";
import getYear from "date-fns/getYear";

export default function App() {
  usePreventUserLeaving();
  const appState = useAppSelector(eventsSelector);
  const [onSave, onAutosave] = useSave();
  useEffect(() => {
    onAutosave(appState);
  }, [appState, onAutosave]);
  const { ledger, consumed } = useAppSelector(computedLedgerSelector);
  const uniqYears = Array.from(
    new Set(ledger.map((item) => getYear(item.timestamp)))
  ).sort((a, b) => b - a);
  const [showEditRow, setShowEditRow] = useState<string | null>(null);
  const isPrefilling = useAppSelector(isPrefillingSelector);

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
              onClick={() => setShowEditRow(`kryptovero_${uuid()}`)}
            >
              Lisää uusi rivi...
            </button>
            <Link href="/coinbase-import">
              <a className="btn btn--secondary btn-wider">
                Tuo Coinbase Pro:sta...
              </a>
            </Link>
            {isPrefilling && <Loading />}
          </div>
          {uniqYears.map((year) => {
            const gains = calculateGains(
              Date.parse(`${year}-01-01`),
              Date.parse(`${year}-12-31`),
              ledger
            );
            const taxes = gains * 0.3;
            return (
              <Fragment key={year}>
                <dl className={s.box}>
                  <dt>Verotettavan tulon määrä {year}</dt>
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
                  .filter((item) => getYear(item.timestamp) === year)
                  .reverse()
                  .map((item) => (
                    <EntryRow
                      key={item.id}
                      item={item}
                      consumed={consumed[item.id] ?? []}
                      onEdit={setShowEditRow}
                    />
                  ))}
              </Fragment>
            );
          })}
        </div>
      </main>
      {showEditRow && (
        <AddRowForm
          id={showEditRow}
          ledger={ledger}
          onHide={() => setShowEditRow(null)}
        />
      )}
    </>
  );
}
