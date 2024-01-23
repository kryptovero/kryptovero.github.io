import s from "../styles/EntryRow.module.scss";
import { useState } from "react";
import { ComputedLedgerItem, TaxComputedLedgerItem } from "@fifo/ledger";
import { insertEvent, useAppDispatch } from "./store";

export default function EntryRow({
  item,
  consumed,
  onEdit,
}: {
  item: ComputedLedgerItem;
  consumed: TaxComputedLedgerItem[];
  onEdit?: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const dispatch = useAppDispatch();

  return (
    <div className={`${s.entryrow} ${open ? "" : s.showLess}`} id={item.id}>
      <button
        className={`${s.opener} ${open ? s.open : ""} ${
          consumed.length === 0 ? s.hidden : ""
        }`}
        onClick={() => setOpen(!open)}
        aria-label="Open"
      ></button>
      <table>
        <thead>
          <tr>
            <th>Päivämäärä</th>
            <th>Mistä</th>
            <th>Mihin</th>
            <th>Välityspalkkio</th>
            <th>Verotettava tulo</th>
            <th className="noprint">Veron määrä</th>
          </tr>
        </thead>
        <tbody>
          <ItemRow item={item} />
        </tbody>

        {consumed.length > 0 && (
          <tbody>
            <tr>
              <td colSpan={6} className={s.tdHeading}>
                Ostot joista verotettu tulo on laskettu:
              </td>
            </tr>

            {consumed.map((item) => (
              <></>
              //<ItemRow item={item} key={item.id} linkTo />
            ))}
          </tbody>
        )}
      </table>
      <button
        type="button"
        onClick={() => onEdit?.(item.id)}
        className={`btn btn--secondary ${s.editButton}`}
      >
        <img src="/edit.svg" alt="Edit" />
      </button>

      <button
        type="button"
        className={`btn btn--secondary ${s.deleteButton}`}
        onClick={() =>
          dispatch(insertEvent({ type: "deleteRow", rowId: item.id }))
        }
      >
        <img src="/delete.svg" alt="Delete" />
      </button>
    </div>
  );
}

function ItemRow({
  item,
  linkTo,
}: {
  item: ComputedLedgerItem;
  linkTo?: boolean;
}) {
  return (
    <tr>
      <td>
        <a
          href={linkTo ? `#${item.id}` : undefined}
          title={`${item.id} / ${new Date(item.timestamp).toLocaleString(
            "fi"
          )}`}
        >
          {new Date(item.timestamp).toLocaleDateString("fi")}
        </a>
      </td>
      <td>
        {item.from.amount.toLocaleString("fi")} {item.from.symbol}
        {item.from.symbol !== "EUR" && item.from.unitPriceEur !== undefined && (
          <>
            {" "}
            <small>
              ({item.from.unitPriceEur.toLocaleString("fi")} EUR/kpl)
            </small>
          </>
        )}
      </td>
      <td>
        {item.to.amount.toLocaleString("fi")} {item.to.symbol}
        {item.to.symbol !== "EUR" && item.to.unitPriceEur !== undefined && (
          <>
            {" "}
            <small>({item.to.unitPriceEur.toLocaleString("fi")} EUR/kpl)</small>
          </>
        )}
      </td>
      <td>
        {item.fee?.amount.toLocaleString("fi") ?? 0} {item.fee?.symbol ?? "EUR"}
      </td>
      <td className={item.taxableGain >= 0 ? s.up : s.down}>
        {item.taxableGain.toLocaleString("fi", {
          maximumFractionDigits: 2,
        })}{" "}
        EUR
      </td>
      <td className="noprint">
        {(item.taxableGain * 0.3).toLocaleString("fi", {
          maximumFractionDigits: 2,
        })}{" "}
        EUR
      </td>
    </tr>
  );
}
