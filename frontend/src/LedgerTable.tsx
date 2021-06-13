import { Ledger } from "@fifo/ledger";
import { Temporal } from "proposal-temporal";
import { NumberInput } from "./NumberInput";
import "./LedgerTable.scss";

const SAMPLE_DATA: Ledger = [
  {
    date: Temporal.PlainDate.from("2017-01-01"),
    from: { symbol: "EUR", amount: 500, unitPriceEur: 1 },
    to: { symbol: "A", unitPriceEur: 5, amount: 100 },
  },
  {
    date: Temporal.PlainDate.from("2017-02-01"),
    from: { symbol: "EUR", amount: 1000, unitPriceEur: 1 },
    to: { symbol: "A", unitPriceEur: 10, amount: 100 },
  },
  {
    date: Temporal.PlainDate.from("2017-03-01"),
    from: { symbol: "A", amount: 50 },
    to: { symbol: "B", amount: 25, unitPriceEur: 15 },
  },
  {
    date: Temporal.PlainDate.from("2017-01-01"),
    from: { symbol: "EUR", amount: 500, unitPriceEur: 1 },
    to: { symbol: "A", unitPriceEur: 5, amount: 100 },
  },
  {
    date: Temporal.PlainDate.from("2017-02-01"),
    from: { symbol: "EUR", amount: 1000, unitPriceEur: 1 },
    to: { symbol: "A", unitPriceEur: 10, amount: 100 },
  },
  {
    date: Temporal.PlainDate.from("2017-03-01"),
    from: { symbol: "A", amount: 50 },
    to: { symbol: "B", amount: 25, unitPriceEur: 15 },
  },
  {
    date: Temporal.PlainDate.from("2017-01-01"),
    from: { symbol: "EUR", amount: 500, unitPriceEur: 1 },
    to: { symbol: "A", unitPriceEur: 5, amount: 100 },
  },
  {
    date: Temporal.PlainDate.from("2017-02-01"),
    from: { symbol: "EUR", amount: 1000, unitPriceEur: 1 },
    to: { symbol: "A", unitPriceEur: 10, amount: 100 },
  },
  {
    date: Temporal.PlainDate.from("2017-03-01"),
    from: { symbol: "A", amount: 50 },
    to: { symbol: "B", amount: 25, unitPriceEur: 15 },
  },
];
const SYMBOLS = [
  ...new Set(SAMPLE_DATA.flatMap((d) => [d.from.symbol, d.to.symbol])),
];

export default () => (
  <table>
    <thead>
      <tr>
        <th rowSpan={2}>Date</th>
        <th colSpan={3}>From</th>
        <th colSpan={3}>To</th>
      </tr>
      <tr>
        <th>Symbol</th>
        <th>Amount</th>
        <th>á price</th>
        <th>Symbol</th>
        <th>Amount</th>
        <th>á price</th>
      </tr>
    </thead>
    <tbody>
      {SAMPLE_DATA.map((row) => (
        <tr>
          <td>
            <input
              type="date"
              value={row.date.toString({ calendarName: "never" })}
            />
          </td>
          <td>
            <select value={row.from.symbol}>
              {SYMBOLS.map((symbol) => (
                <option>{symbol}</option>
              ))}
            </select>
          </td>
          <td>
            <NumberInput value={row.from.amount} onChange={() => {}} />
             €
          </td>
          <td>
            <NumberInput value={row.from.unitPriceEur} onChange={() => {}} />
             €
          </td>
          <td>
            <select value={row.to.symbol}>
              {SYMBOLS.map((symbol) => (
                <option>{symbol}</option>
              ))}
            </select>
          </td>
          <td>
            <NumberInput value={row.to.amount} onChange={() => {}} />
             €
          </td>
          <td>
            <NumberInput value={row.to.unitPriceEur} onChange={() => {}} />
             €
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
