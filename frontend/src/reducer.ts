import { Temporal } from "proposal-temporal";
import { Ledger, LedgerItem } from "../../ledger/build";
import { sortLedger } from "@fifo/ledger";
import React, { useReducer } from "react";

const INITIAL_DATA: Ledger = [
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

export type Action =
  | { action: "create"; item: LedgerItem }
  | { index: number; action: "set"; item: Partial<LedgerItem> };

export function reducer(state: Ledger = INITIAL_DATA, action: Action) {
  switch (action.action) {
    case "create":
      return sortLedger([...state, action.item]);
    case "set":
      return sortLedger(
        state.map((item, i) =>
          i === action.index ? { ...item, ...action.item } : item
        )
      );
  }
}

export function usePersistedReducer(
  reducer: React.Reducer<Ledger, Action>,
  firstState: Ledger
) {
  const initialState: Ledger = parse(localStorage.getItem("state"), firstState);
  const wrappedReducer = (state: Ledger, action: Action) => {
    const result = reducer(state, action);
    localStorage.setItem("state", JSON.stringify(result));
    return result;
  };
  return useReducer(wrappedReducer, initialState);
}

function parse(input: string | null, fallback: Ledger): Ledger {
  const data = JSON.parse(input ?? "null") as (Omit<Ledger[number], "date"> & {
    date: string;
  })[];
  return (
    data?.map((i) => ({ ...i, date: Temporal.PlainDate.from(i.date) })) ??
    fallback
  );
}
