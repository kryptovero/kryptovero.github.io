import { Ledger, LedgerItem, sortLedger } from "@fifo/ledger";
import { readCsv } from "@fifo/csv-reader";
import { useEffect } from "react";

export const toCacheKey = (symbol: string, timestamp: number) =>
  [symbol, timestamp].join("-");
type PrefilledEurValues = { [symbolDateKey: string]: number };
type ImportAppStateItem = {
  type: "importCoinbaseCsv";
  data: string;
  prefilledEurValues: PrefilledEurValues;
};
type DeleteRowAppStateItem = { type: "deleteRow"; rowId: string };
type InsertRowAppStateItem = { type: "insertRow"; data: LedgerItem };
type EditRowAppStateItem = { type: "editRow"; data: LedgerItem; note?: string };
export type AppStateItem =
  | ImportAppStateItem
  | DeleteRowAppStateItem
  | InsertRowAppStateItem
  | EditRowAppStateItem;
export type AppState = { version: 0; items: AppStateItem[] };

const uniqByIdFilter = ({ id }: LedgerItem, index: number, ledger: Ledger) =>
  ledger.findIndex((item) => item.id === id) === index;

const applyPrefilledValues = (
  ledger: Ledger,
  prefilledEurValues: PrefilledEurValues
): Ledger =>
  ledger.map((ledgerItem) => ({
    ...ledgerItem,
    from: {
      ...ledgerItem.from,
      unitPriceEur:
        ledgerItem.from.unitPriceEur ??
        prefilledEurValues[
          toCacheKey(ledgerItem.from.symbol, ledgerItem.timestamp)
        ],
    },
    to: {
      ...ledgerItem.to,
      unitPriceEur:
        ledgerItem.to.unitPriceEur ??
        prefilledEurValues[
          toCacheKey(ledgerItem.to.symbol, ledgerItem.timestamp)
        ],
    },
  }));

export const applyLedgerItem = (ledger: Ledger, next: AppStateItem) => {
  switch (next.type) {
    case "importCoinbaseCsv":
      return sortLedger(
        [
          ...applyPrefilledValues(readCsv(next.data), next.prefilledEurValues),
          ...ledger,
        ].filter(uniqByIdFilter)
      );
    case "deleteRow":
      return ledger.filter((item) => item.id !== next.rowId);
    case "insertRow":
      return sortLedger(ledger.concat(next.data));
    case "editRow":
      return sortLedger(
        ledger.filter((item) => item.id !== next.data.id).concat(next.data)
      );
    default:
      return ledger;
  }
};

/*
export const useAutofillCoinUnitPrices = () => {
  const [{ ledger }] = useAtom(computedStateAtom);
  const addAppStateItem = useAppState();
  useEffect(() => {
    for (const item of ledger) {
      const fromPrice = item.from.unitPriceEur;
      const toPrice = item.to.unitPriceEur;
      if (fromPrice && !toPrice)
        addAppStateItem({
          type: "editRow",
          data: {
            ...item,
            to: {
              ...item.to,
              unitPriceEur: (fromPrice * item.from.amount) / item.to.amount,
            },
          },
          note: "Automatic fill of to unit price",
        });
      else if (toPrice && !fromPrice)
        addAppStateItem({
          type: "editRow",
          data: {
            ...item,
            from: {
              ...item.from,
              unitPriceEur: (toPrice * item.to.amount) / item.from.amount,
            },
          },
          note: "Automatic fill of from unit price",
        });
      else if (!fromPrice && !toPrice)
        getPriceAt(item.date, item.from.symbol).then((price) =>
          addAppStateItem({
            type: "editRow",
            data: { ...item, from: { ...item.from, unitPriceEur: price } },
            note: "Automatic fill of from unit price, fetched from Coinbase",
          })
        );

      if (item.fee && item.fee.symbol !== "EUR" && !item.fee.unitPriceEur) {
        if (item.fee.symbol === item.from.symbol && item.from.unitPriceEur)
          addAppStateItem({
            type: "editRow",
            data: {
              ...item,
              fee: { ...item.fee, unitPriceEur: item.from.unitPriceEur },
            },
            note: "Automatic fill of fee unit price",
          });
        if (item.fee.symbol === item.to.symbol && item.to.unitPriceEur)
          addAppStateItem({
            type: "editRow",
            data: {
              ...item,
              fee: { ...item.fee, unitPriceEur: item.to.unitPriceEur },
            },
            note: "Automatic fill of fee unit price",
          });
      }
    }
  }, [ledger, addAppStateItem]);
};*/

export const usePreventUserLeaving = () => {
  useEffect(() => {
    window.onbeforeunload = confirmExit;
    function confirmExit() {
      return "Are you sure you want to exit? You may have unsaved changes.";
    }
    return () => (window.onbeforeunload = null);
  }, []);
};
