import { Temporal } from "proposal-temporal";
import { useEffect } from "react";
import { useState } from "react";
import { LedgerItem } from "../../ledger/build";
import { getPriceAt } from "./coinbase";
import "./NewEntryForm.scss";

const COINS = ["EUR", "BTC", "ETH", "FIL", "A", "B", "C"];

export default () => {
  const [data, setData] = useState<LedgerItem>({
    date: Temporal.now
      .plainDate("gregory")
      .subtract(Temporal.Duration.from({ days: 1 })),
    from: { symbol: COINS[0], amount: 1, unitPriceEur: 1 },
    to: { symbol: COINS[1], amount: 1 },
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
  return (
    <form>
      <h1>Add new entry</h1>
      <label>
        <span>Date</span>
        <input
          type="date"
          value={data.date.toString({ calendarName: "never" })}
          onChange={(e) =>
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
            {COINS.map((coin) => (
              <option key={coin}>{coin}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Amount</span>
          <input
            defaultValue={data.from.amount}
            key={data.from.amount}
            pattern="0-9,."
            onBlur={(e) =>
              setData({
                ...data,
                from: {
                  ...data.from,
                  amount:
                    parseFloat(
                      e.target.value.replace(",", ".").replace(/[^\d\.]/g, "")
                    ) || 1,
                },
              })
            }
            type="decimal"
          />
        </label>
        {data.from.symbol !== "EUR" && (
          <label>
            <span>á price (€)</span>
            <input
              defaultValue={data.from.unitPriceEur ?? 1}
              key={data.from.unitPriceEur}
              pattern="0-9,."
              onBlur={(e) =>
                setData({
                  ...data,
                  from: {
                    ...data.from,
                    unitPriceEur:
                      parseFloat(
                        e.target.value.replace(",", ".").replace(/[^\d\.]/g, "")
                      ) || 1,
                  },
                })
              }
              type="decimal"
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
            {COINS.map((coin) => (
              <option key={coin}>{coin}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Amount</span>
          <input
            defaultValue={data.to.amount}
            key={data.to.amount.toString()}
            onBlur={(e) =>
              setData({
                ...data,
                to: {
                  ...data.to,
                  amount:
                    parseFloat(
                      e.target.value.replace(",", ".").replace(/[^\d\.]/g, "")
                    ) || 1,
                },
              })
            }
            type="decimal"
          />
        </label>
        {data.to.symbol !== "EUR" && (
          <label>
            <span>á price (€)</span>
            <input
              defaultValue={data.to.unitPriceEur ?? 1}
              key={data.to.unitPriceEur}
              pattern="0-9,."
              onBlur={(e) =>
                setData({
                  ...data,
                  to: {
                    ...data.to,
                    unitPriceEur:
                      parseFloat(
                        e.target.value.replace(",", ".").replace(/[^\d\.]/g, "")
                      ) || 1,
                  },
                })
              }
              type="decimal"
            />
          </label>
        )}
      </fieldset>
      <button type="submit">Add row</button>
    </form>
  );
};
