import { calculateGains, Ledger } from "@fifo/ledger";
import { NumberInput } from "./NumberInput";
import { Link } from "react-router-dom";
import "./LedgerTable.scss";
import { Action } from "./reducer";
import { Temporal } from "proposal-temporal";

const LedgerTable: React.FC<{
  ledger: Ledger;
  dispatch: React.Dispatch<Action>;
  symbols: string[];
}> = ({ ledger, dispatch, symbols }) => {
  return (
    <>
      {ledger.length > 0 && (
        <h1>
          Taxable gains:{" "}
          {calculateGains(
            ledger[0].date,
            ledger[ledger.length - 1].date,
            ledger
          ).toFixed(2)}{" "}
          €
        </h1>
      )}
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
          {ledger.map((row, index) => (
            <tr>
              <td>
                <input
                  type="date"
                  defaultValue={row.date.toString({ calendarName: "never" })}
                  key={row.date.toString({ calendarName: "never" })}
                  onBlur={(v) =>
                    dispatch({
                      action: "set",
                      index,
                      item: { date: Temporal.PlainDate.from(v.target.value) },
                    })
                  }
                />
              </td>
              <td>
                <select
                  value={row.from.symbol}
                  onChange={(e) =>
                    dispatch({
                      action: "set",
                      index,
                      item: { from: { ...row.from, symbol: e.target.value } },
                    })
                  }
                >
                  {symbols.map((symbol) => (
                    <option>{symbol}</option>
                  ))}
                </select>
              </td>
              <td>
                <NumberInput
                  value={row.from.amount}
                  onChange={(amount) =>
                    dispatch({
                      action: "set",
                      index,
                      item: { from: { ...row.from, amount } },
                    })
                  }
                />
              </td>
              <td>
                <NumberInput
                  value={row.from.unitPriceEur}
                  onChange={(unitPriceEur) =>
                    dispatch({
                      action: "set",
                      index,
                      item: { from: { ...row.from, unitPriceEur } },
                    })
                  }
                />
                 €
              </td>
              <td>
                <select
                  value={row.to.symbol}
                  onChange={(e) =>
                    dispatch({
                      action: "set",
                      index,
                      item: { to: { ...row.to, symbol: e.target.value } },
                    })
                  }
                >
                  {symbols.map((symbol) => (
                    <option>{symbol}</option>
                  ))}
                </select>
              </td>
              <td>
                <NumberInput
                  value={row.to.amount}
                  onChange={(amount) =>
                    dispatch({
                      action: "set",
                      index,
                      item: { to: { ...row.to, amount } },
                    })
                  }
                />
              </td>
              <td>
                <NumberInput
                  value={row.to.unitPriceEur}
                  onChange={(unitPriceEur) =>
                    dispatch({
                      action: "set",
                      index,
                      item: { to: { ...row.to, unitPriceEur } },
                    })
                  }
                />
                 €
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link to="/new" className="fab">
        +
      </Link>
      <Link to="/import" className="fab">
        ↑
      </Link>
    </>
  );
};

export default LedgerTable;
