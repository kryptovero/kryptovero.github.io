import s from "../styles/EntryRow.module.scss";
import { useState } from "react";
import { LedgerItem } from "@fifo/ledger";
import { useAppState } from "./app-state";

export default function EntryRow({ item }: { item: LedgerItem }) {
  const [open, setOpen] = useState(false);
  const addAppStateItem = useAppState();

  return (
    <div className={`${s.entryrow} ${open ? "" : s.showLess}`}>
      <button
        className={`${s.opener} ${open ? s.open : ""}`}
        onClick={() => setOpen(!open)}
        aria-label="Open"
        disabled
      ></button>
      <table>
        <thead>
          <tr>
            <th>Päivämäärä</th>
            <th>Mistä</th>
            <th>Mihin</th>
            <th>Välityspalkkio</th>
            <th>Verotettava tulo</th>
            <th>Veron määrä</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{item.date.toLocaleString("fi")}</td>
            <td>
              {item.from.amount.toLocaleString("fi")} {item.from.symbol}
              {item.from.symbol !== "EUR" &&
                item.from.unitPriceEur !== undefined && (
                  <>
                    {" "}
                    <small>
                      ({item.to.unitPriceEur.toLocaleString("fi")} EUR/kpl)
                    </small>
                  </>
                )}
            </td>
            <td>
              {item.to.amount.toLocaleString("fi")} {item.to.symbol}
              {item.to.symbol !== "EUR" && item.to.unitPriceEur !== undefined && (
                <>
                  {" "}
                  <small>
                    ({item.to.unitPriceEur.toLocaleString("fi")} EUR/kpl)
                  </small>
                </>
              )}
            </td>
            <td>
              {item.fee?.amount.toLocaleString("fi") ?? 0}{" "}
              {item.fee?.symbol ?? "EUR"}
            </td>
            <td className={s.up}>??? EUR</td>
            <td>??? EUR</td>
          </tr>
        </tbody>

        <tbody>
          <tr>
            <td colSpan={6} className={s.tdHeading}>
              Ostot joista verotettu tulo on laskettu:
            </td>
          </tr>

          <tr>
            <td>20.5.2021</td>
            <td>10 000 EUR</td>
            <td>
              5 BTC <small>(2 000 EUR/kpl)</small>
            </td>
            <td>11 EUR</td>
            <td className={s.up}>232 EUR</td>
            <td>69,60 EUR</td>
          </tr>
        </tbody>
      </table>
      <button type="button" className={`btn btn--secondary ${s.editButton}`}>
        <img src="/edit.svg" alt="Edit" />
      </button>

      <button
        type="button"
        className={`btn btn--secondary ${s.deleteButton}`}
        onClick={() => addAppStateItem({ type: "deleteRow", rowId: item.id })}
      >
        <img src="/delete.svg" alt="Delete" />
      </button>
    </div>
  );
}
