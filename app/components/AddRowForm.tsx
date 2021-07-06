import React, { Suspense, useCallback, useRef, useState } from "react";
import { Ledger, LedgerItem } from "@fifo/ledger";
import { Temporal } from "proposal-temporal";
import s from "../styles/AddRowForm.module.scss";
import { v4 as uuid } from "uuid";
import { useAtom } from "jotai";
import { availableSymbolsAtom, useAppState } from "./app-state";

const DEFAULT_ITEM = {
  date: Temporal.now.plainDate("iso8601"),
  from: { amount: 1000, symbol: "EUR" },
  to: { amount: 1, symbol: "BTC" },
};

function AddRowForm({
  onHide,
  ledger,
  id,
}: {
  onHide: () => void;
  ledger: Ledger;
  id: string;
}) {
  const [data, setData] = useState(
    ledger.find((item) => item.id === id) ?? { ...DEFAULT_ITEM, id }
  );
  const isNew = !ledger.some((item) => item.id === id);
  const [symbols] = useAtom(availableSymbolsAtom);
  const addAppStateItem = useAppState();
  const onSubmit = useCallback(() => {
    const filledData =
      data.from.symbol === "EUR"
        ? {
            ...data,
            to: { ...data.to, unitPriceEur: data.from.amount / data.to.amount },
          }
        : data.to.symbol === "EUR"
        ? {
            ...data,
            from: {
              ...data.from,
              unitPriceEur: data.to.amount / data.from.amount,
            },
          }
        : data;
    addAppStateItem({
      type: isNew ? "insertRow" : "editRow",
      data: filledData,
    });
    onHide();
    jumpToCorrectElementAfterRender(filledData.id);
  }, [onHide, addAppStateItem, data, isNew]);

  return (
    <>
      <div className={s.overlayBg} onClick={onHide}></div>
      <aside className={s.overlay}>
        <form className={s.overlayForm} onSubmit={onSubmit}>
          <h2>{isNew ? "Lisää uusi rivi..." : "Muokkaa riviä"}</h2>
          <label>
            Päivämäärä
            <div>
              <input
                className={s.dateInput}
                key={data.date.toLocaleString("fi")}
                defaultValue={data.date.toLocaleString("fi")}
                pattern="^\d{1,2}\.\d{1,2}\.\d{4}$"
                required
                onBlur={(e) => {
                  if (e.currentTarget.checkValidity()) {
                    const [day, month, year] = e.currentTarget.value
                      .split(".")
                      .map((v) => parseInt(v, 10));
                    setData({
                      ...data,
                      date: Temporal.PlainDate.from({ day, month, year }),
                    });
                  }
                }}
              />
              <div className={s.error}>Käytä muotoa pp.kk.vvvv</div>
            </div>
          </label>
          <label>
            Mistä
            <div>
              <input
                className={s.numberInput}
                defaultValue={data.from.amount.toLocaleString("fi", {
                  useGrouping: true,
                  maximumFractionDigits: 20,
                })}
                key={`from_amount_${data.from.amount}`}
                pattern="[0-9 ]+(,[0-9]+)?"
                required
                onBlur={(e) =>
                  setData({
                    ...data,
                    from: {
                      ...data.from,
                      amount: parseFloat(
                        e.target.value.replace(/ /g, "").replace(",", ".")
                      ),
                    },
                  })
                }
              />
              <select
                value={data.from.symbol}
                onChange={(e) =>
                  setData({
                    ...data,
                    from: {
                      ...data.from,
                      symbol: e.currentTarget.value,
                      unitPriceEur:
                        e.currentTarget.value === "EUR" ? 1 : undefined,
                    },
                  })
                }
              >
                {symbols.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label>
            Mihin
            <div>
              <input
                className={s.numberInput}
                defaultValue={data.to.amount.toLocaleString("fi", {
                  useGrouping: true,
                  maximumFractionDigits: 20,
                })}
                key={`to_amount_${data.to.amount}`}
                pattern="[0-9 ]+(,[0-9]+)?"
                required
                onBlur={(e) =>
                  setData({
                    ...data,
                    to: {
                      ...data.to,
                      amount: parseFloat(
                        e.target.value.replace(/ /g, "").replace(",", ".")
                      ),
                    },
                  })
                }
              />
              <select
                value={data.to.symbol}
                onChange={(e) =>
                  setData({
                    ...data,
                    to: {
                      ...data.to,
                      symbol: e.currentTarget.value,
                      unitPriceEur:
                        e.currentTarget.value === "EUR" ? 1 : undefined,
                    },
                  })
                }
              >
                {symbols.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <div className={s.overlayButtons}>
            <button type="submit" className="btn">
              {isNew ? "Lisää" : "Muokkaa"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

const withErrorBoundary = <P extends {}>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  function WithErrorBoundary(props) {
    return (
      <Suspense fallback={<div className={s.overlayBg} />}>
        <Component {...props} />
      </Suspense>
    );
  }
  return WithErrorBoundary;
};

function jumpToCorrectElementAfterRender(id: string) {
  requestAnimationFrame(() => (document.location.hash = id));
}

export default withErrorBoundary(AddRowForm);
