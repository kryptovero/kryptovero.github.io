import React, {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Ledger, LedgerItem } from "@fifo/ledger";
import s from "../styles/AddRowForm.module.scss";
import { insertEvent, useAppDispatch } from "./store";
import { getPriceAt, useCoinSymbolsQuery } from "./coinbase";

const DEFAULT_ITEM = {
  timestamp: Date.now(),
  from: { amount: 1000, symbol: "EUR" },
  to: { amount: 1, symbol: "BTC" },
  fee: { amount: 0, symbol: "EUR", unitPriceEur: 1 },
};

const autoFillUniPriceIfMissing = async (ledgerItem: LedgerItem) => {
  if (ledgerItem.from.unitPriceEur ?? ledgerItem.to.unitPriceEur !== undefined)
    return ledgerItem;

  try {
    return {
      ...ledgerItem,
      from: {
        ...ledgerItem.from,
        unitPriceEur: await getPriceAt(
          ledgerItem.timestamp,
          ledgerItem.from.symbol
        ),
      },
    };
  } catch (e) {
    try {
      return {
        ...ledgerItem,
        to: {
          ...ledgerItem.to,
          unitPriceEur: await getPriceAt(
            ledgerItem.timestamp,
            ledgerItem.to.symbol
          ),
        },
      };
    } catch (e) {}
  }
  return ledgerItem;
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
  const fee = data.fee ?? DEFAULT_ITEM.fee;
  const isNew = !ledger.some((item) => item.id === id);
  const symbols = useCoinSymbolsQuery(undefined);
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      dispatch(
        insertEvent({
          type: isNew ? "insertRow" : "editRow",
          data: await autoFillUniPriceIfMissing(data),
        })
      );
      onHide();
      jumpToCorrectElementAfterRender(data.id);
    },
    [onHide, dispatch, data, isNew]
  );

  useEffect(() => {
    if (symbols.isError) onHide();
  }, [symbols.isError, onHide]);

  if (symbols.isLoading) return <div className={s.overlayBg} />;
  if (symbols.isError) return <div className={s.overlayBg} />;

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
                key={data.timestamp}
                defaultValue={new Date(data.timestamp).toLocaleDateString("fi")}
                pattern="^\d{1,2}\.\d{1,2}\.\d{4}$"
                required
                onBlur={(e) => {
                  if (e.currentTarget.checkValidity()) {
                    const [day, month, year] = e.currentTarget.value
                      .split(".")
                      .map((v) => parseInt(v, 10));
                    setData({
                      ...data,
                      timestamp: new Date(year, month - 1, day).getTime(),
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
                {symbols.data?.map((symbol) => (
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
                {symbols.data?.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label>
            Välityspalkkio
            <div>
              <input
                className={s.numberInput}
                defaultValue={fee.amount.toLocaleString("fi", {
                  useGrouping: true,
                  maximumFractionDigits: 20,
                })}
                key={`to_amount_${fee.amount}`}
                pattern="[0-9 ]+(,[0-9]+)?"
                required
                onBlur={(e) =>
                  setData({
                    ...data,
                    fee: {
                      ...fee,
                      amount: parseFloat(
                        e.target.value.replace(/ /g, "").replace(",", ".")
                      ),
                    },
                  })
                }
              />
              <select
                value={fee.symbol}
                onChange={(e) =>
                  setData({
                    ...data,
                    fee: {
                      ...fee,
                      symbol: e.currentTarget.value,
                      unitPriceEur:
                        e.currentTarget.value === "EUR" ? 1 : undefined,
                    },
                  })
                }
              >
                {symbols.data?.map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <div className={s.overlayButtons}>
            <button type="submit" className="btn" disabled={submitting}>
              {isNew ? "Lisää" : "Muokkaa"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

const withErrorBoundary = <P extends {}>(
  Component: React.FunctionComponent<P>
): React.FC<P> => {
  function WithErrorBoundary(props: P) {
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
