import { Temporal } from "proposal-temporal";
import React, { useEffect } from "react";
import { useState } from "react";
import { LedgerItem } from "../../ledger/build";
import { getPriceAt } from "./coinbase";
import { NumberInput } from "./NumberInput";
import "./NewEntryForm.scss";
import { Action } from "./reducer";
import { useHistory } from "react-router-dom";
import { useCallback } from "react";

const NewEntryForm: React.FC<{
  dispatch: React.Dispatch<Action>;
  symbols: string[];
}> = ({ dispatch, symbols }) => {
  const history = useHistory();
  const [data, setData] = useState<LedgerItem>({
    date: Temporal.now
      .plainDate("iso8601")
      .subtract(Temporal.Duration.from({ days: 1 })),
    from: { symbol: "EUR", amount: 1, unitPriceEur: 1 },
    to: { symbol: "BTC", amount: 1 },
  });

  useEffect(() => {
    if (data.from.symbol === "EUR")
      setData({ ...data, from: { ...data.from, unitPriceEur: 1 } });
    else
      getPriceAt(data.date, data.from.symbol).then((price) =>
        setData({ ...data, from: { ...data.from, unitPriceEur: price } })
      );
  }, [data.from.symbol, data.date]);

  useEffect(() => {
    if (data.to.symbol === "EUR")
      setData({ ...data, to: { ...data.to, unitPriceEur: 1 } });
    else
      getPriceAt(data.date, data.to.symbol).then((price) =>
        setData({ ...data, to: { ...data.to, unitPriceEur: price } })
      );
  }, [data.to.symbol, data.date]);

  const addRow = useCallback(() => {
    dispatch({ action: "create", item: data });
    history.push("/");
  }, [history, data, dispatch]);

  return (
    <form onSubmit={addRow}>
      <h1>Add new entry</h1>
      <label>
        <span>Date</span>
        <input
          type="date"
          defaultValue={data.date.toString({ calendarName: "never" })}
          key={data.date.toString()}
          onBlur={(e) =>
            setData({ ...data, date: Temporal.PlainDate.from(e.target.value) })
          }
        />
      </label>
      <fieldset>
        <h2>From</h2>
        <label>
          <span>Symbol</span>
          <select
            value={data.from.symbol}
            onChange={(e) =>
              setData({
                ...data,
                from: { ...data.from, symbol: e.target.value },
              })
            }
          >
            {symbols.map((coin) => (
              <option key={coin}>{coin}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Amount</span>
          <NumberInput
            value={data.from.amount}
            onChange={(amount) =>
              setData({
                ...data,
                from: {
                  ...data.from,
                  amount: amount || 1,
                },
              })
            }
          />
        </label>
        {data.from.symbol !== "EUR" && (
          <label>
            <span>á price (€)</span>
            <NumberInput
              value={data.from.unitPriceEur ?? 1}
              onChange={(amount) =>
                setData({
                  ...data,
                  from: {
                    ...data.from,
                    unitPriceEur: amount || 1,
                  },
                })
              }
            />
          </label>
        )}
      </fieldset>
      <fieldset>
        <h2>To</h2>
        <label>
          <span>Symbol</span>
          <select
            value={data.to.symbol}
            onChange={(e) =>
              setData({
                ...data,
                to: { ...data.to, symbol: e.target.value },
              })
            }
          >
            {symbols.map((coin) => (
              <option key={coin}>{coin}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Amount</span>
          <NumberInput
            value={data.to.amount}
            onChange={(amount) =>
              setData({
                ...data,
                to: {
                  ...data.to,
                  amount: amount || 1,
                },
              })
            }
          />
        </label>
        {data.to.symbol !== "EUR" && (
          <label>
            <span>á price (€)</span>
            <NumberInput
              value={data.to.unitPriceEur}
              onChange={(amount) =>
                setData({
                  ...data,
                  to: {
                    ...data.to,
                    unitPriceEur: amount || 1,
                  },
                })
              }
            />
          </label>
        )}
      </fieldset>
      <button type="submit">Add row</button>
    </form>
  );
};

export default NewEntryForm;
